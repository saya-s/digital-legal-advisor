export default function ActivityFeed() {
  return (
    <div className="mt-6 bg-white p-6 rounded-2xl border border-[#E5E5E0]">
      <h3 className="font-semibold mb-4">Recent Activity</h3>

      <ul className="space-y-3 text-sm text-slate-600">
        <li>📄 Rental contract analyzed</li>
        <li>⚠️ High risk detected in supplier agreement</li>
        <li>✅ Employment contract looks safe</li>
      </ul>
    </div>
  );
}
