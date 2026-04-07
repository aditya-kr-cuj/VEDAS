"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { MaterialCard, Material } from "@/components/material-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Course = { id: string; name: string };

export default function StudentMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [bookmarks, setBookmarks] = useState<Material[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourse, setActiveCourse] = useState<string>("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get("/courses").then((res) => setCourses(res.data.courses ?? [])).catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    const load = async () => {
      const params: Record<string, string | number> = { page: 1, limit: 50 };
      if (activeCourse) params.course_id = activeCourse;
      if (search) params.search = search;
      const res = await api.get("/materials", { params });
      setMaterials(res.data.materials ?? []);
      const bookmarkRes = await api.get("/materials/bookmarks");
      setBookmarks(bookmarkRes.data.materials ?? []);
    };
    load().catch(() => setMaterials([]));
  }, [activeCourse, search]);

  const recentlyAdded = useMemo(() => materials.slice(0, 6), [materials]);
  const mostDownloaded = useMemo(
    () => [...materials].sort((a, b) => b.download_count - a.download_count).slice(0, 6),
    [materials]
  );

  const download = async (id: string) => {
    const res = await api.post(`/materials/${id}/download`);
    window.open(res.data.url, "_blank");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Study Materials</h2>
        <p className="text-sm text-slate-400">Browse course resources shared by your teachers.</p>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <input
            className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200 md:w-64"
            placeholder="Search materials..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant={activeCourse === "" ? "default" : "outline"} onClick={() => setActiveCourse("")}>
              All
            </Button>
            {courses.map((course) => (
              <Button
                key={course.id}
                size="sm"
                variant={activeCourse === course.id ? "default" : "outline"}
                onClick={() => setActiveCourse(course.id)}
              >
                {course.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-lg font-semibold text-white">Recently Added</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recentlyAdded.map((item) => (
            <MaterialCard
              key={item.id}
              material={item}
              detailBase="/portal/student/materials"
              onDownload={() => download(item.id)}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white">Most Downloaded</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {mostDownloaded.map((item) => (
            <MaterialCard
              key={item.id}
              material={item}
              detailBase="/portal/student/materials"
              onDownload={() => download(item.id)}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white">Bookmarks</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {bookmarks.length === 0 ? (
            <p className="text-sm text-slate-400">No bookmarks yet.</p>
          ) : (
            bookmarks.slice(0, 6).map((item) => (
              <MaterialCard
                key={item.id}
                material={item}
                detailBase="/portal/student/materials"
                onDownload={() => download(item.id)}
              />
            ))
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white">All Materials</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {materials.map((item) => (
            <MaterialCard
              key={item.id}
              material={item}
              detailBase="/portal/student/materials"
              onDownload={() => download(item.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
