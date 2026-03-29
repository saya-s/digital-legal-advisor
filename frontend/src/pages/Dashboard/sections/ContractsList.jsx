import { AlertCircle, CheckCircle, FileText, Search } from "lucide-react";

export default function ContractsList() {
  const contracts = [
    {
      name: "Rental Agreement",
      risk: "High",
      date: "Mar 28",
      status: "Review Needed",
    },
    {
      name: "Employment Contract",
      risk: "Low",
      date: "Mar 25",
      status: "Safe",
    },
    {
      name: "Non-Disclosure Agreement",
      risk: "Medium",
      date: "Mar 20",
      status: "Review Needed",
    },
  ];

  return (
    <div className="bg-white p-6 rounded-3xl border border-[#E5E5E0] shadow-sm">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h3 className="font-bold text-[#1A2035] text-lg">My Analyses</h3>
        {/* Deliverable: Search through legal documents */}
        <div className="relative w-full md:w-64">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
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
            {contracts.map((c, i) => (
              <tr
                key={i}
                className="group border-b border-slate-50 last:border-0"
              >
                <td className="py-4 flex items-center gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-[#1A2035] group-hover:text-white transition">
                    <FileText size={18} />
                  </div>
                  <span className="font-semibold text-slate-700">{c.name}</span>
                </td>
                <td className="py-4">
                  <span
                    className={`flex items-center gap-1.5 font-bold ${
                      c.risk === "High"
                        ? "text-red-500"
                        : c.risk === "Medium"
                          ? "text-amber-500"
                          : "text-emerald-500"
                    }`}
                  >
                    {c.risk === "High" ? (
                      <AlertCircle size={14} />
                    ) : (
                      <CheckCircle size={14} />
                    )}
                    {c.risk}
                  </span>
                </td>
                <td className="py-4 text-slate-400">{c.date}</td>
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
    </div>
  );
}
