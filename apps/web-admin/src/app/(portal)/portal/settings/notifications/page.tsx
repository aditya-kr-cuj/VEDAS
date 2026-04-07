"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const types = [
  "welcome",
  "test_scheduled",
  "test_result",
  "fee_reminder",
  "low_attendance",
  "announcement",
  "material_upload"
];

export default function PortalNotificationSettingsPage() {
  const [prefs, setPrefs] = useState<Record<string, { email_enabled: boolean; sms_enabled: boolean }>>({});

  useEffect(() => {
    api.get("/notifications/preferences").then((res) => {
      const next: any = {};
      (res.data.preferences ?? []).forEach((p: any) => {
        next[p.notification_type] = { email_enabled: p.email_enabled, sms_enabled: p.sms_enabled };
      });
      types.forEach((t) => {
        if (!next[t]) next[t] = { email_enabled: true, sms_enabled: false };
      });
      setPrefs(next);
    });
  }, []);

  const save = async () => {
    const preferences = Object.entries(prefs).map(([key, value]) => ({
      notification_type: key,
      email_enabled: value.email_enabled,
      sms_enabled: value.sms_enabled
    }));
    await api.put("/notifications/preferences", { preferences });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white">Notification Settings</h2>
      <Card>
        <CardContent className="space-y-3 p-6 text-sm text-slate-300">
          {types.map((type) => (
            <div key={type} className="flex items-center justify-between">
              <span className="capitalize">{type.replace("_", " ")}</span>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={prefs[type]?.email_enabled ?? true}
                  onChange={(e) =>
                    setPrefs((prev) => ({
                      ...prev,
                      [type]: { ...prev[type], email_enabled: e.target.checked }
                    }))
                  }
                />
                Email
              </label>
            </div>
          ))}
          <Button onClick={save}>Save Preferences</Button>
        </CardContent>
      </Card>
    </div>
  );
}
