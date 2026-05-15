import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import Link from "next/link";

interface PricingCardProps {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  planKey: string;
  className?: string;
}

export function PricingCard({
  name,
  price,
  period,
  description,
  features,
  popular = false,
  planKey,
  className,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border p-8 transition-all duration-300 hover:-translate-y-1",
        popular
          ? "border-[#f4b860]/30 bg-gradient-to-b from-[#f4b860]/[0.06] to-transparent shadow-lg shadow-[#f4b860]/5"
          : "border-white/10 bg-white/[0.03] hover:border-white/15",
        className
      )}
    >
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-[#f4b860] to-[#e09530] text-[#1a1a1a]">
            Most Popular
          </span>
        </div>
      )}

      <h3 className="text-lg font-semibold text-white">{name}</h3>
      <p className="mt-1 text-sm text-slate-400">{description}</p>

      <div className="mt-6 flex items-baseline gap-1">
        <span className={cn("text-4xl font-bold", popular ? "text-[#f4b860]" : "text-white")}>
          {price}
        </span>
        <span className="text-sm text-slate-500">/{period}</span>
      </div>

      <Link
        href={`/register?plan=${planKey}`}
        className={cn(
          "mt-6 block w-full text-center py-3 rounded-xl text-sm font-semibold transition-all duration-200",
          popular
            ? "bg-gradient-to-r from-[#f4b860] to-[#e09530] text-[#1a1a1a] hover:shadow-lg hover:shadow-[#f4b860]/25"
            : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
        )}
      >
        Get Started
      </Link>

      <ul className="mt-8 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check className={cn("h-4 w-4 mt-0.5 shrink-0", popular ? "text-[#f4b860]" : "text-[#86e3ce]")} />
            <span className="text-sm text-slate-300">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
