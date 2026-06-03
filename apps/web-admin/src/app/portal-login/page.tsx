"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, BookOpen, Eye, EyeOff, ArrowLeft } from "lucide-react";
import Link from "next/link";

type RoleOption = "student" | "teacher";

const webPublicUrl = process.env.NEXT_PUBLIC_WEB_PUBLIC_URL ?? "http://localhost:3001";

export default function PortalLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [loginAs, setLoginAs] = useState<RoleOption>("student");
  const [instituteCode, setInstituteCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password, instituteCode);

      // Check stored role matches selection
      const stored = window.localStorage.getItem("vedas_user");
      const user = stored ? (JSON.parse(stored) as { role?: string }) : null;
      const role = user?.role;

      if (loginAs === "student" && role !== "student") {
        window.localStorage.removeItem("vedas_user");
        window.localStorage.removeItem("vedas_access_token");
        window.localStorage.removeItem("vedas_refresh_token");
        throw new Error(
          "This account is not a student. Please select the correct role or use the Institute Admin login."
        );
      }

      if (loginAs === "teacher" && role !== "teacher") {
        window.localStorage.removeItem("vedas_user");
        window.localStorage.removeItem("vedas_access_token");
        window.localStorage.removeItem("vedas_refresh_token");
        throw new Error(
          "This account is not a teacher. Please select the correct role or use the Institute Admin login."
        );
      }

      // Redirect to correct portal
      if (role === "student") {
        router.push("/portal/student");
      } else if (role === "teacher") {
        router.push("/portal/teacher");
      }
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message ?? "Login failed"
          : err instanceof Error
          ? err.message
          : "Login failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const roles: { key: RoleOption; label: string; icon: React.ReactNode; emoji: string }[] = [
    {
      key: "student",
      label: "Student",
      icon: <GraduationCap className="h-6 w-6" />,
      emoji: "🎓",
    },
    {
      key: "teacher",
      label: "Teacher",
      icon: <BookOpen className="h-6 w-6" />,
      emoji: "👨‍🏫",
    },
  ];

  return (
    <div className="min-h-screen grid place-items-center px-6 py-16">
      <div className="w-full max-w-md">
        {/* Back link */}
        <Link
          href={`${webPublicUrl}/login-options`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login options
        </Link>

        <div className="rounded-3xl border border-[#86e3ce]/20 bg-gradient-to-b from-[#86e3ce]/[0.04] to-transparent p-8 shadow-2xl backdrop-blur">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#86e3ce]/10">
              <GraduationCap className="h-7 w-7 text-[#86e3ce]" />
            </div>
            <h1 className="text-2xl font-semibold text-white">
              Student & Teacher Portal
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Sign in to access your dashboard
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role Selection */}
            <div>
              <Label className="mb-2 block text-slate-300">I am a:</Label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => setLoginAs(r.key)}
                    className={`rounded-xl border-2 p-4 text-center transition-all ${
                      loginAs === r.key
                        ? "border-[#86e3ce]/60 bg-[#86e3ce]/10 text-[#86e3ce] shadow-sm shadow-[#86e3ce]/10"
                        : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <div className="mb-1 text-2xl">{r.emoji}</div>
                    <div className="text-sm font-medium">{r.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Institute Code */}
            <div>
              <Label htmlFor="portal-code">Institute Code</Label>
              <Input
                id="portal-code"
                type="text"
                placeholder="e.g. VDT-A7K"
                value={instituteCode}
                onChange={(e) => setInstituteCode(e.target.value.toUpperCase())}
                className="mt-1.5 font-mono uppercase tracking-wider"
                required
              />
              <p className="mt-1 text-xs text-slate-500">
                Ask your institute admin for the code
              </p>
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="portal-email">
                {loginAs === "student" ? "Student Email" : "Teacher Email"}
              </Label>
              <Input
                id="portal-email"
                type="email"
                placeholder={
                  loginAs === "student"
                    ? "student@example.com"
                    : "teacher@example.com"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="portal-password">Password</Label>
              <div className="relative mt-1.5">
                <Input
                  id="portal-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#86e3ce] to-[#5bc4ad] text-slate-900 font-medium hover:from-[#6fd6bf] hover:to-[#4ab89e] disabled:opacity-50"
            >
              {isLoading
                ? "Signing in..."
                : `Sign in as ${loginAs === "student" ? "Student" : "Teacher"}`}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-6 space-y-2 text-center text-sm text-slate-500">
            <p>Forgot password? Contact your institute admin.</p>
            <p>
              Are you an admin?{" "}
              <Link
                href="/login"
                className="text-[#f4b860] hover:text-[#e8a645] hover:underline"
              >
                Institute Admin Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
