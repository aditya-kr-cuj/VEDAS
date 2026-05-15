import type { Metadata } from "next";
import { StatsCounter } from "@/components/StatsCounter";
import { Target, Eye, Heart, Lightbulb } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us",
  description: "Learn about VEDAS — the team and mission behind India's #1 coaching institute management platform.",
};

const values = [
  {
    icon: Target,
    title: "Mission-Driven",
    description: "We believe every coaching institute — from a single classroom to a multi-city chain — deserves world-class management tools.",
  },
  {
    icon: Eye,
    title: "Transparency First",
    description: "Simple pricing, open communication, and honest metrics. No lock-in contracts, no hidden fees.",
  },
  {
    icon: Heart,
    title: "Built for Educators",
    description: "Every feature is designed by talking to real coaching institute owners and understanding their daily pain points.",
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description: "We continuously push the envelope — AI-powered insights, smart scheduling, and predictive analytics are on our roadmap.",
  },
];

export default function AboutPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <p className="text-sm font-semibold text-[#f4b860] uppercase tracking-wider mb-3">About VEDAS</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Empowering India&apos;s Coaching Ecosystem
          </h1>
          <p className="mt-6 text-lg text-slate-400 leading-relaxed">
            VEDAS was born from a simple observation: coaching institutes — the backbone of India&apos;s education system — were
            still running on paper registers, WhatsApp groups, and spreadsheets. We set out to change that.
          </p>
        </div>

        {/* Story Section */}
        <div className="max-w-4xl mx-auto mb-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold text-white mb-4">Our Story</h2>
              <div className="space-y-4 text-slate-400 leading-relaxed text-sm">
                <p>
                  In 2024, while working with local coaching institutes in Indore, we saw the same problem everywhere: talented
                  teachers drowning in administrative chaos. Fee tracking on paper, attendance in registers, exam results
                  communicated via WhatsApp — it was inefficient and error-prone.
                </p>
                <p>
                  We built VEDAS (Versatile Education Digital Administration System) to be the all-in-one operating system for
                  coaching institutes. From day one, our focus has been on making powerful technology accessible and affordable
                  for institutes of all sizes.
                </p>
                <p>
                  Today, VEDAS powers 500+ coaching institutes across India, helping them save time, reduce errors, and focus on
                  what they do best — teaching.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#f4b860]/10 to-[#86e3ce]/10 rounded-3xl blur-2xl" />
              <div className="relative rounded-2xl border border-white/10 bg-[#121f36]/80 p-8 space-y-6">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Founded</p>
                  <p className="text-2xl font-bold text-[#f4b860]">2024</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Headquarters</p>
                  <p className="text-lg font-semibold text-white">Indore, India</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Mission</p>
                  <p className="text-sm text-slate-300">Digitize every coaching institute in India</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="py-16 border-y border-white/5 mb-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <StatsCounter end={500} suffix="+" label="Institutes" />
            <StatsCounter end={50000} suffix="+" label="Students Managed" />
            <StatsCounter end={15} suffix="L+" prefix="₹" label="Fees Collected" />
            <StatsCounter end={20} suffix="+" label="Cities" />
          </div>
        </div>

        {/* Values */}
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((val) => (
              <div
                key={val.title}
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 flex gap-5 transition-all duration-300 hover:border-white/15"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f4b860]/10">
                  <val.icon className="h-6 w-6 text-[#f4b860]" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{val.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{val.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
