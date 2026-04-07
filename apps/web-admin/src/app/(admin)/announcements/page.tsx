"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [filterUnread, setFilterUnread] = useState(false);
  const [filterPinned, setFilterPinned] = useState(false);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (filterUnread) params.unread = "true";
    if (filterPinned) params.pinned = "true";
    api.get("/announcements", { params }).then((res) => setAnnouncements(res.data.announcements ?? []));
  }, [filterUnread, filterPinned]);

  const markRead = async (id: string) => {
    await api.patch(`/announcements/${id}/read`);
    setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, read_at: new Date().toISOString() } : a)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Announcements</h2>
          <p className="text-sm text-slate-400">Pinned announcements are shown first.</p>
        </div>
        <Link href="/announcements/new">
          <Button>Create Announcement</Button>
        </Link>
      </div>

      <div className="flex items-center gap-4 text-sm text-slate-300">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={filterUnread} onChange={() => setFilterUnread((v) => !v)} />
          Unread
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={filterPinned} onChange={() => setFilterPinned((v) => !v)} />
          Pinned
        </label>
      </div>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id}>
            <CardContent className="space-y-2 p-4 text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{announcement.title}</h3>
                {announcement.is_pinned && <span className="text-xs text-amber-300">Pinned</span>}
              </div>
              <div dangerouslySetInnerHTML={{ __html: announcement.message }} />
              <p className="text-xs text-slate-400">
                {announcement.announcement_type} • {announcement.priority}
              </p>
              {!announcement.read_at && (
                <Button size="sm" variant="outline" onClick={() => markRead(announcement.id)}>
                  Mark as Read
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
