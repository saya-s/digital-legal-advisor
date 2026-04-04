import DashboardLayout from "../../layouts/DashboardLayout";
import ActivityFeed from "./sections/ActivityFeed";
import ContractsList from "./sections/ContractsList";
import Overview from "./sections/Overview";
import RiskStats from "./sections/RiskStats";
import { getAuthSession } from "../../utils/authSession.js";

export default function Dashboard() {
  const session = getAuthSession(); 

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, {session?.username || "User"}!
        </h1>
        <p className="text-gray-500 text-sm">Here is your legal overview for today.</p>
      </div>

      <Overview userId={session?.userId} />

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        <ContractsList userId={session?.userId} />
        <RiskStats />
      </div>

      <ActivityFeed userId={session?.userId} />
    </DashboardLayout>
  );
}
