import { Bell, Menu } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Topbar({ setCollapsed, setMobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();

  const getTitle = () => {
    const path = location.pathname;
    if (path.includes("upload")) return "Analyze Contract";
    if (path.includes("qa")) return "AI Legal Chat";
    if (path.includes("dictionary")) return "Legal Dictionary";
    if (path.includes("templates")) return "Contract Templates";
    if (path.includes("lawyers")) return "Professional Directory";
    return "Account Overview";
  };

  return (
    <div className="flex justify-between items-center px-4 md:px-8 py-4 bg-white border-b border-[#E5E5E0] sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {/* Mobile Toggle (Shown only on small screens) */}
        <button onClick={() => setMobileOpen(true)} className="md:hidden p-1">
          <Menu size={24} />
        </button>

        {/* Desktop Collapse */}
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="hidden md:block hover:bg-slate-100 p-1 rounded-md transition"
        >
          <Menu size={20} />
        </button>

        <h2 className="text-md md:text-lg font-bold text-[#1A2035]">
          {getTitle()}
        </h2>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="text-slate-400 hover:text-[#1A2035] cursor-pointer hidden sm:block">
          <Bell size={20} />
        </div>

        <div className="flex items-center gap-3 border-l pl-4 border-slate-200">
          <div className="hidden lg:block text-right">
            <p className="text-xs font-bold text-[#1A2035]">
              {localStorage.getItem("username") || "User"}
            </p>
            <p className="text-[10px] text-slate-400">Pro Account</p>
          </div>
          <div className="w-9 h-9 bg-[#1A2035] text-[#D4AF37] rounded-full flex items-center justify-center font-black border-2 border-[#D4AF37]">
            {localStorage.getItem("username")?.[0] || "U"}
          </div>
        </div>
      </div>
    </div>
  );
}
