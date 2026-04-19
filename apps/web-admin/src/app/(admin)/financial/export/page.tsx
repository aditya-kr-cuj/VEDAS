"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function defaultFinancialYearRange() {
  const now = new Date();
  const year = now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
  return {
    from: `${year}-04-01`,
    to: `${year + 1}-03-31`
  };
}

export default function TallyExportPage() {
  const defaults = defaultFinancialYearRange();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [loadingXml, setLoadingXml] = useState(false);
  const [loadingExcel, setLoadingExcel] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const download = async (format: "xml" | "excel") => {
    setMessage(null);

    try {
      if (format === "xml") setLoadingXml(true);
      if (format === "excel") setLoadingExcel(true);

      const response = await api.get("/financial/export/tally", {
        params: { from, to, format },
        responseType: "blob"
      });

      const contentType = response.headers["content-type"];
      const disposition = response.headers["content-disposition"];
      const filenameMatch = disposition?.match(/filename=([^;]+)/i);
      const filename = filenameMatch?.[1] ?? `tally-export-${from}-to-${to}.${format === "xml" ? "xml" : "xls"}`;

      const blob = new Blob([response.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setMessage(`Tally ${format.toUpperCase()} export downloaded.`);
    } catch {
      setMessage("Failed to export Tally data.");
    } finally {
      setLoadingXml(false);
      setLoadingExcel(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Finance</p>
        <h2 className="mt-1 text-2xl font-semibold">Tally Export</h2>
        <p className="mt-0.5 text-sm text-slate-400">Export income and expense vouchers with GST details in Tally-compatible format.</p>
      </div>

      <Card className="p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs text-slate-400">From Date</p>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <p className="mb-1 text-xs text-slate-400">To Date</p>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={() => download("xml")} disabled={loadingXml || loadingExcel}>
            {loadingXml ? "Exporting XML..." : "Export to Tally (XML)"}
          </Button>
          <Button variant="outline" onClick={() => download("excel")} disabled={loadingXml || loadingExcel}>
            {loadingExcel ? "Exporting Excel..." : "Export as Excel"}
          </Button>
        </div>

        {message && <p className="mt-4 text-sm text-slate-300">{message}</p>}
      </Card>

      <Card className="p-5">
        <p className="text-sm font-semibold">Export Includes</p>
        <ul className="mt-3 space-y-2 text-sm text-slate-400">
          <li>All fee and other income entries in selected date range.</li>
          <li>All expense entries in selected date range.</li>
          <li>GST amounts for each voucher row.</li>
          <li>Tally-compatible XML structure for import workflow.</li>
        </ul>
      </Card>
    </div>
  );
}
