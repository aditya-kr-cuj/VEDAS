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

type Batch = {
  id: string;
  name: string;
  course_id: string;
  schedule: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
};

type Course = {
  id: string;
  name: string;
};

type StudentUser = {
  id: string;
  full_name: string;
  email: string;
};

type TeacherUser = {
  id: string;
  full_name: string;
  email: string;
};

type BatchTeacher = {
  teacherUserId: string;
  fullName: string;
  email: string;
  courseId: string | null;
  courseName: string | null;
};

type BatchStudent = {
  studentUserId: string;
  fullName: string;
  email: string;
  assignedAt: string;
};

const createSchema = z.object({
  name: z.string().min(2),
  courseId: z.string().uuid(),
  schedule: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type CreateValues = z.infer<typeof createSchema>;

const editSchema = z.object({
  name: z.string().min(2),
  schedule: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type EditValues = z.infer<typeof editSchema>;

const pageSize = 10;

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Batch | null>(null);
  const [assignStudentOpen, setAssignStudentOpen] = useState(false);
  const [assignTeacherOpen, setAssignTeacherOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [teacherList, setTeacherList] = useState<BatchTeacher[]>([]);
  const [studentList, setStudentList] = useState<BatchStudent[]>([]);

  const createForm = useForm<CreateValues>({ resolver: zodResolver(createSchema) });
  const editForm = useForm<EditValues>({ resolver: zodResolver(editSchema) });

  const loadBatches = async () => {
    setLoading(true);
    try {
      const response = await api.get("/batches");
      setBatches(response.data.batches ?? []);
      setError(null);
    } catch (err) {
      const message =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to load batches"
          : "Failed to load batches";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await api.get("/courses");
      setCourses(response.data.courses ?? []);
    } catch {
      setCourses([]);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await api.get("/users", { params: { role: "student" } });
      setStudents(response.data.users ?? []);
    } catch {
      setStudents([]);
    }
  };

  const loadTeachers = async () => {
    try {
      const response = await api.get("/users", { params: { role: "teacher" } });
      setTeachers(response.data.users ?? []);
    } catch {
      setTeachers([]);
    }
  };

  useEffect(() => {
    loadBatches();
    loadCourses();
    loadStudents();
    loadTeachers();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return batches;
    return batches.filter((batch) => batch.name.toLowerCase().includes(needle));
  }, [batches, query]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const onCreate = async (values: CreateValues) => {
    try {
      await api.post("/batches", values);
      setCreateOpen(false);
      createForm.reset();
      await loadBatches();
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
      await api.put(`/batches/${editTarget.id}`, values);
      setEditOpen(false);
      setEditTarget(null);
      await loadBatches();
    } catch (err) {
      const message =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Update failed"
          : "Update failed";
      editForm.setError("root", { message });
    }
  };

  const onAssignStudent = async () => {
    if (!selectedBatch || !selectedStudent) return;
    try {
      await api.post(`/batches/${selectedBatch.id}/assign-student`, {
        studentUserId: selectedStudent,
      });
      setAssignStudentOpen(false);
      setSelectedStudent("");
    } catch (err) {
      const message =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Assign failed"
          : "Assign failed";
      setError(message);
    }
  };

  const onAssignTeacher = async () => {
    if (!selectedBatch || !selectedTeacher) return;
    try {
      await api.post(`/batches/${selectedBatch.id}/assign-teacher`, {
        teacherUserId: selectedTeacher,
        courseId: selectedCourse || undefined,
      });
      setAssignTeacherOpen(false);
      setSelectedTeacher("");
      setSelectedCourse("");
    } catch (err) {
      const message =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Assign failed"
          : "Assign failed";
      setError(message);
    }
  };

  const openDetails = async (batch: Batch) => {
    setSelectedBatch(batch);
    setDetailsOpen(true);
    try {
      const [teacherRes, studentRes] = await Promise.all([
        api.get(`/batches/${batch.id}/teachers`),
        api.get(`/batches/${batch.id}/students`),
      ]);
      setTeacherList(teacherRes.data.teachers ?? []);
      setStudentList(studentRes.data.students ?? []);
    } catch {
      setTeacherList([]);
      setStudentList([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Batches</p>
          <h2 className="mt-2 text-2xl font-semibold">Batch Management</h2>
          <p className="mt-1 text-sm text-slate-400">Create batches and manage assignments.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setCreateOpen(true)}>Create Batch</Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="min-w-[220px]">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search by batch name"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        </div>
      </Card>

      <Card className="p-0">
        {error && <p className="px-4 pt-4 text-sm text-red-300">{error}</p>}
        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Course</TH>
              <TH>Status</TH>
              <TH>Actions</TH>
            </TR>
          </THead>
          <TBody>
            {loading ? (
              <TR>
                <TD colSpan={4} className="py-8 text-center text-slate-400">
                  Loading batches...
                </TD>
              </TR>
            ) : paged.length === 0 ? (
              <TR>
                <TD colSpan={4} className="py-8 text-center text-slate-400">
                  No batches found.
                </TD>
              </TR>
            ) : (
              paged.map((batch) => (
                <TR key={batch.id}>
                  <TD className="font-semibold text-white">{batch.name}</TD>
                  <TD>{courses.find((c) => c.id === batch.course_id)?.name ?? "—"}</TD>
                  <TD>{batch.is_active ? "Active" : "Inactive"}</TD>
                  <TD className="space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditTarget(batch);
                        editForm.reset({
                          name: batch.name,
                          schedule: batch.schedule ?? "",
                          startDate: batch.start_date ?? "",
                          endDate: batch.end_date ?? "",
                        });
                        setEditOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedBatch(batch);
                        setAssignStudentOpen(true);
                      }}
                    >
                      Assign Student
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedBatch(batch);
                        setAssignTeacherOpen(true);
                      }}
                    >
                      Assign Teacher
                    </Button>
                    <Button variant="outline" onClick={() => openDetails(batch)}>
                      View
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
          <DialogTitle>Create Batch</DialogTitle>
          <DialogDescription>Define a batch for a course.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={createForm.handleSubmit(onCreate)}>
          <div>
            <Label>Name</Label>
            <Input {...createForm.register("name")} placeholder="Batch name" />
            {createForm.formState.errors.name && (
              <p className="text-xs text-red-300">{createForm.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <Label>Course</Label>
            <select
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
              {...createForm.register("courseId")}
            >
              <option value="">Select course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
            {createForm.formState.errors.courseId && (
              <p className="text-xs text-red-300">{createForm.formState.errors.courseId.message}</p>
            )}
          </div>
          <div>
            <Label>Schedule</Label>
            <Input {...createForm.register("schedule")} placeholder="Mon/Wed/Fri - 6pm" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Start Date</Label>
              <Input type="date" {...createForm.register("startDate")} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" {...createForm.register("endDate")} />
            </div>
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
          <DialogTitle>Edit Batch</DialogTitle>
          <DialogDescription>Update batch details.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={editForm.handleSubmit(onEdit)}>
          <div>
            <Label>Name</Label>
            <Input {...editForm.register("name")} placeholder="Batch name" />
            {editForm.formState.errors.name && (
              <p className="text-xs text-red-300">{editForm.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <Label>Schedule</Label>
            <Input {...editForm.register("schedule")} placeholder="Mon/Wed/Fri - 6pm" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Start Date</Label>
              <Input type="date" {...editForm.register("startDate")} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" {...editForm.register("endDate")} />
            </div>
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

      <Dialog open={assignStudentOpen} onOpenChange={setAssignStudentOpen}>
        <DialogHeader>
          <DialogTitle>Assign Student</DialogTitle>
          <DialogDescription>Select a student for this batch.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Student</Label>
            <select
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
              value={selectedStudent}
              onChange={(event) => setSelectedStudent(event.target.value)}
            >
              <option value="">Select student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.full_name} ({student.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setAssignStudentOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onAssignStudent} disabled={!selectedStudent}>
              Assign
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={assignTeacherOpen} onOpenChange={setAssignTeacherOpen}>
        <DialogHeader>
          <DialogTitle>Assign Teacher</DialogTitle>
          <DialogDescription>Select a teacher and optional course.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Teacher</Label>
            <select
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
              value={selectedTeacher}
              onChange={(event) => setSelectedTeacher(event.target.value)}
            >
              <option value="">Select teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name} ({teacher.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label>Course (optional)</Label>
            <select
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
              value={selectedCourse}
              onChange={(event) => setSelectedCourse(event.target.value)}
            >
              <option value="">No course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setAssignTeacherOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onAssignTeacher} disabled={!selectedTeacher}>
              Assign
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogHeader>
          <DialogTitle>Batch Details</DialogTitle>
          <DialogDescription>Teachers assigned to this batch.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm text-slate-300">
          {selectedBatch && (
            <div>
              <p className="font-semibold text-white">{selectedBatch.name}</p>
              <p className="text-xs text-slate-400">
                {courses.find((c) => c.id === selectedBatch.course_id)?.name ?? "No course linked"}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs uppercase text-slate-400">Teachers</p>
            {teacherList.length === 0 ? (
              <p className="text-sm text-slate-400">No teachers assigned.</p>
            ) : (
              <ul className="space-y-2">
                {teacherList.map((teacher) => (
                  <li key={teacher.teacherUserId} className="rounded-lg border border-white/10 p-3">
                    <p className="font-semibold text-white">{teacher.fullName}</p>
                    <p className="text-xs text-slate-400">{teacher.email}</p>
                    <p className="text-xs text-slate-400">
                      Course: {teacher.courseName ?? "Not specified"}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-xs uppercase text-slate-400">Students</p>
            {studentList.length === 0 ? (
              <p className="text-sm text-slate-400">No students assigned.</p>
            ) : (
              <ul className="space-y-2">
                {studentList.map((student) => (
                  <li key={student.studentUserId} className="rounded-lg border border-white/10 p-3">
                    <p className="font-semibold text-white">{student.fullName}</p>
                    <p className="text-xs text-slate-400">{student.email}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
