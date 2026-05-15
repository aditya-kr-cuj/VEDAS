import { HeroSection } from "@/components/HeroSection";
import { FeatureCard } from "@/components/FeatureCard";
import { TestimonialCard } from "@/components/TestimonialCard";
import { StatsCounter } from "@/components/StatsCounter";
import Link from "next/link";
import {
  CalendarDays,
  Users,
  CreditCard,
  FileText,
  BarChart3,
  Bell,
  ArrowRight,
  CheckCircle2,
  Zap,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: CalendarDays,
    title: "Smart Timetable",
    description: "Automated scheduling with conflict detection, room allocation, and teacher availability management.",
    accentColor: "#f4b860",
  },
  {
    icon: Users,
    title: "Attendance Tracking",
    description: "Digital attendance with instant parent notifications, trend analysis, and automated absence alerts.",
    accentColor: "#86e3ce",
  },
  {
    icon: CreditCard,
    title: "Fee Management",
    description: "Online payments via Razorpay, automated reminders, receipt generation, and installment tracking.",
    accentColor: "#a78bfa",
  },
  {
    icon: FileText,
    title: "Test & Exams",
    description: "Create tests, auto-grade objective papers, generate rank lists, and share performance reports.",
    accentColor: "#fb923c",
  },
  {
    icon: BarChart3,
    title: "Performance Analytics",
    description: "Student progress dashboards, batch comparisons, subject-wise insights, and trend analysis.",
    accentColor: "#38bdf8",
  },
  {
    icon: Bell,
    title: "Communication Hub",
    description: "Push notifications, announcements, SMS, WhatsApp, and email — all from one dashboard.",
    accentColor: "#f472b6",
  },
];

const testimonials = [
  {
    quote: "VEDAS transformed how we manage our coaching center. Fee collection went from a nightmare to a breeze. We saved 15 hours per week on admin work.",
    author: "Rajesh Sharma",
    role: "Director",
    institute: "Pinnacle Classes, Indore",
  },
  {
    quote: "The attendance tracking with parent notifications reduced our dropout rate by 30%. Parents love the transparency and real-time updates.",
    author: "Priya Mehta",
    role: "Administrator",
    institute: "Bright Future Academy, Bhopal",
  },
  {
    quote: "Our test management has become so efficient. Auto-grading and instant rank lists save us days of work every month. Students get faster feedback.",
    author: "Amit Patel",
    role: "Founder",
    institute: "Excel Coaching, Jaipur",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Register Your Institute",
    description: "Sign up in 2 minutes with your institute details and choose a plan that fits your needs.",
    icon: Zap,
  },
  {
    step: "02",
    title: "Set Up Your Dashboard",
    description: "Add courses, batches, teachers, and students. Import existing data or start fresh.",
    icon: CheckCircle2,
  },
  {
    step: "03",
    title: "Go Live & Grow",
    description: "Start managing attendance, fees, tests, and communication — all from one platform.",
    icon: Shield,
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <HeroSection />

      {/* Features Section */}
      <section id="features" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-[#f4b860] uppercase tracking-wider mb-3">
              Everything You Need
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Powerful Features for Modern Institutes
            </h2>
            <p className="mt-4 text-slate-400">
              From daily operations to strategic insights — VEDAS handles it all so you can focus on what matters: teaching.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-white/5">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <StatsCounter end={500} suffix="+" label="Institutes" />
            <StatsCounter end={50000} suffix="+" label="Students" />
            <StatsCounter end={99} suffix="%" label="Uptime" />
            <StatsCounter end={2000} suffix="+" label="Teachers" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-[#86e3ce] uppercase tracking-wider mb-3">
              Simple Setup
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Get Started in 3 Easy Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f4b860]/15 to-[#86e3ce]/10 border border-white/10">
                  <item.icon className="h-7 w-7 text-[#f4b860]" />
                </div>
                <span className="text-xs font-bold text-[#f4b860]/50 uppercase tracking-widest">
                  Step {item.step}
                </span>
                <h3 className="mt-2 text-lg font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-28 bg-[#080e1a]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold text-[#f4b860] uppercase tracking-wider mb-3">
              Trusted by Educators
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              What Institute Owners Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <TestimonialCard key={t.author} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-[#f4b860]/[0.08] via-transparent to-[#86e3ce]/[0.05] p-12 md:p-16 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#f4b860]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Ready to Transform Your Institute?
              </h2>
              <p className="mt-4 text-lg text-slate-400 max-w-xl mx-auto">
                Join 500+ coaching institutes already using VEDAS to streamline operations and boost student outcomes.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="group flex items-center gap-2 px-8 py-4 text-base font-semibold text-[#1a1a1a] bg-gradient-to-r from-[#f4b860] to-[#e09530] rounded-2xl hover:shadow-2xl hover:shadow-[#f4b860]/25 transition-all duration-300 hover:-translate-y-0.5"
                >
                  Start Free Trial
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/pricing"
                  className="px-8 py-4 text-base font-medium text-slate-300 rounded-2xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all duration-200"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
