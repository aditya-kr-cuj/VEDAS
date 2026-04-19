"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type MonthlyReport = {
  period: { year: number; month: number };
  income: { total: number; fee_payments: number; other: number };
  expenses: { total: number; breakdown: { category: string; amount: number }[] };
  net_profit: number;
  comparison_previous_month: {
    income_change: number;
    expense_change: number;
    prev_income: number;
    prev_expenses: number;
  };
};

type YearlyReport = {
  year: number;
  summary: {
    total_income: number;
    total_expenses: number;
    net_profit: number;
    profit_margin: number;
  };
  monthly: { month: number; income: number; expenses: number; net_profit: number }[];
};

type BudgetRow = {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  percentage_used: number;
  status: "ok" | "warning" | "exceeded";
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function TrendChart({ data }: { data: YearlyReport["monthly"] }) {
  const width = 760;
  const height = 220;
  const padding = 24;

  const maxValue = Math.max(1, ...data.flatMap((d) => [d.income, d.expenses]));
  const getX = (index: number) => padding + (index * (width - padding * 2)) / 11;
  const getY = (value: number) => height - padding - (value / maxValue) * (height - padding * 2);

  const incomePoints = data.map((d, i) => `${getX(i)},${getY(d.income)}`).join(" ");
  const expensePoints = data.map((d, i) => `${getX(i)},${getY(d.expenses)}`).join(" ");

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[680px] w-full">
        <rect x={0} y={0} width={width} height={height} fill="transparent" />

        {[0, 0.25, 0.5, 0.75, 1].map((step) => {
          const y = height - padding - step * (height - padding * 2);
          return <line key={step} x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />;
        })}

        <polyline fill="none" stroke="#22c55e" strokeWidth={3} points={incomePoints} />
        <polyline fill="none" stroke="#f97316" strokeWidth={3} points={expensePoints} />

        {data.map((d, i) => (
          <g key={d.month}>
            <circle cx={getX(i)} cy={getY(d.income)} r={3.5} fill="#22c55e" />
            <circle cx={getX(i)} cy={getY(d.expenses)} r={3.5} fill="#f97316" />
            <text x={getX(i)} y={height - 8} textAnchor="middle" fill="#94a3b8" fontSize={10}>
              {monthNames[d.month - 1]}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function Gauge({ label, percentage, subtitle }: { label: string; percentage: number; subtitle: string }) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const isExceeded = clamped >= 100;
  const isWarning = clamped >= 80 && clamped < 100;
  const ringColor = isExceeded ? "#ef4444" : isWarning ? "#f59e0b" : "#22c55e";

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="text-sm font-medium text-slate-200">{label}</p>
      <div className="mt-3 flex items-center gap-3">
        <svg width="92" height="92" viewBox="0 0 92 92">
          <circle cx="46" cy="46" r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="8" />
          <circle
            cx="46"
            cy="46"
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 46 46)"
          />
        </svg>
        <div>
          <p className={`text-2xl font-bold ${isExceeded ? "text-red-300" : isWarning ? "text-amber-300" : "text-emerald-300"}`}>
            {clamped.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export default function FinancialDashboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [monthly, setMonthly] = useState<MonthlyReport | null>(null);
  const [yearly, setYearly] = useState<YearlyReport | null>(null);
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [monthlyRes, yearlyRes, budgetRes] = await Promise.all([
        api.get("/financial/reports/monthly", { params: { year, month } }),
        api.get("/financial/reports/yearly", { params: { year } }),
        api.get(`/budgets/${year}`),
      ]);

      setMonthly(monthlyRes.data as MonthlyReport);
      setYearly(yearlyRes.data as YearlyReport);
      setBudgets((budgetRes.data.budgets ?? []) as BudgetRow[]);
    } catch {
      setError("Failed to load financial dashboard data.");
      setMonthly(null);
      setYearly(null);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    load();
  }, [load]);

  const budgetSummary = useMemo(() => {
    const allocated = budgets.reduce((sum, b) => sum + b.allocated, 0);
    const spent = budgets.reduce((sum, b) => sum + b.spent, 0);
    return {
      allocated,
      spent,
      utilization: allocated > 0 ? (spent / allocated) * 100 : 0,
      alerts: budgets.filter((b) => b.status === "warning" || b.status === "exceeded"),
      top: budgets
        .filter((b) => b.allocated > 0)
        .sort((a, b) => b.percentage_used - a.percentage_used)
        .slice(0, 4),
    };
  }, [budgets]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Finance</p>
          <h2 className="mt-1 text-2xl font-semibold">Financial Dashboard</h2>
          <p className="text-sm text-slate-400">Income, expenses, profit trends, and budget utilization in one view.</p>
        </div>
        <Link href="/financial/budget" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10">
          Budget Planning →
        </Link>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-400">Year</p>
            <Input type="number" min={2000} max={2100} value={year} onChange={(e) => setYear(Number(e.target.value || now.getFullYear()))} />
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-400">Month</p>
            <select
              className="h-9 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-slate-100"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {monthNames.map((name, idx) => (
                <option key={name} value={idx + 1}>{name}</option>
              ))}
            </select>
          </div>
          <Button onClick={load} disabled={loading}>{loading ? "Loading…" : "Refresh"}</Button>
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </Card>

      {monthly && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="p-5 border-emerald-500/20 bg-emerald-500/5">
            <p className="text-xs uppercase tracking-wide text-emerald-300">Total Income</p>
            <p className="mt-2 text-2xl font-bold text-white">{fmt(monthly.income.total)}</p>
            <p className="mt-1 text-xs text-emerald-200/80">Selected month</p>
          </Card>
          <Card className="p-5 border-rose-500/20 bg-rose-500/5">
            <p className="text-xs uppercase tracking-wide text-rose-300">Total Expenses</p>
            <p className="mt-2 text-2xl font-bold text-white">{fmt(monthly.expenses.total)}</p>
            <p className="mt-1 text-xs text-rose-200/80">Selected month</p>
          </Card>
          <Card className={`p-5 ${monthly.net_profit >= 0 ? "border-cyan-500/20 bg-cyan-500/5" : "border-red-500/20 bg-red-500/5"}`}>
            <p className="text-xs uppercase tracking-wide text-slate-300">Net Profit</p>
            <p className={`mt-2 text-2xl font-bold ${monthly.net_profit >= 0 ? "text-white" : "text-red-300"}`}>
              {fmt(monthly.net_profit)}
            </p>
            <p className="mt-1 text-xs text-slate-300">Income minus expenses</p>
          </Card>
        </div>
      )}

      {monthly && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5">
            <p className="text-sm font-semibold">Comparison With Previous Month</p>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Income change</span>
                <span className={monthly.comparison_previous_month.income_change >= 0 ? "text-emerald-300" : "text-red-300"}>
                  {monthly.comparison_previous_month.income_change >= 0 ? "+" : ""}
                  {fmt(monthly.comparison_previous_month.income_change)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Expense change</span>
                <span className={monthly.comparison_previous_month.expense_change <= 0 ? "text-emerald-300" : "text-amber-300"}>
                  {monthly.comparison_previous_month.expense_change >= 0 ? "+" : ""}
                  {fmt(monthly.comparison_previous_month.expense_change)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Previous income</span>
                <span className="text-slate-300">{fmt(monthly.comparison_previous_month.prev_income)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Previous expenses</span>
                <span className="text-slate-300">{fmt(monthly.comparison_previous_month.prev_expenses)}</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-sm font-semibold">Expense Breakdown (Selected Month)</p>
            <div className="mt-4 space-y-2">
              {monthly.expenses.breakdown.length === 0 ? (
                <p className="text-sm text-slate-500">No expenses for selected month.</p>
              ) : (
                monthly.expenses.breakdown.map((item) => {
                  const pct = monthly.expenses.total > 0 ? (item.amount / monthly.expenses.total) * 100 : 0;
                  return (
                    <div key={item.category}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-slate-300">{item.category}</span>
                        <span className="text-slate-100">{fmt(item.amount)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/10">
                        <div className="h-2 rounded-full bg-orange-400" style={{ width: `${pct.toFixed(1)}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </div>
      )}

      {yearly && (
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold">Monthly Trend ({year})</p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded bg-green-500" /> Income</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded bg-orange-500" /> Expenses</span>
            </div>
          </div>
          <TrendChart data={yearly.monthly} />
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm font-semibold">Budget Utilization</p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
              <p className="text-xs uppercase tracking-wide text-cyan-300">Allocated</p>
              <p className="mt-1 font-semibold text-white">{fmt(budgetSummary.allocated)}</p>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-xs uppercase tracking-wide text-amber-300">Spent</p>
              <p className="mt-1 font-semibold text-white">{fmt(budgetSummary.spent)}</p>
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.02] p-3">
            <p className="text-xs text-slate-500">Overall utilization</p>
            <p className="mt-1 text-2xl font-bold text-white">{budgetSummary.utilization.toFixed(1)}%</p>
          </div>

          {budgetSummary.alerts.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs uppercase tracking-wide text-slate-400">Alert Categories</p>
              {budgetSummary.alerts.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg border px-3 py-2 text-xs ${item.status === "exceeded" ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-amber-500/30 bg-amber-500/10 text-amber-200"}`}
                >
                  {item.category}: {item.percentage_used.toFixed(1)}% used
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <p className="text-sm font-semibold">Top Budget Gauges</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {budgetSummary.top.length === 0 ? (
              <p className="text-sm text-slate-500">No budget categories found for {year}.</p>
            ) : (
              budgetSummary.top.map((item) => (
                <Gauge
                  key={item.id}
                  label={item.category}
                  percentage={item.percentage_used}
                  subtitle={`${fmt(item.spent)} / ${fmt(item.allocated)}`}
                />
              ))
            )}
          </div>
        </Card>
      </div>

      {yearly && (
        <Card className="p-5">
          <p className="text-sm font-semibold">Year Summary ({yearly.year})</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">Total Income</p>
              <p className="mt-1 font-semibold text-white">{fmt(yearly.summary.total_income)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Expenses</p>
              <p className="mt-1 font-semibold text-white">{fmt(yearly.summary.total_expenses)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Net Profit</p>
              <p className="mt-1 font-semibold text-white">{fmt(yearly.summary.net_profit)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Profit Margin</p>
              <p className="mt-1 font-semibold text-white">{yearly.summary.profit_margin}%</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
