import { FileDiff } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buildApiUrl } from "../../config/api.js";
import DashboardLayout from "../../layouts/DashboardLayout";
import AnalysesTable from "./sections/AnalysesTable";
import DashboardSummaryCards from "./sections/DashboardSummaryCards";
import RecentActivityList from "./sections/RecentActivityList";
import RiskDistributionChart from "./sections/RiskDistributionChart";
import { getAuthSession } from "../../utils/authSession.js";

// This is the main signed-in dashboard page.
export default function Dashboard() {
  // Saved history is shared with the cards, table, chart, and activity list.
  const [historyRows, setHistoryRows] = useState([]);
  const session = getAuthSession();

  useEffect(() => {
    // Load the saved history once when the page opens.
    async function loadHistory() {
      const currentSession = getAuthSession();
      if (!currentSession?.token) return;

      const response = await fetch(buildApiUrl("/api/history"), {
        headers: {
          Authorization: `Bearer ${currentSession.token}`,
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      setHistoryRows(Array.isArray(data) ? data : []);
    }

    loadHistory();
  }, []);

  return (
    // Dashboard layout gives this page the sidebar and top bar.
    <DashboardLayout>
      {/* Welcome area. */}
      <section className="card-surface mb-6 overflow-hidden">
        <div className="relative px-6 py-7 md:px-8 md:py-8">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-brand-accent/10 blur-3xl" />

          <div className="relative">
            <p className="eyebrow">Dashboard Overview</p>
            <h1 className="mt-3 font-display text-3xl font-bold text-brand-ink md:text-4xl">
              Welcome back, {session?.username || "User"}.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
              Track saved analyses, reopen a contract, and keep an eye on risk
              patterns across your recent legal work.
            </p>
          </div>
        </div>
      </section>

      {/* Small summary cards. */}
      <DashboardSummaryCards historyRows={historyRows} />

      {/* Quick shortcut to the compare page. */}
      <section className="card-surface mt-6 overflow-hidden bg-brand-ink text-white">
        <div className="relative px-6 py-7 md:px-8 md:py-8">
          <div className="absolute -right-12 top-0 h-36 w-36 rounded-full bg-brand-accent/15 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accent">
                Compare Documents
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold text-white">
                Benchmark a contract against a template or compare versions
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Use one workspace for contract-versus-template review or
                original-versus-revised comparison, then inspect missing
                clauses, wording changes, and higher-risk edits.
              </p>
            </div>

            <Link
              to="/compare"
              className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-white px-5 py-3 text-sm font-bold text-brand-ink transition hover:bg-slate-100"
            >
              <FileDiff size={18} />
              Open Comparison
            </Link>
          </div>
        </div>
      </section>

      {/* Table and chart side by side. */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <AnalysesTable historyRows={historyRows} />
        <RiskDistributionChart historyRows={historyRows} />
      </div>

      {/* Latest saved activity. */}
      <RecentActivityList historyRows={historyRows} />
    </DashboardLayout>
  );
}
