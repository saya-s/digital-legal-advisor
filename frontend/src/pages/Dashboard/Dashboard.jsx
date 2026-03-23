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
            className="font-medium text-[#F8F7F2] bg-[#1A2035] hover:bg-[#303658] transition px-6 py-2 rounded-full "
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

      {/* FOOTER */}
      <footer className="bg-[#1A2035] text-[#F8F7F2] px-8 py-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-3">Misharu</h2>
            <p className="text-sm text-slate-300">
              Simplifying contracts with AI. Understand risks, clauses, and
              legal terms instantly.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Explore</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="hover:text-[#D4AF37] cursor-pointer">Features</li>
              <li className="hover:text-[#D4AF37] cursor-pointer">How it Works</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Team</h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>Saya Sardar</li>
              <li>Sewa Adnan</li>
              <li className="text-slate-400">Capstone Project 2026</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-600 mt-10 pt-6 text-center text-sm text-slate-400">
          © 2026 Misharu. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
