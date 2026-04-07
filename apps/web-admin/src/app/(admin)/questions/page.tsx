"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Course = { id: string; name: string };
type Question = {
  id: string;
  course_id: string;
  topic: string | null;
  question_text: string;
  question_type: string;
  difficulty_level: string;
  marks: string;
};

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState("");
  const [type, setType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.get("/courses").then((res) => setCourses(res.data.courses ?? [])).catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    const params: Record<string, string | number> = { page, limit: 25 };
    if (courseId) params.course_id = courseId;
    if (type) params.question_type = type;
    if (difficulty) params.difficulty_level = difficulty;
    if (search) params.search = search;

    api
      .get("/questions", { params })
      .then((res) => setQuestions(res.data.questions ?? []))
      .catch(() => setQuestions([]));
  }, [courseId, type, difficulty, search, page]);

  const bulkImport = async (file: File) => {
    const form = new FormData();
    form.append("file", file);
    await api.post("/questions/bulk-import", form, { headers: { "Content-Type": "multipart/form-data" } });
    const res = await api.get("/questions", { params: { page: 1, limit: 25 } });
    setQuestions(res.data.questions ?? []);
  };

  const deleteQuestion = async (id: string) => {
    await api.delete(`/questions/${id}`);
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Question Bank</h2>
          <p className="text-sm text-slate-400">Manage and organize questions for exams.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-300">
            <input
              type="file"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) bulkImport(file);
              }}
            />
            <span className="rounded-md border border-white/10 px-3 py-2 text-xs hover:bg-white/5">Bulk Import</span>
          </label>
          <Link href="/questions/new">
            <Button>Add Question</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardContent className="grid gap-4 p-4 md:grid-cols-4">
          <Input placeholder="Search question text" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select
            className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200"
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
          >
            <option value="">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200"
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="">All Types</option>
            <option value="mcq">MCQ</option>
            <option value="true_false">True/False</option>
            <option value="subjective">Subjective</option>
            <option value="fill_blanks">Fill in the Blanks</option>
            <option value="multi_select">Multi-select</option>
          </select>
          <select
            className="rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200"
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead />
                <TableHead>Question</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={Boolean(selected[question.id])}
                      onChange={(event) =>
                        setSelected((prev) => ({ ...prev, [question.id]: event.target.checked }))
                      }
                    />
                  </TableCell>
                  <TableCell className="max-w-[420px]">
                    <div className="line-clamp-2 text-sm text-slate-200">
                      {stripHtml(question.question_text)}
                    </div>
                    <div className="text-xs text-slate-400">{question.topic ?? "No topic"}</div>
                  </TableCell>
                  <TableCell className="text-xs uppercase text-slate-300">{question.question_type}</TableCell>
                  <TableCell>{question.marks}</TableCell>
                  <TableCell className="capitalize">{question.difficulty_level}</TableCell>
                  <TableCell className="space-x-2">
                    <Link href={`/questions/new?id=${question.id}`} className="text-xs text-blue-300">
                      Edit
                    </Link>
                    <button className="text-xs text-red-300" onClick={() => deleteQuestion(question.id)}>
                      Delete
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))}>
          Previous
        </Button>
        <span className="text-xs text-slate-400">Page {page}</span>
        <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
