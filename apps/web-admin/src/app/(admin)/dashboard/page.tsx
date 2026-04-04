"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Summary = {
  students: number;
  teachers: number;
  staff: number;
  totalUsers: number;
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [batchCount, setBatchCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryRes, batchRes] = await Promise.all([
          api.get("/dashboard/summary"),
          api.get("/batches"),
        ]);
        setSummary(summaryRes.data.summary);
        setBatchCount(batchRes.data.batches?.length ?? 0);
      } catch {
        setSummary(null);
        setBatchCount(0);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const cards = [
    { label: "Total Students", value: summary?.students ?? 0 },
    { label: "Total Teachers", value: summary?.teachers ?? 0 },
    { label: "Total Staff", value: summary?.staff ?? 0 },
    { label: "Total Batches", value: batchCount },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Overview</p>
        <h2 className="mt-2 text-2xl font-semibold">Dashboard</h2>
        <p className="mt-1 text-sm text-slate-400">Quick snapshot of your institute activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardTitle>{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-white">
                {loading ? "—" : card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Charts can go here (attendance, enrollment, revenue). Plug in Recharts when you are
            ready.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
