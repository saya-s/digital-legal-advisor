import { motion } from "framer-motion";
import { MessageSquare, Scale, Search, Upload } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      title: "Upload a contract",
      desc: "Start with the document you already have, such as a rental, supplier, employment, or service agreement.",
      icon: <Upload />,
    },
    {
      title: "Review the risky parts",
      desc: "The platform should flag unusual clauses, show the contract structure, and highlight areas that deserve attention.",
      icon: <Search />,
    },
    {
      title: "Ask follow-up questions",
      desc: "Users can ask for a simpler explanation of a clause or request a short overall summary in plain language.",
      icon: <MessageSquare />,
    },
    {
      title: "Decide or escalate",
      desc: "If the contract still looks risky, the user can compare templates or move to the lawyer finder for human support.",
      icon: <Scale />,
    },
  ];

  return (
    <section id="how-it-works" className="section-anchor bg-white">
      <div className="section-shell section-spacing">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <p className="eyebrow">Workflow</p>
          <h2 className="mt-4 font-display text-4xl font-bold md:text-5xl">
            A simple legal workflow for people who are not lawyers.
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-600">
            The goal is not to impress users with AI. The goal is to help them
            read faster, understand better, and avoid signing harmful terms by
            mistake.
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
                Step {i + 1}
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
