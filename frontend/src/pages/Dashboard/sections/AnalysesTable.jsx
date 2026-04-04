import { AlertCircle, CheckCircle, FileText, Search } from "lucide-react";
import { useMemo, useState } from "react";

function formatDate(value) {
  if (!value) return "Not saved";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not saved";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function AnalysesTable({ historyRows = [] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const contracts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return historyRows
      .map((row) => ({
        id: row.id,
        name: row.document_name || "Untitled document",
        risk: row.risk_level || "Low",
        date: formatDate(row.created_at),
        status: row.status || "Saved",
      }))
      .filter((contract) => {
        if (!normalizedSearch) return true;
        return `${contract.name} ${contract.risk} ${contract.status}`
          .toLowerCase()
          .includes(normalizedSearch);
      });
  }, [historyRows, searchTerm]);

  return (
    <div className="bg-white p-6 rounded-3xl border border-[#E5E5E0] shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h3 className="font-bold text-[#1A2035] text-lg">My Analyses</h3>
        <div className="relative w-full md:w-64">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search contracts..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-400 text-[11px] uppercase tracking-widest border-b border-slate-50">
              <th className="pb-4 font-bold">Document Name</th>
              <th className="pb-4 font-bold">Risk Level</th>
              <th className="pb-4 font-bold">Date</th>
              <th className="pb-4 font-bold">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {contracts.map((contract) => (
              <tr
                key={contract.id}
                className="group border-b border-slate-50 last:border-0"
              >
                <td className="py-4 flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-[#1A2035] group-hover:text-white transition">
                    <FileText size={18} />
                  </div>
                  <span className="font-semibold text-slate-700">
                    {contract.name}
                  </span>
                </td>
                <td className="py-4">
                  <span
                    className={`flex items-center gap-1.5 font-bold ${
                      contract.risk === "High"
                        ? "text-red-500"
                        : contract.risk === "Medium"
                          ? "text-amber-500"
                          : "text-emerald-500"
                    }`}
                  >
                    {contract.risk === "High" ? (
                      <AlertCircle size={14} />
                    ) : (
                      <CheckCircle size={14} />
                    )}
                    {contract.risk}
                  </span>
                </td>
                <td className="py-4 text-slate-400">{contract.date}</td>
                <td className="py-4">
                  <button className="text-[#D4AF37] font-bold hover:underline">
                    View Analysis
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {contracts.length === 0 && (
        <p className="mt-6 text-center text-sm text-slate-500">
          No saved analyses found yet.
        </p>
      )}
    </div>
  );
}
