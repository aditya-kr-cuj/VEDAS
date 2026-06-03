"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { Search, Filter, ChevronLeft, ChevronRight, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Institute {
  id: string;
  name: string;
  slug: string;
  tenant_code: string;
  owner_email: string;
  plan_key: string | null;
  is_active: boolean;
  created_at: string;
  user_count: string;
  student_count: string;
  teacher_count: string;
}

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  pro: "Pro",
  none: "No Plan",
};

export default function InstitutesPage() {
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const limit = 15;

  const fetchInstitutes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (planFilter) params.set("plan", planFilter);

      const res = await api.get(`/super-admin/institutes?${params}`);
      setInstitutes(res.data.institutes);
      setTotal(res.data.total);
    } catch (err) {
      console.error("Failed to load institutes", err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, planFilter]);

  useEffect(() => {
    fetchInstitutes();
  }, [fetchInstitutes]);

  const totalPages = Math.ceil(total / limit);

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === institutes.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(institutes.map((i) => i.id)));
    }
  };

  const bulkApprove = async () => {
    try {
      await Promise.all(
        Array.from(selected).map((id) =>
          api.put(`/super-admin/institutes/${id}/status`, { is_active: true })
        )
      );
      setSelected(new Set());
      fetchInstitutes();
    } catch (err) {
      console.error("Bulk approve failed", err);
    }
  };

  const exportCSV = () => {
    const header = "Name,Email,Code,Plan,Status,Users,Created\n";
    const rows = institutes
      .map(
        (i) =>
          `"${i.name}","${i.owner_email}","${i.tenant_code}","${i.plan_key ?? "none"}","${i.is_active ? "Active" : "Pending"}","${i.user_count}","${i.created_at}"`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `institutes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Institutes</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage all registered coaching institutes ({total} total)
          </p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2 rounded-xl border-white/10 text-slate-300 hover:bg-white/5">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, or code..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="appearance-none rounded-xl border border-white/10 bg-white/5 py-2.5 pl-9 pr-8 text-sm text-slate-300 outline-none transition focus:border-purple-500/50"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Pending</option>
            </select>
          </div>
          <select
            value={planFilter}
            onChange={(e) => {
              setPlanFilter(e.target.value);
              setPage(1);
            }}
            className="appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 outline-none transition focus:border-purple-500/50"
          >
            <option value="">All Plans</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="pro">Pro</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3">
          <span className="text-sm text-purple-300">{selected.size} selected</span>
          <Button
            size="sm"
            onClick={bulkApprove}
            className="gap-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Approve Selected
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelected(new Set())}
            className="text-slate-400"
          >
            Clear
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/50">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-slate-400">
                <th className="p-4">
                  <input
                    type="checkbox"
                    checked={selected.size === institutes.length && institutes.length > 0}
                    onChange={toggleAll}
                    className="rounded accent-purple-500"
                  />
                </th>
                <th className="p-4 font-medium">Institute</th>
                <th className="p-4 font-medium">Code</th>
                <th className="p-4 font-medium">Plan</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium">Students</th>
                <th className="p-4 font-medium">Teachers</th>
                <th className="p-4 font-medium">Created</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {institutes.map((inst) => (
                <tr
                  key={inst.id}
                  className="border-b border-white/5 transition hover:bg-white/5"
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selected.has(inst.id)}
                      onChange={() => toggleSelect(inst.id)}
                      className="rounded accent-purple-500"
                    />
                  </td>
                  <td className="p-4">
                    <p className="font-medium text-white">{inst.name}</p>
                    <p className="text-xs text-slate-500">{inst.owner_email}</p>
                  </td>
                  <td className="p-4">
                    <span className="rounded-md bg-white/5 px-2 py-1 font-mono text-xs text-slate-300">
                      {inst.tenant_code}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-xs font-medium text-purple-300">
                      {PLAN_LABELS[inst.plan_key ?? "none"]}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        inst.is_active
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {inst.is_active ? "Active" : "Pending"}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300">{inst.student_count}</td>
                  <td className="p-4 text-slate-300">{inst.teacher_count}</td>
                  <td className="p-4 text-slate-400">
                    {new Date(inst.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="p-4">
                    <Link
                      href={`/institutes/${inst.id}`}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-purple-300 transition hover:bg-purple-500/10"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
              {institutes.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-500">
                    No institutes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="gap-1 rounded-lg border-white/10 text-slate-300"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="gap-1 rounded-lg border-white/10 text-slate-300"
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
