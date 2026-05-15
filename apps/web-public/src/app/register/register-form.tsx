"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { CheckCircle2, ArrowRight, ArrowLeft, Building2, User, CreditCard } from "lucide-react";

const schema = z.object({
  instituteName: z.string().min(2, "Institute name is required"),
  instituteSlug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens"),
  ownerName: z.string().min(2, "Owner name is required"),
  ownerEmail: z.string().email("Valid email required"),
  ownerPhone: z.string().optional(),
  password: z.string().min(8, "Minimum 8 characters"),
  planKey: z.enum(["starter", "growth", "pro"]),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const steps = [
  { id: 1, label: "Institute", icon: Building2 },
  { id: 2, label: "Owner", icon: User },
  { id: 3, label: "Plan", icon: CreditCard },
];

export function RegisterForm() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
    trigger,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      planKey: (searchParams.get("plan") as "starter" | "growth" | "pro") || "growth",
    },
  });

  const selectedPlan = watch("planKey");

  const nextStep = async () => {
    let valid = false;
    if (step === 1) {
      valid = await trigger(["instituteName", "instituteSlug", "addressLine1", "city", "state", "pincode"]);
    } else if (step === 2) {
      valid = await trigger(["ownerName", "ownerEmail", "ownerPhone", "password"]);
    }
    if (valid) setStep((s) => Math.min(s + 1, 3));
  };

  const onSubmit = async (values: FormValues) => {
    setError(null);
    try {
      await api.post("/auth/register-institute", values);
      setSuccess(true);
    } catch (err: unknown) {
      const message =
        typeof err === "object" && err && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Registration failed"
          : "Registration failed";
      setError(message);
    }
  };

  if (success) {
    return (
      <div className="pt-32 pb-20">
        <div className="mx-auto max-w-lg px-6 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#86e3ce]/10">
            <CheckCircle2 className="h-10 w-10 text-[#86e3ce]" />
          </div>
          <h1 className="text-3xl font-bold text-white">Registration Successful!</h1>
          <p className="mt-4 text-slate-400">
            Your institute has been registered. Check your email for login credentials and next steps.
          </p>
          <a
            href="/login-options"
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#1a1a1a] bg-gradient-to-r from-[#f4b860] to-[#e09530] rounded-xl hover:shadow-lg hover:shadow-[#f4b860]/25 transition-all"
          >
            Go to Login
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20">
      <div className="mx-auto max-w-2xl px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-sm font-semibold text-[#f4b860] uppercase tracking-wider mb-3">Register</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Register Your Institute</h1>
          <p className="mt-3 text-slate-400">Set up your institute in just 3 steps.</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <button
                onClick={() => s.id < step && setStep(s.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  step === s.id
                    ? "bg-[#f4b860] text-[#1a1a1a]"
                    : step > s.id
                    ? "bg-[#86e3ce]/20 text-[#86e3ce]"
                    : "bg-white/5 text-slate-500"
                }`}
              >
                <s.icon className="h-4 w-4" />
                {s.label}
              </button>
              {i < steps.length - 1 && <div className="w-8 h-px bg-white/10" />}
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
            {/* Step 1: Institute Details */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-white mb-4">Institute Details</h2>
                <div className="space-y-2">
                  <Label htmlFor="reg-institute-name">Institute Name *</Label>
                  <Input id="reg-institute-name" placeholder="Vedant Classes" {...register("instituteName")} />
                  {errors.instituteName && <p className="text-xs text-red-400">{errors.instituteName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-slug">Institute Slug *</Label>
                  <div className="flex items-center gap-2">
                    <Input id="reg-slug" placeholder="vedant-classes" {...register("instituteSlug")} />
                    <span className="text-xs text-slate-500 whitespace-nowrap">.vedas.app</span>
                  </div>
                  {errors.instituteSlug && <p className="text-xs text-red-400">{errors.instituteSlug.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-address">Address</Label>
                  <Input id="reg-address" placeholder="Street / Area" {...register("addressLine1")} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-city">City</Label>
                    <Input id="reg-city" placeholder="Indore" {...register("city")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-state">State</Label>
                    <Input id="reg-state" placeholder="MP" {...register("state")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-pincode">Pincode</Label>
                    <Input id="reg-pincode" placeholder="452001" {...register("pincode")} />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="button" onClick={nextStep}>
                    Next <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Owner Details */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-white mb-4">Owner Details</h2>
                <div className="space-y-2">
                  <Label htmlFor="reg-owner-name">Full Name *</Label>
                  <Input id="reg-owner-name" placeholder="Aditi Sharma" {...register("ownerName")} />
                  {errors.ownerName && <p className="text-xs text-red-400">{errors.ownerName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-owner-email">Email *</Label>
                  <Input id="reg-owner-email" type="email" placeholder="owner@example.com" {...register("ownerEmail")} />
                  {errors.ownerEmail && <p className="text-xs text-red-400">{errors.ownerEmail.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-owner-phone">Phone</Label>
                  <Input id="reg-owner-phone" placeholder="9876543210" {...register("ownerPhone")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password *</Label>
                  <Input id="reg-password" type="password" placeholder="Minimum 8 characters" {...register("password")} />
                  {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
                </div>
                <div className="flex justify-between pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button type="button" onClick={nextStep}>
                    Next <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Plan Selection */}
            {step === 3 && (
              <div className="space-y-5">
                <h2 className="text-lg font-semibold text-white mb-4">Choose Your Plan</h2>
                <div className="grid grid-cols-3 gap-3">
                  {(["starter", "growth", "pro"] as const).map((plan) => (
                    <button
                      key={plan}
                      type="button"
                      onClick={() => setValue("planKey", plan)}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        selectedPlan === plan
                          ? "border-[#f4b860] bg-[#f4b860]/10"
                          : "border-white/10 bg-white/[0.02] hover:border-white/20"
                      }`}
                    >
                      <p className={`text-sm font-semibold capitalize ${selectedPlan === plan ? "text-[#f4b860]" : "text-white"}`}>
                        {plan}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {plan === "starter" ? "₹999/mo" : plan === "growth" ? "₹2,499/mo" : "₹4,999/mo"}
                      </p>
                    </button>
                  ))}
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <div className="flex justify-between pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(2)}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Registering..." : "Register Institute"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
