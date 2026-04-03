import { AlertTriangle, MessageSquareText, Scale, Sparkles } from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";

const PROMPTS = [
  "Explain this clause in plain language",
  "What should I watch for before signing?",
  "When should I speak to a real lawyer?",
];

export default function QA() {
  return (
    <DashboardLayout>
      <section className="card-surface overflow-hidden bg-brand-ink text-white">
        <div className="relative px-6 py-10 md:px-8 md:py-12">
          <div className="absolute -right-16 -top-12 h-48 w-48 rounded-full bg-brand-accent/10 blur-3xl" />
          <div className="absolute -bottom-20 left-0 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

          <div className="relative z-10 grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
            <div>
              <p className="eyebrow">AI Legal Chat</p>
              <h1 className="mt-3 font-display text-4xl font-bold text-white">
                Ask follow-up legal questions in simpler language
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-300 md:text-base">
                This page is ready for your chat UI. For now it gives you a
                polished placeholder that matches the rest of the workspace.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/10 p-3 text-brand-accent">
                  <MessageSquareText size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">
                    Suggested starter prompts
                  </p>
                  <p className="text-sm text-slate-300">
                    Use these as placeholder chips for the real assistant flow.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {PROMPTS.map((prompt) => (
                  <span
                    key={prompt}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200"
                  >
                    {prompt}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="card-surface p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-surface text-brand-accent">
            <Sparkles size={20} />
          </div>
          <h2 className="mt-4 text-xl font-bold text-brand-ink">
            Plain-language answers
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            The assistant should explain rights, clauses, and risks in a way a
            non-lawyer can actually follow.
          </p>
        </section>

        <section className="card-surface p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-surface text-brand-accent">
            <AlertTriangle size={20} />
          </div>
          <h2 className="mt-4 text-xl font-bold text-brand-ink">
            Safety disclaimer
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Keep a visible reminder that AI supports understanding, but it does
            not replace licensed legal advice.
          </p>
        </section>

        <section className="card-surface p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-surface text-brand-accent">
            <Scale size={20} />
          </div>
          <h2 className="mt-4 text-xl font-bold text-brand-ink">
            Escalate to a lawyer
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            High-risk questions should point users toward the lawyer directory
            when human review is the safer next step.
          </p>
        </section>
      </div>
    </DashboardLayout>
  );
}
