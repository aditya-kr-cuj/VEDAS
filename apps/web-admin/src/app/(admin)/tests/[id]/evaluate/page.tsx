"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Submission = {
  id: string;
  student_name: string;
  student_email: string;
  total_marks_obtained: string;
  status: string;
  subjective_pending: string;
};

export default function SubmissionsPage() {
  const params = useParams();
  const id = params?.id as string;
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const paramsObj: Record<string, string> = {};
    if (filter !== "all") paramsObj.status = filter;
    api
      .get(`/tests/${id}/submissions`, { params: paramsObj })
      .then((res) => setSubmissions(res.data.submissions ?? []))
      .catch(() => setSubmissions([]));
  }, [id, filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Submissions</h2>
          <p className="text-sm text-slate-400">Evaluate student answers.</p>
        </div>
        <select
          className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="submitted">Pending</option>
          <option value="evaluated">Evaluated</option>
        </select>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {submissions.map((submission) => (
          <Card key={submission.id}>
            <CardContent className="space-y-2 p-4 text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{submission.student_name}</span>
                <span className="rounded-full bg-white/10 px-2 py-1 text-xs uppercase text-slate-300">
                  {submission.status}
                </span>
              </div>
              <p>{submission.student_email}</p>
              <p>Marks: {submission.total_marks_obtained}</p>
              <p>Subjective pending: {submission.subjective_pending}</p>
              <Link href={`/tests/${id}/evaluate/${submission.id}`}>
                <Button size="sm">Evaluate</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
