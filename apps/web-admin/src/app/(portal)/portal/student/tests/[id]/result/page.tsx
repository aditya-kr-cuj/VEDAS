"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StudentResultPage() {
  const params = useParams();
  const id = params?.id as string;
  const [result, setResult] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    api.get(`/tests/${id}/result`).then((res) => setResult(res.data.result)).catch(() => setResult(null));
    api.get(`/tests/${id}/leaderboard`).then((res) => setLeaderboard(res.data.leaderboard ?? []));
  }, [id]);

  if (!result) return <p className="text-sm text-slate-400">Loading result...</p>;

  const myRank = leaderboard.find((row) => row.student_id === result.attempt.student_id);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Score Card</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-300">
          <p>Marks: {result.attempt.total_marks_obtained}</p>
          <p>Percentage: {result.attempt.percentage}%</p>
          {myRank && <p>Rank: #{myRank.rank}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Question Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-300">
          {result.answers.map((answer: any) => (
            <div key={answer.id} className="rounded-lg border border-white/10 p-3">
              <div dangerouslySetInnerHTML={{ __html: answer.question_text }} />
              <p>
                {answer.is_correct === null ? "Pending" : answer.is_correct ? "Correct" : "Wrong"} •{" "}
                {answer.marks_obtained ?? 0}/{answer.marks}
              </p>
              {answer.explanation && <p className="text-xs text-slate-500">Solution: {answer.explanation}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
