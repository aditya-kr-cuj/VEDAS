"use client";

import { Menu } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PortalSidebar } from "@/components/portal-sidebar";
import { cn } from "@/lib/utils";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { accessToken, isLoading, user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [storedRole] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    const userStr = localStorage.getItem("vedas_user");
    const storedUser = userStr ? (JSON.parse(userStr) as { role?: string }) : null;
    return storedUser?.role;
  });

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const userStr = localStorage.getItem("vedas_user");
    const storedUser = userStr ? (JSON.parse(userStr) as { role?: string }) : null;

    if (!accessToken || !storedUser) {
      router.replace("/portal-login");
      return;
    }

    if (storedUser.role !== "student" && storedUser.role !== "teacher") {
      if (storedUser.role === "institute_admin") {
        router.replace("/dashboard");
        return;
      }
      router.replace("/portal-login");
    }
  }, [accessToken, isLoading, router]);

  const role = useMemo(() => {
    const nextRole = user?.role ?? storedRole;
    return nextRole === "teacher" ? "teacher" : "student";
  }, [storedRole, user?.role]);
  const portalTitle = role === "teacher" ? "Teacher Portal" : "Student Portal";
  const portalDetail = role === "teacher" ? "Subject / Department" : "Batch";

  return (
    <div className="min-h-screen">
      <div className="md:hidden">
        <div className={cn("fixed inset-0 z-40 bg-black/60", menuOpen ? "block" : "hidden")} onClick={() => setMenuOpen(false)} />
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 transform bg-slate-950 transition-transform",
            menuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <PortalSidebar
            role={role}
            name={user?.fullName}
            detail={user?.tenantName ?? portalDetail}
            onNavigate={() => setMenuOpen(false)}
            onLogout={logout}
          />
        </div>
      </div>

      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:block md:w-72">
        <PortalSidebar role={role} name={user?.fullName} detail={user?.tenantName ?? portalDetail} onLogout={logout} />
      </div>

      <div className="md:pl-72">
        <header className="flex items-center justify-between gap-4 border-b border-white/10 bg-slate-950/40 px-6 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
              <Menu className="size-4" aria-hidden="true" />
            </Button>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">VEDAS</p>
              <h1 className="text-lg font-semibold">{portalTitle}</h1>
            </div>
          </div>
          <div className="text-right text-sm text-slate-300">
            <p className="font-semibold text-white">{user?.fullName ?? "User"}</p>
            <p className="text-xs text-slate-400">{user?.email ?? ""}</p>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
