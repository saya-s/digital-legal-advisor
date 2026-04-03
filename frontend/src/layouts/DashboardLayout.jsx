import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
      {/* 1. Pass both states to Sidebar */}
    <div className="flex min-h-screen overflow-hidden bg-brand-surface text-brand-ink">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

        {/* 2. Pass both setters to Topbar */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar setCollapsed={setCollapsed} setMobileOpen={setMobileOpen} />

        <main className="h-[calc(100vh-73px)] overflow-y-auto px-4 py-4 md:px-8 md:py-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
