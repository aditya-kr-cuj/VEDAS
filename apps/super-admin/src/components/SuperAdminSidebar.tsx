"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  Settings,
  Shield,
} from "lucide-react";

const items = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Institutes", href: "/institutes", icon: Building2 },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function SuperAdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col gap-6 border-r border-white/10 bg-slate-950/60 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20">
          <Shield className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">VEDAS</p>
          <h2 className="text-lg font-semibold text-white">Super Admin</h2>
        </div>
      </div>

      <div className="h-px bg-white/10" />

      <nav className="flex flex-col gap-1 text-sm">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
                active
                  ? "bg-purple-500/15 text-purple-300 shadow-sm"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-purple-400" : "text-slate-500")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
          <p className="text-xs font-medium text-purple-300">Platform Admin</p>
          <p className="mt-1 text-xs text-slate-400">Full access to all institutes and platform settings.</p>
        </div>
      </div>
    </aside>
  );
}
