"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckSquare, ClipboardList, FileUp, PlusCircle } from "lucide-react";
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

type Test = {
  id: string;
  title: string;
  status: string;
  start_time: string | null;
  end_time: string | null;
};

type StudentSummary = {
  id: string;
  fullName?: string;
  full_name?: string;
};

type TeacherStats = {
  totalStudents: number;
  totalBatches: number;
  testsCreated: number;
  pendingEvaluations: number;
};

export default function TeacherPortalPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [schedule, setSchedule] = useState<
    Array<{
      id: string;
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      courseName: string;
      batchName: string;
      roomName: string;
      batchId?: string;
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
      const [dashboardRes, notesRes, slotsRes, availRes, scheduleRes, testsRes, studentsRes] = await Promise.allSettled([
        api.get("/portal/teacher/dashboard"),
        api.get("/notifications/my"),
        api.get("/time-slots"),
        api.get(`/teachers/${user?.id}/availability`),
        api.get(`/timetable/teacher/${user?.id}`),
        api.get("/tests"),
        api.get("/students"),
      ]);
      setStats(dashboardRes.status === "fulfilled" ? dashboardRes.value.data.data ?? null : null);
      setNotifications(notesRes.status === "fulfilled" ? notesRes.value.data.notifications ?? [] : []);
      setTimeSlots(slotsRes.status === "fulfilled" ? slotsRes.value.data.slots ?? [] : []);
      setAvailability(availRes.status === "fulfilled" ? availRes.value.data.availability ?? [] : []);
      setSchedule(scheduleRes.status === "fulfilled" ? scheduleRes.value.data.entries ?? [] : []);
      setTests(testsRes.status === "fulfilled" ? testsRes.value.data.tests ?? [] : []);
      setStudents(studentsRes.status === "fulfilled" ? studentsRes.value.data.students ?? [] : []);
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

  const uniqueBatches = Array.from(
    new Map(schedule.map((entry) => [entry.batchName, { name: entry.batchName, course: entry.courseName }])).values()
  );
  const pendingEvaluations = stats?.pendingEvaluations ?? tests.filter((test) => test.status === "completed").length;
  const todaysDay = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const todaysClasses = schedule.filter((entry) => entry.dayOfWeek.toLowerCase() === todaysDay);
  const recentTests = tests.slice(0, 3);
  const recentAnnouncements = notifications.slice(0, 3);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {user?.fullName ?? "Teacher"}!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm text-slate-300">Institute: {user?.tenantName ?? "Your Institute"}</p>
          <p className="text-xs text-slate-400">Manage your classes, tests, materials, attendance, and student progress.</p>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "My Students", value: stats?.totalStudents ?? students.length, hint: "students in assigned batches" },
          { label: "My Batches", value: stats?.totalBatches ?? uniqueBatches.length, hint: "assigned batches" },
          { label: "Tests Created", value: stats?.testsCreated ?? tests.length, hint: "created assessments" },
          { label: "Pending Evaluations", value: pendingEvaluations, hint: "completed tests to review" }
        ].map((stat) => (
          <Card key={stat.label} className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{stat.value}</p>
            <p className="mt-1 text-xs text-slate-400">{stat.hint}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button className="justify-start gap-2" onClick={generateQr}>
              <CheckSquare className="size-4" aria-hidden="true" />
              Mark Today&apos;s Attendance
            </Button>
            <Link href="/tests/new">
              <Button className="w-full justify-start gap-2" variant="outline">
                <PlusCircle className="size-4" aria-hidden="true" />
                Create New Test
              </Button>
            </Link>
            <Link href="/materials/upload">
              <Button className="w-full justify-start gap-2" variant="outline">
                <FileUp className="size-4" aria-hidden="true" />
                Upload Material
              </Button>
            </Link>
            <a href="#timetable">
              <Button className="w-full justify-start gap-2" variant="outline">
                <CalendarDays className="size-4" aria-hidden="true" />
                View Timetable
              </Button>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentTests.length === 0 && recentAnnouncements.length === 0 && todaysClasses.length === 0 ? (
              <p className="text-sm text-slate-400">No recent activity yet.</p>
            ) : (
              <>
                {recentTests.map((test) => (
                  <div key={test.id} className="rounded-lg border border-white/10 p-3">
                    <p className="font-semibold text-white">{test.title}</p>
                    <p className="text-xs text-slate-400">Test status: {test.status}</p>
                  </div>
                ))}
                {recentAnnouncements.map((note) => (
                  <div key={note.id} className="rounded-lg border border-white/10 p-3">
                    <p className="font-semibold text-white">{note.subject}</p>
                    <p className="text-xs text-slate-400">Announcement received</p>
                  </div>
                ))}
                {todaysClasses.map((entry) => (
                  <div key={entry.id} className="rounded-lg border border-white/10 p-3">
                    <p className="font-semibold text-white">{entry.courseName}</p>
                    <p className="text-xs text-slate-400">
                      Today, {entry.startTime} - {entry.endTime} • {entry.batchName}
                    </p>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </section>

      <Card id="classes">
        <CardHeader>
          <CardTitle>My Classes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {uniqueBatches.length === 0 ? (
            <p className="text-sm text-slate-400">No batches assigned yet.</p>
          ) : (
            uniqueBatches.map((batch) => (
              <div key={batch.name} className="rounded-lg border border-white/10 p-3">
                <p className="font-semibold text-white">{batch.name}</p>
                <p className="text-xs text-slate-400">{batch.course ?? "Course not assigned"}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card id="timetable">
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
          <CardTitle>Tests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {tests.length === 0 ? (
            <p className="text-sm text-slate-400">No tests created yet.</p>
          ) : (
            recentTests.map((test) => (
              <div key={test.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 p-3">
                <div>
                  <p className="font-semibold text-white">{test.title}</p>
                  <p className="text-xs text-slate-400">{test.start_time ? new Date(test.start_time).toLocaleString() : "No schedule"}</p>
                </div>
                <span className="rounded-full bg-white/10 px-2 py-1 text-xs uppercase text-slate-300">{test.status}</span>
              </div>
            ))
          )}
          <Link href="/tests">
            <Button variant="outline" className="gap-2">
              <ClipboardList className="size-4" aria-hidden="true" />
              Manage Tests
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card id="announcements">
        <CardHeader>
          <CardTitle>Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-400">No announcements yet.</p>
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
            <Link href="/portal/settings/notifications" className="text-xs text-blue-300 underline">
              Notification Settings
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card id="profile">
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

      <Card id="attendance">
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
