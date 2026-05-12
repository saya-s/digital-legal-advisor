import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

// This chart shows how many saved items are high, medium, or low risk.
export default function RiskDistributionChart({ historyRows = [] }) {
  const data = [
    {
      name: "High",
      value: historyRows.filter(
        (row) => String(row.risk_level || "").toLowerCase() === "high",
      ).length,
      color: "var(--brand-danger)",
      badgeClassName: "bg-brand-danger/10 text-brand-danger",
    },
    {
      name: "Medium",
      value: historyRows.filter(
        (row) => String(row.risk_level || "").toLowerCase() === "medium",
      ).length,
      color: "var(--brand-warning)",
      badgeClassName: "bg-brand-warning/10 text-brand-warning",
    },
    {
      name: "Low",
      value: historyRows.filter(
        (row) => String(row.risk_level || "").toLowerCase() === "low",
      ).length,
      color: "var(--brand-success)",
      badgeClassName: "bg-brand-success/10 text-brand-success",
    },
  ];
  const hasRiskData = data.some((item) => item.value > 0);

  return (
    <section className="card-surface p-6 md:p-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
          Saved History
        </p>
        <h3 className="mt-2 text-2xl font-bold text-brand-ink">
          Risk Overview
        </h3>
        <p className="mt-2 text-sm leading-7 text-slate-500">
          See how your saved analyses are distributed across risk levels.
        </p>
      </div>

      {hasRiskData ? (
        <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr] xl:items-center">
          <div className="h-64 rounded-[1.75rem] bg-brand-surface px-2 py-4">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={82}
                  paddingAngle={3}
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `${value} saved analyses`,
                    `${name} risk`,
                  ]}
                  contentStyle={{
                    border: "1px solid var(--brand-line)",
                    borderRadius: "1rem",
                    backgroundColor: "white",
                    color: "var(--brand-ink)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {data.map((item) => (
              <div
                key={item.name}
                className="rounded-[1.75rem] border border-brand-line bg-brand-surface px-4 py-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-brand-ink">
                      {item.name} risk
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Saved analyses currently marked at this level.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] ${item.badgeClassName}`}
                    >
                      {item.name}
                    </span>
                    <span className="text-2xl font-bold text-brand-ink">
                      {item.value}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-5 flex h-64 items-center justify-center rounded-[1.75rem] border border-dashed border-brand-line bg-brand-surface px-6 text-center">
          <p className="text-sm font-semibold text-brand-ink">
            No saved risk data yet.
          </p>
        </div>
      )}
    </section>
  );
}
