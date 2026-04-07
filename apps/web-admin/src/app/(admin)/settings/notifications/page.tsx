"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const notificationGroups = [
  {
    title: "Account",
    icon: "👤",
    items: [
      {
        type: "welcome",
        label: "Welcome Email",
        description: "Sent when a new user registers",
      },
    ],
  },
  {
    title: "Academic",
    icon: "📚",
    items: [
      {
        type: "test_scheduled",
        label: "Test Scheduled",
        description: "Reminder 1 day before a test",
      },
      {
        type: "test_result",
        label: "Test Result",
        description: "When test results are published",
      },
      {
        type: "low_attendance",
        label: "Low Attendance Alert",
        description: "Weekly alert for low attendance",
      },
    ],
  },
  {
    title: "Finance",
    icon: "💰",
    items: [
      {
        type: "fee_reminder",
        label: "Fee Reminder",
        description: "Before due date, on due date, and overdue",
      },
    ],
  },
  {
    title: "Communication",
    icon: "📢",
    items: [
      {
        type: "announcement",
        label: "Announcement",
        description: "New announcements from the institute",
      },
      {
        type: "material_upload",
        label: "Study Material Upload",
        description: "When new study material is added",
      },
    ],
  },
];

type Pref = { email_enabled: boolean; sms_enabled: boolean };

function Toggle({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  id: string;
}) {
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 ${
        checked ? "bg-emerald-500" : "bg-slate-700"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-lg transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<Record<string, Pref>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .get("/notifications/preferences")
      .then((res) => {
        const next: Record<string, Pref> = {};
        (res.data.preferences ?? []).forEach((p: any) => {
          next[p.notification_type] = {
            email_enabled: p.email_enabled,
            sms_enabled: p.sms_enabled,
          };
        });
        // Default all types to enabled if no pref stored
        notificationGroups.forEach((g) =>
          g.items.forEach((item) => {
            if (!next[item.type]) {
              next[item.type] = { email_enabled: true, sms_enabled: false };
            }
          })
        );
        setPrefs(next);
      })
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const preferences = Object.entries(prefs).map(([key, value]) => ({
        notification_type: key,
        email_enabled: value.email_enabled,
        sms_enabled: value.sms_enabled,
      }));
      await api.put("/notifications/preferences", { preferences });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      console.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Notification Settings</h2>
          <p className="mt-1 text-sm text-slate-400">
            Control which email notifications you receive
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-sm text-emerald-400 animate-in fade-in slide-in-from-right-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
          <Button
            id="save-notification-prefs"
            onClick={save}
            disabled={saving}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Saving…
              </span>
            ) : (
              "Save Preferences"
            )}
          </Button>
        </div>
      </div>

      {/* Groups */}
      {notificationGroups.map((group) => (
        <Card key={group.title}>
          <CardContent className="p-0">
            {/* Group header */}
            <div className="flex items-center gap-3 border-b border-white/5 px-6 py-4">
              <span className="text-xl">{group.icon}</span>
              <h3 className="text-base font-semibold text-white">{group.title}</h3>
            </div>

            {/* Items */}
            <div className="divide-y divide-white/5">
              {group.items.map((item) => {
                const pref = prefs[item.type] ?? {
                  email_enabled: true,
                  sms_enabled: false,
                };
                return (
                  <div
                    key={item.type}
                    className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-white/[0.02]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200">{item.label}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Email</span>
                        <Toggle
                          id={`toggle-email-${item.type}`}
                          checked={pref.email_enabled}
                          onChange={(val) =>
                            setPrefs((prev) => ({
                              ...prev,
                              [item.type]: { ...prev[item.type], email_enabled: val },
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">SMS</span>
                        <Toggle
                          id={`toggle-sms-${item.type}`}
                          checked={pref.sms_enabled}
                          onChange={(val) =>
                            setPrefs((prev) => ({
                              ...prev,
                              [item.type]: { ...prev[item.type], sms_enabled: val },
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
