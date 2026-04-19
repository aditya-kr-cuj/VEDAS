"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ── Types ─────────────────────────────────────────────────────────────────────
type PnL = {
  period: { from: string; to: string };
  total_income: number;
  income_breakdown: { fee_payments: number; other_income: number };
  total_expenses: number;
  expense_breakdown: Record<string, number>;
  net_profit: number;
  profit_margin: number;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const pct = (v: number, total: number) =>
  total > 0 ? ((v / total) * 100).toFixed(1) : "0.0";

// ── Export helpers ─────────────────────────────────────────────────────────────
function exportPnLCSV(data: PnL) {
  const rows = [
    ["Report", "Profit & Loss Statement"],
    ["Period", `${data.period.from} to ${data.period.to}`],
    [],
    ["INCOME"],
    ["Fee Payments", data.income_breakdown.fee_payments],
    ["Other Income", data.income_breakdown.other_income],
    ["Total Income", data.total_income],
    [],
    ["EXPENSES"],
    ...Object.entries(data.expense_breakdown).map(([k, v]) => [k, v]),
    ["Total Expenses", data.total_expenses],
    [],
    ["NET PROFIT", data.net_profit],
    ["PROFIT MARGIN", `${data.profit_margin}%`],
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pnl-${data.period.from}-to-${data.period.to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Mini Bar Chart ─────────────────────────────────────────────────────────────
function BarChart({
  items,
}: {
  items: { label: string; value: number; color: string }[];
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-slate-300 truncate max-w-[55%]">{item.label}</span>
            <span className="font-semibold text-white ml-2">{fmt(item.value)}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${item.color}`}
              style={{ width: `${((item.value / max) * 100).toFixed(1)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function PnLPage() {
  const now = new Date();
  const defaultFrom = `${now.getFullYear()}-01-01`;
  const defaultTo   = now.toISOString().slice(0, 10);

  const [from, setFrom]     = useState(defaultFrom);
  const [to, setTo]         = useState(defaultTo);
  const [data, setData]     = useState<PnL | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/financial/profit-loss", { params: { from, to } });
      setData(res.data);
    } catch {
      setError("Failed to load Profit & Loss data.");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { load(); }, [load]);

  const incomeItems = data
    ? [
        { label: "Fee Payments", value: data.income_breakdown.fee_payments, color: "bg-emerald-500" },
        { label: "Other Income",  value: data.income_breakdown.other_income,  color: "bg-teal-400" },
      ]
    : [];

  const expenseItems = data
    ? Object.entries(data.expense_breakdown).map(([k, v], i) => ({
        label: k,
        value: v,
        color: ["bg-rose-500","bg-orange-400","bg-amber-400","bg-fuchsia-500","bg-pink-400","bg-red-400"][i % 6],
      }))
    : [];

  const isProfit = (data?.net_profit ?? 0) >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Financial Reports</p>
          <h2 className="mt-1 text-2xl font-semibold">Profit &amp; Loss Statement</h2>
        </div>
        {data && (
          <Button variant="outline" size="sm" onClick={() => exportPnLCSV(data)}>
            ↓ Export CSV
          </Button>
        )}
      </div>

      {/* Date range */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <p className="text-xs text-slate-400 uppercase tracking-wide">From</p>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-400 uppercase tracking-wide">To</p>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Generate Report"}
          </Button>
        </div>
      </Card>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {data && (
        <>
          {/* KPI Summary */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card className="p-5 border-emerald-500/20 bg-emerald-500/5">
              <p className="text-xs text-emerald-400 uppercase tracking-wide font-medium">Total Income</p>
              <p className="mt-2 text-2xl font-bold text-white">{fmt(data.total_income)}</p>
            </Card>
            <Card className="p-5 border-rose-500/20 bg-rose-500/5">
              <p className="text-xs text-rose-400 uppercase tracking-wide font-medium">Total Expenses</p>
              <p className="mt-2 text-2xl font-bold text-white">{fmt(data.total_expenses)}</p>
            </Card>
            <Card className={`p-5 ${isProfit ? "border-violet-500/20 bg-violet-500/5" : "border-red-500/20 bg-red-500/5"}`}>
              <p className={`text-xs uppercase tracking-wide font-medium ${isProfit ? "text-violet-400" : "text-red-400"}`}>
                Net {isProfit ? "Profit" : "Loss"}
              </p>
              <p className={`mt-2 text-2xl font-bold ${isProfit ? "text-white" : "text-red-400"}`}>
                {fmt(Math.abs(data.net_profit))}
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Profit Margin</p>
              <p className={`mt-2 text-2xl font-bold ${isProfit ? "text-emerald-400" : "text-red-400"}`}>
                {data.profit_margin}%
              </p>
            </Card>
          </div>

          {/* Period */}
          <p className="text-xs text-slate-500 text-center">
            Report period: <span className="text-slate-300">{data.period.from}</span> →{" "}
            <span className="text-slate-300">{data.period.to}</span>
          </p>

          {/* Visual Comparison Bar */}
          <Card className="p-5">
            <p className="text-sm font-semibold mb-4">Income vs Expenses</p>
            <div className="relative h-8 rounded-full overflow-hidden bg-white/10">
              {data.total_income + data.total_expenses > 0 && (
                <>
                  <div
                    className="absolute inset-y-0 left-0 bg-emerald-500/80 transition-all duration-700"
                    style={{
                      width: `${pct(data.total_income, data.total_income + data.total_expenses)}%`,
                    }}
                  />
                  <div
                    className="absolute inset-y-0 bg-rose-500/70 transition-all duration-700"
                    style={{
                      left: `${pct(data.total_income, data.total_income + data.total_expenses)}%`,
                      right: "0",
                    }}
                  />
                </>
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-semibold text-white mix-blend-screen">
                  Income {pct(data.total_income, data.total_income + data.total_expenses)}% &nbsp;|&nbsp;
                  Expenses {pct(data.total_expenses, data.total_income + data.total_expenses)}%
                </span>
              </div>
            </div>
          </Card>

          {/* Income & Expense Breakdown */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-5">
              <p className="text-sm font-semibold mb-4 text-emerald-400">Income Breakdown</p>
              <BarChart items={incomeItems} />
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-sm text-slate-400">Total</span>
                <span className="text-sm font-bold text-white">{fmt(data.total_income)}</span>
              </div>
            </Card>

            <Card className="p-5">
              <p className="text-sm font-semibold mb-4 text-rose-400">Expense Breakdown</p>
              {expenseItems.length === 0 ? (
                <p className="text-sm text-slate-500">No expenses recorded in this period.</p>
              ) : (
                <BarChart items={expenseItems} />
              )}
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-sm text-slate-400">Total</span>
                <span className="text-sm font-bold text-white">{fmt(data.total_expenses)}</span>
              </div>
            </Card>
          </div>

          {/* Detailed Table */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <p className="text-sm font-semibold">Detailed Breakdown</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-400 uppercase tracking-wide border-b border-white/10">
                    <th className="px-4 py-3 text-left">Item</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-right">% of Total Income</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  <tr className="bg-emerald-500/5">
                    <td className="px-4 py-2 font-semibold text-emerald-400" colSpan={3}>INCOME</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 pl-8 text-slate-300">Fee Payments</td>
                    <td className="px-4 py-2 text-right text-white font-medium">{fmt(data.income_breakdown.fee_payments)}</td>
                    <td className="px-4 py-2 text-right text-slate-400">{pct(data.income_breakdown.fee_payments, data.total_income)}%</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 pl-8 text-slate-300">Other Income</td>
                    <td className="px-4 py-2 text-right text-white font-medium">{fmt(data.income_breakdown.other_income)}</td>
                    <td className="px-4 py-2 text-right text-slate-400">{pct(data.income_breakdown.other_income, data.total_income)}%</td>
                  </tr>
                  <tr className="border-t border-white/10 font-semibold">
                    <td className="px-4 py-2 text-white">Total Income</td>
                    <td className="px-4 py-2 text-right text-white">{fmt(data.total_income)}</td>
                    <td className="px-4 py-2 text-right text-emerald-400">100%</td>
                  </tr>
                  <tr className="bg-rose-500/5">
                    <td className="px-4 py-2 font-semibold text-rose-400" colSpan={3}>EXPENSES</td>
                  </tr>
                  {expenseItems.length === 0 ? (
                    <tr>
                      <td className="px-4 py-2 pl-8 text-slate-500 italic" colSpan={3}>No expenses in this period</td>
                    </tr>
                  ) : (
                    expenseItems.map((item) => (
                      <tr key={item.label}>
                        <td className="px-4 py-2 pl-8 text-slate-300">{item.label}</td>
                        <td className="px-4 py-2 text-right text-white font-medium">{fmt(item.value)}</td>
                        <td className="px-4 py-2 text-right text-slate-400">{pct(item.value, data.total_income)}%</td>
                      </tr>
                    ))
                  )}
                  <tr className="border-t border-white/10 font-semibold">
                    <td className="px-4 py-2 text-white">Total Expenses</td>
                    <td className="px-4 py-2 text-right text-white">{fmt(data.total_expenses)}</td>
                    <td className="px-4 py-2 text-right text-rose-400">{pct(data.total_expenses, data.total_income)}%</td>
                  </tr>
                  <tr className={`border-t-2 ${isProfit ? "border-violet-500/40 bg-violet-500/5" : "border-red-500/40 bg-red-500/5"}`}>
                    <td className="px-4 py-3 font-bold text-white">Net {isProfit ? "Profit" : "Loss"}</td>
                    <td className={`px-4 py-3 text-right font-bold text-lg ${isProfit ? "text-violet-300" : "text-red-400"}`}>
                      {isProfit ? "" : "-"}{fmt(Math.abs(data.net_profit))}
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${isProfit ? "text-violet-300" : "text-red-400"}`}>
                      {data.profit_margin}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
