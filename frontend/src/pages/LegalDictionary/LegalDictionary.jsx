import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";

const previewTerms = [
  {
    id: 1,
    term: "Indemnity",
    plainMeaning:
      "One side promises to cover losses or legal costs if a certain problem happens.",
    whyItMatters:
      "This can move serious financial risk onto the person signing the contract.",
  },
  {
    id: 2,
    term: "Force majeure",
    plainMeaning:
      "A clause explaining what happens if events outside anyone's control prevent the contract from being performed.",
    whyItMatters:
      "It affects whether delays or missed obligations are excused.",
  },
];

export default function LegalDictionary() {
  const [query, setQuery] = useState("");

  const filteredTerms = useMemo(() => {
    const value = query.trim().toLowerCase();

    if (!value) {
      return previewTerms;
    }

    return previewTerms.filter((item) => {
      return (
        item.term.toLowerCase().includes(value) ||
        item.plainMeaning.toLowerCase().includes(value) ||
        item.whyItMatters.toLowerCase().includes(value)
      );
    });
  }, [query]);

  return (
    <DashboardLayout>
      <section className="card-surface p-8 md:p-10">
        <h1 className="mt-4 font-display text-4xl font-bold text-brand-ink">
          Legal dictionary
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
          Search a curated set of legal terms in plain language. This page
          currently shows a small sample glossary and can later display a
          larger live collection.
        </p>

        <div className="relative mt-8 max-w-xl">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a legal term or clause"
            className="w-full rounded-2xl border border-brand-line bg-brand-surface py-3.5 pl-12 pr-4 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15"
          />
        </div>
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {filteredTerms.map((item) => (
          <article key={item.id} className="card-surface p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
              Legal term
            </p>
            <h2 className="mt-3 text-2xl font-bold text-brand-ink">
              {item.term}
            </h2>

            <div className="mt-5 rounded-2xl bg-brand-surface px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Plain meaning
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {item.plainMeaning}
              </p>
            </div>

            <div className="mt-4 rounded-2xl border border-brand-line px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Why it matters
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                {item.whyItMatters}
              </p>
            </div>
          </article>
        ))}
      </div>

      {filteredTerms.length === 0 && (
        <div className="card-surface mt-6 p-8 text-center text-sm text-slate-500">
          No terms matched that search in the current preview set.
        </div>
      )}
    </DashboardLayout>
  );
}
