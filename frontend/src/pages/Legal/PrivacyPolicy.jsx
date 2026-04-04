import { Link } from "react-router-dom";
import MainLayout from "../../layouts/MainLayout.jsx";

const sections = [
  {
    title: "Information We Store",
    body:
      "The platform stores account details, saved analysis history, and any files or text you submit for review within the workflow.",
  },
  {
    title: "How Data Is Used",
    body:
      "Your data is used to authenticate your account, personalize the dashboard, save contract analysis history, and support the features you choose to use.",
  },
  {
    title: "Security Notes",
    body:
      "We take steps to protect account access, but this  should not be treated as a production-grade document vault for highly sensitive legal records.",
  },
  {
    title: "Your Choices",
    body:
      "You can stop using the platform at any time and request account-related changes from the project team while the website is under development.",
  },
];

export default function PrivacyPolicy() {
  return (
    <MainLayout>
      <section className="mx-auto max-w-4xl px-4 py-10 md:px-6">
        <div className="card-surface p-8 md:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
            Legal
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold text-brand-ink">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm leading-8 text-slate-600 md:text-base">
            This summary explains what information the Misharu website keeps
            and how that information supports the app experience.
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
            to="/terms"
            className="rounded-full border border-brand-line bg-white px-5 py-3 text-brand-ink transition hover:border-brand-accent hover:text-brand-accentDeep"
          >
            Read terms of service
          </Link>
        </div>
      </section>
    </MainLayout>
  );
}
