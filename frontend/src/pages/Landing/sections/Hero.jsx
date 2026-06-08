import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  FileText,
  MessageSquare,
  Scale,
} from "lucide-react";
import { useNavigate } from "react-router-dom"; //to navigate to other pages when buttons are clicked
import { useLanguage } from "../../../i18n/language.js";

export default function Hero() {
  const navigate = useNavigate();
  const { t, tm } = useLanguage();
  const highlights = tm("landing.hero.highlights", []);

  return (
    <section className="section-shell section-spacing grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
      <motion.div
        initial={{ opacity: 0, y: 40 }} //initial state for animation: starts slightly down and invisible
        animate={{ opacity: 1, y: 0 }} //animate to: fully visible and in original position
        transition={{ duration: 0.6 }} //animation duration of 0.6 seconds
      >
        <p className="eyebrow">{t("landing.hero.eyebrow")}</p>

        <h1 className="mt-5 font-display text-5xl font-bold leading-tight md:text-6xl">
          {t("landing.hero.title")}
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
          {t("landing.hero.description")}
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="cta-primary"
          >
            {t("landing.hero.primaryCta")} <ArrowRight size={16} />
          </button>

          <button
            type="button"
            onClick={() => navigate("/#how-it-works")}
            className="cta-secondary"
          >
            {t("landing.hero.secondaryCta")}
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          {t("landing.hero.disclaimer")}
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {highlights.map((item) => (
            <div key={item} className="card-surface p-4">
              <p className="text-sm font-semibold leading-6 text-slate-700">
                {item}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        whileHover={{ scale: 1.02 }}
        className="relative lg:pl-6"
      >
        <div className="absolute inset-0 rounded-3xl bg-brand-accent/10 blur-3xl" />

        <div className="card-surface relative overflow-hidden p-6 md:p-8">
          <div className="flex items-start justify-between gap-4 border-b border-brand-line pb-5">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-slate-500">
                {t("landing.hero.previewLabel")}
              </p>
              <h3 className="mt-2 text-xl font-bold text-brand-ink">
                {t("landing.hero.previewFile")}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {t("landing.hero.previewPreparedFor")}
              </p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-brand-warning">
              {t("landing.hero.previewRisk")}
            </span>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="rounded-2xl bg-brand-surface p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-ink">
                <FileText size={16} className="text-brand-accent" />
                {t("landing.hero.summaryLabel")}
              </div>
              <p className="text-sm leading-6 text-slate-600">
                {t("landing.hero.summaryText")}
              </p>
            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700">
                <AlertCircle size={16} />
                {t("landing.hero.flaggedClauseLabel")}
              </div>
              <p className="text-sm leading-6 text-red-800">
                {t("landing.hero.flaggedClauseText")}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-ink">
                <MessageSquare size={16} className="text-brand-accent" />
                {t("landing.hero.plainLanguageLabel")}
              </div>
              <p className="text-sm leading-6 text-slate-600">
                {t("landing.hero.plainLanguageText")}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-brand-ink p-4 text-white">
            <Scale size={18} className="mt-1 shrink-0 text-brand-accent" />
            <div>
              <p className="text-sm font-bold">
                {t("landing.hero.nextStepLabel")}
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                {t("landing.hero.nextStepText")}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
