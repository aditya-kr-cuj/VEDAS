"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

type Batch = { id: string; name: string };
type BatchStudent = {
  studentUserId?: string;
  student_profile_id?: string;
  id?: string;
  fullName?: string;
  full_name?: string;
  name?: string;
  email?: string;
};

const statuses = ["present", "absent", "late"] as const;

export default function TeacherAttendancePage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<BatchStudent[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState<"mark" | "history">("mark");
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    api
      .get("/batches")
      .then((res) => setBatches(res.data.batches ?? res.data.data ?? []))
      .catch(() => setBatches([]));
  }, []);

  useEffect(() => {
    if (!selectedBatch) {
      setStudents([]);
      setAttendance({});
      setHistory([]);
      return;
    }

    setLoading(true);
    Promise.all([
      api.get(`/batches/${selectedBatch}/students`),
      api.get(`/attendance/batch/${selectedBatch}`, { params: { date: selectedDate } }).catch(() => ({ data: { records: [] } })),
    ])
      .then(([studentsRes, historyRes]) => {
        const studentList = studentsRes.data.students ?? studentsRes.data.data ?? [];
        const records = historyRes.data.records ?? historyRes.data.data ?? [];
        const defaults: Record<string, string> = {};
        studentList.forEach((student: BatchStudent) => {
          const id = student.student_profile_id ?? student.id ?? student.studentUserId;
          if (id) defaults[id] = "present";
        });
        records.forEach((record: any) => {
          if (record.student_id) defaults[record.student_id] = record.status;
        });
        setStudents(studentList);
        setAttendance(defaults);
        setHistory(records);
      })
      .catch(() => {
        setStudents([]);
        setHistory([]);
        toast.error("Failed to load batch students");
      })
      .finally(() => setLoading(false));
  }, [selectedBatch, selectedDate]);

  const selectedBatchName = useMemo(
    () => batches.find((batch) => batch.id === selectedBatch)?.name ?? "",
    [batches, selectedBatch]
  );

  const studentId = (student: BatchStudent) => student.student_profile_id ?? student.id ?? student.studentUserId ?? "";

  const markAll = (status: string) => {
    const next: Record<string, string> = {};
    students.forEach((student) => {
      const id = studentId(student);
      if (id) next[id] = status;
    });
    setAttendance(next);
  };

  const submit = async () => {
    if (!selectedBatch) {
      toast.error("Select a batch first");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/attendance/mark", {
        batchId: selectedBatch,
        date: selectedDate,
        attendance: students.map((student) => {
          const id = studentId(student);
          return { studentId: id, status: attendance[id] ?? "absent" };
        }),
      });
      toast.success("Attendance marked");
      const res = await api.get(`/attendance/batch/${selectedBatch}`, { params: { date: selectedDate } });
      setHistory(res.data.records ?? []);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to mark attendance");
    } finally {
      setSubmitting(false);
    }
  };

  const statusClass: Record<string, string> = {
    present: "border-teal-500/40 bg-teal-500/15 text-teal-300",
    absent: "border-red-500/40 bg-red-500/15 text-red-300",
    late: "border-amber-500/40 bg-amber-500/15 text-amber-300",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Attendance</h1>
        <p className="mt-1 text-sm text-slate-400">Mark attendance for your assigned classes.</p>
      </div>

      <div className="flex gap-2">
        {(["mark", "history"] as const).map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${
              tab === item ? "border border-teal-500/30 bg-teal-500/20 text-teal-300" : "text-slate-400 hover:text-white"
            }`}
          >
            {item === "mark" ? "Mark Attendance" : "History"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm">
          <span className="text-slate-400">Batch</span>
          <select
            value={selectedBatch}
            onChange={(event) => setSelectedBatch(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
          >
            <option value="">Select batch</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm">
          <span className="text-slate-400">Date</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
          />
        </label>
      </div>

      {tab === "mark" ? (
        <div className="space-y-4">
          {students.length > 0 && (
            <div className="flex gap-2">
              <button onClick={() => markAll("present")} className="rounded-lg bg-teal-500/10 px-3 py-1.5 text-xs text-teal-300">
                Mark all present
              </button>
              <button onClick={() => markAll("absent")} className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-300">
                Mark all absent
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
            </div>
          ) : students.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center text-sm text-slate-500">
              {selectedBatch ? "No students in this batch" : "Select a batch to mark attendance"}
            </div>
          ) : (
            <div className="space-y-2">
              {students.map((student) => {
                const id = studentId(student);
                const status = attendance[id] ?? "present";
                return (
                  <div key={id} className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{student.fullName ?? student.full_name ?? student.name ?? "Student"}</p>
                      <p className="text-xs text-slate-500">{student.email}</p>
                    </div>
                    <div className="flex gap-2">
                      {statuses.map((item) => (
                        <button
                          key={item}
                          onClick={() => setAttendance((prev) => ({ ...prev, [id]: item }))}
                          className={`rounded-lg border px-3 py-1 text-xs font-medium capitalize transition ${
                            status === item ? statusClass[item] : "border-slate-700 text-slate-500 hover:border-slate-600"
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {students.length > 0 && (
            <button
              onClick={submit}
              disabled={submitting}
              className="w-full rounded-xl bg-teal-500 py-3 text-sm font-medium text-slate-950 transition hover:bg-teal-400 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Submit Attendance"}
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-white">
            {selectedBatchName || "Selected batch"} history for {selectedDate}
          </div>
          {history.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">No records for this date.</div>
          ) : (
            <div className="divide-y divide-slate-800">
              {history.map((record) => (
                <div key={record.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-slate-300">{record.student_name ?? record.student_id}</span>
                  <span className={`rounded-full px-2 py-1 text-xs capitalize ${statusClass[record.status] ?? "bg-slate-800 text-slate-400"}`}>
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
