import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

// This is the main page frame for signed-in pages.
export default function DashboardLayout({ children }) {
  // This decides if the sidebar is wide or small on desktop.
  const [collapsed, setCollapsed] = useState(false);
  // This decides if the sidebar is open on mobile.
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    // Full dashboard page wrapper.
    <div className="flex min-h-screen overflow-hidden bg-brand-surface text-brand-ink">
      {/* Left menu. */}
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Right side holds the page header and page content. */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar with the page title and menu buttons. */}
        <Topbar setCollapsed={setCollapsed} setMobileOpen={setMobileOpen} />

        {/* Main area where each page shows its content. */}
        <main className="h-[calc(100vh-73px)] overflow-y-auto px-4 py-4 md:px-8 md:py-6">
          {/* Keeps the page content centered and not too wide. */}
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
