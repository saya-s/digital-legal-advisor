import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { hasAuthSession } from "../../utils/authSession.js";
import { navigateToSection } from "../../utils/sectionNavigation.jsx";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const isSignedIn = hasAuthSession();

  // Keep the public navbar focused on the pages guests can browse.
  const navLinks = [
    { name: "Who It's For", sectionId: "who-its-for" },
    { name: "How It Works", sectionId: "how-it-works" },
    { name: "Templates", path: "/templates" },
    { name: "Find a Lawyer", path: "/lawyers" },
    { name: "Lawyers", path: "/lawyers" },
  ];

  const handleNavigate = (link) => {
    setIsOpen(false);

    if (link.sectionId) {
      navigateToSection({ id: link.sectionId, location, navigate });
      return;
    }

    navigate(link.path);
  };

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-brand-line bg-brand-surface/90 backdrop-blur-md">
      <div className="section-shell flex items-center justify-between py-4">
        <div
          onClick={() => navigate("/")}
          className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-80"
        >
          <img
            src={logo}
            alt="Misharu Logo"
            className="h-10 w-10 object-contain md:h-12 md:w-12"
          />
          <div>
            <p className="font-display text-2xl font-bold leading-none text-brand-ink">
              Misharu
            </p>
            <p className="hidden text-[10px] font-bold uppercase tracking-widest text-slate-500 md:block">
              Digital Legal Advisor
            </p>
          </div>
        </div>

        <div className="hidden items-center space-x-7 md:flex">
          {navLinks.map((link) => {
            const active = link.sectionId
              ? location.pathname === "/" &&
                location.hash === `#${link.sectionId}`
              : location.pathname === link.path;

            return (
              <button
                key={link.name}
                type="button"
                onClick={() => handleNavigate(link)}
                className={`text-sm font-semibold transition-colors ${
                  active
                    ? "text-brand-ink"
                    : "text-slate-600 hover:text-brand-accent"
                }`}
              >
                {link.name}
              </button>
            );
          })}

          <div className="mx-1 h-5 w-px bg-slate-300" />

          {isSignedIn ? (
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="cta-primary"
            >
              Dashboard
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sm font-semibold text-brand-ink transition hover:text-brand-accent"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="cta-primary"
              >
                Create Account
              </button>
            </>
          )}
        </div>

        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label="Toggle navigation menu"
            className="p-2 text-brand-ink transition"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute left-0 top-full w-full border-b border-brand-line bg-brand-surface shadow-panel md:hidden"
          >
            <div className="section-shell flex flex-col gap-5 py-8">
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  type="button"
                  onClick={() => handleNavigate(link)}
                  className="text-left text-lg font-bold text-brand-ink transition hover:text-brand-accent"
                >
                  {link.name}
                </button>
              ))}

              <div className="border-t border-brand-line pt-5">
                {isSignedIn ? (
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="w-full rounded-2xl bg-brand-ink px-4 py-4 text-sm font-bold text-white"
                  >
                    Dashboard
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="mb-3 w-full rounded-2xl border border-brand-ink px-4 py-4 text-sm font-bold text-brand-ink"
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/register")}
                      className="w-full rounded-2xl bg-brand-ink px-4 py-4 text-sm font-bold text-white"
                    >
                      Create Account
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
