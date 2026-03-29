import DashboardLayout from "../../layouts/DashboardLayout";
import ActivityFeed from "./sections/ActivityFeed";
import ContractsList from "./sections/ContractsList";
import Overview from "./sections/Overview";
import RiskStats from "./sections/RiskStats";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <Overview />

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <ContractsList />
        <RiskStats />
      </div>

      <ActivityFeed />
    </DashboardLayout>
  );
}
