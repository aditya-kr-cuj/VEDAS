"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function StudentPortalPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [courses, setCourses] = useState<Array<{ id: string; name: string }>>([]);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [fees, setFees] = useState<StudentFee[]>([]);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [payingFeeId, setPayingFeeId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role && user.role !== "student") {
      router.replace("/dashboard");
      return;
    }

    const load = async () => {
      try {
        const [notesRes, studentRes, courseRes, feeRes] = await Promise.all([
          api.get("/notifications/my"),
          api.get("/students/me"),
          api.get("/courses"),
          api.get("/fees/my")
        ]);
        setNotifications(notesRes.data.notifications ?? []);
        setCourses(courseRes.data.courses ?? []);
        setFees(feeRes.data.fees ?? []);
        const id = studentRes.data.student?.id;
        setStudentId(id);
        if (id) {
          const attRes = await api.get(`/attendance/student/${id}`);
          setAttendance(attRes.data.records ?? []);
        }
      } catch {
        setNotifications([]);
        setAttendance([]);
        setFees([]);
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
    const status = searchParams.get("payment");
    if (status === "success") setPaymentStatus("Payment successful. It may take a moment to reflect.");
    if (status === "failed") setPaymentStatus("Payment failed. Please try again.");
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome back, {user?.fullName ?? "Student"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-300">Your profile and notifications will appear here.</p>
        </CardContent>
      </Card>

      <Card>
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
            <a href="/portal/student/qr" className="underline text-sm text-white">
              Open QR Scanner
            </a>
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

      <Card>
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
        </CardContent>
      </Card>
    </div>
  );
}
