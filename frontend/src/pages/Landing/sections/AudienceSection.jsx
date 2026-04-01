import { motion } from "framer-motion";
import { FileText, MessageSquare, Scale, ShieldCheck } from "lucide-react";

export default function AudienceSection() {
  const supportAreas = [
    {
      title: "Small business contracts",
      desc: "Supplier agreements, shop leases, service terms, and payment clauses that affect daily business decisions.",
      icon: <FileText size={20} />,
    },
    {
      title: "Plain-language understanding",
      desc: "Complex legal language gets translated into practical wording that non-lawyers can act on.",
      icon: <MessageSquare size={20} />,
    },
    {
      title: "Human escalation when needed",
      desc: "The platform should help users recognise when a lawyer review is worth the cost and urgency.",
      icon: <Scale size={20} />,
    },
    {
      title: "Safer signing decisions",
      desc: "Risk indicators and clause-level warnings help users slow down before agreeing to one-sided terms.",
      icon: <ShieldCheck size={20} />,
    },
  ];

  const personaNeeds = [
    "He understands business, but not every legal phrase hidden inside a contract.",
    "He needs fast explanations before agreeing to supplier or rental terms.",
    "He wants reliable guidance without paying for a lawyer at every step.",
    "He still needs a clear path to expert help when the risk is serious.",
  ];

  return (
    <section id="who-its-for" className="section-anchor section-spacing">
      <div className="section-shell grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-3xl bg-brand-ink p-8 text-white shadow-panel"
        >
          <p className="eyebrow">Is This for You?</p>
          <h2 className="mt-4 font-display text-4xl font-bold">
            Built for people like Mohammad.
          </h2>
          <p className="mt-5 text-sm leading-7 text-slate-300">
            Mohammad is a grocery shop owner in Sulaymaniyah. He has real
            business experience, but no legal training. Misharu is being
            designed to translate hidden legal risk into clear, useful language
            for people in his position.
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
