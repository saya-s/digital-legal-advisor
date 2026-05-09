import {
  BookOpenText,
  Loader2,
  Scale,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { buildApiUrl } from "../../config/api.js";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getAuthSession } from "../../utils/authSession.js";

function ResultCount({ label, value }) {
  return (
    <div className="rounded-2xl bg-brand-surface px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-brand-ink">{value}</p>
    </div>
  );
}

export default function LegalDictionary() {
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [results, setResults] = useState({
    glossaryResults: [],
    articleResults: [],
    suggestedQueries: [],
    resultCounts: { glossary: 0, articles: 0 },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadResults = async (nextQuery = "") => {
    const session = getAuthSession();

    if (!session?.token) {
      setError("Your session expired. Please sign in again.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (nextQuery.trim()) {
        params.set("q", nextQuery.trim());
      }

      const path = params.toString()
        ? `/api/legal-dictionary/search?${params.toString()}`
        : "/api/legal-dictionary/search";

      const response = await fetch(buildApiUrl(path), {
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setResults({
          glossaryResults: [],
          articleResults: [],
          suggestedQueries: [],
          resultCounts: { glossary: 0, articles: 0 },
        });
        setError(data?.error || "Could not search the legal dictionary.");
        return;
      }

      setResults({
        glossaryResults: Array.isArray(data.glossaryResults)
          ? data.glossaryResults
          : [],
        articleResults: Array.isArray(data.articleResults)
          ? data.articleResults
          : [],
        suggestedQueries: Array.isArray(data.suggestedQueries)
          ? data.suggestedQueries
          : [],
        resultCounts: data.resultCounts || { glossary: 0, articles: 0 },
      });
      setActiveQuery(nextQuery.trim());
    } catch {
      setResults({
        glossaryResults: [],
        articleResults: [],
        suggestedQueries: [],
        resultCounts: { glossary: 0, articles: 0 },
      });
      setError("Could not connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadResults("");
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await loadResults(query);
  };

  const runSuggestedQuery = async (nextQuery) => {
    setQuery(nextQuery);
    await loadResults(nextQuery);
  };

  return (
    <DashboardLayout>
      <section className="card-surface p-8 md:p-10">
        <p className="eyebrow">Legal Search</p>
        <h1 className="mt-4 font-display text-4xl font-bold text-brand-ink">
          Search legal terms, clause concepts, and Iraq labour-law articles
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
          This tool now searches a real glossary plus the labour-law dataset in
          your project. Use it to look up a term, understand why it matters,
          and see the most relevant law articles in one place.
        </p>

        <form className="mt-8" onSubmit={handleSubmit}>
          <div className="relative max-w-2xl">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search a legal term, clause type, or labour-law topic"
              className="w-full rounded-2xl border border-brand-line bg-brand-surface py-3.5 pl-12 pr-32 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-brand-ink px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-brand-inkSoft disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isLoading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap gap-2">
          {results.suggestedQueries.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => runSuggestedQuery(item)}
              disabled={isLoading}
              className="rounded-full border border-brand-line bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-brand-accent hover:text-brand-ink disabled:cursor-not-allowed disabled:opacity-60"
            >
              {item}
            </button>
          ))}
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ResultCount
          label="Glossary Matches"
          value={results.resultCounts.glossary || 0}
        />
        <ResultCount
          label="Article Matches"
          value={results.resultCounts.articles || 0}
        />
        <div className="rounded-2xl bg-brand-surface px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Search Mode
          </p>
          <p className="mt-2 text-base font-bold text-brand-ink">
            {activeQuery ? "Live search results" : "Featured references"}
          </p>
        </div>
        <div className="rounded-2xl bg-brand-surface px-4 py-4">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            Current Query
          </p>
          <p className="mt-2 text-base font-bold text-brand-ink">
            {activeQuery || "featured terms"}
          </p>
        </div>
      </section>

      {isLoading ? (
        <div className="card-surface mt-6 flex items-center justify-center gap-3 p-8 text-sm font-semibold text-slate-500">
          <Loader2 size={20} className="animate-spin text-brand-accent" />
          Searching glossary terms and law articles...
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="card-surface p-6 md:p-7">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-surface p-3 text-brand-accent">
              <BookOpenText size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-brand-ink">
                Glossary results
              </p>
              <p className="text-sm text-slate-500">
                Plain-language explanations for legal and contract terms.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {results.glossaryResults.map((item) => (
              <article
                key={item.id}
                className="rounded-[1.75rem] border border-brand-line bg-brand-surface p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
                      {item.category}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-brand-ink">
                      {item.term}
                    </h2>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-white px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Plain meaning
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {item.plainMeaning}
                  </p>
                </div>

                <div className="mt-4 rounded-2xl border border-brand-line bg-white px-4 py-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                    Why it matters
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {item.whyItMatters}
                  </p>
                </div>

                {item.relatedArticles?.length ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.relatedArticles.map((article) => (
                      <span
                        key={`${item.id}-${article.article_number}`}
                        className="rounded-full bg-brand-ink px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white"
                      >
                        {article.article_label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}

            {!results.glossaryResults.length && !isLoading ? (
              <div className="rounded-2xl border border-dashed border-brand-line bg-brand-surface px-6 py-10 text-center">
                <p className="text-sm font-semibold text-brand-ink">
                  No glossary terms matched that search yet.
                </p>
              </div>
            ) : null}
          </div>
        </section>

        <section className="card-surface p-6 md:p-7">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-surface p-3 text-brand-accent">
              <Scale size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-brand-ink">
                Matching law articles
              </p>
              <p className="text-sm text-slate-500">
                Closest labour-law provisions tied to your search.
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {results.articleResults.map((item) => (
              <article
                key={item.article_number}
                className="rounded-[1.75rem] border border-brand-line bg-brand-surface p-5"
              >
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
                  {item.chapter}
                </p>
                <h2 className="mt-2 text-xl font-bold text-brand-ink">
                  {item.article_label}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {item.excerpt}
                </p>
                <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                  Source: {item.source_document}
                </p>
              </article>
            ))}

            {!results.articleResults.length && !isLoading ? (
              <div className="rounded-2xl border border-dashed border-brand-line bg-brand-surface px-6 py-10 text-center">
                <p className="text-sm font-semibold text-brand-ink">
                  No law articles matched that search yet.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
