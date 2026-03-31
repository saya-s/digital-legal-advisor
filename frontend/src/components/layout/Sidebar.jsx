import {
  BookOpen,
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

export default function Sidebar({ collapsed, mobileOpen, setMobileOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  const links = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard size={20} />,
      path: "/Dashboard",
    },
    { name: "Analyze", icon: <Upload size={20} />, path: "/Upload" },
    { name: "AI Legal Chat", icon: <MessageSquare size={20} />, path: "/qa" },
    {
      name: "Legal Dictionary",
      icon: <BookOpen size={20} />,
      path: "/dictionary",
    },
    { name: "Templates", icon: <FileText size={20} />, path: "/Templates" },
    { name: "Lawyers", icon: <Scale size={20} />, path: "/lawyers" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[#1A2035]/60 backdrop-blur-sm z-[60] md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
        fixed md:static inset-y-0 left-0 z-[70]
        ${collapsed ? "w-20" : "w-64"}
        bg-white border-r border-[#E5E5E0] flex flex-col transition-all duration-300 ease-in-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
      `}
      >
        <div className="p-6 flex items-center justify-between">
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-3 cursor-pointer"
          >
            <img src={logo} alt="Logo" className="w-8 h-8 object-contain" />
            {!collapsed && (
              <h1 className="text-xl font-black text-[#1A2035] tracking-tight">
                Misharu
              </h1>
            )}
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 px-4 mt-4 space-y-1">
          {links.map((link) => {
            const active = location.pathname === link.path;
            return (
              <button
                key={link.path}
                onClick={() => {
                  navigate(link.path);
                  setMobileOpen(false);
                }}
                className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all group ${
                  active
                    ? "bg-[#1A2035] text-white shadow-lg shadow-[#1A2035]/20"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`${active ? "text-[#D4AF37]" : "text-slate-400 group-hover:text-[#1A2035]"}`}
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

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => {
              localStorage.clear();
              navigate("/");
            }}
            className="flex items-center gap-3 w-full p-3 text-red-500 hover:bg-red-50 text-sm font-bold rounded-xl transition-colors"
          >
            <LogOut size={18} />
            {!collapsed && "Sign Out"}
          </button>
        </div>
      </aside>
    </>
  );
}
