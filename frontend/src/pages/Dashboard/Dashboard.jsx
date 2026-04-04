import DashboardLayout from "../../layouts/DashboardLayout";
import AnalysesTable from "./sections/AnalysesTable";
import DashboardSummaryCards from "./sections/DashboardSummaryCards";
import RecentActivityList from "./sections/RecentActivityList";
import RiskDistributionChart from "./sections/RiskDistributionChart";
import { getAuthSession } from "../../utils/authSession.js";

export default function Dashboard() {
  const session = getAuthSession(); 

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold text-gray-800">
          Welcome back, {session?.username || "User"}!
        </h1>
        <p className="text-gray-500 text-sm">Here is your legal overview for today.</p>
      </div>

      <DashboardSummaryCards userId={session?.userId} />

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <AnalysesTable userId={session?.userId} />
        <RiskDistributionChart />
      </div>

      <RecentActivityList userId={session?.userId} />
    </DashboardLayout>
  );
}
