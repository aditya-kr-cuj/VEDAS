"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

interface WhatsAppLog {
  id: string;
  recipient_phone: string;
  template_name: string;
  template_params: string[];
  status: "sent" | "failed" | "queued";
  message_id: string | null;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const statusColors: Record<string, string> = {
  sent: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  failed: "bg-red-500/20 text-red-400 border border-red-500/30",
  queued: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WhatsAppLogsPage() {
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 25, total: 0, totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 25 };
      if (statusFilter) params.status = statusFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      const res = await api.get("/notifications/whatsapp/logs", { params });
      setLogs(res.data.logs ?? []);
      setPagination(res.data.pagination ?? { page: 1, limit: 25, total: 0, totalPages: 0 });
    } catch {
      console.error("Failed to load WhatsApp logs");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, fromDate, toDate]);

  useEffect(() => { fetchLogs(1); }, [fetchLogs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">💬</span> WhatsApp Logs
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Monitor all outgoing WhatsApp template messages
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" /> Sent
          <span className="ml-2 inline-block h-2 w-2 rounded-full bg-red-400" /> Failed
          <span className="ml-2 inline-block h-2 w-2 rounded-full bg-amber-400" /> Queued
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-400">Status</label>
            <select
              id="wa-log-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-lg border border-white/10 bg-slate-900/80 px-3 text-sm text-slate-200 outline-none transition focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/40"
            >
              <option value="">All</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="queued">Queued</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-400">From</label>
            <Input id="wa-log-from" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 w-40 bg-slate-900/80" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-400">To</label>
            <Input id="wa-log-to" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-9 w-40 bg-slate-900/80" />
          </div>
          <Button id="wa-log-clear" variant="outline" size="sm" onClick={() => { setStatusFilter(""); setFromDate(""); setToDate(""); }}>
            Clear
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-[var(--accent)]" />
            </div>
          ) : logs.length === 0 ? (
            <div className="py-20 text-center text-sm text-slate-500">No WhatsApp logs found</div>
          ) : (
            <Table>
              <THead>
                <TR className="border-white/5 hover:bg-transparent">
                  <TH className="text-slate-400">Phone</TH>
                  <TH className="text-slate-400">Template</TH>
                  <TH className="text-slate-400">Params</TH>
                  <TH className="text-slate-400">Status</TH>
                  <TH className="text-slate-400">Sent At</TH>
                  <TH className="text-slate-400">Error</TH>
                </TR>
              </THead>
              <TBody>
                {logs.map((log) => (
                  <TR key={log.id} className="border-white/5 transition hover:bg-white/[0.03]">
                    <TD className="whitespace-nowrap text-sm font-mono text-slate-200">{log.recipient_phone}</TD>
                    <TD>
                      <span className="rounded-md bg-green-500/10 px-2 py-0.5 text-xs text-green-400 border border-green-500/20">
                        {log.template_name}
                      </span>
                    </TD>
                    <TD className="max-w-[180px] truncate text-xs text-slate-400">
                      {Array.isArray(log.template_params) ? log.template_params.join(", ") : "—"}
                    </TD>
                    <TD>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[log.status] ?? ""}`}>
                        {log.status}
                      </span>
                    </TD>
                    <TD className="whitespace-nowrap text-xs text-slate-400">{formatDate(log.sent_at)}</TD>
                    <TD className="max-w-[160px] truncate text-xs text-red-400/80">{log.error_message ?? "—"}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
          <div className="flex gap-2">
            <Button id="wa-log-prev" variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => fetchLogs(pagination.page - 1)}>Previous</Button>
            <Button id="wa-log-next" variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => fetchLogs(pagination.page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
