"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { accessToken, isLoading } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !accessToken) {
      router.replace("/login");
    }
  }, [accessToken, isLoading, router]);

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
          <Sidebar onNavigate={() => setMenuOpen(false)} />
        </div>
      </div>

      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:block md:w-64">
        <Sidebar />
      </div>

      <div className="md:pl-64">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
