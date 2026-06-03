import type { Metadata } from "next";
import Link from "next/link";
import { LoginOptionCards } from "@/components/LoginOptionCards";

export const metadata: Metadata = {
  title: "Login",
  description: "Choose your login type — Super Admin, Institute Admin, or Student/Teacher portal.",
};

export default function LoginOptionsPage() {
  return (
    <div className="pt-32 pb-20">
      <div className="mx-auto max-w-4xl px-6">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-14">
          <p className="text-sm font-semibold text-[#f4b860] uppercase tracking-wider mb-3">Login</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Choose Your Portal</h1>
          <p className="mt-3 text-slate-400">
            Select your role to access the right dashboard.
          </p>
        </div>

        {/* Login Cards */}
        <LoginOptionCards />

        {/* Register CTA */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-[#f4b860] hover:underline font-medium">
              Register your institute
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
