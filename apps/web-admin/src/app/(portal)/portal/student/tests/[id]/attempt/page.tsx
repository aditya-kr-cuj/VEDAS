"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Question = {
  id: string;
  question_text: string;
  question_type: string;
  marks: string;
  options?: Array<{ id: string; option_text: string }>;
  blanks?: Array<{ blank_position: number }>;
};

export default function TestAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [test, setTest] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [current, setCurrent] = useState(0);
  const [saving, setSaving] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    api.post(`/tests/${id}/start`).then((res) => {
      setTest(res.data.test);
      setQuestions(res.data.questions ?? []);
      const initial: Record<string, any> = {};
      (res.data.answers ?? []).forEach((a: any) => (initial[a.question_id] = a.answer_data));
      setAnswers(initial);
      if (res.data.test?.duration_minutes) {
        setTimeLeft(res.data.test.duration_minutes * 60);
      }
    });
  }, [id]);

  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      submit();
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => (t ? t - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    const interval = setInterval(() => {
      autoSave();
    }, 30000);
    return () => clearInterval(interval);
  });

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        console.warn("Tab switch detected");
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const currentQuestion = questions[current];

  const autoSave = async () => {
    if (!currentQuestion) return;
    setSaving(true);
    await api.post(`/tests/${id}/save-answer`, {
      question_id: currentQuestion.id,
      answer_data: answers[currentQuestion.id] ?? {}
    });
    setSaving(false);
  };

  const submit = async () => {
    await api.post(`/tests/${id}/submit`, {
      total_marks: questions.reduce((sum, q) => sum + Number(q.marks), 0),
      time_taken_seconds: (test?.duration_minutes ?? 0) * 60 - (timeLeft ?? 0),
      show_result_immediately: test?.show_result_immediately
    });
    router.push(`/portal/student/tests/${id}/review`);
  };

  const progress = useMemo(() => Math.round(((current + 1) / questions.length) * 100), [current, questions.length]);

  if (!test) return <p className="text-sm text-slate-400">Loading test...</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">{test.title}</h2>
          <p className="text-sm text-slate-400">Question {current + 1} of {questions.length}</p>
        </div>
        <div className="text-sm text-slate-300">
          Time left: {timeLeft !== null ? `${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}` : "--"}
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="text-sm text-slate-400">Progress: {progress}% {saving && "(Saving...)"}</div>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                className={`h-8 w-8 rounded-full text-xs ${
                  idx === current ? "bg-white text-black" : answers[q.id] ? "bg-emerald-500/30 text-emerald-100" : "bg-white/10 text-slate-300"
                }`}
                onClick={() => setCurrent(idx)}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          {currentQuestion && (
            <>
              <div className="text-base text-white" dangerouslySetInnerHTML={{ __html: currentQuestion.question_text }} />
              {currentQuestion.question_type === "mcq" || currentQuestion.question_type === "true_false" ? (
                <div className="space-y-2">
                  {currentQuestion.options?.map((opt) => (
                    <label key={opt.id} className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="radio"
                        name="mcq"
                        checked={answers[currentQuestion.id]?.selected_option_id === opt.id}
                        onChange={() =>
                          setAnswers((prev) => ({ ...prev, [currentQuestion.id]: { selected_option_id: opt.id } }))
                        }
                      />
                      {opt.option_text}
                    </label>
                  ))}
                </div>
              ) : null}

              {currentQuestion.question_type === "multi_select" ? (
                <div className="space-y-2">
                  {currentQuestion.options?.map((opt) => {
                    const selected = new Set(answers[currentQuestion.id]?.selected_option_ids ?? []);
                    return (
                      <label key={opt.id} className="flex items-center gap-2 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={selected.has(opt.id)}
                          onChange={(e) => {
                            const next = new Set(selected);
                            if (e.target.checked) next.add(opt.id);
                            else next.delete(opt.id);
                            setAnswers((prev) => ({
                              ...prev,
                              [currentQuestion.id]: { selected_option_ids: Array.from(next) }
                            }));
                          }}
                        />
                        {opt.option_text}
                      </label>
                    );
                  })}
                </div>
              ) : null}

              {currentQuestion.question_type === "fill_blanks" ? (
                <div className="space-y-2">
                  {currentQuestion.blanks?.map((blank, idx) => (
                    <Input
                      key={blank.blank_position}
                      placeholder={`Blank ${idx + 1}`}
                      value={answers[currentQuestion.id]?.answers?.[idx] ?? ""}
                      onChange={(e) => {
                        const arr = [...(answers[currentQuestion.id]?.answers ?? [])];
                        arr[idx] = e.target.value;
                        setAnswers((prev) => ({ ...prev, [currentQuestion.id]: { answers: arr } }));
                      }}
                    />
                  ))}
                </div>
              ) : null}

              {currentQuestion.question_type === "subjective" ? (
                <textarea
                  className="w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                  rows={6}
                  value={answers[currentQuestion.id]?.answer_text ?? ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: { answer_text: e.target.value } }))}
                />
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setCurrent((c) => Math.max(0, c - 1))}>
          Previous
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={autoSave}>Save</Button>
          {current < questions.length - 1 ? (
            <Button onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))}>Next</Button>
          ) : (
            <Button onClick={submit}>Submit</Button>
          )}
        </div>
      </div>
    </div>
  );
}
