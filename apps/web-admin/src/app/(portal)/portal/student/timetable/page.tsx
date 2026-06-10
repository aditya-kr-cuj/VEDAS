"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function StudentTimetablePage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(days[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1]);

  useEffect(() => {
    api
      .get("/students/my-batch")
      .then((batchRes) => {
        const batchId = batchRes.data.data?.batch_id ?? batchRes.data.batch?.batch_id;
        if (!batchId) throw new Error("No batch assigned");
        return api.get(`/timetable/batch/${batchId}`);
      })
      .then((res) => setEntries(res.data.entries ?? res.data.data ?? []))
      .catch((err) => toast.error(err.message === "No batch assigned" ? "No batch assigned" : "Failed to load timetable"))
      .finally(() => setLoading(false));
  }, []);

  const dayEntries = entries.filter((entry) => (entry.dayOfWeek ?? entry.day_of_week ?? "").toLowerCase() === selectedDay.toLowerCase());

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">My Timetable</h1>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`whitespace-nowrap rounded-lg border px-4 py-2 text-sm font-medium transition ${
              selectedDay === day ? "border-teal-500/30 bg-teal-500/20 text-teal-300" : "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            {day.slice(0, 3)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
        </div>
      ) : dayEntries.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center text-sm text-slate-500">No classes on {selectedDay}.</div>
      ) : (
        <div className="space-y-3">
          {dayEntries
            .sort((a, b) => String(a.startTime ?? a.start_time).localeCompare(String(b.startTime ?? b.start_time)))
            .map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
                <div className="min-w-20 text-center">
                  <p className="text-sm font-semibold text-teal-300">{entry.startTime ?? entry.start_time}</p>
                  <p className="text-xs text-slate-500">{entry.endTime ?? entry.end_time}</p>
                </div>
                <div className="h-10 w-px bg-slate-700" />
                <div>
                  <p className="text-sm font-medium text-white">{entry.courseName ?? entry.course_name ?? "Class"}</p>
                  <p className="text-xs text-slate-400">
                    {entry.teacherName ?? entry.teacher_name ?? "Teacher"} | {entry.roomName ?? entry.room_name ?? "TBD"}
                  </p>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
