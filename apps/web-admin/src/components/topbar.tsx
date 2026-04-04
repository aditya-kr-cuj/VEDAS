"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export function Topbar({ onMenu }: { onMenu?: () => void }) {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-white/10 bg-slate-950/40 px-6 py-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="md:hidden" onClick={onMenu}>
          Menu
        </Button>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Institute</p>
          <h1 className="text-lg font-semibold">{user?.tenantId ? "Your Institute" : "Institute Admin"}</h1>
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm text-slate-300">
        <div className="text-right">
          <p className="font-semibold text-white">{user?.fullName ?? "Admin User"}</p>
          <p className="text-xs text-slate-400">{user?.email ?? "admin@vedas.app"}</p>
        </div>
        <Button variant="ghost" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
