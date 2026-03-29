import { useNavigate } from "react-router-dom";

export default function Footer() {
  const navigate = useNavigate();

  // Helper to handle smooth scrolling to the "How it Works" section
  const handleScrollTo = (id) => {
    if (window.location.pathname === "/") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/");
      setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  return (
    <footer className="bg-[#1A2035] text-[#F8F7F2] pt-16 pb-8 px-6 md:px-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          {/* COLUMN 1: BRAND & VISION */}
          <div className="col-span-2 md:col-span-1">
            <h2 className="text-2xl font-bold mb-4 text-white">Misharu</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Simplifying legal complexity with AI. Built to protect businesses
              and individuals through clear, accessible analysis.
            </p>
          </div>

          {/* COLUMN 2: ANALYSIS TOOLS (From: Upload, QA, Lawyers) */}
          <div>
            <h3 className="font-bold mb-5 text-[#D4AF37] uppercase tracking-wider text-xs">
              Analysis Tools
            </h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li
                onClick={() => navigate("/upload")}
                className="hover:text-[#D4AF37] cursor-pointer transition"
              >
                Upload & Analyze
              </li>
              <li
                onClick={() => navigate("/qa")}
                className="hover:text-[#D4AF37] cursor-pointer transition"
              >
                AI Legal Chat
              </li>
              <li
                onClick={() => navigate("/lawyers")}
                className="hover:text-[#D4AF37] cursor-pointer transition"
              >
                Lawyer Finder
              </li>
            </ul>
          </div>

          {/* COLUMN 3: RESOURCES (From: Templates, Dashboard, Landing) */}
          <div>
            <h3 className="font-bold mb-5 text-[#D4AF37] uppercase tracking-wider text-xs">
              Resources
            </h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li
                onClick={() => navigate("/templates")}
                className="hover:text-[#D4AF37] cursor-pointer transition"
              >
                Contract Templates
              </li>
              <li
                onClick={() => navigate("/dashboard")}
                className="hover:text-[#D4AF37] cursor-pointer transition"
              >
                User Dashboard
              </li>
              <li
                onClick={() => handleScrollTo("how-it-works")}
                className="hover:text-[#D4AF37] cursor-pointer transition"
              >
                How it Works
              </li>
            </ul>
          </div>

          {/* COLUMN 4: PROJECT TEAM */}
          <div>
            <h3 className="font-bold mb-5 text-[#D4AF37] uppercase tracking-wider text-xs">
              The Team
            </h3>
            <ul className="text-sm text-slate-300 mb-6 space-y-2">
              <li>Saya Sardar Mohammed</li>
              <li>Sewa Adnan Mustafa</li>
              <li className="text-slate-500 text-xs pt-2">
                Capstone Project 2026
              </li>
            </ul>
            <p className="text-[10px] text-slate-500 italic leading-snug border-t border-slate-700 pt-4">
              Disclaimer: Misharu is an AI-assisted platform. All analysis
              should be verified by a legal professional.
            </p>
          </div>
        </div>

        {/* BOTTOM BAR: COPYRIGHT & LEGAL */}
        <div className="border-t border-slate-700/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© 2026 Misharu. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-white cursor-pointer transition">
              Privacy Policy
            </span>
            <span className="hover:text-white cursor-pointer transition">
              Terms of Service
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
