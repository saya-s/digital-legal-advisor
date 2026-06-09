import {
  BookOpen,
  FileDiff,
  FileText,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Scale,
  Upload,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";
import { useLanguage } from "../../i18n/language.js";
import { clearAuthSession } from "../../utils/authSession.js";

// Show workspace navigation links and handle sign-out for signed-in users.
export default function Sidebar({ collapsed, mobileOpen, setMobileOpen }) {
  // Read whether the desktop menu is small or the mobile menu is open.
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  // Central list of workspace links used to render the sidebar buttons.
  const links = [
    {
      name: t("sidebar.dashboard"),
      icon: <LayoutDashboard size={20} />,
      path: "/dashboard",
    },
    { name: t("sidebar.analyze"), icon: <Upload size={20} />, path: "/upload" },
    { name: t("sidebar.compare"), icon: <FileDiff size={20} />, path: "/compare" },
    { name: t("sidebar.qa"), icon: <MessageSquare size={20} />, path: "/qa" },
    {
      name: t("sidebar.dictionary"),
      icon: <BookOpen size={20} />,
      path: "/dictionary",
    },
    { name: t("sidebar.templates"), icon: <FileText size={20} />, path: "/templates" },
    { name: t("sidebar.lawyers"), icon: <Scale size={20} />, path: "/lawyers" },
  ];

  return (
    <>
      {/* Dark overlay behind the mobile sidebar; clicking it closes the menu. */}
      {/* Darken the page only while the mobile menu is open. */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[60] bg-brand-ink/60 backdrop-blur-sm md:hidden" 
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar width and slide-in behavior both depend on collapsed/mobile state. */}
      {/* Change the sidebar width and position for each menu state. */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-[70] md:static
        ${collapsed ? "w-20" : "w-64"}
        flex flex-col border-r border-brand-line bg-white shadow-panel transition-all duration-300 ease-in-out md:shadow-none
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
      `}
      >
        {/* Sidebar brand area with home link and mobile close button. */}
        <div className="flex items-center justify-between p-6">
          <div
            onClick={() => navigate("/")}
            className="flex cursor-pointer items-center gap-3"
          >
            <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
            {!collapsed && (
              /* Hide the wordmark when the desktop sidebar is collapsed. */
              <h1 className="text-xl font-black tracking-tight text-brand-ink">
                Misharu
              </h1>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-xl p-2 text-slate-400 transition hover:bg-brand-surface hover:text-brand-ink md:hidden"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation buttons are built from the shared links array above. */}
        <nav className="flex-1 px-4 mt-4 space-y-1">
          {/* Create one sidebar button for every link above. */}
          {links.map((link) => {
            // Mark a link active when the current pathname matches that section.
            const active =
              location.pathname === link.path ||
              location.pathname.startsWith(`${link.path}/`);

            return (
              <button
                key={link.path}
                type="button"
                onClick={() => {
                  navigate(link.path);
                  setMobileOpen(false);
                }}
                className={`group flex w-full items-center gap-3 rounded-2xl p-3 transition-all ${
                  active
                    ? "bg-brand-ink text-white shadow-lg shadow-brand-ink/15"
                    : "text-slate-500 hover:bg-brand-surface hover:text-brand-ink"
                }`}
              >
                <span
                  className={`${
                    active
                      ? "text-brand-accent"
                      : "text-slate-400 group-hover:text-brand-accentDeep"
                  }`}
                >
                  {link.icon}
                </span>
                {!collapsed && (
                  <span className="text-sm font-bold">{link.name}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sign-out clears the saved session, closes mobile nav, and returns home. */}
        <div className="border-t border-brand-line p-4">
          <button
            type="button"
            onClick={() => {
              clearAuthSession();
              setMobileOpen(false);
              navigate("/");
            }}
            className="flex w-full items-center gap-3 rounded-2xl p-3 text-sm font-bold text-brand-danger transition-colors hover:bg-brand-surface"
          >
            <LogOut size={18} />
            {!collapsed && t("sidebar.signOut")}
          </button>
        </div>
      </aside>
    </>
  );
}
