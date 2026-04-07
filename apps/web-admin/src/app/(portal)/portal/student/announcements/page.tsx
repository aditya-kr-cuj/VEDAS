"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StudentAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    api.get("/announcements").then((res) => setAnnouncements(res.data.announcements ?? []));
  }, []);

  const markRead = async (id: string) => {
    await api.patch(`/announcements/${id}/read`);
    setAnnouncements((prev) => prev.map((a) => (a.id === id ? { ...a, read_at: new Date().toISOString() } : a)));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white">Notice Board</h2>
      <div className="space-y-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id}>
            <CardContent className="space-y-2 p-4 text-sm text-slate-300">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{announcement.title}</h3>
                {announcement.is_pinned && <span className="text-xs text-amber-300">Pinned</span>}
              </div>
              <div dangerouslySetInnerHTML={{ __html: announcement.message }} />
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
