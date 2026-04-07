"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function BatchPerformancePage() {
  const params = useParams();
  const id = params?.id as string;
  const [comparisons, setComparisons] = useState<any[]>([]);

  useEffect(() => {
    api.get(`/batch/${id}/performance/comparison`).then((res) => setComparisons(res.data.comparisons ?? []));
  }, [id]);

  if (!comparisons.length) return <p className="text-sm text-slate-400">Loading batch performance...</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Batch Comparison</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-300">
          {comparisons.map((row) => (
            <div key={row.student_id} className="flex items-center justify-between">
              <span>{row.student_name}</span>
              <span>{row.average_score ?? 0}%</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance vs Performance</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid stroke="#1f2937" />
              <XAxis dataKey="attendance_percentage" name="Attendance" unit="%" stroke="#94a3b8" />
              <YAxis dataKey="average_score" name="Score" unit="%" stroke="#94a3b8" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={comparisons} fill="#f59e0b" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
