import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function RiskStats() {
  const data = [
    { name: "High", value: 3 },
    { name: "Medium", value: 5 },
    { name: "Low", value: 4 },
  ];

  const COLORS = ["#EF4444", "#FACC15", "#22C55E"];

  return (
    <div className="bg-white p-6 rounded-2xl border">
      <h3 className="font-semibold mb-4">Risk Overview</h3>

      <div className="h-64">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" outerRadius={80}>
              {data.map((entry, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}