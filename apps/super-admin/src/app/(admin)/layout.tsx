"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SuperAdminSidebar } from "@/components/SuperAdminSidebar";
import { Topbar } from "@/components/Topbar";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { accessToken, user, isLoading } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!accessToken || user?.role !== "super_admin")) {
      router.replace("/login");
    }
  }, [accessToken, user, isLoading, router]);

  if (isLoading || !accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Mobile sidebar */}
      <div className="md:hidden">
        <div className={cn("fixed inset-0 z-40 bg-black/60", menuOpen ? "block" : "hidden")} onClick={() => setMenuOpen(false)} />
        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 transform bg-slate-950 transition-transform",
            menuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <SuperAdminSidebar onNavigate={() => setMenuOpen(false)} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:block md:w-64">
        <SuperAdminSidebar />
      </div>

      {/* Main content */}
      <div className="md:pl-64">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
