"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Trend = { day: string; total: string };
type MaterialItem = { id: string; title: string; download_count: number };

export default function MaterialAnalyticsPage() {
  const [summary, setSummary] = useState<{
    mostDownloaded: MaterialItem[];
    uploadTrends: Trend[];
    storageBytes: number;
  } | null>(null);

  useEffect(() => {
    api
      .get("/materials/analytics/summary")
      .then((res) => setSummary(res.data.summary))
      .catch(() => setSummary(null));
  }, []);

  const formatSize = (bytes: number) => {
    if (!bytes) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    let value = bytes;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit += 1;
    }
    return `${value.toFixed(1)} ${units[unit]}`;
  };

  if (!summary) return <p className="text-sm text-slate-400">Loading analytics...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Material Analytics</h2>
        <p className="text-sm text-slate-400">Track engagement and storage usage.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Storage</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-white">{formatSize(summary.storageBytes)}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Most Downloaded</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            {summary.mostDownloaded.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <span>{item.title}</span>
                <span>{item.download_count}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Uploads Trend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            {summary.uploadTrends.map((item) => (
              <div key={item.day} className="flex items-center justify-between">
                <span>{new Date(item.day).toLocaleDateString()}</span>
                <span>{item.total}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
