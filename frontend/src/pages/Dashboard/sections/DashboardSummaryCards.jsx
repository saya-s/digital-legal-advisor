import { motion } from "framer-motion";

// Turn one saved date into a real date value.
function parseHistoryDate(createdAt) {
  if (!createdAt) return null;

  const normalizedValue =
    typeof createdAt === "string" ? createdAt.replace(" ", "T") : createdAt;
  const savedDate = new Date(normalizedValue);

  return Number.isNaN(savedDate.getTime()) ? null : savedDate;
}

// Check if one saved item was added today.
function isSavedToday(createdAt) {
  const savedDate = parseHistoryDate(createdAt);
  if (!savedDate) return false;

  const today = new Date();
  const matchesLocalDate =
    savedDate.getFullYear() === today.getFullYear() &&
    savedDate.getMonth() === today.getMonth() &&
    savedDate.getDate() === today.getDate();

  const matchesUtcDate =
    savedDate.getUTCFullYear() === today.getUTCFullYear() &&
    savedDate.getUTCMonth() === today.getUTCMonth() &&
    savedDate.getUTCDate() === today.getUTCDate();

  return matchesLocalDate || matchesUtcDate;
}

// These are the small number cards at the top of the dashboard.
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
