"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export default function TestAnalyticsPage() {
  const params = useParams();
  const id = params?.id as string;
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    api.get(`/tests/${id}/analytics`).then((res) => setAnalytics(res.data.analytics)).catch(() => setAnalytics(null));
  }, [id]);

  if (!analytics) return <p className="text-sm text-slate-400">Loading analytics...</p>;

  const downloadCsv = () => {
    const rows = [
      ["question_id", "correct_attempts", "incorrect_attempts", "accuracy"],
      ...analytics.question_wise_performance.map((q: any) => [
        q.question_id,
        q.correct_attempts,
        q.incorrect_attempts,
        q.accuracy
      ])
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "test-analytics.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const distribution = Object.entries(analytics.score_distribution).map(([range, count]) => ({ range, count }));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-slate-300 md:grid-cols-3">
          <div>Total Students: {analytics.total_students}</div>
          <div>Attempted: {analytics.attempted}</div>
          <div>Average Score: {analytics.average_score}%</div>
          <div>Highest Score: {analytics.highest_score}%</div>
          <div>Lowest Score: {analytics.lowest_score}%</div>
          <div>Passing %: {analytics.passing_percentage}%</div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Score Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="range" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="count" fill="#38bdf8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Question Accuracy</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics.question_wise_performance} dataKey="accuracy" nameKey="question_id" fill="#34d399" />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Question-wise Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-300">
          <button className="text-xs text-blue-300 underline" onClick={downloadCsv}>
            Export CSV
          </button>
          {analytics.question_wise_performance.map((q: any) => (
            <div key={q.question_id} className="flex items-center justify-between">
              <span>{q.question_id}</span>
              <span>
                {q.correct_attempts} correct / {q.incorrect_attempts} wrong • {q.accuracy}%
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
