"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart3, BookOpen, CalendarDays, ClipboardList, QrCode } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Notification = {
  id: string;
  subject: string;
  body: string;
  created_at: string;
};

type Attendance = {
  id: string;
  date: string;
  status: string;
  course_id: string | null;
};

type StudentFee = {
  student_fee_id: string;
  total_amount: string;
  paid_amount: string;
  due_amount: string;
  due_date: string;
  status: string;
  fee_name: string;
  frequency: string;
};

type StudentProfile = {
  id: string;
  rollNumber?: string | null;
  className?: string | null;
};

type StudentTest = {
  id: string;
  title: string;
  status: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number;
};

type PerformanceOverview = {
  average_score?: number | string | null;
};

export default function StudentPortalPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [paymentQuery, setPaymentQuery] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [courses, setCourses] = useState<Array<{ id: string; name: string }>>([]);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [fees, setFees] = useState<StudentFee[]>([]);
  const [tests, setTests] = useState<StudentTest[]>([]);
  const [performanceOverview, setPerformanceOverview] = useState<PerformanceOverview | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [payingFeeId, setPayingFeeId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role && user.role !== "student") {
      router.replace("/dashboard");
      return;
    }

    const load = async () => {
      try {
        const [notesRes, studentRes, courseRes, feeRes, testsRes] = await Promise.all([
          api.get("/notifications/my"),
          api.get("/students/me"),
          api.get("/courses"),
          api.get("/fees/my"),
          api.get("/student/tests")
        ]);
        setNotifications(notesRes.data.notifications ?? []);
        setCourses(courseRes.data.courses ?? []);
        setFees(feeRes.data.fees ?? []);
        setTests(testsRes.data.tests ?? []);
        setStudentProfile(studentRes.data.student ?? null);
        const id = studentRes.data.student?.id;
        if (id) {
          const [attRes, performanceRes] = await Promise.allSettled([
            api.get(`/attendance/student/${id}`),
            api.get(`/student/${id}/performance/overview`)
          ]);
          if (attRes.status === "fulfilled") {
            setAttendance(attRes.value.data.records ?? []);
          }
          if (performanceRes.status === "fulfilled") {
            setPerformanceOverview(performanceRes.value.data ?? null);
          }
        }
      } catch {
        setNotifications([]);
        setAttendance([]);
        setFees([]);
        setTests([]);
        setPerformanceOverview(null);
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

  const attendanceStats = attendance.reduce(
    (acc, record) => {
      acc.total += 1;
      if (["present", "late", "excused"].includes(record.status)) acc.present += 1;
      return acc;
    },
    { total: 0, present: 0 }
  );
  const percent = attendanceStats.total === 0 ? 0 : Math.round((attendanceStats.present / attendanceStats.total) * 100);
  const byCourse = attendance.reduce<Record<string, { total: number; present: number }>>((acc, record) => {
    const key = record.course_id ?? "unknown";
    if (!acc[key]) acc[key] = { total: 0, present: 0 };
    acc[key].total += 1;
    if (["present", "late", "excused"].includes(record.status)) acc[key].present += 1;
    return acc;
  }, {});
  const testsAttempted = tests.filter((test) => test.status === "completed").length;
  const averageScore =
    performanceOverview?.average_score === null || performanceOverview?.average_score === undefined
      ? "N/A"
      : `${Math.round(Number(performanceOverview.average_score))}%`;
  const pendingFees = fees.reduce((sum, fee) => sum + Number(fee.due_amount || 0), 0);
  const upcomingTests = tests
    .filter((test) => test.start_time && new Date(test.start_time) > new Date())
    .sort((a, b) => Number(new Date(a.start_time ?? 0)) - Number(new Date(b.start_time ?? 0)))
    .slice(0, 3);
  const recentAnnouncements = notifications.slice(0, 3);
  const batchName = studentProfile?.className ?? "Batch not assigned";
  const performanceBars = Object.entries(byCourse).slice(0, 4);

  const payOnline = async (fee: StudentFee) => {
    try {
      setPayingFeeId(fee.student_fee_id);
      const amount = Number(fee.due_amount);
      const res = await api.post("/fees/create-payment-link", {
        studentFeeId: fee.student_fee_id,
        amount
      });
      window.location.href = res.data.link;
    } catch {
      setPaymentStatus("Unable to start payment. Please try again.");
    } finally {
      setPayingFeeId(null);
    }
  };

  useEffect(() => {
    setPaymentQuery(new URLSearchParams(window.location.search).get("payment"));
  }, []);

  useEffect(() => {
    const status = paymentQuery;
    if (status === "success") setPaymentStatus("Payment successful. It may take a moment to reflect.");
    if (status === "failed") setPaymentStatus("Payment failed. Please try again.");
  }, [paymentQuery]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome back, {user?.fullName ?? "Student"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm text-slate-300">
            Batch: {batchName} | Institute: {user?.tenantName ?? "Your Institute"}
          </p>
          <p className="text-xs text-slate-400">Track tests, attendance, materials, fees, announcements, and performance.</p>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Attendance %", value: `${percent}%`, hint: `${attendanceStats.present}/${attendanceStats.total} present` },
          { label: "Tests Attempted", value: testsAttempted, hint: `${tests.length} total tests` },
          { label: "Average Score", value: averageScore, hint: "from published results" },
          { label: "Pending Fees", value: `₹${pendingFees}`, hint: fees.length === 0 ? "no records" : "total due" }
        ].map((stat) => (
          <Card key={stat.label} className="p-5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">{stat.value}</p>
            <p className="mt-1 text-xs text-slate-400">{stat.hint}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingTests.length === 0 ? (
              <p className="text-sm text-slate-400">No upcoming tests.</p>
            ) : (
              upcomingTests.map((test) => {
                const start = new Date(test.start_time ?? "");
                const days = Math.max(0, Math.ceil((start.getTime() - Date.now()) / 86400000));
                return (
                  <div key={test.id} className="rounded-lg border border-white/10 p-3">
                    <p className="font-semibold text-white">{test.title}</p>
                    <p className="text-xs text-slate-400">
                      {start.toLocaleString()} • {days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"} left`}
                    </p>
                  </div>
                );
              })
            )}
            <Link href="/portal/student/tests">
              <Button variant="outline" className="gap-2">
                <ClipboardList className="size-4" aria-hidden="true" />
                My Tests
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAnnouncements.length === 0 ? (
              <p className="text-sm text-slate-400">No announcements yet.</p>
            ) : (
              recentAnnouncements.map((note) => (
                <div key={note.id} className="rounded-lg border border-white/10 p-3">
                  <p className="font-semibold text-white">{note.subject}</p>
                  <p className="line-clamp-2 text-xs text-slate-400">{note.body}</p>
                </div>
              ))
            )}
            <Link href="/portal/student/announcements">
              <Button variant="outline">Open Notice Board</Button>
            </Link>
          </CardContent>
        </Card>

        <Card id="timetable">
          <CardHeader>
            <CardTitle>Today&apos;s Timetable</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-400">Timetable entries will appear here when your batch schedule is assigned.</p>
            <Button variant="outline" className="gap-2">
              <CalendarDays className="size-4" aria-hidden="true" />
              View Schedule
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Link href="/portal/student/tests">
              <Button className="w-full justify-start gap-2" variant="outline">
                <ClipboardList className="size-4" aria-hidden="true" />
                Open Tests
              </Button>
            </Link>
            <Link href="/portal/student/materials">
              <Button className="w-full justify-start gap-2" variant="outline">
                <BookOpen className="size-4" aria-hidden="true" />
                Study Materials
              </Button>
            </Link>
            <Link href="/portal/student/qr">
              <Button className="w-full justify-start gap-2" variant="outline">
                <QrCode className="size-4" aria-hidden="true" />
                QR Attendance
              </Button>
            </Link>
            <Link href="/portal/student/performance">
              <Button className="w-full justify-start gap-2" variant="outline">
                <BarChart3 className="size-4" aria-hidden="true" />
                Performance
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {performanceBars.length === 0 ? (
              <p className="text-sm text-slate-400">Performance data will appear after attendance and test records are available.</p>
            ) : (
              performanceBars.map(([courseId, stats]) => {
                const courseName = courses.find((c) => c.id === courseId)?.name ?? "Unknown";
                const pct = stats.total === 0 ? 0 : Math.round((stats.present / stats.total) * 100);
                return (
                  <div key={courseId}>
                    <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                      <span>{courseName}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>

      <Card id="attendance">
        <CardHeader>
          <CardTitle>Attendance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-300">Overall Attendance: {percent}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>QR Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">
            Use the QR token provided by your teacher to mark attendance.
          </p>
          <div className="mt-3">
            <Link href="/portal/student/qr" className="underline text-sm text-white">
              Open QR Scanner
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Study Materials</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">Browse resources shared by your teachers.</p>
          <div className="mt-3">
            <Link href="/portal/student/materials" className="underline text-sm text-white">
              Open Materials Library
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">View upcoming and completed assessments.</p>
          <div className="mt-3">
            <Link href="/portal/student/tests" className="underline text-sm text-white">
              Open Tests
            </Link>
          </div>
          <div className="mt-2">
            <Link href="/portal/student/performance" className="underline text-xs text-blue-300">
              Performance Dashboard
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Announcements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">Check the latest institute notices.</p>
          <div className="mt-3">
            <Link href="/portal/student/announcements" className="underline text-sm text-white">
              Open Notice Board
            </Link>
          </div>
          <div className="mt-2">
            <Link href="/portal/settings/notifications" className="underline text-xs text-blue-300">
              Notification Settings
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Attendance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-300">
          {Object.entries(byCourse).length === 0 ? (
            <p className="text-slate-400">No attendance data yet.</p>
          ) : (
            Object.entries(byCourse).map(([courseId, stats]) => {
              const courseName = courses.find((c) => c.id === courseId)?.name ?? "Unknown";
              const pct = stats.total === 0 ? 0 : Math.round((stats.present / stats.total) * 100);
              return (
                <div key={courseId} className="flex items-center justify-between">
                  <span>{courseName}</span>
                  <span>{pct}%</span>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card id="fees">
        <CardHeader>
          <CardTitle>Fees & Payments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-300">
          {paymentStatus && <p className="text-xs text-amber-200">{paymentStatus}</p>}
          {fees.length === 0 ? (
            <p className="text-slate-400">No fee records found.</p>
          ) : (
            <div className="space-y-3">
              {fees.map((fee) => {
                const due = Number(fee.due_amount);
                return (
                  <div key={fee.student_fee_id} className="rounded-lg border border-white/10 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-white">{fee.fee_name}</p>
                        <p className="text-xs text-slate-400">
                          Due date: {fee.due_date} • {fee.frequency.replace("_", " ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">Due: ₹{due}</p>
                        <p className="text-xs text-slate-400">Status: {fee.status.replace("_", " ")}</p>
                      </div>
                    </div>
                    {due > 0 && (
                      <div className="mt-3">
                        <Button
                          onClick={() => payOnline(fee)}
                          disabled={payingFeeId === fee.student_fee_id}
                        >
                          {payingFeeId === fee.student_fee_id ? "Redirecting..." : "Pay Online"}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
        </CardContent>
      </Card>
    </div>
  );
}
