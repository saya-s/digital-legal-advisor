import { useState } from "react";
import Sidebar from "../components/layout/Sidebar";
import Topbar from "../components/layout/Topbar";

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false); // <--- Add this state here!

  return (
    <div className="flex min-h-screen bg-[#F8F7F2] text-[#1A2035] overflow-hidden">
      {/* 1. Pass both states to Sidebar */}
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* 2. Pass both setters to Topbar */}
        <Topbar setCollapsed={setCollapsed} setMobileOpen={setMobileOpen} />

        <main className="p-4 md:p-8 overflow-y-auto h-[calc(100vh-64px)]">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
