import type { Metadata } from "next";
import { PricingCard } from "@/components/PricingCard";
import { Check, X } from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple, transparent pricing for coaching institutes of every size.",
};

const plans = [
  {
    name: "Starter",
    price: "₹999",
    period: "month",
    description: "Perfect for small coaching classes",
    planKey: "starter",
    features: [
      "Up to 100 students",
      "3 teacher accounts",
      "Attendance tracking",
      "Basic fee management",
      "Announcements",
      "Email support",
    ],
  },
  {
    name: "Growth",
    price: "₹2,499",
    period: "month",
    description: "For growing coaching institutes",
    planKey: "growth",
    popular: true,
    features: [
      "Up to 500 students",
      "15 teacher accounts",
      "Everything in Starter",
      "Test & exam management",
      "Performance analytics",
      "SMS & WhatsApp notifications",
      "Fee reminders & Razorpay",
      "Study materials upload",
      "Priority support",
    ],
  },
  {
    name: "Pro",
    price: "₹4,999",
    period: "month",
    description: "For large multi-branch institutes",
    planKey: "pro",
    features: [
      "Unlimited students",
      "Unlimited teachers",
      "Everything in Growth",
      "Multi-branch support",
      "Custom domain",
      "Financial reports (P&L, Balance Sheet)",
      "Budget management",
      "Advanced analytics",
      "Dedicated account manager",
      "Custom integrations",
    ],
  },
];

const comparisonFeatures = [
  { name: "Students", starter: "100", growth: "500", pro: "Unlimited" },
  { name: "Teachers", starter: "3", growth: "15", pro: "Unlimited" },
  { name: "Attendance", starter: true, growth: true, pro: true },
  { name: "Fee Management", starter: true, growth: true, pro: true },
  { name: "Online Payments", starter: false, growth: true, pro: true },
  { name: "Test Management", starter: false, growth: true, pro: true },
  { name: "Performance Analytics", starter: false, growth: true, pro: true },
  { name: "SMS/WhatsApp", starter: false, growth: true, pro: true },
  { name: "Study Materials", starter: false, growth: true, pro: true },
  { name: "Financial Reports", starter: false, growth: false, pro: true },
  { name: "Multi-Branch", starter: false, growth: false, pro: true },
  { name: "Custom Domain", starter: false, growth: false, pro: true },
];

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm font-medium text-white">{value}</span>;
  }
  return value ? (
    <Check className="h-5 w-5 text-[#86e3ce] mx-auto" />
  ) : (
    <X className="h-5 w-5 text-slate-600 mx-auto" />
  );
}

export default function PricingPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-[#f4b860] uppercase tracking-wider mb-3">Pricing</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-lg text-slate-400">
            No hidden fees. No surprises. Choose the plan that fits your institute.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <PricingCard key={plan.planKey} {...plan} />
          ))}
        </div>

        {/* Comparison Table */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            Feature Comparison
          </h2>
          <div className="rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03]">
                  <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Feature</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-white">Starter</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-[#f4b860]">Growth</th>
                  <th className="text-center px-4 py-4 text-sm font-semibold text-white">Pro</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row, i) => (
                  <tr key={row.name} className={i % 2 === 0 ? "bg-white/[0.01]" : ""}>
                    <td className="px-6 py-3.5 text-sm text-slate-300">{row.name}</td>
                    <td className="px-4 py-3.5 text-center"><CellValue value={row.starter} /></td>
                    <td className="px-4 py-3.5 text-center bg-[#f4b860]/[0.03]"><CellValue value={row.growth} /></td>
                    <td className="px-4 py-3.5 text-center"><CellValue value={row.pro} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
