import { Bell, Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { getAuthSession } from "../../utils/authSession.js";

// Show the current workspace page title and quick user controls.
export default function Topbar({ setCollapsed, setMobileOpen }) {
  const location = useLocation();
  const session = getAuthSession();
  // Use the saved username when available, otherwise fall back to "User".
  const displayName = session?.username || "User";
  // Show the first letter inside the small avatar circle.
  const displayInitial = displayName.charAt(0).toUpperCase() || "U";

  // Turn the current pathname into the topbar title users should see.
  const getTitle = () => {
    const path = location.pathname;

    if (path.includes("/dashboard")) return "Dashboard";
    if (path.includes("/upload")) return "Analyze Contract";
    if (path.includes("/compare")) return "Compare Documents";
    if (path.includes("/qa")) return "AI Legal Chat";
    if (path.includes("/dictionary")) return "Legal Dictionary";
    if (path.includes("/templates")) return "Contract Templates";
    if (path.includes("/lawyers")) return "Lawyers";

    return "Workspace";
  };

  return (
    // Sticky workspace header that stays visible while dashboard content scrolls.
    <div className="sticky top-0 z-40 flex items-center justify-between border-b border-brand-line bg-white/90 px-4 py-4 backdrop-blur md:px-8">
      {/* Left side controls the sidebar and shows the current page title. */}
      <div className="flex items-center gap-4">
        {/* Mobile Toggle (Shown only on small screens) */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-xl p-2 text-slate-500 transition hover:bg-brand-surface hover:text-brand-ink md:hidden"
        >
          <Menu size={24} />
        </button>

        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="hidden rounded-xl p-2 text-slate-500 transition hover:bg-brand-surface hover:text-brand-ink md:block"
        >
          <Menu size={20} />
        </button>

        <h2 className="text-base font-bold text-brand-ink md:text-lg">
          {getTitle()}
        </h2>
      </div>

      {/* Right side holds quick actions and the user identity chip. */}
      <div className="flex items-center gap-3 md:gap-5">
        {/* Placeholder notifications button. */}
        <button
          type="button"
          className="hidden rounded-2xl border border-brand-line bg-brand-surface p-2.5 text-slate-500 transition hover:border-brand-accent hover:text-brand-ink sm:block"
          aria-label="Notifications"
        >
          <Bell size={18} />
        </button>

        {/* User chip shows the saved username and fallback initial. */}
        <div className="flex items-center gap-3 rounded-full border border-brand-line bg-white px-2 py-1.5 shadow-sm">
          <div className="hidden text-right lg:block">
            <p className="text-xs font-bold text-brand-ink">{displayName}</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
              User Account
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-brand-accent bg-brand-ink text-sm font-black text-brand-accent">
            {displayInitial}
          </div>
        </div>
      </div>
    </div>
  );
}
