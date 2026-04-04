"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Notification = {
  id: string;
  subject: string;
  body: string;
  created_at: string;
};

export default function TeacherPortalPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role && user.role !== "teacher") {
      router.replace("/dashboard");
      return;
    }

    const load = async () => {
      try {
        const response = await api.get("/notifications/my");
        setNotifications(response.data.notifications ?? []);
      } catch {
        setNotifications([]);
      }
    };
    load();
  }, [user, router]);

  const updateProfile = async () => {
    try {
      await api.put("/users/me", { fullName });
      setSaveStatus("Profile updated");
    } catch {
      setSaveStatus("Update failed");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome back, {user?.fullName ?? "Teacher"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-300">Your teaching summary and notices live here.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input value={user?.email ?? ""} readOnly />
            </div>
            {saveStatus && <p className="text-xs text-slate-400">{saveStatus}</p>}
            <Button onClick={updateProfile}>Save</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-sm text-slate-400">No notifications yet.</p>
          ) : (
            <ul className="space-y-3">
              {notifications.map((note) => (
                <li key={note.id} className="rounded-lg border border-white/10 p-3">
                  <p className="font-semibold text-white">{note.subject}</p>
                  <p className="text-sm text-slate-300">{note.body}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
