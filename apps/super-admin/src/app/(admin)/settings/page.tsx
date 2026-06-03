"use client";

import { Shield, Server, Globe, Bell } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">Platform configuration and preferences</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {[
          {
            title: "Security",
            desc: "Manage authentication, session policies, and access controls.",
            icon: Shield,
            color: "purple",
          },
          {
            title: "Infrastructure",
            desc: "Database, caching, and server configuration.",
            icon: Server,
            color: "blue",
          },
          {
            title: "Domains",
            desc: "Manage subdomain routing and custom domain mappings.",
            icon: Globe,
            color: "teal",
          },
          {
            title: "Notifications",
            desc: "Configure platform-wide email, SMS, and push settings.",
            icon: Bell,
            color: "amber",
          },
        ].map((card) => {
          const Icon = card.icon;
          const colorMap: Record<string, string> = {
            purple: "border-purple-500/20 hover:border-purple-500/40",
            blue: "border-blue-500/20 hover:border-blue-500/40",
            teal: "border-teal-500/20 hover:border-teal-500/40",
            amber: "border-amber-500/20 hover:border-amber-500/40",
          };
          const iconColorMap: Record<string, string> = {
            purple: "bg-purple-500/20 text-purple-400",
            blue: "bg-blue-500/20 text-blue-400",
            teal: "bg-teal-500/20 text-teal-400",
            amber: "bg-amber-500/20 text-amber-400",
          };
          return (
            <div
              key={card.title}
              className={`rounded-2xl border bg-slate-900/50 p-6 transition ${colorMap[card.color]}`}
            >
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${iconColorMap[card.color]}`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">{card.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{card.desc}</p>
              <p className="mt-4 text-xs text-slate-600">Coming soon</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
