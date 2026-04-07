"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TimeSlot = {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  slot_number: number;
};

type Batch = {
  id: string;
  name: string;
};

type Course = {
  id: string;
  name: string;
};

type Room = {
  id: string;
  room_name: string;
  capacity: number;
};

type Teacher = {
  id: string;
  full_name: string;
  email: string;
};

type Entry = {
  id: string;
  dayOfWeek: string;
  timeSlotId: string;
  startTime: string;
  endTime: string;
  courseId: string;
  courseName: string;
  teacherUserId: string;
  teacherName: string;
  roomId: string;
  roomName: string;
};

const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function TimetablePage() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [generated, setGenerated] = useState<Entry[]>([]);
  const [generateErrors, setGenerateErrors] = useState<string[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [viewMode, setViewMode] = useState<"batch" | "teacher">("batch");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [roomFilter, setRoomFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [mobileDayIndex, setMobileDayIndex] = useState(0);
  const [form, setForm] = useState({
    dayOfWeek: "monday",
    timeSlotId: "",
    courseId: "",
    teacherUserId: "",
    roomId: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [autoCourses, setAutoCourses] = useState<
    Array<{ courseId: string; teacherUserId: string; lecturesPerWeek: number }>
  >([{ courseId: "", teacherUserId: "", lecturesPerWeek: 3 }]);

  const loadBase = async () => {
    const [slotRes, batchRes, courseRes, roomRes, teacherRes] = await Promise.all([
      api.get("/time-slots"),
      api.get("/batches"),
      api.get("/courses"),
      api.get("/rooms"),
      api.get("/users", { params: { role: "teacher" } }),
    ]);
    setTimeSlots(slotRes.data.slots ?? []);
    setBatches(batchRes.data.batches ?? []);
    setCourses(courseRes.data.courses ?? []);
    setRooms(roomRes.data.rooms ?? []);
    setTeachers(teacherRes.data.users ?? []);
  };

  const loadEntries = async (batchId: string) => {
    if (viewMode === "batch") {
      if (!batchId) return;
      const response = await api.get(`/timetable/batch/${batchId}`);
      setEntries(response.data.entries ?? []);
      return;
    }
    if (viewMode === "teacher") {
      if (!selectedTeacher) return;
      const response = await api.get(`/timetable/teacher/${selectedTeacher}`);
      setEntries(response.data.entries ?? []);
    }
  };

  useEffect(() => {
    loadBase();
  }, []);

  useEffect(() => {
    if (viewMode === "batch" && selectedBatch) loadEntries(selectedBatch);
    if (viewMode === "teacher" && selectedTeacher) loadEntries(selectedBatch);
  }, [selectedBatch, selectedTeacher, viewMode]);

  const grid = useMemo(() => {
    const map = new Map<string, Entry>();
    entries
      .filter((entry) => (roomFilter ? entry.roomId === roomFilter : true))
      .filter((entry) => {
        if (!search.trim()) return true;
        const q = search.trim().toLowerCase();
        return (
          entry.courseName.toLowerCase().includes(q) ||
          entry.teacherName.toLowerCase().includes(q) ||
          entry.roomName.toLowerCase().includes(q)
        );
      })
      .forEach((entry) => {
      map.set(`${entry.dayOfWeek}-${entry.timeSlotId}`, entry);
    });
    return map;
  }, [entries, roomFilter, search]);

  const generatedGrid = useMemo(() => {
    const map = new Map<string, Entry>();
    generated.forEach((entry) => {
      map.set(`${entry.dayOfWeek}-${entry.timeSlotId}`, entry);
    });
    return map;
  }, [generated]);

  const submit = async () => {
    if (!selectedBatch) return;
    try {
      setError(null);
      await api.post("/timetable/entries", {
        batchId: selectedBatch,
        ...form,
      });
      await loadEntries(selectedBatch);
    } catch (err) {
      const message =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Create failed"
          : "Create failed";
      setError(message);
    }
  };

  const downloadICS = (items: Entry[], filename: string) => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const nextDateForDay = (day: string) => {
      const dayIndex = days.indexOf(day);
      const currentIndex = (now.getDay() + 6) % 7; // monday=0
      let diff = dayIndex - currentIndex;
      if (diff < 0) diff += 7;
      const date = new Date(now);
      date.setDate(now.getDate() + diff);
      return date;
    };

    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//VEDAS//Timetable//EN",
    ];

    items.forEach((entry) => {
      const date = nextDateForDay(entry.dayOfWeek);
      const [sh, sm] = entry.startTime.split(":");
      const [eh, em] = entry.endTime.split(":");
      const start = new Date(date);
      start.setHours(Number(sh), Number(sm), 0, 0);
      const end = new Date(date);
      end.setHours(Number(eh), Number(em), 0, 0);
      const fmt = (d: Date) =>
        `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(
          d.getMinutes()
        )}00`;

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${entry.id}@vedas`);
      lines.push(`DTSTAMP:${fmt(new Date())}`);
      lines.push(`DTSTART:${fmt(start)}`);
      lines.push(`DTEND:${fmt(end)}`);
      lines.push(`SUMMARY:${entry.courseName} (${entry.roomName})`);
      lines.push(`DESCRIPTION:${entry.teacherName}`);
      lines.push("RRULE:FREQ=WEEKLY");
      lines.push("END:VEVENT");
    });

    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredEntries = entries.filter((entry) => (roomFilter ? entry.roomId === roomFilter : true));
  const mobileDay = days[mobileDayIndex];
  const mobileEntries = filteredEntries.filter((entry) => entry.dayOfWeek === mobileDay);

  const runGenerate = async () => {
    if (!selectedBatch) return;
    try {
      setError(null);
      const response = await api.post("/timetable/generate", {
        batchId: selectedBatch,
        courses: autoCourses.map((c) => ({
          courseId: c.courseId,
          teacherUserId: c.teacherUserId,
          lecturesPerWeek: c.lecturesPerWeek,
        })),
      });
      setGenerated(response.data.entries ?? []);
      setGenerateErrors((response.data.errors ?? []).map((e: { error: string }) => e.error));
    } catch (err) {
      const message =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Generate failed"
          : "Generate failed";
      setError(message);
    }
  };

  const applyGenerated = async () => {
    try {
      await api.post("/timetable/apply", {
        entries: generated.map((entry) => ({
          batchId: selectedBatch,
          courseId: entry.courseId,
          teacherUserId: entry.teacherUserId,
          roomId: entry.roomId,
          timeSlotId: entry.timeSlotId,
          dayOfWeek: entry.dayOfWeek,
        })),
      });
      await loadEntries(selectedBatch);
      setGenerated([]);
    } catch (err) {
      const message =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Apply failed"
          : "Apply failed";
      setError(message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Timetable</p>
        <h2 className="mt-2 text-2xl font-semibold">Manual Timetable</h2>
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
            <Label>View Mode</Label>
            <select
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value as "batch" | "teacher")}
            >
              <option value="batch">Batch</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
          {viewMode === "teacher" && (
            <div>
              <Label>Teacher</Label>
              <select
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
              >
                <option value="">Select teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <Label>Day</Label>
            <select
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
              value={form.dayOfWeek}
              onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
            >
              {days.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Time Slot</Label>
            <select
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
              value={form.timeSlotId}
              onChange={(e) => setForm({ ...form, timeSlotId: e.target.value })}
            >
              <option value="">Select slot</option>
              {timeSlots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.day_of_week} {slot.start_time}-{slot.end_time}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Course</Label>
            <select
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
              value={form.courseId}
              onChange={(e) => setForm({ ...form, courseId: e.target.value })}
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Teacher</Label>
            <select
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
              value={form.teacherUserId}
              onChange={(e) => setForm({ ...form, teacherUserId: e.target.value })}
            >
              <option value="">Select teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name} ({teacher.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Room</Label>
            <select
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
              value={form.roomId}
              onChange={(e) => setForm({ ...form, roomId: e.target.value })}
            >
              <option value="">Select room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.room_name} (cap {room.capacity})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Room Filter</Label>
            <select
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
            >
              <option value="">All rooms</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.room_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Search</Label>
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Course / Teacher / Room" />
          </div>
        </div>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button onClick={submit} disabled={!selectedBatch || !form.timeSlotId}>
          Create Entry
          </Button>
          <Button variant="outline" onClick={() => downloadICS(filteredEntries, "timetable.ics")}>
            Export to Calendar
          </Button>
          <Button variant="ghost" onClick={() => window.print()}>
            Print / PDF
          </Button>
        </div>
      </Card>

      <Card className="p-4 space-y-4">
        <div>
          <p className="text-sm font-semibold">Auto Generate</p>
          <p className="text-xs text-slate-400">Greedy generation with conflict checks.</p>
        </div>
        {autoCourses.map((row, index) => (
          <div key={index} className="grid gap-3 md:grid-cols-4">
            <div>
              <Label>Course</Label>
              <select
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
                value={row.courseId}
                onChange={(e) => {
                  const next = [...autoCourses];
                  next[index] = { ...next[index], courseId: e.target.value };
                  setAutoCourses(next);
                }}
              >
                <option value="">Select course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Teacher</Label>
              <select
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
                value={row.teacherUserId}
                onChange={(e) => {
                  const next = [...autoCourses];
                  next[index] = { ...next[index], teacherUserId: e.target.value };
                  setAutoCourses(next);
                }}
              >
                <option value="">Select teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Lectures / Week</Label>
              <Input
                type="number"
                min={1}
                value={row.lecturesPerWeek}
                onChange={(e) => {
                  const next = [...autoCourses];
                  next[index] = { ...next[index], lecturesPerWeek: Number(e.target.value) };
                  setAutoCourses(next);
                }}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setAutoCourses((prev) => prev.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            </div>
          </div>
        ))}
        <Button
          variant="ghost"
          onClick={() =>
            setAutoCourses((prev) => [...prev, { courseId: "", teacherUserId: "", lecturesPerWeek: 3 }])
          }
        >
          Add Course
        </Button>
        <div className="flex gap-2">
          <Button onClick={runGenerate} disabled={!selectedBatch}>
            Generate
          </Button>
          <Button onClick={applyGenerated} disabled={generated.length === 0}>
            Apply
          </Button>
        </div>
        {generateErrors.length > 0 && (
          <ul className="text-xs text-red-300 space-y-1">
            {generateErrors.map((errMsg, idx) => (
              <li key={idx}>{errMsg}</li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-4">
        <div className="md:hidden space-y-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setMobileDayIndex((i) => (i === 0 ? 6 : i - 1))}>
              Prev
            </Button>
            <p className="text-sm font-semibold uppercase text-slate-300">{mobileDay}</p>
            <Button variant="ghost" onClick={() => setMobileDayIndex((i) => (i === 6 ? 0 : i + 1))}>
              Next
            </Button>
          </div>
          <div className="space-y-2">
            {mobileEntries.length === 0 ? (
              <p className="text-sm text-slate-400">No entries for this day.</p>
            ) : (
              mobileEntries.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm">
                  <p className="font-semibold text-white">{entry.courseName}</p>
                  <p className="text-xs text-slate-400">
                    {entry.startTime} - {entry.endTime}
                  </p>
                  <p className="text-xs text-slate-400">{entry.teacherName}</p>
                  <p className="text-xs text-slate-400">{entry.roomName}</p>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="hidden md:block">
        <div className="grid gap-2">
          <div className="grid grid-cols-[160px_repeat(7,minmax(120px,1fr))] gap-2 text-xs text-slate-400">
            <div>Time</div>
            {days.map((day) => (
              <div key={day} className="uppercase">
                {day}
              </div>
            ))}
          </div>
          {timeSlots.map((slot) => (
            <div key={slot.id} className="grid grid-cols-[160px_repeat(7,minmax(120px,1fr))] gap-2">
              <div className="text-xs text-slate-300">
                Slot {slot.slot_number} {slot.start_time}-{slot.end_time}
              </div>
              {days.map((day) => {
                const entry = grid.get(`${day}-${slot.id}`);
                return (
                  <div
                    key={day}
                    className={`min-h-[52px] rounded-lg border border-white/10 p-2 text-xs ${
                      entry ? "bg-emerald-500/20 text-emerald-100" : "bg-white/5 text-slate-400"
                    }`}
                  >
                    {entry ? (
                      <div>
                        <p className="font-semibold">{entry.courseName}</p>
                        <p>{entry.teacherName}</p>
                        <p className="text-[10px]">{entry.roomName}</p>
                      </div>
                    ) : (
                      <p>—</p>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        </div>
      </Card>

      {generated.length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-semibold">Generated Preview</p>
          <div className="mt-3 grid gap-2">
            <div className="grid grid-cols-[160px_repeat(7,minmax(120px,1fr))] gap-2 text-xs text-slate-400">
              <div>Time</div>
              {days.map((day) => (
                <div key={day} className="uppercase">
                  {day}
                </div>
              ))}
            </div>
            {timeSlots.map((slot) => (
              <div key={slot.id} className="grid grid-cols-[160px_repeat(7,minmax(120px,1fr))] gap-2">
                <div className="text-xs text-slate-300">
                  Slot {slot.slot_number} {slot.start_time}-{slot.end_time}
                </div>
                {days.map((day) => {
                  const entry = generatedGrid.get(`${day}-${slot.id}`);
                  return (
                    <div
                      key={day}
                      className={`min-h-[52px] rounded-lg border border-white/10 p-2 text-xs ${
                        entry ? "bg-blue-500/20 text-blue-100" : "bg-white/5 text-slate-400"
                      }`}
                    >
                      {entry ? (
                        <div>
                          <p className="font-semibold">{entry.courseName}</p>
                          <p>{entry.teacherName}</p>
                          <p className="text-[10px]">{entry.roomName}</p>
                        </div>
                      ) : (
                        <p>—</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
