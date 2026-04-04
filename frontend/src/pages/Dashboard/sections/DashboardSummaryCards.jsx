import { motion } from "framer-motion";

function isSavedToday(createdAt) {
  if (!createdAt) return false;

  const savedDate = new Date(createdAt);
  if (Number.isNaN(savedDate.getTime())) return false;

  const today = new Date();
  return (
    savedDate.getFullYear() === today.getFullYear() &&
    savedDate.getMonth() === today.getMonth() &&
    savedDate.getDate() === today.getDate()
  );
}

export default function DashboardSummaryCards({ historyRows = [] }) {
  const totalContracts = historyRows.length;
  const highRiskCount = historyRows.filter(
    (row) => String(row.risk_level || "").toLowerCase() === "high",
  ).length;
  const analyzedTodayCount = historyRows.filter((row) =>
    isSavedToday(row.created_at),
  ).length;

  const stats = [
    { label: "Contracts", value: totalContracts },
    { label: "High Risk", value: highRiskCount },
    { label: "Analyzed Today", value: analyzedTodayCount },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {stats.map((item, i) => (
        <motion.div
          key={i}
          whileHover={{ scale: 1.03 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-[#E5E5E0]"
        >
          <p className="text-sm text-slate-500">{item.label}</p>
          <h3 className="text-2xl font-bold mt-2">{item.value}</h3>
        </motion.div>
      ))}
    </div>
  );
}
