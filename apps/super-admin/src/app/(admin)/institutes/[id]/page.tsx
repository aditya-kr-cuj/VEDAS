"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Hash,
  Users,
  GraduationCap,
  BookOpen,
  Layers,
  Shield,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

interface InstituteDetail {
  id: string;
  name: string;
  slug: string;
  tenant_code: string;
  owner_email: string;
  phone: string | null;
  plan_key: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  subdomain: string | null;
  custom_domain: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_count: string;
  student_count: string;
  teacher_count: string;
  course_count: string;
  batch_count: string;
}

const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  growth: "Growth",
  pro: "Pro",
  none: "No Plan",
};

export default function InstituteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [inst, setInst] = useState<InstituteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");

  const id = params.id as string;

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get(`/super-admin/institutes/${id}`);
        setInst(res.data);
        setSelectedPlan(res.data.plan_key ?? "");
      } catch {
        console.error("Failed to load institute");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const toggleStatus = async () => {
    if (!inst) return;
    setActionLoading(true);
    try {
      await api.put(`/super-admin/institutes/${id}/status`, { is_active: !inst.is_active });
      setInst({ ...inst, is_active: !inst.is_active });
    } catch (err) {
      console.error("Status update failed", err);
    } finally {
      setActionLoading(false);
    }
  };

  const changePlan = async () => {
    if (!inst) return;
    setActionLoading(true);
    try {
      await api.put(`/super-admin/institutes/${id}`, { plan_key: selectedPlan });
      setInst({ ...inst, plan_key: selectedPlan });
      setShowPlanModal(false);
    } catch (err) {
      console.error("Plan change failed", err);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteInstitute = async () => {
    setActionLoading(true);
    try {
      await api.delete(`/super-admin/institutes/${id}`);
      router.push("/institutes");
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  if (!inst) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-slate-400">Institute not found</p>
        <Button variant="outline" onClick={() => router.push("/institutes")} className="border-white/10">
          Back to Institutes
        </Button>
      </div>
    );
  }

  const usageStats = [
    { label: "Total Users", value: inst.user_count, icon: Users, color: "purple" },
    { label: "Students", value: inst.student_count, icon: GraduationCap, color: "blue" },
    { label: "Teachers", value: inst.teacher_count, icon: Shield, color: "teal" },
    { label: "Courses", value: inst.course_count, icon: BookOpen, color: "amber" },
    { label: "Batches", value: inst.batch_count, icon: Layers, color: "rose" },
  ];

  const colorMap: Record<string, { bg: string; icon: string }> = {
    purple: { bg: "bg-purple-500/20", icon: "text-purple-400" },
    blue: { bg: "bg-blue-500/20", icon: "text-blue-400" },
    teal: { bg: "bg-teal-500/20", icon: "text-teal-400" },
    amber: { bg: "bg-amber-500/20", icon: "text-amber-400" },
    rose: { bg: "bg-rose-500/20", icon: "text-rose-400" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/institutes")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{inst.name}</h1>
            <p className="mt-1 text-sm text-slate-400">{inst.owner_email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              inst.is_active ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"
            }`}
          >
            {inst.is_active ? "Active" : "Suspended"}
          </span>
          <span className="rounded-full bg-purple-500/15 px-3 py-1 text-xs font-medium text-purple-300">
            {PLAN_LABELS[inst.plan_key ?? "none"]}
          </span>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Institute Info */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <h2 className="mb-4 text-lg font-semibold">Institute Information</h2>
          <div className="space-y-4">
            {[
              { icon: Building2, label: "Name", value: inst.name },
              { icon: Mail, label: "Email", value: inst.owner_email },
              { icon: Phone, label: "Phone", value: inst.phone ?? "—" },
              { icon: Hash, label: "Institute Code", value: inst.tenant_code, mono: true },
              { icon: Globe, label: "Subdomain", value: inst.subdomain ?? "—" },
              {
                icon: MapPin,
                label: "Address",
                value: [inst.address_line1, inst.city, inst.state, inst.pincode].filter(Boolean).join(", ") || "—",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5">
                    <Icon className="h-4 w-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{item.label}</p>
                    <p className={`text-sm text-white ${item.mono ? "font-mono" : ""}`}>{item.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subscription Info */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
          <h2 className="mb-4 text-lg font-semibold">Subscription & Dates</h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
              <p className="text-xs text-slate-400">Current Plan</p>
              <p className="mt-1 text-xl font-bold text-purple-300">
                {PLAN_LABELS[inst.plan_key ?? "none"]}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-slate-500">Registered</p>
                <p className="mt-1 text-sm font-medium text-white">
                  {new Date(inst.created_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-xs text-slate-500">Last Updated</p>
                <p className="mt-1 text-sm font-medium text-white">
                  {new Date(inst.updated_at).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-xs text-slate-500">Slug</p>
              <p className="mt-1 font-mono text-sm text-white">{inst.slug}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Usage Statistics</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {usageStats.map((stat) => {
            const Icon = stat.icon;
            const colors = colorMap[stat.color];
            return (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-center"
              >
                <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl ${colors.bg}`}>
                  <Icon className={`h-5 w-5 ${colors.icon}`} />
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-xs text-slate-400">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
        <h2 className="mb-4 text-lg font-semibold">Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={toggleStatus}
            disabled={actionLoading}
            className={`gap-2 rounded-xl ${
              inst.is_active
                ? "bg-amber-600 text-white hover:bg-amber-500"
                : "bg-emerald-600 text-white hover:bg-emerald-500"
            }`}
          >
            {inst.is_active ? (
              <>
                <ToggleLeft className="h-4 w-4" /> Suspend Institute
              </>
            ) : (
              <>
                <ToggleRight className="h-4 w-4" /> Activate Institute
              </>
            )}
          </Button>

          <Button
            onClick={() => setShowPlanModal(true)}
            variant="outline"
            className="gap-2 rounded-xl border-white/10 text-slate-300 hover:bg-white/5"
          >
            Change Plan
          </Button>

          <Button
            onClick={() => setShowDeleteConfirm(true)}
            variant="outline"
            className="gap-2 rounded-xl border-red-500/30 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" /> Delete Institute
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900 p-6">
            <h3 className="text-lg font-bold text-red-400">Delete Institute</h3>
            <p className="mt-2 text-sm text-slate-400">
              This will permanently delete <strong className="text-white">{inst.name}</strong> and all associated data
              (users, students, teachers, courses, etc.). This action cannot be undone.
            </p>
            <div className="mt-6 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} className="rounded-xl border-white/10">
                Cancel
              </Button>
              <Button
                onClick={deleteInstitute}
                disabled={actionLoading}
                className="rounded-xl bg-red-600 text-white hover:bg-red-500"
              >
                {actionLoading ? "Deleting..." : "Delete Permanently"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-purple-500/30 bg-slate-900 p-6">
            <h3 className="text-lg font-bold">Change Subscription Plan</h3>
            <p className="mt-2 text-sm text-slate-400">
              Select a new plan for <strong className="text-white">{inst.name}</strong>
            </p>
            <div className="mt-4 space-y-2">
              {["starter", "growth", "pro"].map((plan) => (
                <label
                  key={plan}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${
                    selectedPlan === plan
                      ? "border-purple-500/50 bg-purple-500/10"
                      : "border-white/10 hover:bg-white/5"
                  }`}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={plan}
                    checked={selectedPlan === plan}
                    onChange={() => setSelectedPlan(plan)}
                    className="accent-purple-500"
                  />
                  <span className="font-medium text-white">{PLAN_LABELS[plan]}</span>
                </label>
              ))}
            </div>
            <div className="mt-6 flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowPlanModal(false)} className="rounded-xl border-white/10">
                Cancel
              </Button>
              <Button
                onClick={changePlan}
                disabled={actionLoading}
                className="rounded-xl bg-purple-600 text-white hover:bg-purple-500"
              >
                {actionLoading ? "Saving..." : "Update Plan"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
