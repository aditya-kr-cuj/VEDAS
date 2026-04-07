"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaterialCard, Material } from "@/components/material-card";

type Course = { id: string; name: string };
type Student = { id: string; full_name: string; email: string };

export default function MaterialUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [topic, setTopic] = useState("");
  const [tags, setTags] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Record<string, boolean>>({});
  const [courses, setCourses] = useState<Course[]>([]);
  const [batches, setBatches] = useState<Array<{ id: string; name: string }>>([]);
  const [progress, setProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [recentMaterials, setRecentMaterials] = useState<Material[]>([]);

  useEffect(() => {
    api.get("/courses").then((res) => setCourses(res.data.courses ?? [])).catch(() => setCourses([]));
    api.get("/users", { params: { role: "student" } })
      .then((res) => setStudents(res.data.users ?? []))
      .catch(() => setStudents([]));
  }, []);

  useEffect(() => {
    if (!courseId) {
      setBatches([]);
      setBatchId("");
      return;
    }
    api
      .get("/batches", { params: { course_id: courseId } })
      .then((res) => setBatches(res.data.batches ?? []))
      .catch(() => setBatches([]));
  }, [courseId]);

  const selectedStudentIds = useMemo(
    () => Object.entries(selectedStudents).filter(([, value]) => value).map(([id]) => id),
    [selectedStudents]
  );

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  };

  const upload = async () => {
    if (!file || !title || !courseId) {
      setUploadStatus("File, title, and course are required.");
      return;
    }

    const form = new FormData();
    form.append("file", file);
    form.append("title", title);
    if (description) form.append("description", description);
    form.append("course_id", courseId);
    if (batchId) form.append("batch_id", batchId);
    if (topic) form.append("topic", topic);
    if (tags) form.append("tags", tags);
    form.append("is_public", String(isPublic));

    try {
      setUploadStatus(null);
      const response = await api.post("/materials/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (!event.total) return;
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      });

      if (!isPublic && selectedStudentIds.length > 0) {
        await api.post(`/materials/${response.data.material.id}/access`, {
          studentIds: selectedStudentIds
        });
      }

      setUploadStatus("Upload successful.");
      setFile(null);
      setTitle("");
      setDescription("");
      setTopic("");
      setTags("");
      setBatchId("");
      setSelectedStudents({});
      setProgress(0);

      const recent = await api.get("/materials", { params: { page: 1, limit: 5 } });
      setRecentMaterials(recent.data.materials ?? []);
    } catch {
      setUploadStatus("Upload failed. Please check inputs and try again.");
    }
  };

  useEffect(() => {
    api.get("/materials", { params: { page: 1, limit: 5 } })
      .then((res) => setRecentMaterials(res.data.materials ?? []))
      .catch(() => setRecentMaterials([]));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Upload Study Material</h2>
        <p className="text-sm text-slate-400">Add PDFs, videos, images, and documents for your courses.</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div
            className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 text-sm text-slate-300"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            onClick={() => document.getElementById("material-file")?.click()}
          >
            <p>{file ? file.name : "Drag & drop a file here or click to select"}</p>
            <p className="mt-2 text-xs text-slate-500">Max 100MB for videos, 10MB for PDFs/docs/images</p>
          </div>
          <input
            id="material-file"
            type="file"
            className="hidden"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>
            <div>
              <Label>Topic</Label>
              <Input value={topic} onChange={(event) => setTopic(event.target.value)} />
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
                <option value="">All batches</option>
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <textarea
                className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200"
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Tags (comma separated)</Label>
              <Input value={tags} onChange={(event) => setTags(event.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={isPublic} onChange={() => setIsPublic((prev) => !prev)} />
              Public to students in course/batch
            </label>
          </div>

          {!isPublic && (
            <div className="rounded-xl border border-white/10 p-4">
              <p className="text-sm text-slate-200">Select students who can access this material.</p>
              <div className="mt-3 grid max-h-48 gap-2 overflow-y-auto">
                {students.map((student) => (
                  <label key={student.id} className="flex items-center gap-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedStudents[student.id])}
                      onChange={(event) =>
                        setSelectedStudents((prev) => ({ ...prev, [student.id]: event.target.checked }))
                      }
                    />
                    {student.full_name} ({student.email})
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {progress > 0 && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full bg-emerald-500" style={{ width: `${progress}%` }} />
              </div>
            )}
            {uploadStatus && <p className="text-xs text-slate-400">{uploadStatus}</p>}
            <Button onClick={upload}>Upload Material</Button>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-lg font-semibold text-white">Recently Uploaded</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recentMaterials.map((material) => (
            <MaterialCard key={material.id} material={material} onDownload={async () => {
              const res = await api.post(`/materials/${material.id}/download`);
              window.open(res.data.url, "_blank");
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
