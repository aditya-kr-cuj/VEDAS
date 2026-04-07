"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Student = { studentUserId: string; fullName: string; email: string };
type FeeStructure = { id: string; name: string };
type StudentFee = { id: string; student_id: string; total_amount: string; due_amount: string; status: string };
type Payment = { id: string; amount: string; payment_date: string; payment_mode: string; receipt_number: string };

export default function FeePaymentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedFee, setSelectedFee] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [paymentDate, setPaymentDate] = useState("");
  const [history, setHistory] = useState<Payment[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [studentsRes, structuresRes] = await Promise.all([
        api.get("/batches"),
        api.get("/fees/structures"),
      ]);
      // Use batch students list per selection; start empty
      setStructures(structuresRes.data.structures ?? []);
      setStudents([]);
    };
    load();
  }, []);

  const loadStudentFees = async (studentId: string) => {
    // currently no API to list student_fees, so placeholder
    setStudentFees([]);
    const res = await api.get(`/fees/student/${studentId}/history`);
    setHistory(res.data.payments ?? []);
  };

  const submit = async () => {
    if (!selectedStudent || !selectedFee) return;
    await api.post("/fees/payments", {
      studentId: selectedStudent,
      studentFeeId: selectedFee,
      amount: Number(amount),
      paymentMode,
      paymentDate,
    });
    setMessage("Payment recorded.");
    await loadStudentFees(selectedStudent);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Fees</p>
        <h2 className="mt-2 text-2xl font-semibold">Payment Recording</h2>
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label>Student ID</Label>
            <Input value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} placeholder="UUID" />
          </div>
          <div>
            <Label>Student Fee ID</Label>
            <Input value={selectedFee} onChange={(e) => setSelectedFee(e.target.value)} placeholder="UUID" />
          </div>
          <div>
            <Label>Amount</Label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" />
          </div>
          <div>
            <Label>Payment Mode</Label>
            <select
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
              value={paymentMode}
              onChange={(e) => setPaymentMode(e.target.value)}
            >
              <option value="cash">cash</option>
              <option value="online">online</option>
              <option value="cheque">cheque</option>
              <option value="upi">upi</option>
            </select>
          </div>
          <div>
            <Label>Payment Date</Label>
            <Input value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} type="date" />
          </div>
          <div className="flex items-end">
            <Button onClick={submit}>Record Payment</Button>
          </div>
        </div>
        {message && <p className="text-sm text-emerald-300">{message}</p>}
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Payment History</p>
          <Button variant="outline" onClick={() => loadStudentFees(selectedStudent)} disabled={!selectedStudent}>
            Load
          </Button>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-slate-400">No payments yet.</p>
        ) : (
          history.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between text-sm text-slate-300">
              <div>
                <p className="font-semibold text-white">₹{payment.amount}</p>
                <p className="text-xs text-slate-400">
                  {payment.payment_mode} • {payment.payment_date}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() =>
                  window.open(`/api/v1/fees/payments/${payment.id}/receipt`, "_blank")
                }
              >
                Download Receipt
              </Button>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}
