"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Student = { id: string; full_name: string; email: string };
type Batch = { id: string; name: string };

export default function ReportsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [studentId, setStudentId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [reportType, setReportType] = useState("monthly");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [report, setReport] = useState<any>(null);
  const [reportId, setReportId] = useState<string | null>(null);

  useEffect(() => {
    api.get("/students", { params: { simple: "true" } })
      .then((res) => setStudents(res.data.students ?? []))
      .catch(() => setStudents([]));
    api.get("/batches").then((res) => setBatches(res.data.batches ?? [])).catch(() => setBatches([]));
  }, []);

  const generate = async () => {
    const res = await api.post("/reports/generate", {
      student_id: studentId,
      report_type: reportType,
      from_date: fromDate,
      to_date: toDate
    });
    setReport(res.data.data);
    setReportId(res.data.report_id);
  };

  const downloadPdf = () => {
    if (!reportId) return;
    window.open(`${process.env.NEXT_PUBLIC_API_BASE_URL}/reports/${reportId}/pdf`, "_blank");
  };

  const bulkDownload = async () => {
    const res = await api.post(
      "/reports/bulk-generate",
      { batch_id: batchId, report_type: reportType, from_date: fromDate, to_date: toDate },
      { responseType: "blob" }
    );
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = "reports.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 p-6 md:grid-cols-3">
          <div>
            <Label>Student</Label>
            <select
              className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              <option value="">Select student</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Report Type</Label>
            <select
              className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="monthly">Monthly</option>
              <option value="term">Term</option>
              <option value="annual">Annual</option>
            </select>
          </div>
          <div>
            <Label>From Date</Label>
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <Label>To Date</Label>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
          <div className="md:col-span-3 flex gap-2">
            <Button onClick={generate}>Generate Report</Button>
            <Button variant="outline" onClick={downloadPdf} disabled={!reportId}>
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-6 text-sm text-slate-300">
          <h3 className="text-lg font-semibold text-white">Report Preview</h3>
          {report ? (
            <pre className="whitespace-pre-wrap text-xs text-slate-300">{JSON.stringify(report, null, 2)}</pre>
          ) : (
            <p className="text-slate-400">Generate a report to preview data.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="grid gap-4 p-6 md:grid-cols-3">
          <div>
            <Label>Batch</Label>
            <select
              className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
            >
              <option value="">Select batch</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={bulkDownload} disabled={!batchId}>
              Download Batch Reports (ZIP)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
