"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Students", href: "/students" },
  { label: "Teachers", href: "/teachers" },
  { label: "Teacher Performance", href: "/teachers/performance" },
  { label: "Staff", href: "/staff" },
  { label: "Courses", href: "/courses" },
  { label: "Batches", href: "/batches" },
  { label: "Materials", href: "/materials" },
  { label: "Upload Material", href: "/materials/upload" },
  { label: "Material Analytics", href: "/materials/analytics" },
  { label: "Questions", href: "/questions" },
  { label: "Tests", href: "/tests" },
  { label: "Reports", href: "/reports" },
  { label: "Announcements", href: "/announcements" },
  { label: "Notification Settings", href: "/settings/notifications" },
  { label: "Email Logs", href: "/settings/email-logs" },
  { label: "Timetable", href: "/timetable" },
  { label: "Attendance", href: "/attendance/mark" },
  { label: "Fee Payments", href: "/fees/payments" },
  { label: "Fee Reports", href: "/fees/reports" },
  { label: "Profile", href: "/profile" },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col gap-6 border-r border-white/10 bg-slate-950/60 p-6">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">VEDAS</p>
        <h2 className="mt-2 text-xl font-semibold">Institute Admin</h2>
      </div>
      <nav className="flex flex-col gap-2 text-sm">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "rounded-xl px-3 py-2 transition",
                active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
