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
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-800">
          Welcome, {session?.username || "User"}!
        </h1>
        <p className="text-gray-500 text-sm">
          Here is your legal overview for today.
        </p>
      </div>

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
      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <AnalysesTable historyRows={historyRows} />
        <RiskDistributionChart historyRows={historyRows} />
      </div>

      {/* Latest saved activity. */}
      <RecentActivityList historyRows={historyRows} />
    </DashboardLayout>
  );
}
