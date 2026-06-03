"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Course = {
  id: string;
  name: string;
  description: string | null;
  subject_code: string | null;
  is_active: boolean;
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const response = await api.get("/courses");
      setCourses(response.data.courses ?? []);
    } catch {
      setError("Could not load courses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const resetForm = () => {
    setName("");
    setSubjectCode("");
    setDescription("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (name.trim().length < 2) {
      setError("Course name must be at least 2 characters.");
      return;
    }

    if (subjectCode.trim().length < 2) {
      setError("Course code is required.");
      return;
    }

    setSaving(true);
    try {
      await api.post("/courses", {
        name: name.trim(),
        subjectCode: subjectCode.trim(),
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      setMessage("Course added successfully.");
      resetForm();
      setDialogOpen(false);
      await loadCourses();
    } catch (err: unknown) {
      const apiMessage =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      setError(apiMessage ?? "Could not add course.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Courses</h2>
          <p className="mt-2 text-sm text-slate-400">Create and manage courses here.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>Add Course</Button>
      </div>

      {message && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <Card>
            <CardContent className="py-8 text-sm text-slate-400">Loading courses...</CardContent>
          </Card>
        ) : courses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-sm text-slate-400">No courses yet.</CardContent>
          </Card>
        ) : (
          courses.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <CardTitle>{course.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-mono text-sm text-[#86e3ce]">{course.subject_code ?? "No code"}</p>
                {course.description && <p className="text-sm text-slate-400">{course.description}</p>}
                <p className="text-xs text-slate-500">{course.is_active ? "Active" : "Inactive"}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-950 p-6 shadow-2xl">
            <div className="mb-5">
              <h3 className="text-xl font-semibold">Add Course</h3>
              <p className="mt-1 text-sm text-slate-400">Create a course for this institute.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="course-name">Course Name</Label>
                <Input
                  id="course-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Mathematics"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-code">Course Code</Label>
                <Input
                  id="course-code"
                  value={subjectCode}
                  onChange={(event) => setSubjectCode(event.target.value)}
                  placeholder="MATH-101"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-description">Description</Label>
                <Input
                  id="course-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="JEE Mathematics"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Course"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
