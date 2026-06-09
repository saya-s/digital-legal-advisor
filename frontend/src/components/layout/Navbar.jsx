import { AnimatePresence, motion } from "framer-motion"; //these animations make the mobile menu fade and slide in/out smoothly
import { Menu, X } from "lucide-react";
import { useState } from "react"; // This manages the open/closed state of the mobile menu
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { useLanguage } from "../../i18n/language.js";
import { hasAuthSession } from "../../utils/authSession.js";
import { navigateToSection } from "../../utils/sectionNavigation.jsx";
import LanguageSwitcher from "./LanguageSwitcher.jsx";

// This is the top navigation used on public pages.
export default function Navbar() {
  // These helpers open pages and tell us which page is active.
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  // This decides if the mobile menu is open.
  const [isOpen, setIsOpen] = useState(false); //useState(false) creates a state variable called isOpen, which starts as false (meaning the mobile menu is closed). setIsOpen is a function we can call to change the value of isOpen. When we click the menu button, we call setIsOpen(!isOpen) to toggle it between true and false, which opens or closes the mobile menu.
  // This checks if the user is signed in.
  const isSignedIn = hasAuthSession();

  // These are the links shown in the navbar.
  const navLinks = [
    { name: t("navbar.links.whoItsFor"), sectionId: "who-its-for" },
    { name: t("navbar.links.howItWorks"), sectionId: "how-it-works" },
    { name: t("navbar.links.templates"), path: "/templates" }, //because templates is a separate page, not a section on the landing page.
    { name: t("navbar.links.lawyers"), path: "/lawyers" },
  ];

  // Close the mobile menu, then go to a section or another page.
  const handleNavigate = (link) => {
    setIsOpen(false);

    if (link.sectionId) {
      navigateToSection({ id: link.sectionId, location, navigate });
      return;
    }

    navigate(link.path);
  };

  return (
    // Top bar that stays visible while scrolling.
    // Keep the bar visible above the page while the user scrolls.
    <nav className="fixed top-0 z-50 w-full border-b border-brand-line bg-brand-surface/90 backdrop-blur-md">
      {/* Main row with logo, links, and buttons. */}
      <div className="section-shell flex items-center justify-between py-4">
        {/* Brand logo. Clicking it goes to the home page. */}
        <div
          onClick={() => navigate("/")}
          className="flex cursor-pointer items-center gap-2 transition-opacity hover:opacity-80"
        >
          <img
            src={logo}
            alt="Misharu Logo"
            className="h-10 w-10 object-contain md:h-12 md:w-12" //object-contain means the image will scale to fit within the given height and width.
          />
          <div>
            <p className="font-display text-2xl font-bold leading-none text-brand-ink">
              Misharu
            </p>
            <p className="hidden text-[10px] font-bold uppercase tracking-widest text-slate-500 md:block">
              {t("navbar.brandTagline")}
            </p>
          </div>
        </div>

        {/* Desktop links and sign-in buttons. */}
        {/* Use these links on larger screens; phones use the menu below. */}
        <div className="hidden items-center gap-7 md:flex">
          {/* for each link, create a button  */}
          {navLinks.map((link) => {
            // This marks the current page or section as active.
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
          <LanguageSwitcher compact />
          {/* A small divider line between the links and the sign-in buttons. */}
          <div className="mx-1 h-5 w-px bg-slate-300" />
          {/* Signed-in users see Dashboard. Guests see login/register. */}
          {/* Show Dashboard when signed in; otherwise show Login and Register. */}
          {isSignedIn ? (
            <button
              type="button"
              onClick={()  => navigate("/dashboard")}
              className="cta-primary"
            >
              {t("navbar.dashboard")}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sm font-semibold text-brand-ink transition hover:text-brand-accent"
              >
                {t("navbar.signIn")}
              </button>
              <button
                type="button"
                onClick={() => navigate("/register")}
                className="cta-primary"
              >
                {t("navbar.createAccount")}
              </button>
            </>
          )}
        </div>

        {/* Small-screen menu button. */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher compact />
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label={t("navbar.toggleMenu")}
            className="p-2 text-brand-ink transition"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile menu. */}
      {/* Let the mobile menu finish its closing animation smoothly. */}
      <AnimatePresence>
        {/* Show the mobile menu only after its button is opened. */}
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute left-0 top-full w-full border-b border-brand-line bg-brand-surface shadow-panel md:hidden"
          >
            {/* Mobile links and buttons. */}
            <div className="section-shell flex flex-col gap-5 py-8">
              <LanguageSwitcher />
              {/* Repeat the same navigation links inside the mobile menu. */}
              {navLinks.map((link) => (
                <button
                  key={link.name}
                  type="button"
                  onClick={() => handleNavigate(link)}
                  className="text-start text-lg font-bold text-brand-ink transition hover:text-brand-accent"
                >
                  {link.name}
                </button>
              ))}

              <div className="border-t border-brand-line pt-5">
                {/* Same button logic as desktop, just stacked for mobile. */}
                {isSignedIn ? (
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="w-full rounded-2xl bg-brand-ink px-4 py-4 text-sm font-bold text-white"
                  >
                    {t("navbar.dashboard")}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="mb-3 w-full rounded-2xl border border-brand-ink px-4 py-4 text-sm font-bold text-brand-ink"
                    >
                      {t("navbar.signIn")}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/register")}
                      className="w-full rounded-2xl bg-brand-ink px-4 py-4 text-sm font-bold text-white"
                    >
                      {t("navbar.createAccount")}
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
