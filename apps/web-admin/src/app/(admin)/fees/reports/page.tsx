"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from "recharts";

type Summary = {
  totalInRange: number;
  duesPending: number;
  overdueCount: number;
  totals: { today: number; month: number; year: number };
  paymentModes: Array<{ mode: string; amount: number }>;
};

type DueRow = {
  student_fee_id: string;
  student_id: string;
  user_id: string;
  student_name: string;
  student_email: string;
  due_amount: string;
  due_date: string;
};

const colors = ["#86e3ce", "#f4b860", "#f97316", "#e11d48"];

export default function FeeReportsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [dueList, setDueList] = useState<DueRow[]>([]);
  const [overdueList, setOverdueList] = useState<DueRow[]>([]);
  const [daily, setDaily] = useState<Array<{ date: string; total: string }>>([]);
  const [monthly, setMonthly] = useState<Array<{ month: string; total: string }>>([]);
  const [studentId, setStudentId] = useState("");
  const [studentStatement, setStudentStatement] = useState<any>(null);

  const loadSummary = async () => {
    if (!from || !to) return;
    const res = await api.get("/fees/reports/summary", { params: { from, to } });
    setSummary(res.data.summary);
    const dailyRes = await api.get("/fees/reports/daily", { params: { from, to } });
    setDaily(dailyRes.data.daily ?? []);
    const monthlyRes = await api.get("/fees/reports/monthly", { params: { from, to } });
    setMonthly(monthlyRes.data.monthly ?? []);
  };

  const loadDue = async () => {
    const [dueRes, overdueRes] = await Promise.all([api.get("/fees/due"), api.get("/fees/overdue")]);
    setDueList(dueRes.data.dues ?? []);
    setOverdueList(overdueRes.data.overdue ?? []);
  };

  const loadStatement = async () => {
    if (!studentId) return;
    const res = await api.get(`/fees/reports/student/${studentId}`);
    setStudentStatement(res.data);
  };

  useEffect(() => {
    loadDue();
  }, []);

  const exportCSV = (rows: DueRow[], filename: string) => {
    const header = "student_id,student_name,student_email,due_amount,due_date";
    const lines = rows.map(
      (r) => `${r.student_id},${r.student_name},${r.student_email},${r.due_amount},${r.due_date}`
    );
    const blob = new Blob([header, "\n", ...lines].join("\n"), { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendReminder = async (userId: string, name: string, due: string) => {
    await api.post("/notifications/send", {
      recipientUserId: userId,
      subject: "Fee payment reminder",
      body: `Hello ${name}, your pending due amount is ₹${due}. Please pay at the earliest.`,
    });
  };

  const modeData = summary?.paymentModes ?? [];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Fees</p>
        <h2 className="mt-2 text-2xl font-semibold">Fee Reports</h2>
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label>From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label>To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={loadSummary}>Load Summary</Button>
          </div>
        </div>
        {summary && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="p-4">
              <p className="text-xs text-slate-400">Today</p>
              <p className="text-lg font-semibold">₹{summary.totals.today}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-slate-400">This Month</p>
              <p className="text-lg font-semibold">₹{summary.totals.month}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-slate-400">This Year</p>
              <p className="text-lg font-semibold">₹{summary.totals.year}</p>
            </Card>
            <Card className="p-4">
              <p className="text-xs text-slate-400">Dues Pending</p>
              <p className="text-lg font-semibold">₹{summary.duesPending}</p>
              <p className="text-xs text-slate-400">Overdue: {summary.overdueCount}</p>
            </Card>
          </div>
        )}
      </Card>

      <Card className="p-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold">Payment Mode Breakdown</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={modeData} dataKey="amount" nameKey="mode" outerRadius={80} label>
                  {modeData.map((_, idx) => (
                    <Cell key={idx} fill={colors[idx % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold">Daily Collection</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#86e3ce" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <p className="text-sm font-semibold">Monthly Collection</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#f4b860" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Due Fees</p>
          <Button variant="outline" onClick={() => exportCSV(dueList, "due-fees.csv")}>
            Export CSV
          </Button>
        </div>
        {dueList.length === 0 ? (
          <p className="text-sm text-slate-400">No dues found.</p>
        ) : (
          dueList.map((row) => (
            <div key={row.student_fee_id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                <p className="font-semibold text-white">{row.student_name}</p>
                <p className="text-xs text-slate-400">{row.student_email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-300">Due: ₹{row.due_amount}</p>
                <p className="text-xs text-slate-400">Due date: {row.due_date}</p>
              </div>
              <Button variant="outline" onClick={() => sendReminder(row.user_id, row.student_name, row.due_amount)}>
                Send Reminder
              </Button>
            </div>
          ))
        )}
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Overdue Students</p>
          <Button variant="outline" onClick={() => exportCSV(overdueList, "overdue-fees.csv")}>
            Export CSV
          </Button>
        </div>
        {overdueList.length === 0 ? (
          <p className="text-sm text-slate-400">No overdue students.</p>
        ) : (
          overdueList.map((row) => (
            <div key={row.student_fee_id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <div>
                <p className="font-semibold text-white">{row.student_name}</p>
                <p className="text-xs text-slate-400">{row.student_email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-300">Due: ₹{row.due_amount}</p>
                <p className="text-xs text-slate-400">Due date: {row.due_date}</p>
              </div>
              <Button variant="outline" onClick={() => sendReminder(row.user_id, row.student_name, row.due_amount)}>
                Send Reminder
              </Button>
            </div>
          ))
        )}
      </Card>

      <Card className="p-4 space-y-3">
        <p className="text-sm font-semibold">Student Fee Statement</p>
        <div className="flex flex-wrap gap-2">
          <Input value={studentId} onChange={(e) => setStudentId(e.target.value)} placeholder="Student ID" />
          <Button onClick={loadStatement}>Load</Button>
        </div>
        {studentStatement && (
          <div className="text-sm text-slate-300">
            <p className="font-semibold text-white">Fees</p>
            {(studentStatement.fees ?? []).map((fee: any) => (
              <p key={fee.id}>
                {fee.structure_name}: ₹{fee.total_amount} (Due ₹{fee.due_amount})
              </p>
            ))}
            <p className="font-semibold text-white mt-3">Payments</p>
            {(studentStatement.payments ?? []).map((pay: any) => (
              <p key={pay.id}>
                ₹{pay.amount} on {pay.payment_date} ({pay.payment_mode})
              </p>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
