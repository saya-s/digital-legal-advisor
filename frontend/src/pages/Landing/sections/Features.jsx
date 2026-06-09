import { motion } from "framer-motion";
import {
  BookOpen,
  BrainCircuit,
  FileDiff,
  FileSearch,
  Scale,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../i18n/language.js";

// This section shows the app's main features.
export default function Features() {
  const navigate = useNavigate();
  const { t, tm } = useLanguage();
  // Add the correct icon to each translated feature.
  const translatedFeatures = tm("landing.features.items", []);

  // Keep each translated feature and add its matching icon.
  const features = [
    {
      ...(translatedFeatures[0] || {}),
      icon: <Upload size={20} />,
    },
    {
      ...(translatedFeatures[1] || {}),
      icon: <BookOpen size={20} />,
    },
    {
      ...(translatedFeatures[2] || {}),
      icon: <BrainCircuit size={20} />,
    },
    {
      ...(translatedFeatures[3] || {}),
      icon: <FileDiff size={20} />,
    },
    {
      ...(translatedFeatures[4] || {}),
      icon: <ShieldCheck size={20} />,
    },
    {
      ...(translatedFeatures[5] || {}),
      icon: <FileSearch size={20} />,
    },
    {
      ...(translatedFeatures[6] || {}),
      icon: <Scale size={20} />,
    },
  ];

  return (
    // Features section on the landing page.
    <section id="core-features" className="section-anchor">
      <div className="section-shell section-spacing">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="eyebrow">{t("landing.features.eyebrow")}</p>
          <h2 className="mt-4 font-display text-4xl font-bold md:text-5xl">
            {t("landing.features.title")}
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            {t("landing.features.description")}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {/* Create one feature card and slightly delay each card's animation. */}
          {features.map((feat, i) => (
            <motion.article
              key={feat.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
              viewport={{ once: true }}
              className="card-surface p-8"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-accent/15 text-brand-accent">
                {feat.icon}
              </div>

              <h3 className="mt-6 text-xl font-bold text-brand-ink">
                {feat.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                {feat.desc}
              </p>
            </motion.article>
          ))}
        </div>

        {/* Buttons below the cards open the related full pages. */}
        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate("/compare")}
            className="cta-secondary"
          >
            {t("landing.features.compareCta")}
          </button>
          <button
            type="button"
            onClick={() => navigate("/templates")}
            className="cta-secondary"
          >
            {t("landing.features.templatesCta")}
          </button>
          <button
            type="button"
            onClick={() => navigate("/lawyers")}
            className="cta-primary"
          >
            {t("landing.features.lawyersCta")}
          </button>
        </div>
      </div>
    </section>
  );
}
