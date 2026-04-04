import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#EF4444", "#FACC15", "#22C55E"];

export default function RiskDistributionChart({ historyRows = [] }) {
  const data = [
    {
      name: "High",
      value: historyRows.filter(
        (row) => String(row.risk_level || "").toLowerCase() === "high",
      ).length,
    },
    {
      name: "Medium",
      value: historyRows.filter(
        (row) => String(row.risk_level || "").toLowerCase() === "medium",
      ).length,
    },
    {
      name: "Low",
      value: historyRows.filter(
        (row) => String(row.risk_level || "").toLowerCase() === "low",
      ).length,
    },
  ];
  const hasRiskData = data.some((item) => item.value > 0);

  return (
    <div className="bg-white p-6 rounded-2xl border">
      <h3 className="font-semibold mb-4">Risk Overview</h3>

      <div className="h-64">
        {hasRiskData ? (
          <ResponsiveContainer>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" outerRadius={80}>
                {data.map((entry, i) => (
                  <Cell key={entry.name} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-center text-sm text-slate-500">
            No saved risk data yet.
          </div>
        )}
      </div>
    </div>
  );
}
