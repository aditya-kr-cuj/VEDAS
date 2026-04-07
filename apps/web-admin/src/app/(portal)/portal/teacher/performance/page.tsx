"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TeacherPerformancePage() {
  const [performance, setPerformance] = useState<any>(null);

  useEffect(() => {
    api.get("/teachers/me").then(async (res) => {
      const teacherId = res.data.teacher?.id;
      if (!teacherId) return;
      const perf = await api.get(`/teacher/${teacherId}/performance`);
      setPerformance(perf.data);
    });
  }, []);

  if (!performance) return <p className="text-sm text-slate-400">Loading performance...</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Performance</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-300">
          <p>Classes Conducted: {performance.classes_conducted}</p>
          <p>Average Student Score: {performance.average_student_score}%</p>
          <p>Materials Uploaded: {performance.materials_uploaded}</p>
          <p>Tests Created: {performance.tests_created}</p>
          <p>Pending Evaluations: {performance.pending_evaluations}</p>
        </CardContent>
      </Card>
    </div>
  );
}
