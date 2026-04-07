"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Batch = { id: string; name: string };
type Student = { studentUserId: string; fullName: string; email: string };
type TimeSlot = { id: string; day_of_week: string; start_time: string; end_time: string };

const statusOptions = ["present", "absent", "late", "excused"] as const;

export default function AttendanceMarkPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [batchRes, slotRes] = await Promise.all([api.get("/batches"), api.get("/time-slots")]);
      setBatches(batchRes.data.batches ?? []);
      setTimeSlots(slotRes.data.slots ?? []);
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedBatch) return;
    const loadStudents = async () => {
      const res = await api.get(`/batches/${selectedBatch}/students`);
      const list = res.data.students ?? [];
      setStudents(list);
      const next: Record<string, string> = {};
      list.forEach((s: Student) => {
        next[s.studentUserId] = "present";
      });
      setStatusMap(next);
    };
    loadStudents();
  }, [selectedBatch]);

  const markAll = (status: string) => {
    const next: Record<string, string> = {};
    students.forEach((s) => {
      next[s.studentUserId] = status;
    });
    setStatusMap(next);
  };

  const submit = async () => {
    if (!selectedBatch || !selectedDate) return;
    try {
      setError(null);
      await api.post("/attendance/mark", {
        batchId: selectedBatch,
        date: selectedDate,
        timeSlotId: selectedSlot || undefined,
        attendance: students.map((s) => ({
          studentId: s.studentUserId,
          status: statusMap[s.studentUserId] ?? "present",
        })),
      });
      setSuccess("Attendance saved.");
    } catch (err) {
      const message =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Save failed"
          : "Save failed";
      setError(message);
    }
  };

  const filled = useMemo(() => students.length > 0 && selectedDate, [students, selectedDate]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Attendance</p>
        <h2 className="mt-2 text-2xl font-semibold">Mark Attendance</h2>
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
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
            <Label>Date</Label>
            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
          </div>
          <div>
            <Label>Time Slot</Label>
            <select
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
            >
              <option value="">Whole day</option>
              {timeSlots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.day_of_week} {slot.start_time}-{slot.end_time}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => markAll("present")}>
            Mark All Present
          </Button>
          <Button variant="outline" onClick={() => markAll("absent")}>
            Mark All Absent
          </Button>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        {students.length === 0 ? (
          <p className="text-sm text-slate-400">Select a batch to load students.</p>
        ) : (
          <div className="space-y-2">
            {students.map((student) => (
              <div key={student.studentUserId} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">{student.fullName}</p>
                  <p className="text-xs text-slate-400">{student.email}</p>
                </div>
                <div className="flex gap-2">
                  {statusOptions.map((status) => (
                    <Button
                      key={status}
                      variant={statusMap[student.studentUserId] === status ? "default" : "outline"}
                      onClick={() =>
                        setStatusMap((prev) => ({ ...prev, [student.studentUserId]: status }))
                      }
                    >
                      {status}
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {error && <p className="text-sm text-red-300">{error}</p>}
        {success && <p className="text-sm text-emerald-300">{success}</p>}
        <Button disabled={!filled} onClick={submit}>
          Save Attendance
        </Button>
      </Card>
    </div>
  );
}
