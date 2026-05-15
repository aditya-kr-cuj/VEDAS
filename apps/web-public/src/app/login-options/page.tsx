import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Building2, GraduationCap, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Login",
  description: "Choose your login type — Super Admin, Institute Admin, or Student/Teacher portal.",
};

const loginOptions = [
  {
    icon: Shield,
    title: "Super Admin",
    description: "Platform owner access. Manage all institutes, subscriptions, and platform analytics.",
    href: "/super-admin/login",
    accentColor: "#a78bfa",
    gradient: "from-[#a78bfa]/10 to-[#7c3aed]/5",
    borderHover: "hover:border-[#a78bfa]/30",
    iconBg: "bg-[#a78bfa]/10",
  },
  {
    icon: Building2,
    title: "Institute Admin",
    description: "Manage your coaching institute — students, teachers, fees, attendance, and more.",
    href: "http://localhost:3000/login",
    accentColor: "#f4b860",
    gradient: "from-[#f4b860]/10 to-[#e09530]/5",
    borderHover: "hover:border-[#f4b860]/30",
    iconBg: "bg-[#f4b860]/10",
  },
  {
    icon: GraduationCap,
    title: "Student / Teacher",
    description: "Access your portal to view timetable, attendance, test results, and study materials.",
    href: "http://localhost:3000/login",
    accentColor: "#86e3ce",
    gradient: "from-[#86e3ce]/10 to-[#5bc4ad]/5",
    borderHover: "hover:border-[#86e3ce]/30",
    iconBg: "bg-[#86e3ce]/10",
  },
];

export default function LoginOptionsPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="mx-auto max-w-4xl px-6">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-14">
          <p className="text-sm font-semibold text-[#f4b860] uppercase tracking-wider mb-3">Login</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Choose Your Portal</h1>
          <p className="mt-3 text-slate-400">
            Select your role to access the right dashboard.
          </p>
        </div>

        {/* Login Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loginOptions.map((opt) => (
            <Link
              key={opt.title}
              href={opt.href}
              className={`group relative rounded-2xl border border-white/10 ${opt.borderHover} bg-gradient-to-b ${opt.gradient} p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20`}
            >
              {/* Glow */}
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

        {/* Register CTA */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#f4b860] hover:underline font-medium">
              Register your institute
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
