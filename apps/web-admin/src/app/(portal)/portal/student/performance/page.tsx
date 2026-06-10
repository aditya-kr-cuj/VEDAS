"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

export default function StudentPerformancePage() {
  const [overview, setOverview] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/students/my-profile")
      .then(async (profileRes) => {
        const studentId = profileRes.data.data?.id ?? profileRes.data.student?.id;
        if (!studentId) throw new Error("Profile not found");
        const [overviewRes, testsRes] = await Promise.all([
          api.get(`/student/${studentId}/performance/overview`),
          api.get("/student/performance/tests"),
        ]);
        setOverview(overviewRes.data.data ?? overviewRes.data);
        setAttempts(testsRes.data.performance?.attempts ?? []);
      })
      .catch(() => toast.error("Failed to load performance data"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">My Performance</h1>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Overall Score", `${overview?.overall_percentage ?? 0}%`, "text-teal-300"],
          ["Tests Taken", overview?.total_tests ?? attempts.length, "text-purple-300"],
          ["Average Score", `${overview?.average_score ?? 0}%`, "text-amber-300"],
        ].map(([label, value, color]) => (
          <div key={String(label)} className="rounded-xl border border-slate-800 bg-slate-900 p-5 text-center">
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="mt-1 text-sm text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 px-5 py-4">
          <h2 className="font-semibold text-white">Test History</h2>
        </div>
        {attempts.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No tests completed yet.</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400">Test</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400">Score</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400">Percentage</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-slate-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => (
                <tr key={attempt.attempt_id} className="border-b border-slate-800/50">
                  <td className="px-5 py-3 text-sm text-white">{attempt.title}</td>
                  <td className="px-5 py-3 text-sm text-white">{Number(attempt.total_marks_obtained ?? 0).toLocaleString("en-IN")}</td>
                  <td className="px-5 py-3">
                    <span className={`text-sm font-semibold ${Number(attempt.percentage ?? 0) >= 60 ? "text-teal-300" : "text-red-300"}`}>
                      {Math.round(Number(attempt.percentage ?? 0))}%
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-slate-400">{attempt.created_at ? new Date(attempt.created_at).toLocaleDateString() : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
