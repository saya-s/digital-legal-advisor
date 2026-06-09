import {
  ArrowLeft,
  ArrowRightLeft,
  FileText,
  Loader2,
  PlusCircle,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getRiskBadgeTone } from "../../utils/riskTone.js";
import ComparisonItemCard from "./components/ComparisonItemCard.jsx";
import { FILTERS } from "./compareConfig.js";
import {
  readComparisonResult,
  saveComparisonResult,
} from "./compareSession.js";

// Provide simple side names if the server did not send labels.
function getFallbackLabel(comparisonMode, side) {
  if (comparisonMode === "template") {
    return side === "original" ? "Template" : "Uploaded contract";
  }

  return side === "original" ? "Original" : "Revised";
}

// This page displays the latest document comparison.
export default function CompareResults() {
  const location = useLocation();
  const navigate = useNavigate();
  // First use the fresh result sent from the Compare page.
  const routeComparisonResult =
    location.state?.comparisonResult &&
    typeof location.state.comparisonResult === "object"
      ? location.state.comparisonResult
      : null;

  // Keep the result available after navigating away and returning.
  const [storedComparisonResult, setStoredComparisonResult] = useState(() =>
    // Otherwise, start with the last result saved in this browser tab.
    readComparisonResult(),
  );
  const [activeFilter, setActiveFilter] = useState("all");

  // Save a new result received from the setup page.
  useEffect(() => {
    if (!routeComparisonResult) {
      return;
    }

    saveComparisonResult(routeComparisonResult);
    setStoredComparisonResult(routeComparisonResult);
  }, [routeComparisonResult]);

  const comparisonResult = routeComparisonResult || storedComparisonResult;

  // Show only the clause changes selected by the filter buttons.
  // Change the visible clause list when the user changes the filter.
  const filteredItems = useMemo(() => {
    const items = Array.isArray(comparisonResult?.comparisonItems)
      ? comparisonResult.comparisonItems
      : [];

    if (activeFilter === "all") {
      return items;
    }

    return items.filter((item) => item.status === activeFilter);
  }, [activeFilter, comparisonResult]);

  const originalLabel =
    // Use a simple side name when the server did not provide one.
    comparisonResult?.documentLabels?.original ||
    getFallbackLabel(comparisonResult?.comparisonMode, "original");
  const revisedLabel =
    comparisonResult?.documentLabels?.revised ||
    getFallbackLabel(comparisonResult?.comparisonMode, "revised");
  const originalRiskBadgeTone = getRiskBadgeTone(
    comparisonResult?.originalDocument?.riskLevel,
  );
  const revisedRiskBadgeTone = getRiskBadgeTone(
    comparisonResult?.revisedDocument?.riskLevel,
  );

  if (!comparisonResult) {
    // Explain what to do when no saved result exists.
    return (
      <DashboardLayout>
        <section className="card-surface p-8 md:p-10">
          <p className="eyebrow">Comparison Results</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-brand-ink">
            No comparison results are open yet
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-600 md:text-base">
            Start a comparison first, then this page will show the summary,
            risk shifts, and clause-by-clause review.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/compare")}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-inkSoft"
            >
              <ArrowRightLeft size={18} />
              Open Comparison Workspace
            </button>
          </div>
        </section>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Result title and navigation buttons. */}
      <section className="card-surface p-8 md:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Comparison Results</p>
            <h1 className="mt-3 font-display text-4xl font-bold text-brand-ink">
              {comparisonResult.originalDocument?.name} vs{" "}
              {comparisonResult.revisedDocument?.name}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
              Review the final comparison output on its own page, with summary
              metrics at the top and the clause-level changes below.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => navigate("/compare")}
              className="inline-flex items-center gap-2 rounded-2xl border border-brand-line bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-brand-accent hover:text-brand-ink"
            >
              <ArrowLeft size={16} />
              Back To Workspace
            </button>
            <button
              type="button"
              onClick={() => navigate("/compare")}
              className="inline-flex items-center gap-2 rounded-2xl bg-brand-ink px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-inkSoft"
            >
              <ArrowRightLeft size={16} />
              Start Another Comparison
            </button>
          </div>
        </div>
      </section>

      <div className="mt-6 space-y-6">
        {/* Overall summary, risk levels, and change counts. */}
        <div className="card-surface p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
                Comparison Summary
              </p>
              <h2 className="mt-2 text-2xl font-bold text-brand-ink">
                {comparisonResult.originalDocument?.name} vs{" "}
                {comparisonResult.revisedDocument?.name}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {originalLabel} on the left, {revisedLabel.toLowerCase()} on the
                right.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs font-bold">
              <span
                className={`rounded-full px-3 py-1.5 ${originalRiskBadgeTone}`}
              >
                {originalLabel} {comparisonResult.originalDocument?.riskLevel} Risk
              </span>
              <span
                className={`rounded-full px-3 py-1.5 ${revisedRiskBadgeTone}`}
              >
                {revisedLabel} {comparisonResult.revisedDocument?.riskLevel} Risk
              </span>
            </div>
          </div>

          <p className="mt-4 text-sm leading-8 text-slate-600">
            {comparisonResult.summary}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-brand-surface px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Modified
              </p>
              <p className="mt-2 text-2xl font-bold text-brand-ink">
                {comparisonResult.counts?.modified || 0}
              </p>
            </div>
            <div className="rounded-2xl bg-brand-surface px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Added
              </p>
              <p className="mt-2 text-2xl font-bold text-brand-ink">
                {comparisonResult.counts?.added || 0}
              </p>
            </div>
            <div className="rounded-2xl bg-brand-surface px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Removed
              </p>
              <p className="mt-2 text-2xl font-bold text-brand-ink">
                {comparisonResult.counts?.removed || 0}
              </p>
            </div>
            <div className="rounded-2xl bg-brand-surface px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Higher-risk changes
              </p>
              <p className="mt-2 text-2xl font-bold text-brand-ink">
                {comparisonResult.higherRiskChanges || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Short guide to how comparison results should be read. */}
        <div className="card-surface p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl bg-brand-surface px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white p-2 text-brand-accent">
                  <FileText size={18} />
                </div>
                <h3 className="text-sm font-bold text-brand-ink">
                  Clause pairing
                </h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                The comparison engine matches the closest sections between both
                sides so you can inspect each difference side by side.
              </p>
            </article>

            <article className="rounded-2xl bg-brand-surface px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white p-2 text-brand-accent">
                  <PlusCircle size={18} />
                </div>
                <h3 className="text-sm font-bold text-brand-ink">
                  Missing or extra sections
                </h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Removed highlights what only appears in the baseline side. Added
                highlights what only appears in the compared side.
              </p>
            </article>

            <article className="rounded-2xl bg-brand-surface px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white p-2 text-brand-accent">
                  <ShieldAlert size={18} />
                </div>
                <h3 className="text-sm font-bold text-brand-ink">
                  Risk shifts
                </h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Higher-risk edits stay easy to spot so the review starts with
                the sections that need the most attention.
              </p>
            </article>
          </div>
        </div>

        {/* Filterable list of clause-by-clause differences. */}
        <div className="card-surface p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-brand-ink">
                Clause-by-clause review
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Filter the results to focus on the changes you care about.
              </p>
              {comparisonResult.comparisonMode === "template" ? (
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  In template mode, removed means the template contains a clause
                  that the uploaded contract does not. Added means the uploaded
                  contract contains wording not found in the template.
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Create one button for every result filter. */}
              {FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                  className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                    activeFilter === filter.id
                      ? "bg-brand-ink text-white"
                      : "bg-brand-surface text-slate-600 hover:text-brand-ink"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {/* Show an empty message only when the active filter has no matches. */}
            {filteredItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-brand-line bg-brand-surface px-6 py-10 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="text-brand-accent" size={24} />
                  <p className="text-sm font-semibold text-brand-ink">
                    No sections match this filter.
                  </p>
                </div>
              </div>
            ) : null}

            {/* Build one side-by-side card for every visible clause result. */}
            {filteredItems.map((item) => (
              <ComparisonItemCard
                key={item.id}
                item={item}
                originalLabel={originalLabel}
                revisedLabel={revisedLabel}
              />
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
