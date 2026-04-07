"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function StudentPerformancePage() {
  const [performance, setPerformance] = useState<any>(null);

  useEffect(() => {
    api.get("/student/performance/tests").then((res) => setPerformance(res.data.performance)).catch(() => setPerformance(null));
  }, []);

  if (!performance) return <p className="text-sm text-slate-400">Loading performance...</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-300">
          <p>Average Score: {performance.average}%</p>
          <p>Total Attempts: {performance.attempts.length}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Improvement Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={performance.trend}>
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="percentage" stroke="#38bdf8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-300">
          {performance.attempts.map((attempt: any) => (
            <div key={attempt.attempt_id} className="flex items-center justify-between">
              <span>{attempt.title}</span>
              <span>{attempt.percentage}%</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
