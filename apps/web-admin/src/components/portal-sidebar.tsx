"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  CalendarDays,
  CheckSquare,
  ClipboardList,
  CreditCard,
  FileQuestion,
  Files,
  Home,
  LogOut,
  User,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type PortalRole = "teacher" | "student";

type PortalSidebarProps = {
  role: PortalRole;
  name?: string;
  detail?: string;
  onNavigate?: () => void;
  onLogout: () => void;
};

const teacherItems = [
  { label: "Dashboard", href: "/portal/teacher/dashboard", icon: Home },
  { label: "Attendance", href: "/portal/teacher/attendance", icon: CheckSquare },
  { label: "My Classes", href: "/portal/teacher/timetable", icon: Users },
  { label: "Questions", href: "/portal/teacher/questions", icon: FileQuestion },
  { label: "Tests", href: "/portal/teacher/tests", icon: ClipboardList },
  { label: "Materials", href: "/portal/teacher/materials", icon: Files },
  { label: "Performance", href: "/portal/teacher/performance", icon: BarChart3 },
  { label: "Announcements", href: "/portal/teacher/announcements", icon: Bell },
  { label: "Timetable", href: "/portal/teacher/timetable", icon: CalendarDays },
  { label: "Profile", href: "/portal/teacher/profile", icon: User }
];

const studentItems = [
  { label: "Dashboard", href: "/portal/student/dashboard", icon: Home },
  { label: "My Tests", href: "/portal/student/tests", icon: ClipboardList },
  { label: "Study Materials", href: "/portal/student/materials", icon: Files },
  { label: "My Attendance", href: "/portal/student/attendance", icon: CheckSquare },
  { label: "My Fees", href: "/portal/student/fees", icon: CreditCard },
  { label: "Performance", href: "/portal/student/performance", icon: BarChart3 },
  { label: "Announcements", href: "/portal/student/announcements", icon: Bell },
  { label: "Timetable", href: "/portal/student/timetable", icon: CalendarDays },
  { label: "Profile", href: "/portal/student#profile", icon: User }
];

export function PortalSidebar({ role, name, detail, onNavigate, onLogout }: PortalSidebarProps) {
  const pathname = usePathname();
  const items = role === "teacher" ? teacherItems : studentItems;
  const portalTitle = role === "teacher" ? "Teacher Portal" : "Student Portal";

  return (
    <aside className="flex h-full w-72 flex-col border-r border-white/10 bg-slate-950/75">
      <div className="border-b border-white/10 p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">VEDAS</p>
        <h2 className="mt-2 text-xl font-semibold text-white">{portalTitle}</h2>
        <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-sm font-semibold text-white">{name ?? (role === "teacher" ? "Teacher" : "Student")}</p>
          <p className="mt-1 text-xs text-slate-400">{detail ?? (role === "teacher" ? "Subject / Department" : "Batch")}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4 text-sm">
        {items.map((item) => {
          const Icon = item.icon;
          const itemPath = item.href.split("#")[0];
          const active = pathname === itemPath;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 transition",
                active ? "bg-white/10 text-white" : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <Button variant="ghost" className="w-full justify-start gap-3 text-slate-300" onClick={onLogout}>
          <LogOut className="size-4" aria-hidden="true" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
