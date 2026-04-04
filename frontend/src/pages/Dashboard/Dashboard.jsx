import { useEffect, useState } from "react";
import { buildApiUrl } from "../../config/api.js";
import DashboardLayout from "../../layouts/DashboardLayout";
import AnalysesTable from "./sections/AnalysesTable";
import DashboardSummaryCards from "./sections/DashboardSummaryCards";
import RecentActivityList from "./sections/RecentActivityList";
import RiskDistributionChart from "./sections/RiskDistributionChart";
import { getAuthSession } from "../../utils/authSession.js";

export default function Dashboard() {
  const [historyRows, setHistoryRows] = useState([]);
  const session = getAuthSession();

  useEffect(() => {
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
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-800">
          Welcome back, {session?.username || "User"}!
        </h1>
        <p className="text-gray-500 text-sm">
          Here is your legal overview for today.
        </p>
      </div>

      <DashboardSummaryCards historyRows={historyRows} />

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <AnalysesTable historyRows={historyRows} />
        <RiskDistributionChart historyRows={historyRows} />
      </div>

      <RecentActivityList historyRows={historyRows} />
    </DashboardLayout>
  );
}
