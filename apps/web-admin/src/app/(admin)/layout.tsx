"use client";

import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { PortalSidebar } from "@/components/portal-sidebar";
import { api } from "@/lib/api";
import { getStoredAccessToken, getStoredUser, setStoredUser, useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const teacherAllowedPaths = ["/attendance", "/questions", "/tests", "/materials", "/reports", "/calendar"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { accessToken, isLoading, user: authUser, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [instituteName, setInstituteName] = useState<string | undefined>(authUser?.tenantName);
  const displayInstituteName = authUser?.tenantName ?? instituteName;
  const isTeacherWorkspace =
    authUser?.role === "teacher" && teacherAllowedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const storedAccessToken = getStoredAccessToken();
    const user = getStoredUser();

    if ((!accessToken && !storedAccessToken) || !user) {
      router.replace("/login");
      return;
    }

    if (user.role === "teacher") {
      if (teacherAllowedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
        return;
      }
      router.replace("/portal/teacher");
      return;
    }

    if (user.role !== "institute_admin") {
      if (user.role === "student") {
        router.replace("/portal/student");
        return;
      }
      router.replace("/login");
    }
  }, [accessToken, isLoading, pathname, router]);

  useEffect(() => {
    if (authUser?.tenantName) {
      document.title = `${authUser.tenantName} | VEDAS`;
    }
  }, [authUser?.tenantName]);

  useEffect(() => {
    if (isLoading || (!accessToken && !getStoredAccessToken())) {
      return;
    }

    let active = true;
    api
      .get("/tenant/me")
      .then((response) => {
        const name = response.data?.name;
        if (active && typeof name === "string" && name.trim()) {
          setInstituteName(name);
          const storedUser = getStoredUser();
          if (storedUser) {
            setStoredUser({ ...storedUser, tenantName: name });
          }
          document.title = `${name} | VEDAS`;
        }
      })
      .catch(() => {
        if (active) {
          setInstituteName(undefined);
        }
      });

    return () => {
      active = false;
    };
  }, [accessToken, isLoading]);

  if (isTeacherWorkspace) {
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
              role="teacher"
              name={authUser?.fullName}
              detail={displayInstituteName ?? "Subject / Department"}
              onNavigate={() => setMenuOpen(false)}
              onLogout={logout}
            />
          </div>
        </div>

        <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:block md:w-72">
          <PortalSidebar
            role="teacher"
            name={authUser?.fullName}
            detail={displayInstituteName ?? "Subject / Department"}
            onLogout={logout}
          />
        </div>

        <div className="md:pl-72">
          <header className="flex items-center justify-between gap-4 border-b border-white/10 bg-slate-950/40 px-6 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(true)} aria-label="Open menu">
                <Menu className="size-4" aria-hidden="true" />
              </Button>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">VEDAS</p>
                <h1 className="text-lg font-semibold">Teacher Portal</h1>
              </div>
            </div>
            <div className="text-right text-sm text-slate-300">
              <p className="font-semibold text-white">{authUser?.fullName ?? "Teacher"}</p>
              <p className="text-xs text-slate-400">{authUser?.email ?? ""}</p>
            </div>
          </header>
          <main className="p-6">{children}</main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="md:hidden">
        <div className={cn("fixed inset-0 z-40 bg-black/60", menuOpen ? "block" : "hidden")} onClick={() => setMenuOpen(false)} />
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 transform bg-slate-950 transition-transform",
            menuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Sidebar instituteName={displayInstituteName} onNavigate={() => setMenuOpen(false)} />
        </div>
      </div>

      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:block md:w-64">
        <Sidebar instituteName={displayInstituteName} />
      </div>

      <div className="md:pl-64">
        <Topbar instituteName={displayInstituteName} onMenu={() => setMenuOpen(true)} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
