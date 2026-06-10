"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FeeStructure = { id: string; name: string };
type StudentFee = {
  student_fee_id: string;
  student_id: string;
  student_user_id: string;
  student_name: string;
  student_email: string;
  fee_structure_name: string;
  batch_name: string | null;
  total_amount: string;
  paid_amount: string;
  due_amount: string;
  due_date: string;
  status: string;
};
type Payment = { id: string; amount: string; payment_date: string; payment_mode: string; receipt_number: string };

export default function FeePaymentsPage() {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [selectedFee, setSelectedFee] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("cash");
  const [paymentDate, setPaymentDate] = useState("");
  const [history, setHistory] = useState<Payment[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [studentFeesRes, structuresRes] = await Promise.all([
        api.get("/fees/student-fees/list"),
        api.get("/fees/structures"),
      ]);
      setStructures(structuresRes.data.structures ?? []);
      setStudentFees(studentFeesRes.data.data ?? []);
    };
    load();
  }, []);

  const loadStudentFees = async (studentId: string) => {
    const res = await api.get(`/fees/student/${studentId}/history`);
    setHistory(res.data.payments ?? []);
  };

  const submit = async () => {
    const fee = studentFees.find((item) => item.student_fee_id === selectedFee);
    if (!fee) return;
    try {
      setError(null);
      await api.post("/fees/payments", {
        studentId: fee.student_id,
        studentFeeId: fee.student_fee_id,
        amount: Number(amount),
        paymentMode,
        paymentDate,
      });
      setMessage("Payment recorded.");
      const [feesRes] = await Promise.all([
        api.get("/fees/student-fees/list"),
        loadStudentFees(fee.student_id),
      ]);
      setStudentFees(feesRes.data.data ?? []);
    } catch (err) {
      const apiMessage =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(apiMessage ?? "Failed to record payment.");
    }
  };

  const selectedStudentId = studentFees.find((item) => item.student_fee_id === selectedFee)?.student_id ?? "";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Fees</p>
        <h2 className="mt-2 text-2xl font-semibold">Payment Recording</h2>
      </div>

      <Card className="p-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label>Student Fee</Label>
            <select
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
              value={selectedFee}
              onChange={(e) => {
                const feeId = e.target.value;
                setSelectedFee(feeId);
                const fee = studentFees.find((item) => item.student_fee_id === feeId);
                setAmount(fee ? String(Number(fee.due_amount)) : "");
                setHistory([]);
              }}
            >
              <option value="">Select student fee</option>
              {studentFees.map((fee) => (
                <option key={fee.student_fee_id} value={fee.student_fee_id}>
                  {fee.student_name} - {fee.fee_structure_name} - Due: ₹{fee.due_amount}
                </option>
              ))}
            </select>
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
        {error && <p className="text-sm text-red-300">{error}</p>}
      </Card>

      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Payment History</p>
          <Button variant="outline" onClick={() => loadStudentFees(selectedStudentId)} disabled={!selectedStudentId}>
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
