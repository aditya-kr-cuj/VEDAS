"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaterialCard, Material } from "@/components/material-card";

type MaterialDetail = Material & {
  file_url: string;
  course_id: string;
  batch_id: string | null;
  topic: string | null;
  tags: string[] | null;
};

export default function MaterialDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [material, setMaterial] = useState<MaterialDetail | null>(null);
  const [related, setRelated] = useState<Material[]>([]);
  const [versions, setVersions] = useState<Array<{ id: string; version_number: number; created_at: string }>>([]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const res = await api.get(`/materials/${id}`);
      setMaterial(res.data.material);
      const versionRes = await api.get(`/materials/${id}/versions`);
      setVersions(versionRes.data.versions ?? []);
      if (res.data.material?.course_id) {
        const relatedRes = await api.get("/materials", {
          params: { course_id: res.data.material.course_id, limit: 4, page: 1 }
        });
        setRelated(relatedRes.data.materials ?? []);
      }
    };
    load().catch(() => setMaterial(null));
  }, [id]);

  const download = async () => {
    if (!material) return;
    const res = await api.post(`/materials/${material.id}/download`);
    window.open(res.data.url, "_blank");
  };

  const updateFile = async (file: File) => {
    if (!material) return;
    const form = new FormData();
    form.append("file", file);
    await api.put(`/materials/${material.id}/file`, form, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    const res = await api.get(`/materials/${material.id}`);
    setMaterial(res.data.material);
    const versionRes = await api.get(`/materials/${material.id}/versions`);
    setVersions(versionRes.data.versions ?? []);
  };

  if (!material) {
    return <p className="text-sm text-slate-400">Loading material...</p>;
  }

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
          className="h-[500px] w-full rounded-xl border border-white/10"
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
        <Button onClick={download}>Download</Button>
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

      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-300">
          <input
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) updateFile(file);
            }}
          />
          {versions.length === 0 ? (
            <p className="text-slate-400">No previous versions.</p>
          ) : (
            versions.map((version) => (
              <div key={version.id} className="flex items-center justify-between">
                <span>Version {version.version_number}</span>
                <span>{new Date(version.created_at).toLocaleString()}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div>
        <h3 className="text-lg font-semibold text-white">Related Materials</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {related.map((item) => (
            <MaterialCard
              key={item.id}
              material={item}
              onDownload={async () => {
                const res = await api.post(`/materials/${item.id}/download`);
                window.open(res.data.url, "_blank");
              }}
            />
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comments</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-400">
          Comments are coming soon. We can enable this in a future release.
        </CardContent>
      </Card>
    </div>
  );
}
