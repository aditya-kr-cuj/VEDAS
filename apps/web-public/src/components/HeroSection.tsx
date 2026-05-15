import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Radial gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-gradient-to-b from-[#f4b860]/8 via-[#86e3ce]/5 to-transparent rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        {/* Floating orbs */}
        <div className="absolute top-32 left-20 w-3 h-3 rounded-full bg-[#f4b860]/30 animate-float" />
        <div className="absolute top-48 right-32 w-2 h-2 rounded-full bg-[#86e3ce]/40 animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute bottom-32 left-1/3 w-4 h-4 rounded-full bg-[#f4b860]/20 animate-float" style={{ animationDelay: "4s" }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#f4b860]/10 border border-[#f4b860]/20 mb-8">
            <Sparkles className="h-4 w-4 text-[#f4b860]" />
            <span className="text-sm font-medium text-[#f4b860]">
              India&apos;s #1 Coaching Institute OS
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight">
            <span className="text-white">Empower Your</span>
            <br />
            <span className="bg-gradient-to-r from-[#f4b860] via-[#f0c878] to-[#86e3ce] bg-clip-text text-transparent">
              Coaching Institute
            </span>
            <br />
            <span className="text-white">with VEDAS</span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto">
            One platform for admissions, attendance, tests, performance, fees,
            and communication. Built for coaching institutes that want to grow.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group flex items-center gap-2.5 px-8 py-4 text-base font-semibold text-[#1a1a1a] bg-gradient-to-r from-[#f4b860] to-[#e09530] rounded-2xl hover:shadow-2xl hover:shadow-[#f4b860]/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              Register Your Institute
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/login-options"
              className="flex items-center gap-2 px-8 py-4 text-base font-medium text-slate-300 rounded-2xl border border-white/10 hover:border-white/25 hover:bg-white/5 transition-all duration-300"
            >
              Login to Dashboard
            </Link>
          </div>

          {/* Social proof */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-[#0b1220] bg-gradient-to-br from-slate-600 to-slate-700"
                  />
                ))}
              </div>
              <span className="text-slate-400">500+ Institutes</span>
            </div>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <span className="text-slate-400">50,000+ Students</span>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <span className="text-slate-400">99.9% Uptime</span>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-20 relative mx-auto max-w-5xl">
          <div className="absolute -inset-4 bg-gradient-to-r from-[#f4b860]/20 via-[#86e3ce]/10 to-[#f4b860]/20 rounded-3xl blur-2xl opacity-40" />
          <div className="relative rounded-2xl border border-white/10 bg-[#121f36]/80 backdrop-blur-sm overflow-hidden shadow-2xl shadow-black/40">
            {/* Mock Browser Chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10 bg-[#0b1220]/60">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 mx-4">
                <div className="h-6 rounded-md bg-white/5 flex items-center px-3">
                  <span className="text-xs text-slate-500">vedas.app/dashboard</span>
                </div>
              </div>
            </div>
            {/* Mock Dashboard Content */}
            <div className="p-6 grid grid-cols-4 gap-4">
              {[
                { label: "Students", val: "1,247", color: "from-[#f4b860] to-[#e09530]" },
                { label: "Teachers", val: "56", color: "from-[#86e3ce] to-[#5bc4ad]" },
                { label: "Revenue", val: "₹18.5L", color: "from-[#a78bfa] to-[#7c3aed]" },
                { label: "Attendance", val: "94.2%", color: "from-[#fb923c] to-[#ea580c]" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl bg-white/5 border border-white/5 p-4">
                  <p className="text-xs text-slate-500 mb-1">{stat.label}</p>
                  <p className={`text-xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                    {stat.val}
                  </p>
                </div>
              ))}
              {/* Chart placeholder */}
              <div className="col-span-3 h-40 rounded-xl bg-white/5 border border-white/5 p-4">
                <p className="text-xs text-slate-500 mb-3">Monthly Revenue Trend</p>
                <div className="flex items-end gap-2 h-24">
                  {[40, 55, 45, 60, 75, 65, 80, 90, 85, 95, 88, 100].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-[#f4b860]/60 to-[#f4b860]/20" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className="col-span-1 h-40 rounded-xl bg-white/5 border border-white/5 p-4">
                <p className="text-xs text-slate-500 mb-3">Quick Actions</p>
                <div className="space-y-2">
                  {["Add Student", "Record Fee", "New Test"].map((a) => (
                    <div key={a} className="text-xs px-3 py-2 rounded-lg bg-white/5 text-slate-400">{a}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
