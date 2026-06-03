"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Menu, LogOut } from "lucide-react";

export function Topbar({ onMenu }: { onMenu?: () => void }) {
  const { user, logout } = useAuth();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-white/10 bg-slate-950/40 px-6 py-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenu}>
          <Menu className="h-5 w-5" />
        </Button>
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-purple-400">Super Admin</p>
          <h1 className="text-lg font-semibold">Platform Control Center</h1>
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm text-slate-300">
        <div className="text-right">
          <p className="font-semibold text-white">{user?.fullName ?? "Super Admin"}</p>
          <p className="text-xs text-slate-400">{user?.email ?? "admin@vedas.app"}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} title="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
