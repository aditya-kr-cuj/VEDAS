"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function StudentPerformancePage() {
  const [overview, setOverview] = useState<any>(null);
  const [trend, setTrend] = useState<any>(null);

  useEffect(() => {
    api.get("/student/me").then(async (res) => {
      const id = res.data.student?.id;
      if (!id) return;
      const [overviewRes, trendRes] = await Promise.all([
        api.get(`/student/${id}/performance/overview`),
        api.get(`/student/${id}/performance/trend`)
      ]);
      setOverview(overviewRes.data);
      setTrend(trendRes.data);
    });
  }, []);

  if (!overview || !trend) return <p className="text-sm text-slate-400">Loading performance...</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Overall Performance</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-300">
          <p>Overall Percentage: {overview.overall_percentage}%</p>
          <p>Average Score: {overview.average_score}%</p>
          <p>Total Tests: {overview.total_tests}</p>
          <p>Attendance: {overview.attendance_percentage}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Score Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend.trend_data}>
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#38bdf8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Comparison</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overview.subjects}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="course_name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="average_score" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
