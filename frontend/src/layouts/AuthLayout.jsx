import { CheckCircle2, Scale } from "lucide-react";
import { Link } from "react-router-dom";

export default function AuthLayout({
  children,
  formTitle,
  formSubtitle,
  panelEyebrow,
  panelTitle,
  panelDescription,
  panelPoints = [],
}) {
  return (
    <div className="min-h-screen bg-brand-surface px-4 py-8 md:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-panel">
        <div className="relative hidden flex-1 overflow-hidden bg-brand-ink px-10 py-12 text-white md:flex md:flex-col md:justify-between">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-accent/10 blur-2xl" />
          <div className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-brand-accent/10 blur-3xl" />

          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <Scale size={24} className="text-brand-accent" />
              </div>
              <div>
                <p className="font-display text-3xl font-bold leading-none">
                  Misharu
                </p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">
                  Digital Legal Advisor
                </p>
              </div>
            </Link>
          </div>

          <div className="relative z-10 max-w-xl">
            <p className="eyebrow">{panelEyebrow}</p>
            <h1 className="mt-5 font-display text-4xl font-bold leading-tight">
              {panelTitle}
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-300">
              {panelDescription}
            </p>

            {panelPoints.length > 0 && (
              <div className="mt-8 space-y-3">
                {panelPoints.map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <CheckCircle2
                      size={18}
                      className="mt-1 shrink-0 text-brand-accent"
                    />
                    <p className="text-sm leading-7 text-slate-200">{point}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="relative z-10">
            <p className="text-sm text-slate-400">
              © 2024 Misharu. All rights reserved.
            </p>
          </div>
        </div>

        <div className="flex flex-1 items-center bg-white px-6 py-10 sm:px-10 md:px-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 md:hidden">
              <Link to="/" className="inline-block">
                <p className="font-display text-3xl font-bold text-brand-ink">
                  Misharu
                </p>
                <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
                  Digital Legal Advisor
                </p>
              </Link>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-brand-ink">{formTitle}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                {formSubtitle}
              </p>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
