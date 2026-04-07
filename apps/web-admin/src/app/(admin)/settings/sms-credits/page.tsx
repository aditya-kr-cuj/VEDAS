"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CreditInfo {
  total: number;
  used: number;
  available: number;
  lowThreshold: number;
  isLow: boolean;
}

export default function SmsCreditsPage() {
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [addAmount, setAddAmount] = useState("");
  const [adding, setAdding] = useState(false);
  const [success, setSuccess] = useState("");

  const fetchCredits = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications/sms/credits");
      setCredits(res.data.credits);
    } catch {
      console.error("Failed to load SMS credits");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredits();
  }, []);

  const handleAddCredits = async () => {
    const amount = Number(addAmount);
    if (!amount || amount <= 0) return;

    setAdding(true);
    setSuccess("");
    try {
      const res = await api.post("/notifications/sms/credits", { amount });
      setCredits(res.data.credits);
      setAddAmount("");
      setSuccess(`Added ${amount} credits successfully`);
      setTimeout(() => setSuccess(""), 4000);
    } catch {
      console.error("Failed to add credits");
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-[var(--accent)]" />
      </div>
    );
  }

  const total = credits?.total ?? 0;
  const used = credits?.used ?? 0;
  const available = credits?.available ?? 0;
  const percentage = total > 0 ? Math.round((used / total) * 100) : 0;
  const circumference = 2 * Math.PI * 56;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">SMS Credits</h2>
        <p className="mt-1 text-sm text-slate-400">
          Manage your institute&apos;s SMS credit balance
        </p>
      </div>

      {/* Credit Balance Card */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Circular Progress Card */}
        <Card className="sm:col-span-2 lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <div className="relative">
              <svg width="136" height="136" className="-rotate-90">
                {/* Background circle */}
                <circle
                  cx="68"
                  cy="68"
                  r="56"
                  fill="none"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="10"
                />
                {/* Progress circle */}
                <circle
                  cx="68"
                  cy="68"
                  r="56"
                  fill="none"
                  stroke={credits?.isLow ? "#f87171" : "#34d399"}
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-700 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{available}</span>
                <span className="text-[10px] uppercase tracking-wider text-slate-500">
                  available
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              {used} of {total} credits used
            </p>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <h3 className="text-sm font-medium text-slate-400">Balance Details</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Total Credits</span>
                <span className="text-lg font-semibold text-white">{total.toLocaleString()}</span>
              </div>
              <div className="h-px bg-white/5" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Used</span>
                <span className="text-lg font-semibold text-amber-400">{used.toLocaleString()}</span>
              </div>
              <div className="h-px bg-white/5" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Available</span>
                <span className={`text-lg font-semibold ${credits?.isLow ? "text-red-400" : "text-emerald-400"}`}>
                  {available.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Credits Card */}
        <Card>
          <CardContent className="flex flex-col gap-4 p-6">
            <h3 className="text-sm font-medium text-slate-400">Add Credits</h3>
            <p className="text-xs text-slate-500">
              Enter the number of SMS credits to add to your balance.
            </p>
            <Input
              id="sms-credit-amount"
              type="number"
              placeholder="e.g. 500"
              min="1"
              max="100000"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
              className="bg-slate-900/80"
            />
            <Button
              id="add-sms-credits-btn"
              onClick={handleAddCredits}
              disabled={adding || !addAmount || Number(addAmount) <= 0}
            >
              {adding ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Adding…
                </span>
              ) : (
                "Add Credits"
              )}
            </Button>
            {success && (
              <span className="flex items-center gap-1 text-sm text-emerald-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {success}
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Credit Warning */}
      {credits?.isLow && (
        <Card className="border-red-500/20">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-red-400">Low SMS Credits</p>
              <p className="mt-0.5 text-xs text-slate-400">
                Your SMS credit balance is below the threshold of{" "}
                {credits.lowThreshold}. Add more credits to ensure
                uninterrupted SMS delivery.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Credit Cost Info */}
      <Card>
        <CardContent className="p-6">
          <h3 className="mb-3 text-sm font-medium text-slate-400">SMS Credit Rates</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-white/[0.03] p-4">
              <p className="text-xs text-slate-500">Fee Reminders</p>
              <p className="mt-1 text-sm text-slate-200">1 credit / SMS</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-4">
              <p className="text-xs text-slate-500">Test Alerts</p>
              <p className="mt-1 text-sm text-slate-200">1 credit / SMS</p>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-4">
              <p className="text-xs text-slate-500">Emergency Announcements</p>
              <p className="mt-1 text-sm text-slate-200">1 credit / SMS</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
