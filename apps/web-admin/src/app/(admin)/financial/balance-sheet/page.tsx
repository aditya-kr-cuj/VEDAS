"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ── Types ─────────────────────────────────────────────────────────────────────
type BalanceSheet = {
  as_of: string;
  assets: {
    cash_and_bank:  number;
    receivables:    number;
    total:          number;
  };
  liabilities: {
    loans:    number;
    payables: number;
    total:    number;
  };
  equity: {
    owners_equity: number;
    total:         number;
  };
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

// ── Donut chart (pure SVG) ────────────────────────────────────────────────────
function DonutChart({
  segments,
  size = 160,
}: {
  segments: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = segments.reduce((a, b) => a + b.value, 0);
  if (total === 0) return <p className="text-sm text-slate-500 text-center">No data</p>;

  const r = size / 2 - 20;
  const cx = size / 2;
  const cy = size / 2;
  let startAngle = -Math.PI / 2;

  const arcs = segments.map((seg) => {
    const angle = (seg.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const endAngle = startAngle + angle;
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    startAngle = endAngle;
    return { ...seg, path };
  });

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {arcs.map((arc) => (
          <path key={arc.label} d={arc.path} fill={arc.color} opacity={0.85} />
        ))}
        <circle cx={cx} cy={cy} r={r * 0.5} fill="transparent" />
      </svg>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs text-slate-300">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section row ───────────────────────────────────────────────────────────────
function BSRow({ label, value, indent = false, bold = false }: {
  label: string; value: number; indent?: boolean; bold?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-2 ${bold ? "border-t border-white/10 mt-1" : ""}`}>
      <span className={`text-sm ${indent ? "pl-6 text-slate-400" : bold ? "font-semibold text-white" : "text-slate-300"}`}>
        {label}
      </span>
      <span className={`text-sm ${bold ? "font-bold text-white" : "text-slate-200"}`}>{fmt(value)}</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function BalanceSheetPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [asOf, setAsOf]       = useState(today);
  const [data, setData]       = useState<BalanceSheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/financial/balance-sheet", { params: { as_of: asOf } });
      setData(res.data);
    } catch {
      setError("Failed to load balance sheet data.");
    } finally {
      setLoading(false);
    }
  }, [asOf]);

  useEffect(() => { load(); }, [load]);

  const assetSegments = data
    ? [
        { label: "Cash & Bank",  value: data.assets.cash_and_bank, color: "#10b981" },
        { label: "Receivables",  value: data.assets.receivables,   color: "#34d399" },
      ]
    : [];

  const equityVsLiab = data
    ? [
        { label: "Equity",       value: data.equity.total,       color: "#7c3aed" },
        { label: "Liabilities",  value: Math.max(data.liabilities.total, 0), color: "#f43f5e" },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Financial Reports</p>
        <h2 className="mt-1 text-2xl font-semibold">Balance Sheet</h2>
        <p className="mt-0.5 text-sm text-slate-400">
          A snapshot of institute assets, liabilities, and equity.
        </p>
      </div>

      {/* Date picker */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <p className="text-xs text-slate-400 uppercase tracking-wide">As of Date</p>
            <Input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
          </div>
          <Button onClick={load} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
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
          {/* KPI row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="p-5 border-emerald-500/20 bg-emerald-500/5">
              <p className="text-xs text-emerald-400 uppercase tracking-wide font-medium mb-2">Total Assets</p>
              <p className="text-3xl font-bold text-white">{fmt(data.assets.total)}</p>
            </Card>
            <Card className="p-5 border-rose-500/20 bg-rose-500/5">
              <p className="text-xs text-rose-400 uppercase tracking-wide font-medium mb-2">Total Liabilities</p>
              <p className="text-3xl font-bold text-white">{fmt(data.liabilities.total)}</p>
            </Card>
            <Card className="p-5 border-violet-500/20 bg-violet-500/5">
              <p className="text-xs text-violet-400 uppercase tracking-wide font-medium mb-2">Owner&apos;s Equity</p>
              <p className="text-3xl font-bold text-white">{fmt(data.equity.total)}</p>
            </Card>
          </div>

          <p className="text-xs text-center text-slate-500">
            Balance sheet as of <span className="text-slate-300">{data.as_of}</span>
          </p>

          {/* Main content */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Assets section */}
            <Card className="p-5 border-emerald-500/20">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-sm bg-emerald-500" />
                <p className="text-sm font-semibold text-emerald-300 uppercase tracking-wider">Assets</p>
              </div>
              <BSRow label="Cash &amp; Bank Balance" value={data.assets.cash_and_bank} indent />
              <BSRow label="Receivables (Pending Fees)" value={data.assets.receivables} indent />
              <BSRow label="Total Assets" value={data.assets.total} bold />

              <div className="mt-6">
                <DonutChart segments={assetSegments} />
              </div>
            </Card>

            {/* Liabilities section */}
            <Card className="p-5 border-rose-500/20">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-sm bg-rose-500" />
                <p className="text-sm font-semibold text-rose-300 uppercase tracking-wider">Liabilities</p>
              </div>
              <BSRow label="Loans" value={data.liabilities.loans} indent />
              <BSRow label="Payables" value={data.liabilities.payables} indent />
              <BSRow label="Total Liabilities" value={data.liabilities.total} bold />

              <div className="mt-4 rounded-xl bg-white/[0.03] border border-white/5 p-3">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Loan &amp; payable tracking will be available once the Loan Management module is configured.
                  Currently showing ₹0 until data is entered.
                </p>
              </div>
            </Card>

            {/* Equity section */}
            <Card className="p-5 border-violet-500/20">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-3 w-3 rounded-sm bg-violet-500" />
                <p className="text-sm font-semibold text-violet-300 uppercase tracking-wider">Equity</p>
              </div>
              <BSRow label="Owner's Equity" value={data.equity.owners_equity} indent />
              <BSRow label="Total Equity" value={data.equity.total} bold />

              <div className="mt-6">
                <DonutChart segments={equityVsLiab} />
              </div>
            </Card>
          </div>

          {/* Accounting equation check */}
          <Card className="p-5">
            <p className="text-sm font-semibold mb-4">Accounting Equation Verification</p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-center">
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-6 py-3">
                <p className="text-xs text-emerald-400 mb-1">Assets</p>
                <p className="text-xl font-bold text-white">{fmt(data.assets.total)}</p>
              </div>
              <span className="text-2xl font-bold text-slate-400">=</span>
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-6 py-3">
                <p className="text-xs text-rose-400 mb-1">Liabilities</p>
                <p className="text-xl font-bold text-white">{fmt(data.liabilities.total)}</p>
              </div>
              <span className="text-2xl font-bold text-slate-400">+</span>
              <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 px-6 py-3">
                <p className="text-xs text-violet-400 mb-1">Equity</p>
                <p className="text-xl font-bold text-white">{fmt(data.equity.total)}</p>
              </div>
              <div className="w-full text-center mt-1">
                {Math.abs(data.assets.total - (data.liabilities.total + data.equity.total)) < 1 ? (
                  <span className="text-xs text-emerald-400">✓ Equation balanced</span>
                ) : (
                  <span className="text-xs text-red-400">⚠ Equation unbalanced — check data</span>
                )}
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
