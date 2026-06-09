import { MessageSquareText } from "lucide-react";
import { formatShortDate } from "../../../utils/formatDate.js";
import { useLanguage } from "../../../i18n/language.js";

// Shorten long saved answers in the activity list.
function truncateText(text, maxLength = 180) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
}

// Turn one saved date into short text.
// Choose the badge colors for a saved risk level.
function getRiskClassName(risk) {
  const normalizedRisk = String(risk || "").toLowerCase();

  if (normalizedRisk === "high") {
    return "bg-brand-danger/10 text-brand-danger";
  }

  if (normalizedRisk === "medium") {
    return "bg-brand-warning/10 text-brand-warning";
  }

  return "bg-brand-success/10 text-brand-success";
}

// Turn the saved risk value into its translation key.
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

// This shows the newest saved items.
export default function RecentActivityList({ historyRows = [] }) {
  const { t, dateLocale } = useLanguage();
  // slice keeps only the five newest records.
  const recentItems = historyRows.slice(0, 5);

  return (
    <section className="card-surface mt-6 p-6 md:p-7">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
          {t("dashboard.recent.eyebrow")}
        </p>
        <h3 className="mt-2 text-2xl font-bold text-brand-ink">
          {t("dashboard.recent.title")}
        </h3>
      </div>

      {/* Show an empty message or the latest saved activity. */}
      {recentItems.length === 0 ? (
        <div className="mt-5 rounded-[1.75rem] border border-dashed border-brand-line bg-brand-surface px-5 py-10 text-center">
          <p className="text-sm font-semibold text-brand-ink">
            {t("dashboard.recent.empty")}
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {/* Build one activity row for each of the five newest records. */}
          {recentItems.map((item) => {
            // Q&A history and contract analyses use different fields and badges.
            const isQaEntry = item.entry_type === "qa";
            const title = isQaEntry
              ? item.question ||
                t(
                  "dashboard.recent.savedQuestionFallback",
                  {},
                  "Saved AI question",
                )
              : item.document_name || t("dashboard.recent.untitledDocument");
            const helperText = isQaEntry
              ? t(
                  "dashboard.recent.savedQuestionLabel",
                  {},
                  "Saved AI Q&A to your dashboard history.",
                )
              : t("dashboard.recent.savedLabel");
            const answerPreview = isQaEntry
              ? truncateText(item.answer || item.summary, 180)
              : "";

            return (
              <li
                key={item.id}
                className="rounded-[1.75rem] border border-brand-line bg-brand-surface px-4 py-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {isQaEntry ? (
                        <MessageSquareText
                          size={16}
                          className="shrink-0 text-brand-accentDeep"
                        />
                      ) : null}
                      <p className="text-sm font-bold text-brand-ink">
                        {title}
                      </p>
                    </div>
                    <p className="mt-1 text-sm leading-7 text-slate-500">
                      {helperText}
                    </p>
                    {answerPreview ? (
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {answerPreview}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs font-bold">
                    {isQaEntry ? (
                      <span className="rounded-full bg-brand-accent/10 px-3 py-1.5 uppercase tracking-[0.14em] text-brand-accentDeep">
                        {t("dashboard.recent.aiBadge", {}, "AI Q&A")}
                      </span>
                    ) : item.risk_level ? (
                      <span
                        className={`rounded-full px-3 py-1.5 uppercase tracking-[0.14em] ${getRiskClassName(item.risk_level)}`}
                      >
                        {t(`common.risks.${getRiskKey(item.risk_level)}`)}{" "}
                        {t("dashboard.recent.riskSuffix")}
                      </span>
                    ) : null}

                    {item.created_at ? (
                      <span className="rounded-full bg-white px-3 py-1.5 text-brand-ink shadow-sm">
                        {formatShortDate(item.created_at, "", dateLocale)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
