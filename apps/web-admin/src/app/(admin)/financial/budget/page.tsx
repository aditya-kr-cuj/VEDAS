"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Category = {
  id: string;
  category_name: string;
};

type BudgetRow = {
  id: string;
  category_id: string;
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
  percentage_used: number;
  status: "ok" | "warning" | "exceeded";
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

function BudgetVsActualBars({ rows }: { rows: BudgetRow[] }) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.allocated, r.spent]));

  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">No budget data for this year yet.</p>;
  }

  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.id} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">{r.category}</span>
            <span className="text-xs text-slate-400">{r.percentage_used.toFixed(1)}% used</span>
          </div>
          <div className="h-7 rounded-lg bg-white/5 p-1">
            <div className="flex h-full gap-1">
              <div
                className="h-full rounded bg-cyan-500/80"
                style={{ width: `${Math.max((r.allocated / max) * 100, 1)}%` }}
                title={`Allocated: ${fmt(r.allocated)}`}
              />
              <div
                className="h-full rounded bg-amber-500/80"
                style={{ width: `${Math.max((r.spent / max) * 100, 1)}%` }}
                title={`Spent: ${fmt(r.spent)}`}
              />
            </div>
          </div>
          <div className="flex justify-between text-xs text-slate-500">
            <span>Allocated {fmt(r.allocated)}</span>
            <span>Spent {fmt(r.spent)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BudgetPlanningPage() {
  const now = new Date();
  const [year, setYear] = useState<number>(now.getFullYear());
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<BudgetRow[]>([]);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    const res = await api.get("/expenses/categories");
    const rows = (res.data.categories ?? []) as Category[];
    setCategories(rows.map((c) => ({ id: c.id, category_name: c.category_name })));
  }, []);

  const loadBudgets = useCallback(async (targetYear: number) => {
    try {
      const res = await api.get(`/budgets/${targetYear}`);
      const rows = (res.data.budgets ?? []) as BudgetRow[];
      setBudgets(rows);
      const nextInputs: Record<string, string> = {};
      rows.forEach((b) => {
        nextInputs[b.category_id] = String(b.allocated);
      });
      setInputs((prev) => ({ ...prev, ...nextInputs }));
    } catch {
      setBudgets([]);
    }
  }, []);

  const load = useCallback(async (targetYear: number) => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadCategories(), loadBudgets(targetYear)]);
    } catch {
      setError("Failed to load budget planning data.");
    } finally {
      setLoading(false);
    }
  }, [loadBudgets, loadCategories]);

  useEffect(() => {
    load(year);
  }, [load, year]);

  const totals = useMemo(() => {
    const allocated = budgets.reduce((s, b) => s + b.allocated, 0);
    const spent = budgets.reduce((s, b) => s + b.spent, 0);
    const remaining = allocated - spent;
    return {
      allocated,
      spent,
      remaining,
      utilization: allocated > 0 ? (spent / allocated) * 100 : 0,
    };
  }, [budgets]);

  const alertRows = budgets.filter((b) => b.status === "warning" || b.status === "exceeded");

  const onChangeAllocation = (categoryId: string, value: string) => {
    setInputs((prev) => ({ ...prev, [categoryId]: value }));
  };

  const saveBudgets = async () => {
    setSaving(true);
    setError(null);

    const categoryBudgets = categories
      .map((category) => {
        const raw = inputs[category.id] ?? "";
        if (raw.trim() === "") return null;
        const amount = Number(raw);
        if (!Number.isFinite(amount) || amount < 0) return null;
        return { category_id: category.id, allocated_amount: amount };
      })
      .filter((item): item is { category_id: string; allocated_amount: number } => item !== null);

    if (categoryBudgets.length === 0) {
      setError("Enter at least one valid budget amount before saving.");
      setSaving(false);
      return;
    }

    try {
      await api.post("/budgets", { budget_year: year, category_budgets: categoryBudgets });
      await loadBudgets(year);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to save budgets");
      } else {
        setError("Failed to save budgets");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Finance</p>
          <h2 className="mt-1 text-2xl font-semibold">Budget Planning</h2>
          <p className="text-sm text-slate-400">Set category budgets, monitor actual spend, and catch over-budget risks early.</p>
        </div>
        <Link href="/financial/dashboard" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10">
          Financial Dashboard →
        </Link>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-slate-400">Budget Year</p>
            <Input type="number" min={2000} max={2100} value={year} onChange={(e) => setYear(Number(e.target.value || now.getFullYear()))} />
          </div>
          <Button onClick={saveBudgets} disabled={saving || loading}>
            {saving ? "Saving…" : "Save Budgets"}
          </Button>
          <Button variant="ghost" onClick={() => load(year)} disabled={loading}>
            Refresh
          </Button>
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border-cyan-500/20 bg-cyan-500/5">
          <p className="text-xs uppercase tracking-wide text-cyan-300">Allocated</p>
          <p className="mt-1 text-xl font-bold text-white">{fmt(totals.allocated)}</p>
        </Card>
        <Card className="p-4 border-amber-500/20 bg-amber-500/5">
          <p className="text-xs uppercase tracking-wide text-amber-300">Spent</p>
          <p className="mt-1 text-xl font-bold text-white">{fmt(totals.spent)}</p>
        </Card>
        <Card className="p-4 border-emerald-500/20 bg-emerald-500/5">
          <p className="text-xs uppercase tracking-wide text-emerald-300">Remaining</p>
          <p className="mt-1 text-xl font-bold text-white">{fmt(totals.remaining)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Utilization</p>
          <p className="mt-1 text-xl font-bold text-white">{totals.utilization.toFixed(1)}%</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold">Set Budget Per Category</p>
            <p className="text-xs text-slate-500">Allocate annual amounts</p>
          </div>

          {loading ? (
            <p className="text-sm text-slate-400">Loading categories…</p>
          ) : categories.length === 0 ? (
            <p className="text-sm text-slate-500">No expense categories found. Add categories first in Expenses.</p>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_180px]">
                  <p className="text-sm text-slate-300">{category.category_name}</p>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={inputs[category.id] ?? ""}
                    onChange={(e) => onChangeAllocation(category.id, e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold">Budget vs Actual</p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded bg-cyan-400" /> Allocated</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded bg-amber-400" /> Spent</span>
            </div>
          </div>
          <BudgetVsActualBars rows={budgets} />
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold">Budget Alerts</p>
          <p className="text-xs text-slate-500">Warning at 80%, alert at 100%+</p>
        </div>

        {alertRows.length === 0 ? (
          <p className="text-sm text-emerald-400">No over-budget categories for {year}.</p>
        ) : (
          <div className="space-y-2">
            {alertRows.map((row) => (
              <div
                key={row.id}
                className={`rounded-lg border px-3 py-2 ${row.status === "exceeded" ? "border-red-500/30 bg-red-500/10" : "border-amber-500/30 bg-amber-500/10"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-white">{row.category}</p>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${row.status === "exceeded" ? "text-red-300" : "text-amber-300"}`}>
                    {row.status === "exceeded" ? "Alert" : "Warning"}
                  </p>
                </div>
                <p className="mt-1 text-xs text-slate-300">
                  Used {row.percentage_used.toFixed(1)}% ({fmt(row.spent)} / {fmt(row.allocated)})
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3 text-right">Allocated</th>
              <th className="px-4 py-3 text-right">Spent</th>
              <th className="px-4 py-3 text-right">Remaining</th>
              <th className="px-4 py-3 text-right">Used %</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {budgets.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">No budget rows yet for {year}.</td>
              </tr>
            ) : (
              budgets.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-slate-200">{row.category}</td>
                  <td className="px-4 py-3 text-right text-white">{fmt(row.allocated)}</td>
                  <td className="px-4 py-3 text-right text-white">{fmt(row.spent)}</td>
                  <td className={`px-4 py-3 text-right ${row.remaining < 0 ? "text-red-300" : "text-emerald-300"}`}>
                    {fmt(row.remaining)}
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${row.status === "exceeded" ? "text-red-300" : row.status === "warning" ? "text-amber-300" : "text-slate-300"}`}>
                    {row.percentage_used.toFixed(1)}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
