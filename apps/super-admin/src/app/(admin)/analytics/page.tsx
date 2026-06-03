"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface SignupPoint {
  month: string;
  count: string;
}

interface RevenuePoint {
  plan_key: string;
  institute_count: string;
  monthly_revenue: string;
}

interface DashboardStats {
  total_institutes: string;
  active_institutes: string;
  pending_institutes: string;
  total_revenue: string;
  total_users: string;
  total_students: string;
}

const CHART_COLORS = ["#a78bfa", "#86e3ce", "#f4b860", "#f87171", "#60a5fa"];
const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  pro: "Pro",
  none: "No Plan",
};

const tooltipStyle = {
  backgroundColor: "#1e293b",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "12px",
  color: "#e2e8f0",
};

export default function AnalyticsPage() {
  const [signups, setSignups] = useState<SignupPoint[]>([]);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [signupRes, revRes, statsRes] = await Promise.all([
          api.get("/super-admin/analytics/signups"),
          api.get("/super-admin/analytics/revenue"),
          api.get("/super-admin/dashboard/stats"),
        ]);
        setSignups(signupRes.data.data);
        setRevenue(revRes.data.data);
        setStats(statsRes.data.stats);
      } catch (err) {
        console.error("Analytics load failed", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  const signupData = signups.map((s) => ({
    month: s.month,
    count: parseInt(s.count, 10),
  }));

  const revenueBarData = revenue.map((r) => ({
    plan: PLAN_LABELS[r.plan_key] ?? r.plan_key,
    revenue: parseInt(r.monthly_revenue, 10),
    institutes: parseInt(r.institute_count, 10),
  }));

  const statusData = stats
    ? [
        { name: "Active", value: parseInt(stats.active_institutes, 10) },
        { name: "Suspended", value: parseInt(stats.pending_institutes, 10) },
      ]
    : [];

  const revenueDonutData = revenue.map((r) => ({
    name: PLAN_LABELS[r.plan_key] ?? r.plan_key,
    value: parseInt(r.monthly_revenue, 10),
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="mt-1 text-sm text-slate-400">
          Platform-wide metrics and trends
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[
          {
            label: "Total Revenue (Monthly)",
            value: `₹${parseInt(stats?.total_revenue ?? "0").toLocaleString("en-IN")}`,
            change: "+12%",
          },
          {
            label: "Active Institutes",
            value: stats?.active_institutes ?? "0",
            change: "+3",
          },
          {
            label: "Total Users",
            value: stats?.total_users ?? "0",
            change: "+28",
          },
          {
            label: "Total Students",
            value: stats?.total_students ?? "0",
            change: "+15",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-white/10 bg-slate-900/50 p-5"
          >
            <p className="text-sm text-slate-400">{card.label}</p>
            <div className="mt-2 flex items-end gap-2">
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <span className="mb-0.5 text-xs text-emerald-400">{card.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Signups Over Time */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
        <h2 className="mb-1 text-lg font-semibold">Institute Signups Over Time</h2>
        <p className="mb-6 text-sm text-slate-500">Last 12 months</p>
        {signupData.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={signupData}>
              <defs>
                <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 12 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="count" stroke="#a78bfa" strokeWidth={2} fill="url(#aGrad)" name="Signups" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[320px] items-center justify-center text-sm text-slate-500">
            No signup data available yet
          </div>
        )}
      </div>

      {/* Revenue + Status Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue by Plan — Bar Chart */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <h2 className="mb-1 text-lg font-semibold">Revenue by Plan</h2>
          <p className="mb-6 text-sm text-slate-500">Monthly recurring revenue breakdown</p>
          {revenueBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={revenueBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="plan" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Revenue"]}
                />
                <Bar dataKey="revenue" fill="#a78bfa" radius={[8, 8, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-slate-500">
              No revenue data yet
            </div>
          )}
        </div>

        {/* Institute Status — Pie Chart */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <h2 className="mb-1 text-lg font-semibold">Institute Status Distribution</h2>
          <p className="mb-6 text-sm text-slate-500">Active vs Suspended institutes</p>
          {statusData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  <Cell fill="#86e3ce" />
                  <Cell fill="#f4b860" />
                </Pie>
                <Legend formatter={(value) => <span className="text-xs text-slate-300">{value}</span>} />
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-slate-500">
              No status data yet
            </div>
          )}
        </div>
      </div>

      {/* Revenue Distribution Donut */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
        <h2 className="mb-1 text-lg font-semibold">Revenue Distribution</h2>
        <p className="mb-6 text-sm text-slate-500">Share of monthly recurring revenue by plan tier</p>
        {revenueDonutData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={revenueDonutData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={4}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {revenueDonutData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Monthly Revenue"]}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center text-sm text-slate-500">
            No revenue data yet
          </div>
        )}
      </div>
    </div>
  );
}
