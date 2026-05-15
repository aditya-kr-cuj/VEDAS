import type { Metadata } from "next";
import { FeatureCard } from "@/components/FeatureCard";
import {
  CalendarDays,
  Users,
  CreditCard,
  FileText,
  BarChart3,
  Bell,
  BookOpen,
  ClipboardList,
  GraduationCap,
  PieChart,
  Send,
  Settings,
  Shield,
  Smartphone,
  TrendingUp,
  Wallet,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Features",
  description: "Explore all the powerful features VEDAS offers for coaching institute management.",
};

const categories = [
  {
    label: "Administration",
    color: "#f4b860",
    features: [
      { icon: CalendarDays, title: "Smart Timetable", description: "Automated scheduling with room allocation, conflict detection, and teacher workload balancing." },
      { icon: Users, title: "Student Management", description: "Complete student profiles, batch assignments, enrollment tracking, and parent contact management." },
      { icon: GraduationCap, title: "Teacher Management", description: "Teacher profiles, subject assignments, schedule management, and performance tracking." },
      { icon: Settings, title: "Institute Settings", description: "Customize branding, academic sessions, grading systems, and notification preferences." },
    ],
  },
  {
    label: "Academic",
    color: "#86e3ce",
    features: [
      { icon: ClipboardList, title: "Attendance Tracking", description: "One-tap digital attendance with automatic parent alerts and detailed analytics." },
      { icon: FileText, title: "Test Management", description: "Create objective and subjective tests, auto-grading, rank lists, and performance reports." },
      { icon: BookOpen, title: "Study Materials", description: "Upload and share notes, PDFs, videos, and assignments organized by course and batch." },
      { icon: TrendingUp, title: "Performance Analytics", description: "Student-wise, batch-wise, and subject-wise performance trends and comparisons." },
    ],
  },
  {
    label: "Financial",
    color: "#a78bfa",
    features: [
      { icon: CreditCard, title: "Fee Collection", description: "Online and offline payments, Razorpay integration, automatic receipts, and installment plans." },
      { icon: Wallet, title: "Expense Tracking", description: "Record expenses, categorize spending, budget management, and P&L reports." },
      { icon: PieChart, title: "Financial Reports", description: "Revenue dashboards, profit & loss statements, balance sheets, and collection summaries." },
      { icon: BarChart3, title: "Revenue Analytics", description: "Fee collection trends, outstanding dues, batch-wise revenue, and payment forecasting." },
    ],
  },
  {
    label: "Communication",
    color: "#fb923c",
    features: [
      { icon: Bell, title: "Push Notifications", description: "Instant alerts to students and parents via Firebase Cloud Messaging." },
      { icon: Send, title: "Announcements", description: "Broadcast notices to entire institute, specific batches, or individual students." },
      { icon: Smartphone, title: "SMS & WhatsApp", description: "Automated messages for attendance, fees, exam results, and custom campaigns." },
      { icon: Shield, title: "Notice Board", description: "Public-facing digital notice board for displaying announcements on screens." },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <p className="text-sm font-semibold text-[#f4b860] uppercase tracking-wider mb-3">Features</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Everything Your Institute Needs
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            From daily attendance to annual financial reports — VEDAS covers every aspect of coaching institute management.
          </p>
        </div>

        {/* Categories */}
        <div className="space-y-20">
          {categories.map((cat) => (
            <section key={cat.label}>
              <div className="flex items-center gap-3 mb-8">
                <div className="h-1 w-8 rounded-full" style={{ backgroundColor: cat.color }} />
                <h2 className="text-2xl font-bold text-white">{cat.label}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {cat.features.map((f) => (
                  <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} accentColor={cat.color} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
