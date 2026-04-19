"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ── Types ─────────────────────────────────────────────────────────────────────

type Expense = {
  id: string;
  expense_category_id: string;
  category_name: string;
  category_type: "fixed" | "variable";
  amount: string;
  expense_date: string;
  description: string | null;
  payment_mode: string;
  vendor_name: string | null;
  receipt_url: string | null;
  recorded_by_name: string | null;
  is_recurring: boolean;
  recurrence_frequency: string | null;
  created_at: string;
};

type Summary = {
  total: number;
  average: number;
  breakdown: { category: string; amount: number }[];
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const PAYMENT_MODES = ["cash", "bank_transfer", "cheque", "card"] as const;
const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

function exportToCSV(expenses: Expense[]) {
  const header = [
    "Date", "Category", "Description", "Vendor", "Amount",
    "Payment Mode", "Recurring", "Frequency", "Recorded By"
  ].join(",");
  const rows = expenses.map((e) =>
    [
      e.expense_date,
      e.category_name,
      `"${(e.description ?? "").replace(/"/g, '""')}"`,
      `"${(e.vendor_name ?? "").replace(/"/g, '""')}"`,
      e.amount,
      e.payment_mode,
      e.is_recurring ? "Yes" : "No",
      e.recurrence_frequency ?? "",
      e.recorded_by_name ?? ""
    ].join(",")
  );
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `expenses-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Page Component ────────────────────────────────────────────────────────────

export default function ExpensesPage() {
  const [expenses, setExpenses]     = useState<Expense[]>([]);
  const [summary, setSummary]       = useState<Summary | null>(null);
  const [categories, setCategories] = useState<{ id: string; category_name: string }[]>([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState("");
  const [filterMode, setFilterMode]         = useState("");
  const [filterFrom, setFilterFrom]         = useState("");
  const [filterTo, setFilterTo]             = useState("");
  const [filterRecurring, setFilterRecurring] = useState("");

  const limit = 20;

  const loadCategories = async () => {
    try {
      const res = await api.get("/expenses/categories");
      setCategories(res.data.categories ?? []);
    } catch {
      // silent
    }
  };

  const loadExpenses = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, limit };
      if (filterCategory) params.category_id   = filterCategory;
      if (filterMode)     params.payment_mode   = filterMode;
      if (filterFrom)     params.from           = filterFrom;
      if (filterTo)       params.to             = filterTo;
      if (filterRecurring) params.is_recurring  = filterRecurring;

      const res = await api.get("/expenses", { params });
      setExpenses(res.data.expenses ?? []);
      setTotal(res.data.total ?? 0);
      setSummary(res.data.summary ?? null);
      setPage(p);
    } catch {
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterMode, filterFrom, filterTo, filterRecurring]);

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { loadExpenses(1); }, [loadExpenses]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this expense? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await api.delete(`/expenses/${id}`);
      await loadExpenses(page);
    } catch {
      alert("Failed to delete expense.");
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.ceil(total / limit);

  const paymentModeBadge = (mode: string) => {
    const map: Record<string, string> = {
      cash: "bg-green-500/20 text-green-300",
      bank_transfer: "bg-blue-500/20 text-blue-300",
      cheque: "bg-yellow-500/20 text-yellow-300",
      card: "bg-purple-500/20 text-purple-300"
    };
    return map[mode] ?? "bg-white/10 text-slate-300";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Finance</p>
          <h2 className="mt-2 text-2xl font-semibold">Expenses</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportToCSV(expenses)}
            disabled={expenses.length === 0}
          >
            ↓ Export CSV
          </Button>
          <Link
            href="/expenses/new"
            className={buttonVariants({ variant: "default" })}
          >
            + Add Expense
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Total (Filtered)</p>
            <p className="mt-1 text-2xl font-bold text-white">{fmt(summary.total)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Average</p>
            <p className="mt-1 text-2xl font-bold text-white">{fmt(summary.average)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Records</p>
            <p className="mt-1 text-2xl font-bold text-white">{total}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Top Category</p>
            <p className="mt-1 text-lg font-bold text-white truncate">
              {summary.breakdown[0]?.category ?? "—"}
            </p>
          </Card>
        </div>
      )}

      {/* Category Breakdown */}
      {summary && summary.breakdown.length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-semibold mb-3">Spending by Category</p>
          <div className="space-y-2">
            {summary.breakdown.map((b) => {
              const pct = summary.total > 0 ? (b.amount / summary.total) * 100 : 0;
              return (
                <div key={b.category}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-300">{b.category}</span>
                    <span className="text-white font-medium">{fmt(b.amount)}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/10">
                    <div
                      className="h-1.5 rounded-full bg-violet-500 transition-all"
                      style={{ width: `${pct.toFixed(1)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4">
        <p className="text-sm font-semibold mb-3">Filters</p>
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-5">
          <select
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.category_name}</option>
            ))}
          </select>
          <select
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value)}
          >
            <option value="">All Modes</option>
            {PAYMENT_MODES.map((m) => (
              <option key={m} value={m}>{m.replace(/_/g, " ")}</option>
            ))}
          </select>
          <div>
            <Input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              placeholder="From date"
            />
          </div>
          <div>
            <Input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              placeholder="To date"
            />
          </div>
          <select
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
            value={filterRecurring}
            onChange={(e) => setFilterRecurring(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="true">Recurring Only</option>
            <option value="false">One-time Only</option>
          </select>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" onClick={() => loadExpenses(1)}>Apply</Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setFilterCategory(""); setFilterMode("");
              setFilterFrom(""); setFilterTo(""); setFilterRecurring("");
            }}
          >
            Clear
          </Button>
        </div>
      </Card>

      {/* Expense Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading expenses…</div>
        ) : expenses.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-400 mb-4">No expenses found.</p>
            <Link
              href="/expenses/new"
              className={buttonVariants({ size: "sm" })}
            >
              Add your first expense
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-slate-400 uppercase tracking-wide">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Description / Vendor</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Receipt</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                      {new Date(e.expense_date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-white">{e.category_name}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          e.category_type === "fixed"
                            ? "bg-blue-500/20 text-blue-300"
                            : "bg-orange-500/20 text-orange-300"
                        }`}>
                          {e.category_type}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      {e.description && (
                        <p className="text-slate-200 truncate">{e.description}</p>
                      )}
                      {e.vendor_name && (
                        <p className="text-xs text-slate-400">{e.vendor_name}</p>
                      )}
                      {e.recorded_by_name && (
                        <p className="text-[10px] text-slate-500">by {e.recorded_by_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-white whitespace-nowrap">
                      {fmt(Number(e.amount))}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${paymentModeBadge(e.payment_mode)}`}>
                        {e.payment_mode.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {e.is_recurring ? (
                        <div>
                          <span className="text-xs px-2 py-1 rounded-full bg-violet-500/20 text-violet-300">
                            Recurring
                          </span>
                          {e.recurrence_frequency && (
                            <p className="text-[10px] text-slate-400 mt-0.5 capitalize">
                              {e.recurrence_frequency}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">One-time</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {e.receipt_url ? (
                        <a
                          href={e.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2"
                        >
                          View
                        </a>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(e.id)}
                        disabled={deletingId === e.id}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs px-2 py-1 h-auto"
                      >
                        {deletingId === e.id ? "…" : "Delete"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-400">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => loadExpenses(page - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-slate-300">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline" size="sm"
              onClick={() => loadExpenses(page + 1)}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
