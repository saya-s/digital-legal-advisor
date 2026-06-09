import { getRiskBadgeTone } from "../../../utils/riskTone.js";
import { getStatusTone } from "../compareConfig.js";

// Explain that one side has no matching clause.
function getMissingClauseMessage(label) {
  return `This section does not appear in the ${label.toLowerCase()}.`;
}

// This card compares one matched, added, or removed clause.
export default function ComparisonItemCard({
  item,
  originalLabel,
  revisedLabel,
}) {
  // Optional chaining ?. lets missing added/removed clauses stay undefined safely.
  const originalClause = item.originalClause;
  const revisedClause = item.revisedClause;
  const originalClauseRiskBadgeTone = getRiskBadgeTone(originalClause?.risk);
  const revisedClauseRiskBadgeTone = getRiskBadgeTone(revisedClause?.risk);

  return (
    <article className="rounded-[2rem] border border-brand-line bg-brand-surface p-5">
      {/* Change type, similarity, risk shift, and summary. */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${getStatusTone(
                item.status,
              )}`}
            >
              {item.status}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
              similarity {item.similarity}
            </span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
              risk {item.riskShift}
            </span>
          </div>
          <h3 className="mt-3 text-xl font-bold text-brand-ink">
            {revisedClause?.label || originalClause?.label || "Clause change"}
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-600">
            {item.changeSummary}
          </p>
        </div>
      </div>

      {/* Original and revised clause text shown side by side. */}
      {/* xl:grid-cols-2 changes stacked cards into two columns on wide screens. */}
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="rounded-[1.5rem] border border-brand-line bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                {originalLabel}
              </p>
              <p className="mt-2 text-sm font-bold text-brand-ink">
                {originalClause?.title || "No matching clause"}
              </p>
            </div>
            {/* Risk badges appear only when that side has a clause. */}
            {originalClause ? (
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${originalClauseRiskBadgeTone}`}
              >
                {originalClause.risk} Risk
              </span>
            ) : null}
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            {originalClause?.preview || getMissingClauseMessage(originalLabel)}
          </p>
        </div>

        <div className="rounded-[1.5rem] border border-brand-line bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                {revisedLabel}
              </p>
              <p className="mt-2 text-sm font-bold text-brand-ink">
                {revisedClause?.title || "No matching clause"}
              </p>
            </div>
            {revisedClause ? (
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${revisedClauseRiskBadgeTone}`}
              >
                {revisedClause.risk} Risk
              </span>
            ) : null}
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            {revisedClause?.preview || getMissingClauseMessage(revisedLabel)}
          </p>
        </div>
      </div>
    </article>
  );
}
