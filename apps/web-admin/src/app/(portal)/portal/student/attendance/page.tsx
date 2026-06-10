"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

export default function StudentAttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/students/my-profile")
      .then((profileRes) => {
        const studentId = profileRes.data.data?.id ?? profileRes.data.student?.id;
        if (!studentId) throw new Error("Profile not found");
        return api.get(`/attendance/student/${studentId}`);
      })
      .then((res) => setRecords(res.data.records ?? res.data.data ?? []))
      .catch((err) => toast.error(err.response?.data?.message ?? "Failed to load attendance"))
      .finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => {
    const total = records.length;
    const present = records.filter((record) => ["present", "late", "excused"].includes(record.status)).length;
    const absent = records.filter((record) => record.status === "absent").length;
    const late = records.filter((record) => record.status === "late").length;
    return { total, present, absent, late, percentage: total > 0 ? Math.round((present / total) * 100) : 0 };
  }, [records]);

  const statusClass: Record<string, string> = {
    present: "bg-teal-500/20 text-teal-300",
    absent: "bg-red-500/20 text-red-300",
    late: "bg-amber-500/20 text-amber-300",
    excused: "bg-blue-500/20 text-blue-300",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">My Attendance</h1>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ["Total Classes", summary.total, "text-white"],
          ["Present", summary.present, "text-teal-300"],
          ["Absent", summary.absent, "text-red-300"],
          ["Late", summary.late, "text-amber-300"],
        ].map(([label, value, color]) => (
          <div key={String(label)} className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="mt-1 text-xs text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-medium text-white">Overall Attendance</span>
          <span className={`text-2xl font-bold ${summary.percentage >= 75 ? "text-teal-300" : "text-red-300"}`}>{summary.percentage}%</span>
        </div>
        <div className="h-3 rounded-full bg-slate-800">
          <div className={`h-3 rounded-full ${summary.percentage >= 75 ? "bg-teal-500" : "bg-red-500"}`} style={{ width: `${summary.percentage}%` }} />
        </div>
        {summary.percentage < 75 && summary.total > 0 && <p className="mt-2 text-xs text-red-300">Attendance is below 75%.</p>}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center text-sm text-slate-500">No attendance records yet.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {[...records]
                .sort((a, b) => Number(new Date(b.date)) - Number(new Date(a.date)))
                .map((record) => (
                  <tr key={record.id} className="border-b border-slate-800/50">
                    <td className="px-4 py-3 text-sm text-white">{record.date ? new Date(record.date).toLocaleDateString() : "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs capitalize ${statusClass[record.status] ?? "bg-slate-800 text-slate-400"}`}>{record.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{record.remarks || "-"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
