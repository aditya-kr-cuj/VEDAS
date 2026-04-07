"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestReviewPage() {
  const params = useParams();
  const id = params?.id as string;
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    api.get(`/tests/${id}/result`).then((res) => setResult(res.data.result)).catch(() => setResult(null));
  }, [id]);

  if (!result) return <p className="text-sm text-slate-400">Loading result...</p>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Result Summary</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-300">
          <p>Total Marks: {result.attempt.total_marks_obtained}</p>
          <p>Percentage: {result.attempt.percentage}%</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Question Review</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-300">
          {result.answers.map((answer: any) => (
            <div key={answer.id} className="rounded-lg border border-white/10 p-3">
              <div dangerouslySetInnerHTML={{ __html: answer.question_text }} />
              <p className="text-xs text-slate-400">
                Marks: {answer.marks_obtained ?? 0} / {answer.marks} •{" "}
                {answer.is_correct === null ? "Pending" : answer.is_correct ? "Correct" : "Wrong"}
              </p>
              {answer.explanation && <p className="text-xs text-slate-500">Explanation: {answer.explanation}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
