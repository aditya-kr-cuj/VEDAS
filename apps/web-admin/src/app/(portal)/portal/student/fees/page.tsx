"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api/v1";

export default function StudentFeesPage() {
  const [fees, setFees] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "history">("pending");

  useEffect(() => {
    Promise.all([api.get("/fees/my"), api.get("/fees/my-payments")])
      .then(([feesRes, paymentsRes]) => {
        setFees(feesRes.data.fees ?? feesRes.data.data ?? []);
        setPayments(paymentsRes.data.payments ?? paymentsRes.data.data ?? []);
      })
      .catch((err) => toast.error(err.response?.data?.message ?? "Failed to load fees"))
      .finally(() => setLoading(false));
  }, []);

  const totals = useMemo(
    () => ({
      due: fees.reduce((sum, fee) => sum + Number(fee.due_amount ?? 0), 0),
      paid: fees.reduce((sum, fee) => sum + Number(fee.paid_amount ?? 0), 0),
    }),
    [fees]
  );

  const statusClass: Record<string, string> = {
    paid: "bg-teal-500/20 text-teal-300",
    pending: "bg-amber-500/20 text-amber-300",
    overdue: "bg-red-500/20 text-red-300",
    partially_paid: "bg-blue-500/20 text-blue-300",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">My Fees</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="mb-1 text-sm text-slate-400">Total Pending</p>
          <p className="text-3xl font-bold text-red-300">Rs. {totals.due.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <p className="mb-1 text-sm text-slate-400">Total Paid</p>
          <p className="text-3xl font-bold text-teal-300">Rs. {totals.paid.toLocaleString("en-IN")}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(["pending", "history"] as const).map((item) => (
          <button key={item} onClick={() => setTab(item)} className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${tab === item ? "border border-teal-500/30 bg-teal-500/20 text-teal-300" : "text-slate-400 hover:text-white"}`}>
            {item === "pending" ? "Pending Fees" : "Payment History"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
        </div>
      ) : tab === "pending" ? (
        fees.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center text-sm text-slate-500">No pending fees.</div>
        ) : (
          <div className="space-y-3">
            {fees.map((fee) => (
              <div key={fee.student_fee_id} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-white">{fee.fee_name ?? fee.fee_structure_name ?? "Fee"}</h3>
                    <p className="mt-1 text-xs text-slate-400">Due {fee.due_date ? new Date(fee.due_date).toLocaleDateString() : "N/A"}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs capitalize ${statusClass[fee.status] ?? statusClass.pending}`}>{fee.status?.replace("_", " ")}</span>
                </div>
                <div className="mt-3 text-sm">
                  <span className="text-slate-500">Due: </span>
                  <span className="font-semibold text-red-300">Rs. {Number(fee.due_amount ?? 0).toLocaleString("en-IN")}</span>
                  <span className="ml-3 text-slate-500">Total: Rs. {Number(fee.total_amount ?? 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
            ))}
          </div>
        )
      ) : payments.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center text-sm text-slate-500">No payments recorded yet.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Mode</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="border-b border-slate-800/50">
                  <td className="px-4 py-3 text-sm text-white">{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : "-"}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-teal-300">Rs. {Number(payment.amount ?? 0).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-sm capitalize text-slate-400">{payment.payment_mode}</td>
                  <td className="px-4 py-3">
                    <a href={`${apiBase}/fees/payments/${payment.id}/receipt`} target="_blank" className="text-xs text-teal-300 hover:text-teal-200">
                      Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
