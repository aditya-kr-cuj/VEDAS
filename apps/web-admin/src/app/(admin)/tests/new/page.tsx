"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Course = { id: string; name: string };
type Batch = { id: string; name: string };
type Question = {
  id: string;
  question_text: string;
  question_type: string;
  difficulty_level: string;
  marks: string;
};

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function TestBuilderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const [step, setStep] = useState(1);
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [courseId, setCourseId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(30);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [allowReview, setAllowReview] = useState(true);
  const [negativeMarking, setNegativeMarking] = useState(0);
  const [status, setStatus] = useState<string | null>(null);

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([id]) => id),
    [selected]
  );

  useEffect(() => {
    api.get("/courses").then((res) => setCourses(res.data.courses ?? [])).catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    if (!courseId) return;
    api.get("/batches").then((res) => setBatches(res.data.batches ?? [])).catch(() => setBatches([]));
    api.get("/questions", { params: { course_id: courseId } })
      .then((res) => setQuestions(res.data.questions ?? []))
      .catch(() => setQuestions([]));
  }, [courseId]);

  useEffect(() => {
    if (!editId) return;
    api.get(`/tests/${editId}`).then((res) => {
      const test = res.data.test;
      setTitle(test.title);
      setDescription(test.description ?? "");
      setCourseId(test.course_id);
      setBatchId(test.batch_id);
      setDuration(test.duration_minutes);
      setStartTime(test.start_time ? test.start_time.slice(0, 16) : "");
      setEndTime(test.end_time ? test.end_time.slice(0, 16) : "");
      setShuffleQuestions(test.shuffle_questions);
      setShuffleOptions(test.shuffle_options);
      setAllowReview(test.allow_review);
      setNegativeMarking(Number(test.negative_marking ?? 0));
      const selectedMap: Record<string, boolean> = {};
      (res.data.questions ?? []).forEach((q: any) => {
        selectedMap[q.question_id] = true;
      });
      setSelected(selectedMap);
    });
  }, [editId]);

  const autoPick = (easy: number, medium: number, hard: number) => {
    const easyQs = questions.filter((q) => q.difficulty_level === "easy").slice(0, easy);
    const medQs = questions.filter((q) => q.difficulty_level === "medium").slice(0, medium);
    const hardQs = questions.filter((q) => q.difficulty_level === "hard").slice(0, hard);
    const combined = [...easyQs, ...medQs, ...hardQs];
    const next: Record<string, boolean> = {};
    combined.forEach((q) => (next[q.id] = true));
    setSelected(next);
  };

  const save = async () => {
    const payload = {
      title,
      description,
      course_id: courseId,
      batch_id: batchId,
      duration_minutes: duration,
      start_time: startTime ? new Date(startTime).toISOString() : undefined,
      end_time: endTime ? new Date(endTime).toISOString() : undefined,
      question_ids: selectedIds,
      shuffle_questions: shuffleQuestions,
      shuffle_options: shuffleOptions,
      allow_review: allowReview,
      negative_marking: negativeMarking
    };
    try {
      if (editId) {
        await api.put(`/tests/${editId}`, payload);
      } else {
        await api.post("/tests", payload);
      }
      router.push("/tests");
    } catch {
      setStatus("Failed to save test.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">{editId ? "Edit Test" : "Create Test"}</h2>
        <p className="text-sm text-slate-400">Build and schedule assessments.</p>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className={step === 1 ? "text-white" : ""}>1. Details</span>
        <span>→</span>
        <span className={step === 2 ? "text-white" : ""}>2. Questions</span>
        <span>→</span>
        <span className={step === 3 ? "text-white" : ""}>3. Settings</span>
        <span>→</span>
        <span className={step === 4 ? "text-white" : ""}>4. Preview</span>
      </div>

      {step === 1 && (
        <Card>
          <CardContent className="grid gap-4 p-6 md:grid-cols-2">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Course</Label>
              <select
                className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
              >
                <option value="">Select course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Batch</Label>
              <select
                className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                value={batchId}
                onChange={(event) => setBatchId(event.target.value)}
              >
                <option value="">Select batch</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
            </div>
            <div>
              <Label>Start Time</Label>
              <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div>
              <Label>End Time</Label>
              <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <textarea
                className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
              <Button size="sm" variant="outline" onClick={() => autoPick(10, 5, 5)}>
                Auto-pick 10E / 5M / 5H
              </Button>
              <span>Selected {selectedIds.length}</span>
            </div>
            <div className="space-y-2">
              {questions.map((q) => (
                <label key={q.id} className="flex items-start gap-3 rounded-lg border border-white/10 p-3">
                  <input
                    type="checkbox"
                    checked={Boolean(selected[q.id])}
                    onChange={(e) => setSelected((prev) => ({ ...prev, [q.id]: e.target.checked }))}
                  />
                  <div>
                    <p className="text-sm text-slate-200">{stripHtml(q.question_text)}</p>
                    <p className="text-xs text-slate-400">
                      {q.question_type} • {q.difficulty_level} • {q.marks} marks
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardContent className="space-y-3 p-6 text-sm text-slate-300">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={shuffleQuestions} onChange={() => setShuffleQuestions((v) => !v)} />
              Shuffle questions
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={shuffleOptions} onChange={() => setShuffleOptions((v) => !v)} />
              Shuffle options
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={allowReview} onChange={() => setAllowReview((v) => !v)} />
              Allow review after submit
            </label>
            <div>
              <Label>Negative marking (per wrong)</Label>
              <Input type="number" value={negativeMarking} onChange={(e) => setNegativeMarking(Number(e.target.value))} />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardContent className="space-y-3 p-6 text-sm text-slate-300">
            <p>
              <strong>{title}</strong> • {selectedIds.length} questions • {duration} mins
            </p>
            <p>{description}</p>
            <p>Start: {startTime || "Not set"} | End: {endTime || "Not set"}</p>
          </CardContent>
        </Card>
      )}

      {status && <p className="text-xs text-slate-400">{status}</p>}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))}>
          Back
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep((s) => Math.min(4, s + 1))}>Next</Button>
        ) : (
          <Button onClick={save}>{editId ? "Save Changes" : "Create Test"}</Button>
        )}
      </div>
    </div>
  );
}
