"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type StudentUser = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

type Batch = {
  id: string;
  name: string;
};

const createSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

type CreateValues = z.infer<typeof createSchema>;

const editSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email().optional(),
});

type EditValues = z.infer<typeof editSchema>;

const pageSize = 10;

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [query, setQuery] = useState("");
  const [batchFilter, setBatchFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StudentUser | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [bulkReport, setBulkReport] = useState<string | null>(null);

  const createForm = useForm<CreateValues>({ resolver: zodResolver(createSchema) });
  const editForm = useForm<EditValues>({ resolver: zodResolver(editSchema) });

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get("/users", { params: { role: "student" } });
      setStudents(response.data.users ?? []);
      setError(null);
    } catch (err) {
      const message =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to load students"
          : "Failed to load students";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const loadBatches = async () => {
    try {
      const response = await api.get("/batches");
      setBatches(response.data.batches ?? []);
    } catch {
      setBatches([]);
    }
  };

  useEffect(() => {
    loadStudents();
    loadBatches();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let list = students;
    if (needle) {
      list = list.filter(
        (student) =>
          student.full_name.toLowerCase().includes(needle) ||
          student.email.toLowerCase().includes(needle)
      );
    }
    if (batchFilter !== "all") {
      // Backend does not expose student-batch mapping yet.
      list = list;
    }
    return list;
  }, [students, query, batchFilter]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const onCreate = async (values: CreateValues) => {
    try {
      await api.post("/auth/student", values);
      setCreateOpen(false);
      createForm.reset();
      await loadStudents();
    } catch (err) {
      const message =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Create failed"
          : "Create failed";
      createForm.setError("root", { message });
    }
  };

  const onEdit = async (values: EditValues) => {
    if (!editTarget) return;
    try {
      await api.put(`/users/${editTarget.id}`, { fullName: values.fullName });
      setEditOpen(false);
      setEditTarget(null);
      await loadStudents();
    } catch (err) {
      const message =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Update failed"
          : "Update failed";
      editForm.setError("root", { message });
    }
  };

  const onDelete = async (studentId: string) => {
    try {
      await api.patch(`/users/${studentId}/status`, { isActive: false });
      await loadStudents();
    } catch (err) {
      const message =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Delete failed"
          : "Delete failed";
      setError(message);
    }
  };

  const onBulkUpload = async () => {
    if (!bulkFile) return;
    try {
      const formData = new FormData();
      formData.append("file", bulkFile);
      const response = await api.post("/students/bulk-upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setBulkReport(JSON.stringify(response.data, null, 2));
      await loadStudents();
    } catch (err) {
      const message =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Upload failed"
          : "Upload failed";
      setBulkReport(message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Students</p>
          <h2 className="mt-2 text-2xl font-semibold">Student Management</h2>
          <p className="mt-1 text-sm text-slate-400">Manage student accounts, uploads, and edits.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setBulkOpen(true)}>Bulk Upload</Button>
          <Button onClick={() => setCreateOpen(true)}>Add Student</Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3">
          <div className="min-w-[220px] flex-1">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              placeholder="Search by name or email"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="min-w-[200px]">
            <Label htmlFor="batch">Filter by Batch</Label>
            <select
              id="batch"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
              value={batchFilter}
              onChange={(event) => {
                setBatchFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="all">All batches</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">Batch filter needs student-batch mapping endpoint.</p>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        {error && <p className="px-4 pt-4 text-sm text-red-300">{error}</p>}
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Email</TH>
              <TH>Status</TH>
              <TH>Actions</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              <TR>
                <TD colSpan={4} className="py-8 text-center text-slate-400">
                  Loading students...
                </TD>
              </TR>
            ) : paged.length === 0 ? (
              <TR>
                <TD colSpan={4} className="py-8 text-center text-slate-400">
                  No students found.
                </TD>
              </TR>
            ) : (
              paged.map((student) => (
                <TR key={student.id}>
                  <TD className="font-semibold text-white">{student.full_name}</TD>
                  <TD>{student.email}</TD>
                  <TD>{student.is_active ? "Active" : "Inactive"}</TD>
                  <TD className="space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditTarget(student);
                        editForm.reset({ fullName: student.full_name, email: student.email });
                        setEditOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button variant="destructive" onClick={() => onDelete(student.id)}>
                      Delete
                    </Button>
                  </TD>
                </TR>
              ))
            )}
          </TBody>
        </Table>
        <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-400">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              Prev
            </Button>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogHeader>
          <DialogTitle>Add Student</DialogTitle>
          <DialogDescription>Create a student login.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={createForm.handleSubmit(onCreate)}>
          <div>
            <Label>Name</Label>
            <Input {...createForm.register("fullName")} placeholder="Student name" />
            {createForm.formState.errors.fullName && (
              <p className="text-xs text-red-300">{createForm.formState.errors.fullName.message}</p>
            )}
          </div>
          <div>
            <Label>Email</Label>
            <Input {...createForm.register("email")} placeholder="student@email.com" />
            {createForm.formState.errors.email && (
              <p className="text-xs text-red-300">{createForm.formState.errors.email.message}</p>
            )}
          </div>
          <div>
            <Label>Temporary Password</Label>
            <Input type="password" {...createForm.register("password")} placeholder="At least 6 chars" />
            {createForm.formState.errors.password && (
              <p className="text-xs text-red-300">{createForm.formState.errors.password.message}</p>
            )}
          </div>
          {createForm.formState.errors.root && (
            <p className="text-sm text-red-300">{createForm.formState.errors.root.message}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createForm.formState.isSubmitting}>
              {createForm.formState.isSubmitting ? "Saving..." : "Create"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>Update basic student details.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={editForm.handleSubmit(onEdit)}>
          <div>
            <Label>Name</Label>
            <Input {...editForm.register("fullName")} placeholder="Student name" />
            {editForm.formState.errors.fullName && (
              <p className="text-xs text-red-300">{editForm.formState.errors.fullName.message}</p>
            )}
          </div>
          <div>
            <Label>Email (read-only)</Label>
            <Input value={editTarget?.email ?? ""} readOnly />
          </div>
          {editForm.formState.errors.root && (
            <p className="text-sm text-red-300">{editForm.formState.errors.root.message}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={editForm.formState.isSubmitting}>
              {editForm.formState.isSubmitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogHeader>
          <DialogTitle>Bulk Upload</DialogTitle>
          <DialogDescription>Upload CSV or XLSX file of students.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(event) => setBulkFile(event.target.files?.[0] ?? null)}
            className="text-sm text-slate-300"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setBulkOpen(false)}>
              Close
            </Button>
            <Button onClick={onBulkUpload} disabled={!bulkFile}>
              Upload
            </Button>
          </div>
          {bulkReport && (
            <pre className="max-h-48 overflow-auto rounded-lg bg-black/40 p-3 text-xs text-slate-200">
              {bulkReport}
            </pre>
          )}
        </div>
      </Dialog>
    </div>
  );
}
