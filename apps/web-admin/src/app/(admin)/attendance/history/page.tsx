"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Batch = { id: string; name: string };
type Record = {
  id: string;
  student_id: string;
  status: string;
  remarks: string | null;
};

export default function AttendanceHistoryPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [records, setRecords] = useState<Record[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const batchRes = await api.get("/batches");
      setBatches(batchRes.data.batches ?? []);
    };
    load();
  }, []);

  const loadAttendance = async () => {
    if (!selectedBatch || !selectedDate) return;
    try {
      const response = await api.get(`/attendance/batch/${selectedBatch}`, {
        params: { date: selectedDate },
      });
      setRecords(response.data.records ?? []);
      setError(null);
    } catch (err) {
      const message =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Load failed"
          : "Load failed";
      setError(message);
    }
  };

  const updateRecord = async (id: string, status: string) => {
    await api.put(`/attendance/${id}`, { status });
    await loadAttendance();
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Attendance</p>
        <h2 className="mt-2 text-2xl font-semibold">Attendance History</h2>
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
          <div className="flex items-end">
            <Button onClick={loadAttendance}>Load</Button>
          </div>
        </div>
        {error && <p className="text-sm text-red-300">{error}</p>}
      </Card>

      <Card className="p-4 space-y-3">
        {records.length === 0 ? (
          <p className="text-sm text-slate-400">No attendance records for this date.</p>
        ) : (
          records.map((record) => (
            <div key={record.id} className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-white">Student ID: {record.student_id}</p>
                <p className="text-xs text-slate-400">{record.remarks ?? "—"}</p>
              </div>
              <div className="flex gap-2">
                {["present", "absent", "late", "excused"].map((status) => (
                  <Button
                    key={status}
                    variant={record.status === status ? "default" : "outline"}
                    onClick={() => updateRecord(record.id, status)}
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
