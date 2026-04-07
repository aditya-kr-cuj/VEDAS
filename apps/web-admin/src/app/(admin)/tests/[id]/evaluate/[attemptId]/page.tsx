"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function EvaluationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const testId = params?.id as string;
  const attemptId = params?.attemptId as string;
  const [submission, setSubmission] = useState<any>(null);
  const [evaluations, setEvaluations] = useState<Record<string, { marks: number; feedback: string }>>({});

  useEffect(() => {
    api.get(`/tests/${testId}/evaluate/${attemptId}`).then((res) => {
      setSubmission(res.data);
      const initial: Record<string, { marks: number; feedback: string }> = {};
      res.data.answers.forEach((ans: any) => {
        if (ans.question_type === "subjective") {
          initial[ans.id] = { marks: Number(ans.marks_obtained ?? 0), feedback: ans.feedback ?? "" };
        }
      });
      setEvaluations(initial);
    });
  }, [testId, attemptId]);

  const save = async () => {
    const payload = {
      evaluations: Object.entries(evaluations).map(([id, value]) => ({
        answer_id: id,
        marks_obtained: value.marks,
        feedback: value.feedback
      }))
    };
    await api.post(`/tests/${testId}/evaluate/${attemptId}`, payload);
    router.push(`/tests/${testId}/evaluate`);
  };

  if (!submission) return <p className="text-sm text-slate-400">Loading submission...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Evaluate Submission</h2>
        <p className="text-sm text-slate-400">{submission.attempt.student_name}</p>
      </div>

      {submission.answers.map((answer: any) => (
        <Card key={answer.id}>
          <CardContent className="space-y-3 p-4 text-sm text-slate-300">
            <div dangerouslySetInnerHTML={{ __html: answer.question_text }} />
            <p>Student Answer: {JSON.stringify(answer.answer_data)}</p>
            {answer.rubric_text && (
              <div className="rounded-md border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
                <strong>Rubric:</strong> {answer.rubric_text}
              </div>
            )}
            {answer.question_type === "subjective" && (
              <div className="space-y-2">
                <Input
                  type="number"
                  value={evaluations[answer.id]?.marks ?? 0}
                  onChange={(e) =>
                    setEvaluations((prev) => ({
                      ...prev,
                      [answer.id]: { ...prev[answer.id], marks: Number(e.target.value) }
                    }))
                  }
                />
                <textarea
                  className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                  rows={3}
                  value={evaluations[answer.id]?.feedback ?? ""}
                  onChange={(e) =>
                    setEvaluations((prev) => ({
                      ...prev,
                      [answer.id]: { ...prev[answer.id], feedback: e.target.value }
                    }))
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <Button onClick={save}>Save Evaluation</Button>
    </div>
  );
}
