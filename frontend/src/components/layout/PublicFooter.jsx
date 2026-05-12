import { useLocation, useNavigate } from "react-router-dom";
import { navigateToSection } from "../../utils/sectionNavigation";

export default function PublicFooter() {
  const navigate = useNavigate();
  const location = useLocation();

  // Links that jump to sections on the landing page.
  const exploreLinks = [
    { label: "Who It's For", sectionId: "who-its-for" },
    { label: "How It Works", sectionId: "how-it-works" },
    { label: "Core Features", sectionId: "core-features" },
  ];

  const publicLinks = [
    { label: "Create Account", path: "/register" },
    { label: "Template Library", path: "/templates" },
    { label: "Find a Lawyer", path: "/lawyers" },
  ];

  return (
    // Full footer block.
    <footer className="border-t border-brand-line bg-brand-ink text-brand-surface">
      <div className="section-shell py-16">
        {/* Footer content in four columns. */}
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand and short project summary. */}
          <div>
            <h2 className="font-display text-3xl font-bold text-white">
              Misharu
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              {" "}
              {/*leading, spacing between lines */}A capstone legal-tech
              platform focused on helping non-lawyers understand contracts
              before they sign.
            </p>
          </div>

          {/* Quick links to landing-page sections. */}
          <div>
            <h3 className="eyebrow">Explore</h3>
            <ul className="mt-5 space-y-3 text-sm text-slate-300">
              {exploreLinks.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() =>
                      navigateToSection({
                        id: link.sectionId,
                        location,
                        navigate,
                      })
                    }
                    className="transition hover:text-brand-accent"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links to public pages. */}
          <div>
            <h3 className="eyebrow">Public Pages</h3>
            <ul className="mt-5 space-y-3 text-sm text-slate-300">
              {publicLinks.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() => navigate(link.path)}
                    className="transition hover:text-brand-accent"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Team names and small disclaimer. */}
          <div>
            <h3 className="eyebrow">Project Team</h3>
            <ul className="mt-5 space-y-2 text-sm text-slate-300">
              <li>Saya Sardar Mohammed</li>
              <li>Sewa Adnan Mustafa</li>
              <li className="pt-2 text-xs text-slate-400">
                Capstone Project 2026
              </li>
            </ul>
            <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-6 text-slate-400">
              AI-assisted explanations can improve clarity and risk awareness,
              but they do not replace licensed legal advice.
            </p>
          </div>
        </div>

        {/* Bottom line of the footer. */}
        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>Copyright 2026 Misharu. All rights reserved.</p>
          <p className="max-w-2xl">
            Designed for people who handle real-life contracts but do not speak
            legal language every day.
          </p>
        </div>
      </div>
    </footer>
  );
}
