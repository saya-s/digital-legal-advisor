import { formatShortDate } from "../../../utils/formatDate.js";
import { useLanguage } from "../../../i18n/language.js";

// Turn one saved date into short text.
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

      {recentItems.length === 0 ? (
        <div className="mt-5 rounded-[1.75rem] border border-dashed border-brand-line bg-brand-surface px-5 py-10 text-center">
          <p className="text-sm font-semibold text-brand-ink">
            {t("dashboard.recent.empty")}
          </p>
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {recentItems.map((item) => (
            <li
              key={item.id}
              className="rounded-[1.75rem] border border-brand-line bg-brand-surface px-4 py-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-brand-ink">
                    {item.document_name || t("dashboard.recent.untitledDocument")}
                  </p>
                  <p className="mt-1 text-sm leading-7 text-slate-500">
                    {t("dashboard.recent.savedLabel")}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  {item.risk_level ? (
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
          ))}
        </ul>
      )}
    </section>
  );
}
