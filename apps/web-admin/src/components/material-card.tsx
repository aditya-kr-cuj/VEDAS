"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type Material = {
  id: string;
  title: string;
  description: string | null;
  file_type: string;
  file_size: string | number;
  download_count: number;
  created_at: string;
  download_url?: string;
};

function formatFileSize(size: number) {
  if (!size) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[unit]}`;
}

function typeBadge(type: string) {
  const normalized = type?.toLowerCase();
  const label = normalized?.toUpperCase() || "FILE";
  return (
    <span className="rounded-full bg-white/10 px-2 py-1 text-xs uppercase tracking-wide text-white">
      {label}
    </span>
  );
}

export function MaterialCard({
  material,
  onDownload,
  viewMode = "grid",
  detailBase = "/materials"
}: {
  material: Material;
  onDownload?: () => void;
  viewMode?: "grid" | "list";
  detailBase?: string;
}) {
  const size = typeof material.file_size === "string" ? Number(material.file_size) : material.file_size;
  const createdAt = material.created_at ? new Date(material.created_at).toLocaleDateString() : "";

  return (
    <Card className={viewMode === "list" ? "flex items-center justify-between gap-4" : ""}>
      <CardContent className={viewMode === "list" ? "flex w-full items-center justify-between p-4" : "p-4"}>
        <div className={viewMode === "list" ? "flex-1" : ""}>
          <div className="flex items-center gap-2">
            {typeBadge(material.file_type)}
            <Link href={`${detailBase}/${material.id}`} className="text-base font-semibold text-white hover:underline">
              {material.title}
            </Link>
          </div>
          {material.description && (
            <p className="mt-2 line-clamp-2 text-sm text-slate-300">{material.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span>{formatFileSize(size)}</span>
            <span>{material.download_count} downloads</span>
            <span>Uploaded {createdAt}</span>
          </div>
        </div>
        <div className={viewMode === "list" ? "" : "mt-4"}>
          <Button size="sm" onClick={onDownload}>
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
