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
import { AvailabilityGrid } from "@/components/availability-grid";

type TeacherUser = {
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

type Course = {
  id: string;
  name: string;
};

type TimeSlot = {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  slot_number: number;
};

type Availability = {
  id: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
  reason: string | null;
};

const createSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

type CreateValues = z.infer<typeof createSchema>;

const editSchema = z.object({
  fullName: z.string().min(2),
});

type EditValues = z.infer<typeof editSchema>;

const pageSize = 10;

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TeacherUser | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTeacherId, setAssignTeacherId] = useState<string | null>(null);
  const [assignBatchId, setAssignBatchId] = useState<string>("");
  const [assignCourseId, setAssignCourseId] = useState<string>("");
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [availabilityTeacherId, setAvailabilityTeacherId] = useState<string | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [availability, setAvailability] = useState<Availability[]>([]);

  const createForm = useForm<CreateValues>({ resolver: zodResolver(createSchema) });
  const editForm = useForm<EditValues>({ resolver: zodResolver(editSchema) });

  const loadTeachers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/users", { params: { role: "teacher" } });
      setTeachers(response.data.users ?? []);
      setError(null);
    } catch (err) {
      const message =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to load teachers"
          : "Failed to load teachers";
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

  const loadCourses = async () => {
    try {
      const response = await api.get("/courses");
      setCourses(response.data.courses ?? []);
    } catch {
      setCourses([]);
    }
  };

  const loadTimeSlots = async () => {
    try {
      const response = await api.get("/time-slots");
      setTimeSlots(response.data.slots ?? []);
    } catch {
      setTimeSlots([]);
    }
  };

  useEffect(() => {
    loadTeachers();
    loadBatches();
    loadCourses();
    loadTimeSlots();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return teachers;
    return teachers.filter(
      (teacher) =>
        teacher.full_name.toLowerCase().includes(needle) ||
        teacher.email.toLowerCase().includes(needle)
    );
  }, [teachers, query]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const onCreate = async (values: CreateValues) => {
    try {
      await api.post("/auth/teacher", values);
      setCreateOpen(false);
      createForm.reset();
      await loadTeachers();
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
      await loadTeachers();
    } catch (err) {
      const message =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Update failed"
          : "Update failed";
      editForm.setError("root", { message });
    }
  };

  const onDelete = async (teacherId: string) => {
    try {
      await api.patch(`/users/${teacherId}/status`, { isActive: false });
      await loadTeachers();
    } catch (err) {
      const message =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Delete failed"
          : "Delete failed";
      setError(message);
    }
  };

  const onAssign = async () => {
    if (!assignTeacherId || !assignBatchId) return;
    try {
      await api.post(`/batches/${assignBatchId}/assign-teacher`, {
        teacherUserId: assignTeacherId,
        courseId: assignCourseId || undefined,
      });
      setAssignOpen(false);
      setAssignTeacherId(null);
      setAssignBatchId("");
      setAssignCourseId("");
    } catch (err) {
      const message =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Assignment failed"
          : "Assignment failed";
      setError(message);
    }
  };

  const openAvailability = async (teacherId: string) => {
    setAvailabilityTeacherId(teacherId);
    setAvailabilityOpen(true);
    try {
      const response = await api.get(`/teachers/${teacherId}/availability`);
      setAvailability(response.data.availability ?? []);
    } catch {
      setAvailability([]);
    }
  };

  const markUnavailable = async (slot: TimeSlot, reason: string) => {
    if (!availabilityTeacherId) return;
    await api.post(`/teachers/${availabilityTeacherId}/availability`, {
      dayOfWeek: slot.day_of_week,
      startTime: slot.start_time,
      endTime: slot.end_time,
      isAvailable: false,
      reason: reason || undefined,
    });
    const res = await api.get(`/teachers/${availabilityTeacherId}/availability`);
    setAvailability(res.data.availability ?? []);
  };

  const markAvailable = async (availabilityId: string) => {
    if (!availabilityTeacherId) return;
    await api.delete(`/teachers/${availabilityTeacherId}/availability/${availabilityId}`);
    const res = await api.get(`/teachers/${availabilityTeacherId}/availability`);
    setAvailability(res.data.availability ?? []);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Teachers</p>
          <h2 className="mt-2 text-2xl font-semibold">Teacher Management</h2>
          <p className="mt-1 text-sm text-slate-400">Manage teacher accounts and batch assignments.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setCreateOpen(true)}>Add Teacher</Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="min-w-[220px]">
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
                  Loading teachers...
                </TD>
              </TR>
            ) : paged.length === 0 ? (
              <TR>
                <TD colSpan={4} className="py-8 text-center text-slate-400">
                  No teachers found.
                </TD>
              </TR>
            ) : (
              paged.map((teacher) => (
                <TR key={teacher.id}>
                  <TD className="font-semibold text-white">{teacher.full_name}</TD>
                  <TD>{teacher.email}</TD>
                  <TD>{teacher.is_active ? "Active" : "Inactive"}</TD>
                  <TD className="space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditTarget(teacher);
                        editForm.reset({ fullName: teacher.full_name });
                        setEditOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setAssignTeacherId(teacher.id);
                        setAssignOpen(true);
                      }}
                    >
                      Assign Batch
                    </Button>
                    <Button variant="outline" onClick={() => openAvailability(teacher.id)}>
                      Availability
                    </Button>
                    <Button variant="destructive" onClick={() => onDelete(teacher.id)}>
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
          <DialogTitle>Add Teacher</DialogTitle>
          <DialogDescription>Create a teacher login.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={createForm.handleSubmit(onCreate)}>
          <div>
            <Label>Name</Label>
            <Input {...createForm.register("fullName")} placeholder="Teacher name" />
            {createForm.formState.errors.fullName && (
              <p className="text-xs text-red-300">{createForm.formState.errors.fullName.message}</p>
            )}
          </div>
          <div>
            <Label>Email</Label>
            <Input {...createForm.register("email")} placeholder="teacher@email.com" />
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
          <DialogTitle>Edit Teacher</DialogTitle>
          <DialogDescription>Update teacher details.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={editForm.handleSubmit(onEdit)}>
          <div>
            <Label>Name</Label>
            <Input {...editForm.register("fullName")} placeholder="Teacher name" />
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

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogHeader>
          <DialogTitle>Assign Teacher to Batch</DialogTitle>
          <DialogDescription>Select batch and optional course.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Batch</Label>
            <select
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
              value={assignBatchId}
              onChange={(event) => setAssignBatchId(event.target.value)}
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
            <Label>Course (optional)</Label>
            <select
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100"
              value={assignCourseId}
              onChange={(event) => setAssignCourseId(event.target.value)}
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
            <Button variant="ghost" type="button" onClick={() => setAssignOpen(false)}>
              Cancel
            </Button>
            <Button onClick={onAssign} disabled={!assignBatchId}>
              Assign
            </Button>
          </div>
        </div>
      </Dialog>

      <Dialog open={availabilityOpen} onOpenChange={setAvailabilityOpen}>
        <DialogHeader>
          <DialogTitle>Teacher Availability</DialogTitle>
          <DialogDescription>Manage weekly availability slots.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <AvailabilityGrid
            timeSlots={timeSlots}
            availability={availability}
            onMarkUnavailable={markUnavailable}
            onMarkAvailable={markAvailable}
          />
        </div>
      </Dialog>
    </div>
  );
}
