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

export default function Features() {
  const navigate = useNavigate();

  const features = [
    {
      title: "Document upload and analysis",
      desc: "Upload a contract and review clause detection, risk flags, structure, and an overall explanation in one workspace.",
      icon: <Upload size={20} />,
    },
    {
      title: "Clause explainer",
      desc: "Select a clause and receive a simpler explanation in everyday language, with less legal jargon and more practical meaning.",
      icon: <BookOpen size={20} />,
    },
    {
      title: "AI legal question answering",
      desc: "Ask follow-up questions about a contract or a legal term and receive guided answers with a clear safety disclaimer.",
      icon: <BrainCircuit size={20} />,
    },
    {
      title: "Document comparison engine",
      desc: "Compare an original contract against a revised version to find added clauses, removed sections, wording changes, and higher-risk edits.",
      icon: <FileDiff size={20} />,
    },
    {
      title: "Risk scoring and safer decisions",
      desc: "Classify documents by risk level and explain why certain clauses deserve more caution before signing.",
      icon: <ShieldCheck size={20} />,
    },
    {
      title: "Template library",
      desc: "Browse ready-made contract templates by category and use them as a reference before accepting a one-sided agreement.",
      icon: <FileSearch size={20} />,
    },
    {
      title: "Lawyer finder",
      desc: "Filter lawyers by city and specialty when the user needs a human review for a high-risk contract.",
      icon: <Scale size={20} />,
    },
  ];

  return (
    <section id="core-features" className="section-anchor">
      <div className="section-shell section-spacing">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <p className="eyebrow">Platform Modules</p>
          <h2 className="mt-4 font-display text-4xl font-bold md:text-5xl">
            Powerful Features for Confident Decisions{" "}
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            Misharu is not meant to be a single chatbot. It combines AI, legal
            expertise, and easy-to-use tools to help you understand, analyze,
            and act on contracts like a pro.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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

        <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate("/compare")}
            className="cta-secondary"
          >
            Try document comparison
          </button>
          <button
            type="button"
            onClick={() => navigate("/templates")}
            className="cta-secondary"
          >
            Browse templates
          </button>
          <button
            type="button"
            onClick={() => navigate("/lawyers")}
            className="cta-primary"
          >
            Explore lawyers
          </button>
        </div>
      </div>
    </section>
  );
}
