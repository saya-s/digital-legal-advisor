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
import { clearAuthSession } from "../../utils/authSession.js";

export default function Sidebar({ collapsed, mobileOpen, setMobileOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/dashboard",
    },
    { name: "Analyze", icon: <Upload size={20} />, path: "/upload" },
    { name: "Compare", icon: <FileDiff size={20} />, path: "/compare" },
    { name: "AI Legal Chat", icon: <MessageSquare size={20} />, path: "/qa" },
    {
      name: "Legal Dictionary",
      icon: <BookOpen size={20} />,
      path: "/dictionary",
    },
    { name: "Templates", icon: <FileText size={20} />, path: "/templates" },
    { name: "Lawyers", icon: <Scale size={20} />, path: "/lawyers" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[60] bg-brand-ink/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
        fixed inset-y-0 left-0 z-[70] md:static
        ${collapsed ? "w-20" : "w-64"}
        flex flex-col border-r border-brand-line bg-white shadow-panel transition-all duration-300 ease-in-out md:shadow-none
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
      `}
      >
        <div className="flex items-center justify-between p-6">
          <div
            onClick={() => navigate("/")}
            className="flex cursor-pointer items-center gap-3"
          >
            <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
            {!collapsed && (
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

        <nav className="flex-1 px-4 mt-4 space-y-1">
          {links.map((link) => {
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
            {!collapsed && "Sign Out"}
          </button>
        </div>
      </aside>
    </>
  );
}
