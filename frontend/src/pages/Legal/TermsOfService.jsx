import { Link } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout.jsx";

const sections = [
  {
    title: "Use of the Platform",
    body:
      "Misharu provides educational legal-support tools to help users review contracts, browse templates, and organize legal information. It does not create an attorney-client relationship.",
  },
  {
    title: "User Responsibilities",
    body:
      "You are responsible for the information you upload, the accounts you create, and the decisions you make based on the platform output. Review important contracts carefully before signing.",
  },
  {
    title: "AI Limitations",
    body:
      "Automated summaries, clause labels, and risk indicators are support tools only. They may be incomplete or incorrect and should not replace advice from a qualified lawyer.",
  },
  {
    title: "Acceptable Use",
    body:
      "Do not use the platform to upload unlawful content, abuse other users, or attempt to interfere with the system. Access may be limited if misuse is detected.",
  },
];

export default function TermsOfService() {
  return (
    <MainLayout>
      <section className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <div className="card-surface p-8 md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
            Legal
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold text-brand-ink">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm leading-8 text-slate-600 md:text-base">
            These terms explain how the Misharu website may be used and what
            responsibilities remain with the user.
          </p>
        </div>

        <div className="mt-6 space-y-6">
          {sections.map((section) => (
            <article key={section.title} className="card-surface p-6 md:p-8">
              <h2 className="text-2xl font-bold text-brand-ink">
                {section.title}
              </h2>
              <p className="mt-3 text-sm leading-8 text-slate-600 md:text-base">
                {section.body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-4 text-sm font-semibold">
          <Link
            to="/register"
            className="rounded-full bg-brand-ink px-5 py-3 text-white transition hover:bg-brand-inkSoft"
          >
            Back to sign up
          </Link>
          <Link
            to="/privacy"
            className="rounded-full border border-brand-line bg-white px-5 py-3 text-brand-ink transition hover:border-brand-accent hover:text-brand-accentDeep"
          >
            Read privacy policy
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
