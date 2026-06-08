import { AlertCircle, CheckCircle, FileText, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../../i18n/language.js";
import { buildContractQaState } from "../../../utils/contractQaState.js";
import { formatShortDate } from "../../../utils/formatDate.js";

function getRiskDisplay(risk) {
  const normalizedRisk = String(risk || "").toLowerCase();

  if (normalizedRisk === "high") {
    return {
      icon: AlertCircle,
      pillClassName: "bg-brand-danger/10 text-brand-danger",
    };
  }

  if (normalizedRisk === "medium") {
    return {
      icon: AlertCircle,
      pillClassName: "bg-brand-warning/10 text-brand-warning",
    };
  }

  return {
    icon: CheckCircle,
    pillClassName: "bg-brand-success/10 text-brand-success",
  };
}

function getRiskKey(risk) {
  const normalizedRisk = String(risk || "").toLowerCase();

  if (normalizedRisk === "high") {
    return "high";
  }

  if (normalizedRisk === "medium") {
    return "medium";
  }

  return "low";
}

// This table lists saved analyses and opens one in a popup.
export default function AnalysesTable({ historyRows = [] }) {
  const { t, dateLocale, isRTL } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  const contracts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return historyRows
      .map((row) => ({
        id: row.id,
        name: row.document_name || t("dashboard.analyses.untitledDocument"),
        risk: row.risk_level || "Low",
        displayRisk: t(`common.risks.${getRiskKey(row.risk_level)}`),
        date: formatShortDate(
          row.created_at,
          t("dashboard.analyses.notSaved"),
          dateLocale,
        ),
        summary: row.summary || t("dashboard.analyses.noSummary"),
        status: row.status || t("dashboard.analyses.savedStatus"),
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

        return `${contract.name} ${contract.risk} ${contract.displayRisk} ${contract.status}`
          .toLowerCase()
          .includes(normalizedSearch);
      });
  }, [dateLocale, historyRows, searchTerm, t]);

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

  useEffect(() => {
    if (!selectedAnalysis) {
      return;
    }

    const currentSelection = contracts.find(
      (contract) => contract.id === selectedAnalysis.id,
    );

    if (currentSelection && currentSelection !== selectedAnalysis) {
      setSelectedAnalysis(currentSelection);
    }
  }, [contracts, selectedAnalysis]);

  const selectedRiskDisplay = selectedAnalysis
    ? getRiskDisplay(selectedAnalysis.risk)
    : null;

  return (
    <section className="card-surface p-6 md:p-7">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
            {t("dashboard.analyses.eyebrow")}
          </p>
          <h3 className="mt-2 text-2xl font-bold text-brand-ink">
            {t("dashboard.analyses.title")}
          </h3>
        </div>

        <div className="relative w-full md:w-72">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t("dashboard.analyses.searchPlaceholder")}
            className="w-full rounded-2xl border border-brand-line bg-brand-surface py-3 pl-10 pr-4 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className={`w-full ${isRTL ? "text-right" : "text-left"}`}>
          <thead>
            <tr className="border-b border-brand-line text-[11px] uppercase tracking-[0.18em] text-slate-400">
              <th className="pb-4 font-bold">
                {t("dashboard.analyses.headers.documentName")}
              </th>
              <th className="pb-4 font-bold">
                {t("dashboard.analyses.headers.riskLevel")}
              </th>
              <th className="pb-4 font-bold">
                {t("dashboard.analyses.headers.date")}
              </th>
              <th className="pb-4 font-bold">
                {t("dashboard.analyses.headers.action")}
              </th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {contracts.map((contract) => {
              const riskDisplay = getRiskDisplay(contract.risk);
              const RiskIcon = riskDisplay.icon;

              return (
                <tr
                  key={contract.id}
                  className="group border-b border-brand-line last:border-0"
                >
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-brand-surface p-2.5 text-brand-accent transition group-hover:bg-brand-ink group-hover:text-brand-accent">
                        <FileText size={18} />
                      </div>
                      <span className="font-semibold text-brand-ink">
                        {contract.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${riskDisplay.pillClassName}`}
                    >
                      <RiskIcon size={14} />
                      {contract.displayRisk}
                    </span>
                  </td>
                  <td className="py-4 text-slate-500">{contract.date}</td>
                  <td className="py-4">
                    <button
                      type="button"
                      onClick={() => setSelectedAnalysis(contract)}
                      className="text-sm font-bold text-brand-accentDeep transition hover:text-brand-accent hover:underline"
                    >
                      {t("dashboard.analyses.viewAnalysis")}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {contracts.length === 0 && (
        <div className="mt-6 rounded-[1.75rem] border border-dashed border-brand-line bg-brand-surface px-5 py-10 text-center">
          <p className="text-sm font-semibold text-brand-ink">
            {t("dashboard.analyses.emptyTitle")}
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            {t("dashboard.analyses.emptyDescription")}
          </p>
        </div>
      )}

      {selectedAnalysis && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-brand-ink/60 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-float">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
                  {t("dashboard.analyses.savedAnalysis")}
                </p>
                <h3 className="mt-2 text-2xl font-bold text-brand-ink">
                  {selectedAnalysis.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAnalysis(null)}
                className="rounded-2xl bg-brand-surface p-2 text-slate-500 transition hover:text-brand-ink"
                aria-label={t("dashboard.analyses.closeAnalysisDetails")}
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
              <span
                className={`rounded-full px-3 py-2 uppercase tracking-[0.14em] ${selectedRiskDisplay?.pillClassName || "bg-brand-surface text-brand-ink"}`}
              >
                {t("dashboard.analyses.riskLabel")}: {selectedAnalysis.displayRisk}
              </span>
              <span className="rounded-full bg-brand-surface px-3 py-2 text-brand-ink">
                {t("dashboard.analyses.statusLabel")}: {selectedAnalysis.status}
              </span>
              <span className="rounded-full bg-brand-surface px-3 py-2 text-brand-ink">
                {t("dashboard.analyses.dateLabel")}: {selectedAnalysis.date}
              </span>
            </div>

            <p className="mt-5 text-sm leading-7 text-slate-600">
              {selectedAnalysis.summary}
            </p>

            <div className="mt-6 rounded-3xl bg-brand-surface p-4">
              <h4 className="text-sm font-bold text-brand-ink">
                {t("dashboard.analyses.documentPreview")}
              </h4>

              <div className="mt-4 max-h-72 overflow-y-auto rounded-2xl bg-white px-4 py-4">
                {selectedAnalysis.documentText ? (
                  <pre className="whitespace-pre-wrap text-xs leading-6 text-slate-600">
                    {selectedAnalysis.documentText}
                  </pre>
                ) : (
                  <p className="text-sm leading-7 text-slate-600">
                    {t("dashboard.analyses.missingDocumentText")}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 rounded-3xl bg-brand-surface p-4">
              <h4 className="text-sm font-bold text-brand-ink">
                {t("dashboard.analyses.clauseDetails")}
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
                          {clause.title ||
                            t("dashboard.analyses.clauseLabel", {
                              number: index + 1,
                            })}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-brand-surface px-3 py-1 text-xs font-bold text-brand-accentDeep">
                            {clause.label || t("dashboard.analyses.generalLabel")}
                          </span>
                          <span className="rounded-full bg-brand-surface px-3 py-1 text-xs font-bold text-brand-ink">
                            {clause.risk
                              ? t(`common.risks.${getRiskKey(clause.risk)}`)
                              : t("common.risks.low")}
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
                                - {reason}
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
                  {t("dashboard.analyses.noClauseDetails")}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedAnalysis(null)}
              className="mt-6 w-full rounded-full bg-brand-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-inkSoft"
            >
              {t("dashboard.analyses.close")}
            </button>

            {selectedAnalysisQaState ? (
              <Link
                to="/qa"
                state={selectedAnalysisQaState}
                className="mt-3 flex w-full items-center justify-center rounded-full border border-brand-line bg-white px-6 py-3 text-sm font-bold text-brand-ink transition hover:border-brand-accent hover:text-brand-accentDeep"
              >
                {t("dashboard.analyses.askAboutContract")}
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}
