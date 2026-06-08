import { motion } from "framer-motion";
import { FileText, MessageSquare, Scale, ShieldCheck } from "lucide-react";
import { useLanguage } from "../../../i18n/language.js";

// This section explains who the app is for.
export default function AudienceSection() {
  const { t, tm } = useLanguage();
  const translatedSupportAreas = tm("landing.audience.supportAreas", []);
  const supportAreas = [
    {
      ...(translatedSupportAreas[0] || {}),
      icon: <FileText size={20} />,
    },
    {
      ...(translatedSupportAreas[1] || {}),
      icon: <MessageSquare size={20} />,
    },
    {
      ...(translatedSupportAreas[2] || {}),
      icon: <Scale size={20} />,
    },
    {
      ...(translatedSupportAreas[3] || {}),
      icon: <ShieldCheck size={20} />,
    },
  ];

  const personaNeeds = tm("landing.audience.personaNeeds", []);

  return (
    // Audience section on the landing page.
    <section id="who-its-for" className="section-anchor section-spacing">
      <div className="section-shell grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-3xl bg-brand-ink p-8 text-white shadow-panel"
        >
          <p className="eyebrow">{t("landing.audience.eyebrow")}</p>
          <h2 className="mt-4 font-display text-4xl font-bold">
            {t("landing.audience.title")}
          </h2>
          <p className="mt-5 text-sm leading-7 text-slate-300">
            {t("landing.audience.description")}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {personaNeeds.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2">
          {supportAreas.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.08 }}
              className="card-surface p-6"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-accent/15 text-brand-accent">
                {item.icon}
              </div>
              <h3 className="text-lg font-bold text-brand-ink">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {item.desc}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
