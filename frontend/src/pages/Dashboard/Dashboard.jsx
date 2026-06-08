import { FileDiff } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buildApiUrl } from "../../config/api.js";
import DashboardLayout from "../../layouts/DashboardLayout";
import AnalysesTable from "./sections/AnalysesTable";
import DashboardSummaryCards from "./sections/DashboardSummaryCards";
import RecentActivityList from "./sections/RecentActivityList";
import RiskDistributionChart from "./sections/RiskDistributionChart";
import { useLanguage } from "../../i18n/language.js";
import { getAuthSession } from "../../utils/authSession.js";

// This is the main signed-in dashboard page.
export default function Dashboard() {
  // Saved history is shared with the cards, table, chart, and activity list.
  const [historyRows, setHistoryRows] = useState([]);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  const { t } = useLanguage();
  const session = getAuthSession();
  const hasSavedHistory = historyRows.length > 0;
  const isReturningUser = hasLoadedHistory && hasSavedHistory;
  const welcomeHeading = isReturningUser
    ? t("dashboard.hero.welcomeBack", {
        username: session?.username || "User",
      })
    : t("dashboard.hero.welcome", {
        username: session?.username || "User",
      });
  const welcomeDescription = isReturningUser
    ? t("dashboard.hero.returningDescription")
    : t("dashboard.hero.firstDescription");

  useEffect(() => {
    // Load the saved history once when the page opens.
    async function loadHistory() {
      const currentSession = getAuthSession();
      if (!currentSession?.token) {
        setHasLoadedHistory(true);
        return;
      }

      try {
        const response = await fetch(buildApiUrl("/api/history"), {
          headers: {
            Authorization: `Bearer ${currentSession.token}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        setHistoryRows(Array.isArray(data) ? data : []);
      } finally {
        setHasLoadedHistory(true);
      }
    }

    loadHistory();
  }, []);

  return (
    // Dashboard layout gives this page the sidebar and top bar.
    <DashboardLayout>
      {/* Welcome area. */}
      <section className="card-surface mb-6 overflow-hidden">
        <div className="relative px-6 py-7 md:px-8 md:py-8">
          <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-brand-accent/10 blur-3xl" />

          <div className="relative">
            <p className="eyebrow">{t("dashboard.hero.eyebrow")}</p>
            <h1 className="mt-3 font-display text-3xl font-bold text-brand-ink md:text-4xl">
              {welcomeHeading}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
              {welcomeDescription}
            </p>
          </div>
        </div>
      </section>

      {/* Small summary cards. */}
      <DashboardSummaryCards historyRows={historyRows} />

      {/* Quick shortcut to the compare page. */}
      <section className="card-surface mt-6 overflow-hidden bg-brand-ink text-white">
        <div className="relative px-6 py-7 md:px-8 md:py-8">
          <div className="absolute -right-12 top-0 h-36 w-36 rounded-full bg-brand-accent/15 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accent">
                {t("dashboard.compare.eyebrow")}
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold text-white">
                {t("dashboard.compare.title")}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                {t("dashboard.compare.description")}
              </p>
            </div>

            <Link
              to="/compare"
              className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-white px-5 py-3 text-sm font-bold text-brand-ink transition hover:bg-slate-100"
            >
              <FileDiff size={18} />
              {t("dashboard.compare.cta")}
            </Link>
          </div>
        </div>
      </section>

      {/* Table and chart side by side. */}
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <AnalysesTable historyRows={historyRows} />
        <RiskDistributionChart historyRows={historyRows} />
      </div>

      {/* Latest saved activity. */}
      <RecentActivityList historyRows={historyRows} />
    </DashboardLayout>
  );
}
