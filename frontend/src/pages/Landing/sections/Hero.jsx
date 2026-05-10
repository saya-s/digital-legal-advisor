import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  FileText,
  MessageSquare,
  Scale,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Hero() {
  const navigate = useNavigate();
  const highlights = [
    "Plain-language clause explanations",
    "Risk-focused contract review",
    "Side-by-side version comparison",
    "A clearer path to lawyer support when needed",
  ];

  return (
    <section className="section-shell section-spacing grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <p className="eyebrow">AI-assisted legal clarity for non-lawyers</p>

        <h1 className="mt-5 font-display text-5xl font-bold leading-tight md:text-6xl">
          Understand Every Contract Before You Sign
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
          Misharu helps shop owners, tenants, employees, and families read
          legal documents in plain language, spot risky clauses, and know when
          a human lawyer should step in.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="cta-primary"
          >
            Create an account <ArrowRight size={16} />
          </button>

          <button
            type="button"
            onClick={() => navigate("/#how-it-works")}
            className="cta-secondary"
          >
            See how it works
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          AI-assisted explanations support understanding. They do not replace
          licensed legal advice.
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
                Analysis Preview
              </p>
              <h3 className="mt-2 text-xl font-bold text-brand-ink">
                Supplier Agreement.pdf
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Prepared for a grocery shop in Sulaymaniyah
              </p>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-brand-warning">
              Medium risk
            </span>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="rounded-2xl bg-brand-surface p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-ink">
                <FileText size={16} className="text-brand-accent" />
                Quick summary
              </div>
              <p className="text-sm leading-6 text-slate-600">
                The supplier can end the contract quickly, while the shop still
                faces late payment penalties and limited negotiation rights.
              </p>
            </div>

            <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700">
                <AlertCircle size={16} />
                Flagged clause
              </div>
              <p className="text-sm leading-6 text-red-800">
                "The supplier may terminate this agreement without notice while
                outstanding penalties remain payable by the client."
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-ink">
                <MessageSquare size={16} className="text-brand-accent" />
                Plain-language explanation
              </div>
              <p className="text-sm leading-6 text-slate-600">
                This means the other side can stop supplying goods fast, but you
                may still owe money if they say you broke the agreement.
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-brand-ink p-4 text-white">
            <Scale size={18} className="mt-1 shrink-0 text-brand-accent" />
            <div>
              <p className="text-sm font-bold">Recommended next step</p>
              <p className="mt-1 text-sm leading-6 text-slate-300">
                Review the termination and penalty clauses, then compare them
                with a standard supplier template or consult a lawyer.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
