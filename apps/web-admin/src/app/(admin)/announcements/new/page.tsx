"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

type Batch = { id: string; name: string };
type User = { id: string; full_name: string; email: string; role: string };

export default function AnnouncementCreatePage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("general");
  const [priority, setPriority] = useState("medium");
  const [targetType, setTargetType] = useState("all");
  const [scheduledAt, setScheduledAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedBatchIds, setSelectedBatchIds] = useState<Record<string, boolean>>({});
  const [selectedUserIds, setSelectedUserIds] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    api.get("/batches").then((res) => setBatches(res.data.batches ?? []));
    api.get("/users").then((res) => setUsers(res.data.users ?? []));
  }, []);

  const submit = async () => {
    const payload: any = {
      title,
      message,
      announcement_type: type,
      priority,
      target_type: targetType,
      scheduled_at: scheduledAt || undefined,
      expires_at: expiresAt || undefined,
      is_pinned: isPinned
    };
    if (targetType === "batch") {
      payload.batch_ids = Object.entries(selectedBatchIds).filter(([, v]) => v).map(([id]) => id);
    }
    if (targetType === "individual") {
      const selected = Object.entries(selectedUserIds).filter(([, v]) => v).map(([id]) => id);
      payload.student_ids = users.filter((u) => u.role === "student" && selected.includes(u.id)).map((u) => u.id);
      payload.teacher_ids = users.filter((u) => u.role === "teacher" && selected.includes(u.id)).map((u) => u.id);
    }
    await api.post("/announcements", payload);
    setStatus("Announcement created");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">New Announcement</h2>
        <p className="text-sm text-slate-400">Send announcements to students and teachers.</p>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Type</Label>
              <select className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="general">General</option>
                <option value="urgent">Urgent</option>
                <option value="event">Event</option>
                <option value="holiday">Holiday</option>
              </select>
            </div>
            <div>
              <Label>Priority</Label>
              <select className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <Label>Target</Label>
              <select className="mt-2 w-full rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-200" value={targetType} onChange={(e) => setTargetType(e.target.value)}>
                <option value="all">All</option>
                <option value="batch">Batch</option>
                <option value="individual">Individual</option>
              </select>
            </div>
            <div>
              <Label>Schedule At</Label>
              <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </div>
            <div>
              <Label>Expires At</Label>
              <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Message</Label>
              <div className="mt-2 rounded-md border border-white/10 bg-white text-black">
                <ReactQuill value={message} onChange={setMessage} />
              </div>
            </div>
          </div>

          {targetType === "batch" && (
            <div className="space-y-2">
              <Label>Select Batches</Label>
              <div className="flex flex-wrap gap-2">
                {batches.map((batch) => (
                  <label key={batch.id} className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedBatchIds[batch.id])}
                      onChange={(e) => setSelectedBatchIds((prev) => ({ ...prev, [batch.id]: e.target.checked }))}
                    />
                    {batch.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          {targetType === "individual" && (
            <div className="space-y-2">
              <Label>Select Users</Label>
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {users.map((user) => (
                  <label key={user.id} className="flex items-center gap-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedUserIds[user.id])}
                      onChange={(e) => setSelectedUserIds((prev) => ({ ...prev, [user.id]: e.target.checked }))}
                    />
                    {user.full_name} ({user.role})
                  </label>
                ))}
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={isPinned} onChange={() => setIsPinned((v) => !v)} />
            Pin announcement
          </label>

          {status && <p className="text-xs text-slate-400">{status}</p>}
          <Button onClick={submit}>Create Announcement</Button>
        </CardContent>
      </Card>
    </div>
  );
}
