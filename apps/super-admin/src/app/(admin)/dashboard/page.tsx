"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  Building2,
  Users,
  Clock,
  TrendingUp,
  GraduationCap,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

interface DashboardStats {
  total_institutes: string;
  active_institutes: string;
  pending_institutes: string;
  total_revenue: string;
  total_users: string;
  total_students: string;
}

interface RecentInstitute {
  id: string;
  name: string;
  owner_email: string;
  tenant_code: string;
  plan_key: string | null;
  is_active: boolean;
  created_at: string;
  user_count: string;
}

interface SignupPoint {
  month: string;
  count: string;
}

interface RevenuePoint {
  plan_key: string;
  institute_count: string;
  monthly_revenue: string;
}

const CHART_COLORS = ["#a78bfa", "#86e3ce", "#f4b860", "#f87171", "#60a5fa"];

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  pro: "Pro",
  none: "No Plan",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recent, setRecent] = useState<RecentInstitute[]>([]);
  const [signups, setSignups] = useState<SignupPoint[]>([]);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dashRes, signupRes, revRes] = await Promise.all([
          api.get("/super-admin/dashboard/stats"),
          api.get("/super-admin/analytics/signups"),
          api.get("/super-admin/analytics/revenue"),
        ]);
        setStats(dashRes.data.stats);
        setRecent(dashRes.data.recentRegistrations);
        setSignups(signupRes.data.data);
        setRevenue(revRes.data.data);
      } catch (err) {
        console.error("Failed to load dashboard", err);
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

  const statCards = [
    {
      label: "Total Institutes",
      value: stats?.total_institutes ?? "0",
      icon: Building2,
      color: "purple",
      gradient: "from-purple-500/20 to-purple-500/5",
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-400",
    },
    {
      label: "Active Institutes",
      value: stats?.active_institutes ?? "0",
      icon: TrendingUp,
      color: "emerald",
      gradient: "from-emerald-500/20 to-emerald-500/5",
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-400",
    },
    {
      label: "Pending Approval",
      value: stats?.pending_institutes ?? "0",
      icon: Clock,
      color: "amber",
      gradient: "from-amber-500/20 to-amber-500/5",
      iconBg: "bg-amber-500/20",
      iconColor: "text-amber-400",
    },
    {
      label: "Monthly Revenue",
      value: `₹${parseInt(stats?.total_revenue ?? "0").toLocaleString("en-IN")}`,
      icon: DollarSign,
      color: "teal",
      gradient: "from-teal-500/20 to-teal-500/5",
      iconBg: "bg-teal-500/20",
      iconColor: "text-teal-400",
    },
    {
      label: "Total Users",
      value: stats?.total_users ?? "0",
      icon: Users,
      color: "blue",
      gradient: "from-blue-500/20 to-blue-500/5",
      iconBg: "bg-blue-500/20",
      iconColor: "text-blue-400",
    },
    {
      label: "Total Students",
      value: stats?.total_students ?? "0",
      icon: GraduationCap,
      color: "rose",
      gradient: "from-rose-500/20 to-rose-500/5",
      iconBg: "bg-rose-500/20",
      iconColor: "text-rose-400",
    },
  ];

  const signupData = signups.map((s) => ({
    month: s.month.substring(5), // MM format
    count: parseInt(s.count, 10),
  }));

  const revenueData = revenue.map((r) => ({
    name: PLAN_LABELS[r.plan_key] ?? r.plan_key,
    value: parseInt(r.monthly_revenue, 10),
    count: parseInt(r.institute_count, 10),
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-400">Platform overview and key metrics</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-2xl border border-white/10 bg-gradient-to-br ${card.gradient} p-5 transition hover:border-white/20`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400">{card.label}</p>
                  <p className="mt-2 text-3xl font-bold text-white">{card.value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}>
                  <Icon className={`h-5 w-5 ${card.iconColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Signups Over Time */}
        <div className="col-span-1 rounded-2xl border border-white/10 bg-slate-900/50 p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Institute Signups</h2>
          {signupData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={signupData}>
                <defs>
                  <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#e2e8f0",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  fill="url(#purpleGradient)"
                  name="Signups"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-slate-500">
              No signup data available yet
            </div>
          )}
        </div>

        {/* Revenue by Plan */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <h2 className="mb-4 text-lg font-semibold">Revenue by Plan</h2>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {revenueData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  formatter={(value) => <span className="text-xs text-slate-300">{value}</span>}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#e2e8f0",
                  }}
                  formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Revenue"]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-slate-500">
              No revenue data yet
            </div>
          )}
        </div>
      </div>

      {/* Recent Registrations */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Registrations</h2>
          <Link
            href="/institutes"
            className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300"
          >
            View All <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-slate-400">
                <th className="pb-3 font-medium">Institute</th>
                <th className="pb-3 font-medium">Code</th>
                <th className="pb-3 font-medium">Plan</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Users</th>
                <th className="pb-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((inst) => (
                <tr key={inst.id} className="border-b border-white/5 transition hover:bg-white/5">
                  <td className="py-3">
                    <Link href={`/institutes/${inst.id}`} className="hover:text-purple-300">
                      <p className="font-medium text-white">{inst.name}</p>
                      <p className="text-xs text-slate-500">{inst.owner_email}</p>
                    </Link>
                  </td>
                  <td className="py-3">
                    <span className="rounded-md bg-white/5 px-2 py-1 font-mono text-xs text-slate-300">
                      {inst.tenant_code}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className="rounded-full bg-purple-500/15 px-2.5 py-0.5 text-xs font-medium text-purple-300">
                      {PLAN_LABELS[inst.plan_key ?? "none"]}
                    </span>
                  </td>
                  <td className="py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        inst.is_active
                          ? "bg-emerald-500/15 text-emerald-300"
                          : "bg-amber-500/15 text-amber-300"
                      }`}
                    >
                      {inst.is_active ? "Active" : "Pending"}
                    </span>
                  </td>
                  <td className="py-3 text-slate-300">{inst.user_count}</td>
                  <td className="py-3 text-slate-400">
                    {new Date(inst.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No institutes registered yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
