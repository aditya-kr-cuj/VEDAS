"use client";

import { useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type GstReport = {
  period: { from: string; to: string };
  tax_settings: { gst_number: string | null; tax_rate: number; tax_regime: "gst" | "vat" | "none" };
  gst_collected: number;
  gst_paid: number;
  net_gst_payable: number;
  gstr_format_data: {
    gstr1_outward_supplies: { invoice_number: string; date: string; taxable_value: number; gst_amount: number }[];
    gstr3b_itc: { ref_id: string; date: string; category: string; taxable_value: number; gst_amount: number }[];
  };
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);

const currentQuarter = () => {
  const now = new Date();
  const q = Math.floor(now.getMonth() / 3);
  const startMonth = q * 3;
  const from = new Date(now.getFullYear(), startMonth, 1);
  const to = new Date(now.getFullYear(), startMonth + 3, 0);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10)
  };
};

export default function GstReportsPage() {
  const q = currentQuarter();
  const [from, setFrom] = useState(q.from);
  const [to, setTo] = useState(q.to);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<GstReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/financial/gst-report", { params: { from, to } });
      setReport(res.data as GstReport);
    } catch {
      setError("Failed to load GST report.");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const filingJson = useMemo(() => {
    if (!report) return "";
    return JSON.stringify(report.gstr_format_data, null, 2);
  }, [report]);

  const exportFiling = () => {
    if (!report) return;
    const blob = new Blob([filingJson], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gst-filing-${report.period.from}-to-${report.period.to}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Finance</p>
        <h2 className="mt-1 text-2xl font-semibold">GST Reports</h2>
        <p className="mt-0.5 text-sm text-slate-400">Quarterly GST summary with outward supplies and input tax credit entries.</p>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <p className="mb-1 text-xs text-slate-400">From</p>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <p className="mb-1 text-xs text-slate-400">To</p>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button onClick={load} disabled={loading}>{loading ? "Loading..." : "Generate GST Report"}</Button>
          {report && <Button variant="outline" onClick={exportFiling}>Export for Filing</Button>}
        </div>
        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      </Card>

      {report && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-4 border-emerald-500/20 bg-emerald-500/5">
              <p className="text-xs uppercase tracking-wide text-emerald-300">GST Collected</p>
              <p className="mt-1 text-2xl font-bold text-white">{fmt(report.gst_collected)}</p>
            </Card>
            <Card className="p-4 border-amber-500/20 bg-amber-500/5">
              <p className="text-xs uppercase tracking-wide text-amber-300">GST Paid</p>
              <p className="mt-1 text-2xl font-bold text-white">{fmt(report.gst_paid)}</p>
            </Card>
            <Card className={`p-4 ${report.net_gst_payable >= 0 ? "border-cyan-500/20 bg-cyan-500/5" : "border-violet-500/20 bg-violet-500/5"}`}>
              <p className="text-xs uppercase tracking-wide text-slate-300">Net GST {report.net_gst_payable >= 0 ? "Payable" : "Refundable"}</p>
              <p className="mt-1 text-2xl font-bold text-white">{fmt(Math.abs(report.net_gst_payable))}</p>
            </Card>
          </div>

          <Card className="p-4">
            <p className="text-sm text-slate-300">
              GSTIN: <span className="font-medium text-white">{report.tax_settings.gst_number ?? "Not configured"}</span> |
              &nbsp;Regime: <span className="font-medium uppercase text-white">{report.tax_settings.tax_regime}</span> |
              &nbsp;Rate: <span className="font-medium text-white">{report.tax_settings.tax_rate}%</span>
            </p>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="overflow-hidden">
              <div className="border-b border-white/10 px-4 py-3">
                <p className="text-sm font-semibold">GSTR-1 Outward Supplies (Fees)</p>
              </div>
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-2">Invoice</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2 text-right">Taxable</th>
                      <th className="px-4 py-2 text-right">GST</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {report.gstr_format_data.gstr1_outward_supplies.map((row) => (
                      <tr key={`${row.invoice_number}-${row.date}`}>
                        <td className="px-4 py-2 text-slate-200">{row.invoice_number}</td>
                        <td className="px-4 py-2 text-slate-400">{row.date}</td>
                        <td className="px-4 py-2 text-right text-white">{fmt(row.taxable_value)}</td>
                        <td className="px-4 py-2 text-right text-emerald-300">{fmt(row.gst_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="border-b border-white/10 px-4 py-3">
                <p className="text-sm font-semibold">GSTR-3B ITC (Expenses)</p>
              </div>
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-2">Ref</th>
                      <th className="px-4 py-2">Category</th>
                      <th className="px-4 py-2 text-right">Taxable</th>
                      <th className="px-4 py-2 text-right">GST</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {report.gstr_format_data.gstr3b_itc.map((row) => (
                      <tr key={row.ref_id}>
                        <td className="px-4 py-2 text-slate-400">{row.date}</td>
                        <td className="px-4 py-2 text-slate-200">{row.category}</td>
                        <td className="px-4 py-2 text-right text-white">{fmt(row.taxable_value)}</td>
                        <td className="px-4 py-2 text-right text-amber-300">{fmt(row.gst_amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
