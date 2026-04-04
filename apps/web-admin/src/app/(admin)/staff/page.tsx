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

type StaffUser = {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
};

const createSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
});

const editSchema = z.object({
  fullName: z.string().min(3),
});

type CreateValues = z.infer<typeof createSchema>;
type EditValues = z.infer<typeof editSchema>;

const pageSize = 10;

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffUser | null>(null);

  const createForm = useForm<CreateValues>({ resolver: zodResolver(createSchema) });
  const editForm = useForm<EditValues>({ resolver: zodResolver(editSchema) });

  const loadStaff = async () => {
    setLoading(true);
    try {
      const response = await api.get("/staff");
      setStaff(response.data.staff ?? []);
      setError(null);
    } catch (err) {
      const message =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to load staff"
          : "Failed to load staff";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return staff;
    return staff.filter(
      (member) =>
        member.full_name.toLowerCase().includes(needle) ||
        member.email.toLowerCase().includes(needle)
    );
  }, [staff, query]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  const onCreate = async (values: CreateValues) => {
    try {
      await api.post("/staff", values);
      setCreateOpen(false);
      createForm.reset();
      await loadStaff();
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
      await api.put(`/staff/${editTarget.id}`, { fullName: values.fullName });
      setEditOpen(false);
      setEditTarget(null);
      await loadStaff();
    } catch (err) {
      const message =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Update failed"
          : "Update failed";
      editForm.setError("root", { message });
    }
  };

  const onDelete = async (staffId: string) => {
    try {
      await api.delete(`/staff/${staffId}`);
      await loadStaff();
    } catch (err) {
      const message =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Delete failed"
          : "Delete failed";
      setError(message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Staff</p>
          <h2 className="mt-2 text-2xl font-semibold">Staff Management</h2>
          <p className="mt-1 text-sm text-slate-400">Manage staff members and access.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setCreateOpen(true)}>Add Staff</Button>
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
                  Loading staff...
                </TD>
              </TR>
            ) : paged.length === 0 ? (
              <TR>
                <TD colSpan={4} className="py-8 text-center text-slate-400">
                  No staff found.
                </TD>
              </TR>
            ) : (
              paged.map((member) => (
                <TR key={member.id}>
                  <TD className="font-semibold text-white">{member.full_name}</TD>
                  <TD>{member.email}</TD>
                  <TD>{member.is_active ? "Active" : "Inactive"}</TD>
                  <TD className="space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditTarget(member);
                        editForm.reset({ fullName: member.full_name });
                        setEditOpen(true);
                      }}
                    >
                      Edit
                    </Button>
                    <Button variant="destructive" onClick={() => onDelete(member.id)}>
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
          <DialogTitle>Add Staff</DialogTitle>
          <DialogDescription>Create staff login credentials.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={createForm.handleSubmit(onCreate)}>
          <div>
            <Label>Name</Label>
            <Input {...createForm.register("fullName")} placeholder="Staff name" />
            {createForm.formState.errors.fullName && (
              <p className="text-xs text-red-300">{createForm.formState.errors.fullName.message}</p>
            )}
          </div>
          <div>
            <Label>Email</Label>
            <Input {...createForm.register("email")} placeholder="staff@email.com" />
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
          <DialogTitle>Edit Staff</DialogTitle>
          <DialogDescription>Update staff details.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={editForm.handleSubmit(onEdit)}>
          <div>
            <Label>Name</Label>
            <Input {...editForm.register("fullName")} placeholder="Staff name" />
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
    </div>
  );
}
