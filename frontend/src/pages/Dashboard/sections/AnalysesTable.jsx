import { AlertCircle, CheckCircle, FileText, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { buildContractQaState } from "../../../utils/contractQaState.js";

// Turn one saved date into short text.
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

// This table lists saved analyses and opens one in a popup.
export default function AnalysesTable({ historyRows = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  const contracts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return historyRows
      .map((row) => ({
        id: row.id,
        name: row.document_name || "Untitled document",
        risk: row.risk_level || "Low",
        date: formatDate(row.created_at),
        summary: row.summary || "No summary saved for this analysis.",
        status: row.status || "Saved",
        clauses: Array.isArray(row.clauses) ? row.clauses : [],
        analysis: row.analysis || null,
        documentText:
          typeof row.documentText === "string"
            ? row.documentText
            : typeof row.analysis?.documentText === "string"
              ? row.analysis.documentText
              : "",
      }))
      .filter((contract) => {
        if (!normalizedSearch) return true;
        return `${contract.name} ${contract.risk} ${contract.status}`
          .toLowerCase()
          .includes(normalizedSearch);
      });
  }, [historyRows, searchTerm]);

  const selectedAnalysisQaState = useMemo(() => {
    if (!selectedAnalysis) {
      return null;
    }

    return buildContractQaState({
      analysisResult: selectedAnalysis.analysis || {
        documentName: selectedAnalysis.name,
        summary: selectedAnalysis.summary,
        riskLevel: selectedAnalysis.risk,
        clauses: selectedAnalysis.clauses,
        documentText: selectedAnalysis.documentText,
      },
      selectedFileName: selectedAnalysis.name,
      analysisId: selectedAnalysis.id,
    });
  }, [selectedAnalysis]);

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
                  <button
                    type="button"
                    onClick={() => setSelectedAnalysis(contract)}
                    className="text-[#D4AF37] font-bold hover:underline"
                  >
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

      {selectedAnalysis && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-brand-ink/60 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-float">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
                  Saved Analysis
                </p>
                <h3 className="mt-2 text-2xl font-bold text-brand-ink">
                  {selectedAnalysis.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnalysis(null)}
                className="rounded-2xl bg-brand-surface p-2 text-slate-500 transition hover:text-brand-ink"
                aria-label="Close analysis details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-brand-surface px-3 py-2 text-brand-ink">
                Risk: {selectedAnalysis.risk}
              </span>
              <span className="rounded-full bg-brand-surface px-3 py-2 text-brand-ink">
                Status: {selectedAnalysis.status}
              </span>
              <span className="rounded-full bg-brand-surface px-3 py-2 text-brand-ink">
                Date: {selectedAnalysis.date}
              </span>
            </div>

            <p className="mt-5 text-sm leading-7 text-slate-600">
              {selectedAnalysis.summary}
            </p>

            <div className="mt-6 rounded-3xl bg-brand-surface p-4">
              <h4 className="text-sm font-bold text-brand-ink">
                Saved Document Preview
              </h4>

              <div className="mt-4 max-h-72 overflow-y-auto rounded-2xl bg-white px-4 py-4">
                {selectedAnalysis.documentText ? (
                  <pre className="whitespace-pre-wrap text-xs leading-6 text-slate-600">
                    {selectedAnalysis.documentText}
                  </pre>
                ) : (
                  <p className="text-sm leading-7 text-slate-600">
                    This saved analysis does not include extracted document text
                    yet.
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-3xl bg-brand-surface p-4">
              <h4 className="text-sm font-bold text-brand-ink">
                Saved Clause Details
              </h4>

              {selectedAnalysis.clauses.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {selectedAnalysis.clauses.map((clause, index) => (
                    <article
                      key={clause.id || `${selectedAnalysis.id}-${index}`}
                      className="rounded-2xl bg-white px-4 py-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-bold text-brand-ink">
                          {clause.title || `Clause ${index + 1}`}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-brand-surface px-3 py-1 text-xs font-bold text-brand-accentDeep">
                            {clause.label || "General"}
                          </span>
                          <span className="rounded-full bg-brand-surface px-3 py-1 text-xs font-bold text-brand-ink">
                            {clause.risk || "Low"}
                          </span>
                        </div>
                      </div>

                      {clause.explanation && (
                        <p className="mt-3 text-sm leading-7 text-slate-600">
                          {clause.explanation}
                        </p>
                      )}

                      {Array.isArray(clause.riskReasons) &&
                        clause.riskReasons.length > 0 && (
                          <ul className="mt-3 space-y-2 text-xs leading-6 text-slate-500">
                            {clause.riskReasons.map((reason, reasonIndex) => (
                              <li
                                key={`${clause.id || index}-reason-${reasonIndex}`}
                              >
                                • {reason}
                              </li>
                            ))}
                          </ul>
                        )}

                      {clause.text && (
                        <p className="mt-3 text-xs leading-6 text-slate-500">
                          {clause.text}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  No clause-level details were saved for this analysis.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedAnalysis(null)}
              className="mt-6 w-full rounded-full bg-brand-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-inkSoft"
            >
              Close
            </button>

            {selectedAnalysisQaState ? (
              <Link
                to="/qa"
                state={selectedAnalysisQaState}
                className="mt-3 flex w-full items-center justify-center rounded-full border border-brand-line bg-white px-6 py-3 text-sm font-bold text-brand-ink transition hover:border-brand-accent hover:text-brand-accentDeep"
              >
                Ask About This Contract
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
