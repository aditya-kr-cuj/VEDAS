"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { Shield, ArrowLeft } from "lucide-react";
import Link from "next/link";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export default function SuperAdminLoginPage() {
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      const response = await api.post("/auth/login", {
        email: values.email,
        password: values.password,
      });
      const payload = response.data;

      // Verify this is a super_admin
      if (payload.user?.role !== "super_admin") {
        setError("This login is restricted to Super Admin accounts only.");
        return;
      }

      // Store tokens and redirect to web-admin
      if (typeof window !== "undefined") {
        window.localStorage.setItem("vedas_access_token", payload.tokens.accessToken);
        window.localStorage.setItem("vedas_refresh_token", payload.tokens.refreshToken);
        window.localStorage.setItem("vedas_user", JSON.stringify(payload.user));
        // Redirect to web-admin dashboard
        window.location.href = "http://localhost:3000/dashboard";
      }
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Login failed"
          : "Login failed";
      setError(message);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 flex items-start justify-center">
      <div className="mx-auto max-w-md w-full px-6">
        {/* Back Link */}
        <Link
          href="/login-options"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login options
        </Link>

        <div className="rounded-2xl border border-[#a78bfa]/20 bg-gradient-to-b from-[#a78bfa]/[0.06] to-transparent p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#a78bfa]/10">
              <Shield className="h-7 w-7 text-[#a78bfa]" />
            </div>
            <h1 className="text-2xl font-semibold text-white">Super Admin Login</h1>
            <p className="mt-2 text-sm text-slate-400">
              Platform-level access. For authorized administrators only.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="sa-email">Email</Label>
              <Input id="sa-email" type="email" placeholder="superadmin@vedas.app" {...register("email")} />
              {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sa-password">Password</Label>
              <Input id="sa-password" type="password" placeholder="••••••••" {...register("password")} />
              {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
            </div>

            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full bg-[#a78bfa] hover:bg-[#9b7af5] text-white" disabled={isSubmitting}>
              {isSubmitting ? "Authenticating..." : "Login as Super Admin"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            This portal is restricted to platform super administrators.
            <br />
            If you&apos;re an institute admin,{" "}
            <Link href="/login-options" className="text-[#f4b860] hover:underline">
              use the Institute Login
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
