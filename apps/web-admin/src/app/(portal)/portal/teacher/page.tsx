"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvailabilityGrid } from "@/components/availability-grid";

type Notification = {
  id: string;
  subject: string;
  body: string;
  created_at: string;
};

type TimeSlot = {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  slot_number: number;
};

type Availability = {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  reason: string | null;
};

export default function TeacherPortalPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [schedule, setSchedule] = useState<
    Array<{
      id: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      courseName: string;
      batchName: string;
      roomName: string;
    }>
  >([]);
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role && user.role !== "teacher") {
      router.replace("/dashboard");
      return;
    }

    const load = async () => {
      try {
        const [notesRes, slotsRes, availRes, scheduleRes] = await Promise.all([
          api.get("/notifications/my"),
          api.get("/time-slots"),
          api.get(`/teachers/${user?.id}/availability`),
          api.get(`/timetable/teacher/${user?.id}`),
        ]);
        setNotifications(notesRes.data.notifications ?? []);
        setTimeSlots(slotsRes.data.slots ?? []);
        setAvailability(availRes.data.availability ?? []);
        setSchedule(scheduleRes.data.entries ?? []);
      } catch {
        setNotifications([]);
        setTimeSlots([]);
        setAvailability([]);
        setSchedule([]);
      }
    };
    load();
  }, [user, router]);

  const updateProfile = async () => {
    try {
      await api.put("/users/me", { fullName });
      setSaveStatus("Profile updated");
    } catch {
      setSaveStatus("Update failed");
    }
  };

  const markUnavailable = async (slot: TimeSlot, reason: string) => {
    if (!user?.id) return;
    await api.post(`/teachers/${user.id}/availability`, {
      dayOfWeek: slot.day_of_week,
      startTime: slot.start_time,
      endTime: slot.end_time,
      isAvailable: false,
      reason: reason || undefined,
    });
    const res = await api.get(`/teachers/${user.id}/availability`);
    setAvailability(res.data.availability ?? []);
  };

  const markAvailable = async (availabilityId: string) => {
    if (!user?.id) return;
    await api.delete(`/teachers/${user.id}/availability/${availabilityId}`);
    const res = await api.get(`/teachers/${user.id}/availability`);
    setAvailability(res.data.availability ?? []);
  };

  const downloadICS = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const nextDateForDay = (day: string) => {
      const dayIndex = days.indexOf(day);
      const currentIndex = (now.getDay() + 6) % 7;
      let diff = dayIndex - currentIndex;
      if (diff < 0) diff += 7;
      const date = new Date(now);
      date.setDate(now.getDate() + diff);
      return date;
    };
    const fmt = (d: Date) =>
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(
        d.getMinutes()
      )}00`;

    const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//VEDAS//Timetable//EN"];
    schedule.forEach((entry) => {
      const date = nextDateForDay(entry.dayOfWeek);
      const [sh, sm] = entry.startTime.split(":");
      const [eh, em] = entry.endTime.split(":");
      const start = new Date(date);
      start.setHours(Number(sh), Number(sm), 0, 0);
      const end = new Date(date);
      end.setHours(Number(eh), Number(em), 0, 0);
      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${entry.id}@vedas`);
      lines.push(`DTSTAMP:${fmt(new Date())}`);
      lines.push(`DTSTART:${fmt(start)}`);
      lines.push(`DTEND:${fmt(end)}`);
      lines.push(`SUMMARY:${entry.courseName} (${entry.batchName})`);
      lines.push(`DESCRIPTION:${entry.roomName}`);
      lines.push("RRULE:FREQ=WEEKLY");
      lines.push("END:VEVENT");
    });
    lines.push("END:VCALENDAR");
    const blob = new Blob([lines.join("\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "teacher-timetable.ics";
    a.click();
    URL.revokeObjectURL(url);
  };

  const [qrToken, setQrToken] = useState<string | null>(null);
  const [qrExpires, setQrExpires] = useState<string | null>(null);

  const generateQr = async () => {
    if (!user?.id) return;
    const res = await api.post("/attendance/generate-qr", {
      batchId: schedule[0]?.batchId,
      timeSlotId: null,
      expiresInMinutes: 10
    });
    setQrToken(res.data.token);
    setQrExpires(res.data.expiresAt);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome back, {user?.fullName ?? "Teacher"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-300">Your teaching summary and notices live here.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email ?? ""} readOnly />
            </div>
            {saveStatus && <p className="text-xs text-slate-400">{saveStatus}</p>}
            <Button onClick={updateProfile}>Save</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-400">No notifications yet.</p>
          ) : (
            <ul className="space-y-3">
              {notifications.map((note) => (
                <li key={note.id} className="rounded-lg border border-white/10 p-3">
                  <p className="font-semibold text-white">{note.subject}</p>
                  <p className="text-sm text-slate-300">{note.body}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3">
            <a href="/portal/settings/notifications" className="underline text-xs text-blue-300">
              Notification Settings
            </a>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timetable</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end">
            <Button variant="outline" onClick={downloadICS}>
              Export to Calendar
            </Button>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            {schedule.length === 0 ? (
              <p className="text-slate-400">No timetable entries assigned.</p>
            ) : (
              schedule.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-white/10 p-3">
                  <p className="font-semibold text-white">{entry.courseName}</p>
                  <p className="text-xs text-slate-400">
                    {entry.dayOfWeek} {entry.startTime} - {entry.endTime}
                  </p>
                  <p className="text-xs text-slate-400">Batch: {entry.batchName}</p>
                  <p className="text-xs text-slate-400">Room: {entry.roomName}</p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>QR Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={generateQr}>Generate QR Token</Button>
          {qrToken && (
            <div className="rounded-lg border border-white/10 p-3 text-sm">
              <p className="font-semibold text-white">Token: {qrToken}</p>
              <p className="text-xs text-slate-400">Expires: {qrExpires}</p>
              <p className="text-xs text-slate-400">Share this token with students to mark attendance.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Availability</CardTitle>
        </CardHeader>
        <CardContent>
          <AvailabilityGrid
            timeSlots={timeSlots}
            availability={availability}
            onMarkUnavailable={markUnavailable}
            onMarkAvailable={markAvailable}
          />
        </CardContent>
      </Card>
    </div>
  );
}
