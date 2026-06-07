"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { accessToken, isLoading, user: authUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [instituteName, setInstituteName] = useState<string | undefined>(authUser?.tenantName);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const storedAccessToken = localStorage.getItem("vedas_access_token");
    const userStr = localStorage.getItem("vedas_user");
    const user = userStr ? (JSON.parse(userStr) as { role?: string }) : null;

    if ((!accessToken && !storedAccessToken) || !user) {
      router.replace("/login");
      return;
    }

    if (user.role === "teacher") {
      const teacherAllowedPaths = ["/attendance", "/questions", "/tests", "/materials", "/reports", "/calendar"];
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
      setInstituteName(authUser.tenantName);
      document.title = `${authUser.tenantName} | VEDAS`;
    }
  }, [authUser?.tenantName]);

  useEffect(() => {
    if (isLoading || (!accessToken && !localStorage.getItem("vedas_access_token"))) {
      return;
    }

    let active = true;
    api
      .get("/tenant/me")
      .then((response) => {
        const name = response.data?.name;
        if (active && typeof name === "string" && name.trim()) {
          setInstituteName(name);
          const userStr = localStorage.getItem("vedas_user");
          if (userStr) {
            localStorage.setItem("vedas_user", JSON.stringify({ ...JSON.parse(userStr), tenantName: name }));
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
          <Sidebar instituteName={instituteName} onNavigate={() => setMenuOpen(false)} />
        </div>
      </div>

      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:block md:w-64">
        <Sidebar instituteName={instituteName} />
      </div>

      <div className="md:pl-64">
        <Topbar instituteName={instituteName} onMenu={() => setMenuOpen(true)} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
