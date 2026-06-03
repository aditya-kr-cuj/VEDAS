"use client";

import Link from "next/link";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Shield, Building2, GraduationCap, ArrowRight } from "lucide-react";

type LoginOption = {
  title: string;
  description: string;
  href: string;
  accentColor: string;
  gradient: string;
  borderHover: string;
  iconBg: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const normalizeUrl = (url: string) => url.replace(/\/+$/, "");

const pingFavicon = (baseUrl: string) =>
  new Promise<boolean>((resolve) => {
    const url = `${normalizeUrl(baseUrl)}/favicon.ico?probe=${Date.now()}`;
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });

const candidateAdminUrls = [
  process.env.NEXT_PUBLIC_WEB_ADMIN_URL ?? "http://localhost:3000",
  "http://localhost:3000",
  "http://localhost:3003",
  "http://localhost:3004",
  "http://localhost:3005",
].map(normalizeUrl);

const loginOptionsFactory = (adminUrl: string): LoginOption[] => [
  {
    icon: Shield,
    title: "Super Admin",
    description: "Platform owner access. Manage all institutes, subscriptions, and platform analytics.",
    href: "http://localhost:3002/login",
    accentColor: "#a78bfa",
    gradient: "from-[#a78bfa]/10 to-[#7c3aed]/5",
    borderHover: "hover:border-[#a78bfa]/30",
    iconBg: "bg-[#a78bfa]/10",
  },
  {
    icon: Building2,
    title: "Institute Admin",
    description: "Manage your coaching institute — students, teachers, fees, attendance, and more.",
    href: `${adminUrl}/login`,
    accentColor: "#f4b860",
    gradient: "from-[#f4b860]/10 to-[#e09530]/5",
    borderHover: "hover:border-[#f4b860]/30",
    iconBg: "bg-[#f4b860]/10",
  },
  {
    icon: GraduationCap,
    title: "Student / Teacher",
    description: "Access your portal to view timetable, attendance, test results, and study materials.",
    href: `${adminUrl}/portal-login`,
    accentColor: "#86e3ce",
    gradient: "from-[#86e3ce]/10 to-[#5bc4ad]/5",
    borderHover: "hover:border-[#86e3ce]/30",
    iconBg: "bg-[#86e3ce]/10",
  },
];

export function LoginOptionCards() {
  const [adminUrl, setAdminUrl] = useState<string>(candidateAdminUrls[0]);
  const [resolvedUrl, setResolvedUrl] = useState<string>(candidateAdminUrls[0]);

  useEffect(() => {
    let active = true;

    const findAdminUrl = async () => {
      for (const url of candidateAdminUrls) {
        try {
          const available = await pingFavicon(url);
          if (available && active) {
            setResolvedUrl(url);
            return;
          }
        } catch {
          // ignore and continue probing
        }
      }
      if (active) {
        setResolvedUrl(candidateAdminUrls[0]);
      }
    };

    findAdminUrl();

    return () => {
      active = false;
    };
  }, []);

  const loginOptions = useMemo(() => loginOptionsFactory(resolvedUrl), [resolvedUrl]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {loginOptions.map((opt) => (
        <Link
          key={opt.title}
          href={opt.href}
          className={`group relative rounded-2xl border border-white/10 ${opt.borderHover} bg-gradient-to-b ${opt.gradient} p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20`}
        >
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `radial-gradient(200px circle at 50% 30%, ${opt.accentColor}15, transparent)`,
            }}
          />

          <div className="relative">
            <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${opt.iconBg} transition-transform group-hover:scale-110`}>
              <opt.icon className="h-8 w-8" style={{ color: opt.accentColor }} />
            </div>
            <h2 className="text-xl font-semibold text-white">{opt.title}</h2>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed">{opt.description}</p>
            <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium transition-all group-hover:gap-2.5" style={{ color: opt.accentColor }}>
              Continue
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
