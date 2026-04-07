"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type MaterialDetail = {
  id: string;
  title: string;
  description: string | null;
  file_type: string;
  download_count: number;
  download_url?: string;
  topic: string | null;
  tags: string[] | null;
  created_at: string;
};

export default function StudentMaterialDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [material, setMaterial] = useState<MaterialDetail | null>(null);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/materials/${id}`)
      .then((res) => setMaterial(res.data.material))
      .catch(() => setMaterial(null));

    api
      .get("/materials/bookmarks")
      .then((res) => {
        const found = (res.data.materials ?? []).some((item: MaterialDetail) => item.id === id);
        setBookmarked(found);
      })
      .catch(() => setBookmarked(false));
  }, [id]);

  const download = async () => {
    if (!material) return;
    const res = await api.post(`/materials/${material.id}/download`);
    window.open(res.data.url, "_blank");
  };

  const toggleBookmark = async () => {
    if (!material) return;
    if (bookmarked) {
      await api.delete(`/materials/${material.id}/bookmark`);
      setBookmarked(false);
    } else {
      await api.post(`/materials/${material.id}/bookmark`);
      setBookmarked(true);
    }
  };

  if (!material) return <p className="text-sm text-slate-400">Loading material...</p>;

  const tagList =
    Array.isArray(material.tags)
      ? material.tags
      : typeof material.tags === "string"
        ? material.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
        : [];

  const renderPreview = () => {
    if (material.file_type === "image") {
      return <img src={material.download_url} alt={material.title} className="w-full rounded-xl" />;
    }
    if (material.file_type === "pdf") {
      return (
        <iframe
          src={material.download_url}
          className="h-[420px] w-full rounded-xl border border-white/10"
        />
      );
    }
    if (material.file_type === "video") {
      return (
        <video controls playsInline className="w-full rounded-xl">
          <source src={material.download_url} />
        </video>
      );
    }
    return (
      <div className="rounded-xl border border-white/10 p-6 text-sm text-slate-300">
        Preview not available. Use download to view the file.
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">{material.title}</h2>
          <p className="text-sm text-slate-400">{material.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={toggleBookmark}>
            {bookmarked ? "Bookmarked" : "Bookmark"}
          </Button>
          <Button onClick={download}>Download</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>{renderPreview()}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-slate-300 md:grid-cols-2">
          <div>File Type: {material.file_type}</div>
          <div>Downloads: {material.download_count}</div>
          <div>Topic: {material.topic ?? "—"}</div>
          <div>Tags: {tagList.join(", ") || "—"}</div>
        </CardContent>
      </Card>
    </div>
  );
}
