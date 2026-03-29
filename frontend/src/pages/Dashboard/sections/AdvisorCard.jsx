// components/dashboard/AdvisorCard.jsx
import { ArrowRight, ShieldCheck } from "lucide-react";

export default function AdvisorCard() {
  return (
    <div className="bg-[#1A2035] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="text-[#D4AF37]" size={24} />
          <h3 className="text-lg font-bold uppercase tracking-tight">
            AI Advisor Status
          </h3>
        </div>
        <p className="text-slate-300 text-sm mb-6 leading-relaxed max-w-md">
          "Mohammad, your last supplier contract has{" "}
          <span className="text-[#D4AF37] font-bold">2 high-risk clauses</span>{" "}
          regarding late delivery fees. I recommend reviewing the 'Termination'
          section."
        </p>
        <button className="flex items-center gap-2 bg-[#D4AF37] text-[#1A2035] px-5 py-2.5 rounded-xl font-black text-xs hover:scale-105 transition">
          VIEW FULL RECOMMENDATION <ArrowRight size={16} />
        </button>
      </div>
      {/* Decorative Gold Glow */}
      <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#D4AF37] opacity-10 rounded-full blur-3xl"></div>
    </div>
  );
}
