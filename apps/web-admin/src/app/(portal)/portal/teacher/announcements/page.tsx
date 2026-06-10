"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";

export default function TeacherAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "high" | "unread">("all");

  useEffect(() => {
    api
      .get("/announcements")
      .then((res) => setAnnouncements(res.data.announcements ?? res.data.data ?? []))
      .catch(() => toast.error("Failed to load announcements"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      announcements.filter((announcement) => {
        if (filter === "high") return announcement.priority === "high";
        if (filter === "unread") return !announcement.read_at;
        return true;
      }),
    [announcements, filter]
  );

  const markRead = async (id: string) => {
    try {
      await api.patch(`/announcements/${id}/read`);
      setAnnouncements((prev) => prev.map((item) => (item.id === id ? { ...item, read_at: new Date().toISOString() } : item)));
      toast.success("Marked as read");
    } catch {
      toast.error("Failed to mark announcement");
    }
  };

  const priorityClass: Record<string, string> = {
    high: "border-red-500/30 bg-red-500/15 text-red-300",
    medium: "border-amber-500/30 bg-amber-500/15 text-amber-300",
    low: "border-slate-600 bg-slate-800 text-slate-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Announcements</h1>
          <p className="mt-1 text-sm text-slate-400">Read institute updates and class notices.</p>
        </div>
        <div className="flex gap-2">
          {(["all", "high", "unread"] as const).map((item) => (
            <button key={item} onClick={() => setFilter(item)} className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${filter === item ? "bg-teal-500/20 text-teal-300" : "text-slate-400 hover:text-white"}`}>
              {item}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-12 text-center text-sm text-slate-500">No announcements found.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((announcement) => (
            <div key={announcement.id} className={`rounded-xl border bg-slate-900 p-5 ${announcement.read_at ? "border-slate-800 opacity-75" : "border-slate-700"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {announcement.is_pinned && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-300">Pinned</span>}
                    <h3 className="text-sm font-medium text-white">{announcement.title}</h3>
                    <span className={`rounded-full border px-2 py-0.5 text-xs capitalize ${priorityClass[announcement.priority] ?? priorityClass.low}`}>
                      {announcement.priority}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">{announcement.message?.replace(/<[^>]+>/g, "")}</p>
                  <p className="mt-2 text-xs text-slate-600">{announcement.created_at ? new Date(announcement.created_at).toLocaleDateString() : ""}</p>
                </div>
                {!announcement.read_at && (
                  <button onClick={() => markRead(announcement.id)} className="whitespace-nowrap text-xs text-teal-300 hover:text-teal-200">
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
