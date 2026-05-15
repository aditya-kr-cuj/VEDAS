import { Quote } from "lucide-react";

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  institute: string;
}

export function TestimonialCard({ quote, author, role, institute }: TestimonialCardProps) {
  return (
    <div className="relative rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition-all duration-300 hover:border-white/15">
      <Quote className="h-8 w-8 text-[#f4b860]/30 mb-4" />
      <p className="text-sm text-slate-300 leading-relaxed mb-6">&ldquo;{quote}&rdquo;</p>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#f4b860]/20 to-[#86e3ce]/20 flex items-center justify-center">
          <span className="text-sm font-bold text-[#f4b860]">{author.charAt(0)}</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{author}</p>
          <p className="text-xs text-slate-500">{role}, {institute}</p>
        </div>
      </div>
    </div>
  );
}
