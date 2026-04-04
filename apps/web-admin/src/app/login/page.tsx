"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
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
      await login(values.email, values.password);
      const stored = window.localStorage.getItem("vedas_user");
      const role = stored ? (JSON.parse(stored) as { role?: string }).role : undefined;
      if (role === "student") {
        router.push("/portal/student");
        return;
      }
      if (role === "teacher") {
        router.push("/portal/teacher");
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      const message =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Login failed"
          : err instanceof Error
          ? err.message
          : "Login failed";
      setError(message);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-6 py-16">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">VEDAS</p>
          <h1 className="mt-3 text-3xl font-semibold">Admin Login</h1>
          <p className="mt-2 text-sm text-slate-400">Sign in to manage your institute.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="admin@institute.com" {...register("email")} />
            {errors.email && <p className="text-xs text-red-300">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register("password")} />
            {errors.password && <p className="text-xs text-red-300">{errors.password.message}</p>}
          </div>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Login"}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm text-slate-400">
          <a href="/reset-password" className="underline hover:text-white">
            Forgot password?
          </a>
        </div>
      </div>
    </div>
  );
}
