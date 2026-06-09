import {
  ArrowRight,
  BookOpenText,
  FileText,
  FolderKanban,
  Loader2,
  Scale,
  Search,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buildApiUrl } from "../../config/api.js";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getAuthSession } from "../../utils/authSession.js";
import { getRiskBadgeTone } from "../../utils/riskTone.js";

// Empty shape used before a search or after an error.
const emptyResults = {
  glossaryResults: [],
  articleResults: [],
  documentResults: [],
  templateResults: [],
  suggestedQueries: [],
  resultCounts: { glossary: 0, articles: 0, documents: 0, templates: 0 },
};

// This page searches terms across the dictionary, laws, contracts, and templates.
export default function LegalDictionary() {
  // Search text, returned results, and request messages.
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [results, setResults] = useState(emptyResults);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const hasActiveQuery = Boolean(activeQuery);
  const totalSearchResults =
    // Add all four result groups for the summary count.
    (results.resultCounts.glossary || 0) +
    (results.resultCounts.articles || 0) +
    (results.resultCounts.documents || 0) +
    (results.resultCounts.templates || 0);

  // STEP 1: Load the browse list or search every legal source for a word.
  const loadResults = async (nextQuery = "") => {
    const session = getAuthSession();

    if (!session?.token) {
      setError("Your session expired. Please sign in again.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Add the typed word to the website request.
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
        setResults(emptyResults);
        setError(data?.error || "Could not search the legal dictionary.");
        return;
      }

      // Keep every result group as a list, even when the server sends none.
      setResults({
        glossaryResults: Array.isArray(data.glossaryResults)
          ? data.glossaryResults
          : [],
        articleResults: Array.isArray(data.articleResults)
          ? data.articleResults
          : [],
        documentResults: Array.isArray(data.documentResults)
          ? data.documentResults
          : [],
        templateResults: Array.isArray(data.templateResults)
          ? data.templateResults
          : [],
        suggestedQueries: Array.isArray(data.suggestedQueries)
          ? data.suggestedQueries
          : [],
        resultCounts: data.resultCounts || emptyResults.resultCounts,
      });
      setActiveQuery(nextQuery.trim());
    } catch {
      setResults(emptyResults);
      setError("Could not connect to the server.");
    } finally {
      setIsLoading(false);
    }
  };

  // Load the basic dictionary list when the page opens.
  useEffect(() => {
    // An empty query loads the default browse list.
    loadResults("");
  }, []);

  // STEP 2: Search using the text typed into the form.
  const handleSubmit = async (event) => {
    event.preventDefault();
    await loadResults(query);
  };

  // Search immediately when a suggested term is clicked.
  const runSuggestedQuery = async (nextQuery) => {
    setQuery(nextQuery);
    await loadResults(nextQuery);
  };

  // Return to the unfiltered dictionary list.
  const clearSearch = async () => {
    setQuery("");
    await loadResults("");
  };

  return (
    <DashboardLayout>
      {/* SCREEN 1: Search box, suggestions, and request message. */}
      <section className="card-surface p-8 md:p-10">
        <p className="eyebrow">Dictionary</p>
        <h1 className="mt-4 font-display text-4xl font-bold text-brand-ink">
          Search a legal term, clause phrase, or contract topic
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
          Enter a word you want to look up, then review the matching glossary
          definitions, saved contract snippets, template clauses, and related
          law sections directly under the search box.
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
              placeholder="Search a legal term, clause phrase, or contract topic"
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
          {/* Create one quick-search button for every suggested term. */}
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

        {/* Choose the active-search summary or the default browse message. */}
        {hasActiveQuery && !isLoading ? (
          <div className="mt-6 rounded-[1.75rem] border border-brand-line bg-brand-surface px-5 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
                  Search results
                </p>
                <h2 className="mt-2 text-2xl font-bold text-brand-ink">
                  Results for "{activeQuery}"
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Found {totalSearchResults} matching item
                  {totalSearchResults === 1 ? "" : "s"} across dictionary
                  terms, saved contracts, templates, and law sections.
                </p>
              </div>

              <button
                type="button"
                onClick={clearSearch}
                className="inline-flex items-center gap-2 rounded-full border border-brand-line bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-600 transition hover:border-brand-accent hover:text-brand-accentDeep"
              >
                <X size={14} />
                Clear Search
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-[1.75rem] border border-brand-line bg-brand-surface px-5 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
              Browse the dictionary
            </p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Search first if you want exact results. Otherwise, browse the
              quick dictionary list below for common legal and contract terms.
            </p>
          </div>
        )}

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}
      </section>

      {/* Full-page loading message while all sources are searched. */}
      {isLoading ? (
        <div className="card-surface mt-6 flex items-center justify-center gap-3 p-8 text-sm font-semibold text-slate-500">
          <Loader2 size={20} className="animate-spin text-brand-accent" />
          Searching glossary terms, law articles, saved contracts, and template
          clauses...
        </div>
      ) : null}

      {/* SCREEN 2: Group search results by dictionary, law, contract, or template. */}
      {/* Detailed grouped results appear only after a completed search. */}
      {hasActiveQuery && !isLoading ? (
        <>
          {totalSearchResults === 0 ? (
            <div className="card-surface mt-6 px-6 py-10 text-center">
              <p className="text-lg font-bold text-brand-ink">
                No results matched "{activeQuery}"
              </p>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                Try a more specific term such as termination, indemnity,
                confidentiality, payment, or governing law.
              </p>
            </div>
          ) : null}

          <div className="mt-6 grid gap-6">
            {/* Plain-language dictionary definitions. */}
            <section className="card-surface p-6 md:p-7">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-brand-surface p-3 text-brand-accent">
                  <BookOpenText size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-ink">
                    Dictionary matches
                  </p>
                  <p className="text-sm text-slate-500">
                    Plain-language explanations for legal and contract terms.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {/* Create one result card for every matching dictionary term. */}
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
                  </article>
                ))}

                {!results.glossaryResults.length ? (
                  <div className="rounded-2xl border border-dashed border-brand-line bg-brand-surface px-6 py-10 text-center">
                    <p className="text-sm font-semibold text-brand-ink">
                      No dictionary terms matched that search yet.
                    </p>
                  </div>
                ) : null}
              </div>
            </section>

            {/* Matching sections from the loaded law library. */}
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
                    Closest matching provisions from the loaded legal texts.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {/* Create one result card for every matching law section. */}
                {results.articleResults.map((item) => (
                  <article
                    key={
                      item.citation_id ||
                      `${item.source_document}-${item.reference_label || item.article_label}`
                    }
                    className="rounded-[1.75rem] border border-brand-line bg-brand-surface p-5"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
                      {item.chapter || item.law_title || "Loaded law section"}
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-brand-ink">
                      {item.reference_label || item.article_label}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {item.excerpt}
                    </p>
                    <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                      Source: {item.source_document}
                    </p>
                  </article>
                ))}

                {!results.articleResults.length ? (
                  <div className="rounded-2xl border border-dashed border-brand-line bg-brand-surface px-6 py-10 text-center">
                    <p className="text-sm font-semibold text-brand-ink">
                      No law articles matched that search yet.
                    </p>
                  </div>
                ) : null}
              </div>
            </section>

            {/* Matching text from the user's saved contract analyses. */}
            <section className="card-surface p-6 md:p-7">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-brand-surface p-3 text-brand-accent">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-ink">
                    Saved contract matches
                  </p>
                  <p className="text-sm text-slate-500">
                    Search through the document text and clause bodies from the
                    contracts you saved after analysis.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {/* Create one result card for every matching saved contract. */}
                {results.documentResults.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-[1.75rem] border border-brand-line bg-brand-surface p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
                          Saved analysis
                        </p>
                        <h2 className="mt-2 text-xl font-bold text-brand-ink">
                          {item.documentName}
                        </h2>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${getRiskBadgeTone(
                          item.riskLevel,
                        )}`}
                      >
                        {item.riskLevel} risk
                      </span>
                    </div>

                    {item.summary ? (
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {item.summary}
                      </p>
                    ) : null}

                    <div className="mt-4 rounded-2xl bg-white px-4 py-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        Matched text
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {item.snippet}
                      </p>
                    </div>

                    {/* Show no clause cards when this contract has no matching clauses. */}
                    {item.matchedClauses?.length ? (
                      <div className="mt-4 space-y-3">
                        {/* Build one card for every matching clause in this contract. */}
                        {item.matchedClauses.map((clause) => (
                          <div
                            key={`${item.id}-${clause.id}`}
                            className="rounded-2xl border border-brand-line bg-white px-4 py-4"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-brand-ink">
                                {clause.title}
                              </p>
                              <span className="rounded-full bg-brand-surface px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-accentDeep">
                                {clause.label}
                              </span>
                              {clause.risk ? (
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${getRiskBadgeTone(
                                    clause.risk,
                                  )}`}
                                >
                                  {clause.risk}
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-2 text-sm leading-7 text-slate-600">
                              {clause.snippet}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                        {item.totalClauses} indexed clauses
                      </span>
                      <Link
                        to="/upload"
                        className="inline-flex items-center gap-2 text-sm font-bold text-brand-accentDeep transition hover:text-brand-accent"
                      >
                        Open upload workspace <ArrowRight size={16} />
                      </Link>
                    </div>
                  </article>
                ))}

                {!results.documentResults.length ? (
                  <div className="rounded-2xl border border-dashed border-brand-line bg-brand-surface px-6 py-10 text-center">
                    <p className="text-sm font-semibold text-brand-ink">
                      No saved contracts matched that search yet.
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      Save an analyzed contract from the upload workspace to
                      make it searchable here.
                    </p>
                    <Link
                      to="/upload"
                      className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-inkSoft"
                    >
                      Analyze a contract <ArrowRight size={16} />
                    </Link>
                  </div>
                ) : null}
              </div>
            </section>

            {/* Matching clauses from reusable contract templates. */}
            <section className="card-surface p-6 md:p-7">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-brand-surface p-3 text-brand-accent">
                  <FolderKanban size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-ink">
                    Template body matches
                  </p>
                  <p className="text-sm text-slate-500">
                    Search through the actual template file contents and surfaced
                    clause matches, not just titles and descriptions.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {/* Create one result card for every matching template. */}
                {results.templateResults.map((item) => (
                  <article
                    key={item.templateId}
                    className="rounded-[1.75rem] border border-brand-line bg-brand-surface p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
                          {item.category}
                        </p>
                        <h2 className="mt-2 text-xl font-bold text-brand-ink">
                          {item.title}
                        </h2>
                      </div>
                      {item.previewUrl ? (
                        <a
                          href={item.previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-bold text-brand-accentDeep transition hover:text-brand-accent"
                        >
                          Open template <ArrowRight size={16} />
                        </a>
                      ) : null}
                    </div>

                    {item.description ? (
                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {item.description}
                      </p>
                    ) : null}

                    <div className="mt-4 rounded-2xl bg-white px-4 py-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        Matched text
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {item.snippet}
                      </p>
                    </div>

                    {item.matchedClauses?.length ? (
                      <div className="mt-4 space-y-3">
                        {/* Build one card for every matching clause in this template. */}
                        {item.matchedClauses.map((clause) => (
                          <div
                            key={`${item.templateId}-${clause.id}`}
                            className="rounded-2xl border border-brand-line bg-white px-4 py-4"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold text-brand-ink">
                                {clause.title}
                              </p>
                              <span className="rounded-full bg-brand-surface px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-accentDeep">
                                {clause.label}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-7 text-slate-600">
                              {clause.snippet}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                        {item.totalClauses} indexed clauses
                      </span>
                      <Link
                        to="/templates"
                        className="inline-flex items-center gap-2 text-sm font-bold text-brand-accentDeep transition hover:text-brand-accent"
                      >
                        Browse template library <ArrowRight size={16} />
                      </Link>
                    </div>
                  </article>
                ))}

                {!results.templateResults.length ? (
                  <div className="rounded-2xl border border-dashed border-brand-line bg-brand-surface px-6 py-10 text-center">
                    <p className="text-sm font-semibold text-brand-ink">
                      No template clauses matched that search yet.
                    </p>
                    <p className="mt-3 text-sm leading-7 text-slate-500">
                      Template matches are taken from the template body text,
                      not just the template card title.
                    </p>
                    <Link
                      to="/templates"
                      className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-inkSoft"
                    >
                      Open templates <ArrowRight size={16} />
                    </Link>
                  </div>
                ) : null}
              </div>
            </section>
          </div>
        </>
      ) : null}

      {/* Default browse view shown before the user searches. */}
      {!hasActiveQuery && !isLoading ? (
        <section className="card-surface mt-6 p-6 md:p-7">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-surface p-3 text-brand-accent">
              <BookOpenText size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-brand-ink">Dictionary</p>
              <p className="text-sm text-slate-500">
                Quick legal and contract terms with short definitions.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {/* Build the default browse cards from the glossary results. */}
            {results.glossaryResults.map((item) => (
              <article
                key={item.id}
                className="rounded-[1.5rem] border border-brand-line bg-brand-surface p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
                      {item.category}
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-brand-ink">
                      {item.term}
                    </h2>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {item.plainMeaning}
                </p>
                <p className="mt-4 text-xs leading-6 text-slate-500">
                  {item.whyItMatters}
                </p>
              </article>
            ))}

            {!results.glossaryResults.length ? (
              <div className="rounded-2xl border border-dashed border-brand-line bg-brand-surface px-6 py-10 text-center">
                <p className="text-sm font-semibold text-brand-ink">
                  No dictionary entries are available yet.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </DashboardLayout>
  );
}
