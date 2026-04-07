"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";

export default function TeachersPerformancePage() {
  const [teachers, setTeachers] = useState<any[]>([]);

  useEffect(() => {
    api.get("/admin/teachers/performance").then((res) => setTeachers(res.data.teachers ?? []));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Teacher Performance</h2>
        <p className="text-sm text-slate-400">Compare instructors across key metrics.</p>
      </div>

      <div className="space-y-3">
        {teachers.map((teacher) => (
          <Card key={teacher.teacher_id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm text-slate-300">
              <div>
                <p className="font-semibold text-white">{teacher.teacher_name}</p>
                <p className="text-xs text-slate-400">Rank #{teacher.rank}</p>
              </div>
              <div>Avg Score: {teacher.average_student_score}%</div>
              <div>Classes: {teacher.classes_conducted}</div>
              <div>Materials: {teacher.materials_uploaded}</div>
              <div>Tests: {teacher.tests_created}</div>
              <div>Pending Eval: {teacher.pending_evaluations}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
