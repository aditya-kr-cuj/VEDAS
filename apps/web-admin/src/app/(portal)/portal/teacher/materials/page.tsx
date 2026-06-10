"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

export default function TeacherMaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    course_id: "",
    is_public: true,
  });

  const loadMaterials = async () => {
    const res = await api.get("/materials");
    setMaterials(res.data.materials ?? res.data.data ?? []);
  };

  useEffect(() => {
    Promise.all([api.get("/materials"), api.get("/courses")])
      .then(([materialRes, courseRes]) => {
        setMaterials(materialRes.data.materials ?? materialRes.data.data ?? []);
        setCourses(courseRes.data.courses ?? courseRes.data.data ?? []);
      })
      .catch(() => toast.error("Failed to load materials"))
      .finally(() => setLoading(false));
  }, []);

  const upload = async () => {
    if (!form.title.trim() || !form.course_id || !file) {
      toast.error("Title, course, and file are required");
      return;
    }
    setUploading(true);
    try {
      const data = new FormData();
      data.append("title", form.title);
      data.append("description", form.description);
      data.append("course_id", form.course_id);
      data.append("is_public", String(form.is_public));
      data.append("file", file);
      await api.post("/materials/upload", data, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Material uploaded");
      setShowForm(false);
      setFile(null);
      setForm({ title: "", description: "", course_id: "", is_public: true });
      await loadMaterials();
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Delete this material?")) return;
    try {
      await api.delete(`/materials/${id}`);
      setMaterials((prev) => prev.filter((material) => material.id !== id));
      toast.success("Material deleted");
    } catch {
      toast.error("Failed to delete material");
    }
  };

  const fileLabel = (type?: string) => {
    if (type?.includes("pdf")) return "PDF";
    if (type?.includes("video")) return "Video";
    if (type?.includes("image")) return "Image";
    return "File";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Study Materials</h1>
          <p className="mt-1 text-sm text-slate-400">Upload and manage files for your courses.</p>
        </div>
        <button onClick={() => setShowForm((value) => !value)} className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-teal-400">
          Upload Material
        </button>
      </div>

      {showForm && (
        <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="font-semibold text-white">Upload Material</h2>
          <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Title" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
          <select value={form.course_id} onChange={(event) => setForm((prev) => ({ ...prev, course_id: event.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white">
            <option value="">Select course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>
          <textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} rows={2} placeholder="Description" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500" />
          <input type="file" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="text-sm text-slate-400" />
          <div className="flex gap-3">
            <button onClick={upload} disabled={uploading} className="flex-1 rounded-lg bg-teal-500 py-2 text-sm font-medium text-slate-950 hover:bg-teal-400 disabled:opacity-50">
              {uploading ? "Uploading..." : "Upload"}
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
      ) : materials.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center text-sm text-slate-500">No materials uploaded yet.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {materials.map((material) => (
            <div key={material.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="mb-3 flex items-start justify-between">
                <span className="rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-400">{fileLabel(material.file_type)}</span>
                <button onClick={() => remove(material.id)} className="text-xs text-slate-500 hover:text-red-300">
                  Delete
                </button>
              </div>
              <h3 className="text-sm font-medium text-white">{material.title}</h3>
              {material.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{material.description}</p>}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500">{material.download_count ?? 0} downloads</span>
                {(material.download_url || material.file_url) && (
                  <a href={material.download_url ?? material.file_url} target="_blank" className="text-xs text-teal-300 hover:text-teal-200">
                    View
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
