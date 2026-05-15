import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  accentColor?: string;
  className?: string;
}

export function FeatureCard({
  icon: Icon,
  title,
  description,
  accentColor = "#f4b860",
  className,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition-all duration-300",
        "hover:border-white/15 hover:bg-white/[0.06] hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20",
        className
      )}
    >
      {/* Glow on hover */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(300px circle at 50% 0%, ${accentColor}10, transparent 70%)`,
        }}
      />

      <div className="relative">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-xl mb-4 transition-transform duration-300 group-hover:scale-110"
          style={{
            backgroundColor: `${accentColor}15`,
          }}
        >
          <Icon className="h-6 w-6" style={{ color: accentColor }} />
        </div>

        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
