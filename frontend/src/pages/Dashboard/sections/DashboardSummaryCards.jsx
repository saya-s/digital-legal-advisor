import { AlertTriangle, CalendarDays, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "../../../i18n/language.js";

// Turn one saved date into a real date value.
function parseHistoryDate(createdAt) {
  if (!createdAt) return null;

  // Replace the database space with T so browsers parse the date consistently.
  const normalizedValue =
    typeof createdAt === "string" ? createdAt.replace(" ", "T") : createdAt;
  const savedDate = new Date(normalizedValue);

  return Number.isNaN(savedDate.getTime()) ? null : savedDate;
}

// Check if one saved item was added today.
function isSavedToday(createdAt) {
  const savedDate = parseHistoryDate(createdAt);
  if (!savedDate) return false;

  const today = new Date();
  // Check both local and UTC dates to avoid timezone edge cases.
  const matchesLocalDate =
    savedDate.getFullYear() === today.getFullYear() &&
    savedDate.getMonth() === today.getMonth() &&
    savedDate.getDate() === today.getDate();

  const matchesUtcDate =
    savedDate.getUTCFullYear() === today.getUTCFullYear() &&
    savedDate.getUTCMonth() === today.getUTCMonth() &&
    savedDate.getUTCDate() === today.getUTCDate();

  return matchesLocalDate || matchesUtcDate;
}

// These are the small number cards at the top of the dashboard.
export default function DashboardSummaryCards({ historyRows = [] }) {
  const { t } = useLanguage();
  // Calculate the three numbers shown in the cards.
  const totalContracts = historyRows.length;
  const highRiskCount = historyRows.filter(
    (row) => String(row.risk_level || "").toLowerCase() === "high",
  ).length;
  const analyzedTodayCount = historyRows.filter((row) =>
    isSavedToday(row.created_at),
  ).length;

  // One data list keeps all summary cards consistent.
  const stats = [
    {
      label: t("dashboard.summaryCards.contracts"),
      value: totalContracts,
      helper: t("dashboard.summaryCards.contractsHelper"),
      icon: FileText,
      iconClassName: "text-brand-accent",
    },
    {
      label: t("dashboard.summaryCards.highRisk"),
      value: highRiskCount,
      helper: t("dashboard.summaryCards.highRiskHelper"),
      icon: AlertTriangle,
      iconClassName: "text-brand-danger",
    },
    {
      label: t("dashboard.summaryCards.analyzedToday"),
      value: analyzedTodayCount,
      helper: t("dashboard.summaryCards.analyzedTodayHelper"),
      icon: CalendarDays,
      iconClassName: "text-brand-success",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* map creates the three cards from the stats data above. */}
      {stats.map((item) => {
        // Use the icon chosen for this summary card.
        const Icon = item.icon;

        return (
        <motion.div
          key={item.label}
          whileHover={{ scale: 1.03 }}
          className="card-surface p-6 transition-shadow hover:shadow-panel md:p-7"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
                {item.label}
              </p>
              <h3 className="mt-3 text-3xl font-bold text-brand-ink">
                {item.value}
              </h3>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                {item.helper}
              </p>
            </div>

            <div
              className={`rounded-2xl bg-brand-surface p-3 ${item.iconClassName}`}
            >
              <Icon size={22} />
            </div>
          </div>
        </motion.div>
        );
      })}
    </div>
  );
}
