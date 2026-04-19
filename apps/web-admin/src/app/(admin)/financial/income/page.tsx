"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ── Types ─────────────────────────────────────────────────────────────────────
type OtherIncome = {
  id:               string;
  source_name:      string;
  amount:           string;
  income_date:      string;
  description:      string | null;
  recorded_by_name: string | null;
  created_at:       string;
};

type FormState = {
  sourceName:  string;
  amount:      string;
  incomeDate:  string;
  description: string;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const COMMON_SOURCES = ["Donation", "Grant", "Event Income", "Sponsorship", "Rental Income", "Other"];

// ── Page ──────────────────────────────────────────────────────────────────────
export default function OtherIncomePage() {
  const today = new Date().toISOString().slice(0, 10);

  const [records, setRecords]     = useState<OtherIncome[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError]         = useState<string | null>(null);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo]     = useState("");

  const [form, setForm] = useState<FormState>({
    sourceName: "", amount: "", incomeDate: today, description: ""
  });

  const limit = 20;

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: p, limit };
      if (filterFrom) params.from = filterFrom;
      if (filterTo)   params.to   = filterTo;
      const res = await api.get("/financial/income", { params });
      setRecords(res.data.income ?? []);
      setTotal(res.data.total ?? 0);
      setPage(p);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filterFrom, filterTo]);

  useEffect(() => { load(1); }, [load]);

  const set = (k: keyof FormState, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.sourceName.trim()) { setError("Source name is required"); return; }
    if (!form.amount || Number(form.amount) <= 0) { setError("Enter a valid positive amount"); return; }
    if (!form.incomeDate) { setError("Income date is required"); return; }

    setSubmitting(true);
    try {
      await api.post("/financial/income", {
        sourceName:  form.sourceName.trim(),
        amount:      Number(form.amount),
        incomeDate:  form.incomeDate,
        description: form.description || undefined
      });
      setForm({ sourceName: "", amount: "", incomeDate: today, description: "" });
      setShowForm(false);
      await load(1);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to save");
      } else {
        setError("Failed to save income record");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this income record? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await api.delete(`/financial/income/${id}`);
      await load(page);
    } catch {
      alert("Failed to delete record.");
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const grandTotal = records.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Finance</p>
          <h2 className="mt-1 text-2xl font-semibold">Other Income</h2>
          <p className="mt-0.5 text-sm text-slate-400">Donations, grants, event income, and other non-fee revenue.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/financial/pnl" className="text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition-colors">
            P&amp;L Report →
          </Link>
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "+ Add Income"}
          </Button>
        </div>
      </div>

      {/* Add Income Form */}
      {showForm && (
        <Card className="p-5 border-emerald-500/20 bg-emerald-500/[0.03]">
          <p className="text-sm font-semibold text-emerald-300 mb-4">New Income Record</p>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="source-name">Source Name *</Label>
              <div className="flex gap-2">
                <Input
                  id="source-name"
                  value={form.sourceName}
                  onChange={(e) => set("sourceName", e.target.value)}
                  placeholder="e.g. Donation, Grant"
                  list="source-suggestions"
                />
                <datalist id="source-suggestions">
                  {COMMON_SOURCES.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="income-amount">Amount (₹) *</Label>
              <Input
                id="income-amount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="income-date">Income Date *</Label>
              <Input
                id="income-date"
                type="date"
                value={form.incomeDate}
                onChange={(e) => set("incomeDate", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="income-desc">Description</Label>
              <Input
                id="income-desc"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Optional notes"
              />
            </div>
            {error && <p className="sm:col-span-2 text-sm text-red-400">{error}</p>}
            <div className="sm:col-span-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Save Income Record"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <p className="text-xs text-slate-400">From</p>
            <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-400">To</p>
            <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
          </div>
          <Button size="sm" onClick={() => load(1)}>Apply</Button>
          <Button size="sm" variant="ghost" onClick={() => { setFilterFrom(""); setFilterTo(""); }}>Clear</Button>
        </div>
      </Card>

      {/* Summary */}
      {!loading && records.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Card className="p-4 border-emerald-500/20 bg-emerald-500/5">
            <p className="text-xs text-emerald-400 uppercase tracking-wide">Visible Total</p>
            <p className="mt-1 text-xl font-bold text-white">{fmt(grandTotal)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Records</p>
            <p className="mt-1 text-xl font-bold text-white">{total}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-slate-400 uppercase tracking-wide">Latest Source</p>
            <p className="mt-1 text-sm font-bold text-white truncate">{records[0]?.source_name ?? "—"}</p>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading…</div>
        ) : records.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-slate-400 mb-3">No income records found.</p>
            <Button size="sm" onClick={() => setShowForm(true)}>Add your first income record</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-slate-400 uppercase tracking-wide text-left">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Recorded By</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                      {new Date(r.income_date).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-300 font-medium">
                        {r.source_name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">
                      {r.description ?? <span className="text-slate-600">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-white whitespace-nowrap">
                      {fmt(Number(r.amount))}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {r.recorded_by_name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId === r.id}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs px-2 py-1 h-auto"
                      >
                        {deletingId === r.id ? "…" : "Delete"}
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
            <Button variant="outline" size="sm" onClick={() => load(page - 1)} disabled={page <= 1}>
              Previous
            </Button>
            <span className="flex items-center px-3 text-slate-300">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => load(page + 1)} disabled={page >= totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
