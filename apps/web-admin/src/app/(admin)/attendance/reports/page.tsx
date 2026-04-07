"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Batch = { id: string; name: string };
type Student = { studentUserId: string; fullName: string; email: string };
type Attendance = { student_id: string; batch_id: string; date: string; status: string; course_id: string | null };

export default function AttendanceReportsPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<Attendance[]>([]);
  const [threshold, setThreshold] = useState(75);

  useEffect(() => {
    const load = async () => {
      const batchRes = await api.get("/batches");
      setBatches(batchRes.data.batches ?? []);
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedBatch) return;
    const loadStudents = async () => {
      const res = await api.get(`/batches/${selectedBatch}/students`);
      setStudents(res.data.students ?? []);
    };
    loadStudents();
  }, [selectedBatch]);

  const loadRecords = async () => {
    if (!selectedBatch) return;
    const results: Attendance[] = [];
    for (const student of students) {
      const res = await api.get(`/attendance/student/${student.studentUserId}`);
      const filtered = (res.data.records ?? []).filter((r: Attendance) => r.batch_id === selectedBatch);
      results.push(...filtered);
    }
    setRecords(results);
  };

  useEffect(() => {
    if (students.length > 0) loadRecords();
  }, [students]);

  const inRange = (date: string) => {
    if (!fromDate || !toDate) return true;
    return date >= fromDate && date <= toDate;
  };

  const summary = useMemo(() => {
    const map = new Map<string, { total: number; present: number }>();
    records.filter((r) => inRange(r.date)).forEach((rec) => {
      const stats = map.get(rec.student_id) ?? { total: 0, present: 0 };
      stats.total += 1;
      if (rec.status === "present" || rec.status === "late" || rec.status === "excused") {
        stats.present += 1;
      }
      map.set(rec.student_id, stats);
    });
    return map;
  }, [records, fromDate, toDate]);

  const downloadCSV = () => {
    const rows = ["student_id,attendance_percentage"];
    summary.forEach((stats, studentId) => {
      const percent = stats.total === 0 ? 0 : Math.round((stats.present / stats.total) * 100);
      rows.push(`${studentId},${percent}`);
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "attendance-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const lowAttendance = Array.from(summary.entries()).filter(([, stats]) => {
    const percent = stats.total === 0 ? 0 : (stats.present / stats.total) * 100;
    return percent < threshold;
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Attendance</p>
        <h2 className="mt-2 text-2xl font-semibold">Reports</h2>
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <Label>Batch</Label>
            <select
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              <option value="">Select batch</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>From</Label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <Label>To</Label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div>
            <Label>Low Attendance Threshold (%)</Label>
            <Input type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={downloadCSV}>Export CSV</Button>
          <Button variant="ghost" onClick={() => window.print()}>
            Export PDF
          </Button>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <p className="text-sm font-semibold">Batch Summary</p>
        {Array.from(summary.entries()).length === 0 ? (
          <p className="text-sm text-slate-400">No data yet.</p>
        ) : (
          Array.from(summary.entries()).map(([studentId, stats]) => {
            const percent = stats.total === 0 ? 0 : Math.round((stats.present / stats.total) * 100);
            return (
              <div key={studentId} className="flex items-center justify-between">
                <p className="text-sm text-slate-300">{studentId}</p>
                <p className="text-sm text-slate-100">{percent}%</p>
              </div>
            );
          })
        )}
      </Card>

      <Card className="p-4 space-y-3">
        <p className="text-sm font-semibold">Low Attendance (&lt; {threshold}%)</p>
        {lowAttendance.length === 0 ? (
          <p className="text-sm text-slate-400">No students below threshold.</p>
        ) : (
          lowAttendance.map(([studentId, stats]) => {
            const percent = stats.total === 0 ? 0 : Math.round((stats.present / stats.total) * 100);
            return (
              <div key={studentId} className="flex items-center justify-between">
                <p className="text-sm text-slate-300">{studentId}</p>
                <p className="text-sm text-red-300">{percent}%</p>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
