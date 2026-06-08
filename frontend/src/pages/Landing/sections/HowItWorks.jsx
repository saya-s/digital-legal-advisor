import { motion } from "framer-motion";
import { MessageSquare, Scale, Search, Upload } from "lucide-react";
import { useLanguage } from "../../../i18n/language.js";

// This section explains how the app works step by step.
export default function HowItWorks() {
  const { t, tm } = useLanguage();
  const translatedSteps = tm("landing.howItWorks.steps", []);
  const steps = [
    {
      ...(translatedSteps[0] || {}),
      icon: <Upload />,
    },
    {
      ...(translatedSteps[1] || {}),
      icon: <Search />,
    },
    {
      ...(translatedSteps[2] || {}),
      icon: <MessageSquare />,
    },
    {
      ...(translatedSteps[3] || {}),
      icon: <Scale />,
    },
  ];

  return (
    // Workflow section on the landing page.
    <section id="how-it-works" className="section-anchor bg-white">
      <div className="section-shell section-spacing">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <p className="eyebrow">{t("landing.howItWorks.eyebrow")}</p>
          <h2 className="mt-4 font-display text-4xl font-bold md:text-5xl">
            {t("landing.howItWorks.title")}
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            {t("landing.howItWorks.description")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {steps.map((step, i) => (
            <motion.article
              key={step.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              viewport={{ once: true }}
              className="card-surface p-8"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-accent/15 text-brand-accent">
                {step.icon}
              </div>

              <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-brand-accent">
                {t("landing.howItWorks.stepLabel", { number: i + 1 })}
              </p>

              <h3 className="mt-3 text-xl font-bold text-brand-ink">
                {step.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-600">
                {step.desc}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
