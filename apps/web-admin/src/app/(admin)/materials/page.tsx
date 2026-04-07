"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { MaterialCard, Material } from "@/components/material-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Course = { id: string; name: string };

type MaterialWithHighlight = Material & {
  highlight_title?: string;
  highlight_description?: string;
  highlight_tags?: string;
};

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<MaterialWithHighlight[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<MaterialWithHighlight[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [fileType, setFileType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 12;

  useEffect(() => {
    api.get("/courses").then((res) => setCourses(res.data.courses ?? [])).catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    const load = async () => {
      const params: Record<string, string | number> = { page, limit };
      if (selectedCourse) params.course_id = selectedCourse;
      if (fileType) params.file_type = fileType;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      if (sort) params.sort = sort;

      if (search.trim().length > 0) {
        const res = await api.get("/materials/search", {
          params: { ...params, q: search, sort: "newest" }
        });
        setMaterials(res.data.materials ?? []);
        setTotal(res.data.total ?? 0);
      } else {
        const res = await api.get("/materials", { params });
        setMaterials(res.data.materials ?? []);
        setTotal(res.data.total ?? 0);
      }
    };
    load().catch(() => {
      setMaterials([]);
      setTotal(0);
    });
  }, [search, selectedCourse, fileType, dateFrom, dateTo, sort, page]);

  useEffect(() => {
    if (search.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timeout = setTimeout(() => {
      api
        .get("/materials/search", { params: { q: search, limit: 5, page: 1 } })
        .then((res) => setSuggestions(res.data.materials ?? []))
        .catch(() => setSuggestions([]));
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const pages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total]);

  const handleDownload = async (id: string) => {
    const res = await api.post(`/materials/${id}/download`);
    window.open(res.data.url, "_blank");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Materials Library</h2>
          <p className="text-sm text-slate-400">Search, filter, and manage study resources.</p>
        </div>
        <Link href="/materials/upload">
          <Button>Upload Material</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-6">
          <div className="md:col-span-2">
            <Label>Search</Label>
            <div className="relative">
              <Input
                value={search}
                placeholder="Search by title, topic, or tag"
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
              {suggestions.length > 0 && (
                <div className="absolute z-10 mt-2 w-full rounded-lg border border-white/10 bg-slate-950 p-2">
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSearch(item.title);
                        setSuggestions([]);
                      }}
                      className="block w-full rounded-md px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
                    >
                      <span dangerouslySetInnerHTML={{ __html: item.highlight_title ?? item.title }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <Label>Course</Label>
            <select
              className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              value={selectedCourse}
              onChange={(event) => {
                setSelectedCourse(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>File Type</Label>
            <select
              className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              value={fileType}
              onChange={(event) => {
                setFileType(event.target.value);
                setPage(1);
              }}
            >
              <option value="">All Types</option>
              <option value="pdf">PDF</option>
              <option value="video">Video</option>
              <option value="image">Image</option>
              <option value="document">Document</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <Label>From</Label>
            <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          </div>
          <div>
            <Label>To</Label>
            <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          </div>
          <div>
            <Label>Sort</Label>
            <select
              className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              <option value="newest">Newest</option>
              <option value="most_downloaded">Most Downloaded</option>
              <option value="alphabetical">A-Z</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>
          Showing {materials.length} of {total} materials
        </span>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={viewMode === "grid" ? "default" : "outline"} onClick={() => setViewMode("grid")}>
            Grid
          </Button>
          <Button size="sm" variant={viewMode === "list" ? "default" : "outline"} onClick={() => setViewMode("list")}>
            List
          </Button>
        </div>
      </div>

      <div className={viewMode === "grid" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
        {materials.map((material) => (
          <MaterialCard
            key={material.id}
            material={material}
            viewMode={viewMode}
            onDownload={() => handleDownload(material.id)}
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-sm text-slate-400">
        <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((prev) => prev - 1)}>
          Previous
        </Button>
        <span>
          Page {page} of {pages}
        </span>
        <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage((prev) => prev + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
