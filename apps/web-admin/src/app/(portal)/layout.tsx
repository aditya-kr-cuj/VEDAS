"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { accessToken, isLoading, user, logout } = useAuth();
  const router = useRouter();

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

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">VEDAS</p>
          <h1 className="text-lg font-semibold">{user?.role === "teacher" ? "Teacher Portal" : "Student Portal"}</h1>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <div className="text-right">
            <p className="font-semibold text-white">{user?.fullName ?? "User"}</p>
            <p className="text-xs text-slate-400">{user?.email ?? ""}</p>
          </div>
          <Button variant="ghost" onClick={logout}>
            Logout
          </Button>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
