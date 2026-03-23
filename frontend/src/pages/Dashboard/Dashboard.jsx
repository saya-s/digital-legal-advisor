import { BrainCircuit, FileSearch, Scale, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8F7F2] text-[#1A2035]">
      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-12 py-6">
        <h1 
          className="text-3xl font-bold tracking-tight cursor-pointer" 
          onClick={() => navigate("/")}
        >
          Misharu
        </h1>
        <div className="space-x-6">
          <button
            className="font-medium hover:text-[#D4AF37] transition"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
          <button
            className="px-6 py-2 bg-[#1A2035] text-[#F8F7F2] rounded-full font-medium hover:bg-[#303658] transition"
            onClick={() => navigate("/register")}
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="text-center py-20 px-4">
        <h2 className="text-5xl font-extrabold mb-6 leading-tight">
          Understand Every Contract <br /> Before You Sign.
        </h2>
        <p className="text-xl text-slate-700 mb-10 max-w-2xl mx-auto">
          Ancient wisdom, modern AI. Get simple explanations, risk detection,
          and professional guidance instantly.
        </p>
        <button
          className="px-8 py-4 bg-[#D4AF37] text-[#1A2035] rounded-xl text-lg font-bold hover:bg-[#B85C38] hover:text-white transition shadow-lg"
          onClick={() => navigate("/register")}
        >
          Start Your Free Analysis
        </button>
      </section>

      {/* FEATURES GRID */}
      <section className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 pb-20 px-4">
        {[
          {
            title: "Risk Detection",
            desc: "Highlight dangerous clauses automatically.",
            icon: <ShieldCheck />,
            path: "/upload",
          },
          {
            title: "Plain Language",
            desc: "Turn complex legal text into simple advice.",
            icon: <BrainCircuit />,
            path: "/qa",
          },
          {
            title: "Template Library",
            desc: "Access verified, ready-to-use contracts.",
            icon: <FileSearch />,
            path: "/templates",
          },
          {
            title: "Find Lawyers",
            desc: "Connect with experts in your city.",
            icon: <Scale />,
            path: "/lawyers",
          },
        ].map((feat, i) => (
          <button
            key={i}
            onClick={() => navigate(feat.path)}
            className="p-8 bg-[#FFFFFF] border border-[#E5E5E0] rounded-3xl flex items-start gap-4 shadow-sm hover:border-[#D4AF37] hover:shadow-md text-left transition-all active:scale-[0.98]"
          >
            <div className="text-[#D4AF37] scale-125 mt-1">{feat.icon}</div>
            <div>
              <h3 className="font-bold text-xl mb-1">{feat.title}</h3>
              <p className="text-slate-600">{feat.desc}</p>
            </div>
          </button>
        ))}
      </section>
    </div>
  );
}
