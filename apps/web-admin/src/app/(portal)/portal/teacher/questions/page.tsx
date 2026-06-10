"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

type QuestionType = "mcq" | "true_false" | "subjective" | "fill_blanks";
type Option = { option_text: string; is_correct: boolean };

const blankForm = {
  question_text: "",
  question_type: "mcq" as QuestionType,
  course_id: "",
  topic: "",
  difficulty_level: "medium",
  marks: 1,
  options: [
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
  ] as Option[],
  correct_answer: "",
  explanation: "",
};

export default function TeacherQuestionsPage() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(blankForm);

  const loadQuestions = async () => {
    const res = await api.get("/questions");
    setQuestions(res.data.questions ?? res.data.data ?? []);
  };

  useEffect(() => {
    Promise.all([api.get("/questions"), api.get("/courses")])
      .then(([questionRes, courseRes]) => {
        setQuestions(questionRes.data.questions ?? questionRes.data.data ?? []);
        setCourses(courseRes.data.courses ?? courseRes.data.data ?? []);
      })
      .catch(() => toast.error("Failed to load question bank"))
      .finally(() => setLoading(false));
  }, []);

  const submit = async () => {
    if (!form.question_text.trim() || !form.course_id) {
      toast.error("Question text and course are required");
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = {
        question_text: form.question_text,
        question_type: form.question_type,
        course_id: form.course_id,
        topic: form.topic || undefined,
        difficulty_level: form.difficulty_level,
        marks: form.marks,
        explanation: form.explanation || undefined,
      };

      if (form.question_type === "mcq") {
        payload.options = form.options.filter((option) => option.option_text.trim());
      }
      if (form.question_type === "true_false") {
        payload.options = [
          { option_text: "True", is_correct: form.correct_answer === "true" },
          { option_text: "False", is_correct: form.correct_answer === "false" },
        ];
      }
      if (form.question_type === "fill_blanks") {
        payload.blanks = [{ blank_position: 1, correct_answer: form.correct_answer }];
      }

      await api.post("/questions", payload);
      toast.success("Question added");
      setShowForm(false);
      setForm(blankForm);
      await loadQuestions();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Failed to add question");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this question?")) return;
    try {
      await api.delete(`/questions/${id}`);
      setQuestions((prev) => prev.filter((question) => question.id !== id));
      toast.success("Question deleted");
    } catch {
      toast.error("Failed to delete question");
    }
  };

  const difficultyClass: Record<string, string> = {
    easy: "bg-teal-500/10 text-teal-300",
    medium: "bg-amber-500/10 text-amber-300",
    hard: "bg-red-500/10 text-red-300",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Question Bank</h1>
          <p className="mt-1 text-sm text-slate-400">Create and manage your questions.</p>
        </div>
        <button onClick={() => setShowForm((value) => !value)} className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-teal-400">
          Add Question
        </button>
      </div>

      {showForm && (
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="font-semibold text-white">New Question</h2>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {[
              ["mcq", "MCQ"],
              ["true_false", "True/False"],
              ["subjective", "Subjective"],
              ["fill_blanks", "Fill Blanks"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setForm((prev) => ({ ...prev, question_type: value as QuestionType }))}
                className={`rounded-lg border py-2 text-sm font-medium transition ${
                  form.question_type === value ? "border-teal-500/30 bg-teal-500/20 text-teal-300" : "border-slate-700 text-slate-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <select value={form.course_id} onChange={(event) => setForm((prev) => ({ ...prev, course_id: event.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white">
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
          <textarea value={form.question_text} onChange={(event) => setForm((prev) => ({ ...prev, question_text: event.target.value }))} rows={3} placeholder="Enter your question" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
          <div className="grid gap-3 md:grid-cols-3">
            <input value={form.topic} onChange={(event) => setForm((prev) => ({ ...prev, topic: event.target.value }))} placeholder="Topic" className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
            <select value={form.difficulty_level} onChange={(event) => setForm((prev) => ({ ...prev, difficulty_level: event.target.value }))} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <input type="number" min={1} value={form.marks} onChange={(event) => setForm((prev) => ({ ...prev, marks: Number(event.target.value) || 1 }))} className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white" />
          </div>
          {form.question_type === "mcq" && (
            <div className="space-y-2">
              {form.options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <button
                    onClick={() => setForm((prev) => ({ ...prev, options: prev.options.map((item, itemIndex) => ({ ...item, is_correct: itemIndex === index })) }))}
                    className={`h-6 w-6 rounded-full border-2 ${option.is_correct ? "border-teal-500 bg-teal-500" : "border-slate-600"}`}
                    aria-label={`Mark option ${index + 1} correct`}
                  />
                  <input value={option.option_text} onChange={(event) => setForm((prev) => ({ ...prev, options: prev.options.map((item, itemIndex) => (itemIndex === index ? { ...item, option_text: event.target.value } : item)) }))} placeholder={`Option ${index + 1}`} className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
                </div>
              ))}
            </div>
          )}
          {form.question_type === "true_false" && (
            <div className="grid grid-cols-2 gap-2">
              {["true", "false"].map((value) => (
                <button key={value} onClick={() => setForm((prev) => ({ ...prev, correct_answer: value }))} className={`rounded-lg border py-2 text-sm capitalize ${form.correct_answer === value ? "border-teal-500/30 bg-teal-500/20 text-teal-300" : "border-slate-700 text-slate-400"}`}>
                  {value}
                </button>
              ))}
            </div>
          )}
          {form.question_type === "fill_blanks" && <input value={form.correct_answer} onChange={(event) => setForm((prev) => ({ ...prev, correct_answer: event.target.value }))} placeholder="Correct answer" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500" />}
          <textarea value={form.explanation} onChange={(event) => setForm((prev) => ({ ...prev, explanation: event.target.value }))} rows={2} placeholder="Explanation" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
          <div className="flex gap-3">
            <button onClick={submit} disabled={submitting} className="flex-1 rounded-lg bg-teal-500 py-2 text-sm font-medium text-slate-950 hover:bg-teal-400 disabled:opacity-50">
              {submitting ? "Saving..." : "Save Question"}
            </button>
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-slate-700 px-6 py-2 text-sm text-slate-400">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
        </div>
      ) : questions.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center text-sm text-slate-500">No questions yet.</div>
      ) : (
        <div className="space-y-3">
          {questions.map((question) => (
            <div key={question.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-white">{question.question_text}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs capitalize text-slate-400">{question.question_type?.replace("_", " ")}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs capitalize ${difficultyClass[question.difficulty_level] ?? "bg-slate-800 text-slate-400"}`}>{question.difficulty_level}</span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">{question.marks} marks</span>
                  </div>
                </div>
                <button onClick={() => remove(question.id)} className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:text-red-300">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
