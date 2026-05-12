// Turn one saved date into short text.
function formatDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

// This shows the newest saved items.
export default function RecentActivityList({ historyRows = [] }) {
  const recentItems = historyRows.slice(0, 5);

  return (
    <div className="mt-6 bg-white p-6 rounded-2xl border border-[#E5E5E0]">
      <h3 className="font-semibold mb-4">Recent Activity</h3>

      {recentItems.length === 0 ? (
        <p className="text-sm text-slate-500">No recent saved activity yet.</p>
      ) : (
        <ul className="space-y-3 text-sm text-slate-600">
          {recentItems.map((item) => (
            <li key={item.id}>
              {item.document_name || "Untitled document"} saved
              {item.risk_level ? ` • ${item.risk_level} risk` : ""}
              {item.created_at ? ` • ${formatDate(item.created_at)}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
