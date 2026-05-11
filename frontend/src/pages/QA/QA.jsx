import {
  AlertTriangle,
  Loader2,
  MessageSquareText,
  Scale,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { buildApiUrl } from "../../config/api.js";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getAuthSession } from "../../utils/authSession.js";
import { getRiskBadgeTone } from "../../utils/riskTone.js";

const DEFAULT_PROMPTS = [
  "What does Article 14 of the Constitution of Iraq say?",
  "Can a foreign investor fully own a project in Kurdistan Region?",
  "What are the official languages of Iraq?",
];

function getConfidenceTone(confidence = "low") {
  if (confidence === "high") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (confidence === "medium") {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-slate-200 text-slate-700";
}

function truncateText(text, maxLength = 220) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();

  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
}

function buildContractPromptSuggestions(contractContext = {}, starterQuestion = "") {
  const clauses = Array.isArray(contractContext?.clauses)
    ? contractContext.clauses
    : [];
  const highRiskClause = clauses.find((clause) => clause.risk === "High");
  const terminationClause = clauses.find((clause) =>
    /termination|notice|renewal|cancel/i.test(
      `${clause.title} ${clause.label} ${clause.text}`,
    ),
  );
  const paymentClause = clauses.find((clause) =>
    /payment|rent|salary|invoice|fee|compensation/i.test(
      `${clause.title} ${clause.label} ${clause.text}`,
    ),
  );

  return [
    starterQuestion,
    "Which clauses are highest risk in this contract?",
    highRiskClause
      ? `Why is the ${highRiskClause.title} marked high risk?`
      : "",
    terminationClause ? "What does this contract say about termination?" : "",
    paymentClause
      ? "What payment obligations does this contract create?"
      : "What are the main obligations in this contract?",
  ]
    .filter(Boolean)
    .filter((prompt, index, prompts) => prompts.indexOf(prompt) === index)
    .slice(0, 4);
}

export default function QA() {
  const location = useLocation();
  const incomingAnalysisId = Number.isInteger(
    Number.parseInt(String(location.state?.analysisId || ""), 10),
  )
    ? Number.parseInt(String(location.state?.analysisId || ""), 10)
    : null;
  const incomingStarterQuestion =
    typeof location.state?.starterQuestion === "string"
      ? location.state.starterQuestion.trim()
      : "";
  const incomingContractContext =
    location.state?.contractContext &&
    typeof location.state.contractContext === "object"
      ? location.state.contractContext
      : null;

  const [question, setQuestion] = useState(incomingStarterQuestion);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responses, setResponses] = useState([]);
  const [activeAnalysisId, setActiveAnalysisId] = useState(incomingAnalysisId);
  const [activeContractContext, setActiveContractContext] = useState(
    incomingContractContext,
  );

  useEffect(() => {
    setActiveAnalysisId(incomingAnalysisId);

    if (incomingContractContext) {
      setActiveContractContext(incomingContractContext);
    } else {
      setActiveContractContext(null);
    }

    if (incomingStarterQuestion) {
      setQuestion((currentQuestion) =>
        currentQuestion || incomingStarterQuestion,
      );
    }
  }, [
    incomingAnalysisId,
    incomingContractContext,
    incomingStarterQuestion,
    location.key,
  ]);

  const promptButtons = useMemo(() => {
    if (!activeContractContext) {
      return DEFAULT_PROMPTS;
    }

    return buildContractPromptSuggestions(
      activeContractContext,
      incomingStarterQuestion,
    );
  }, [activeContractContext, incomingStarterQuestion]);

  const activeContractName =
    activeContractContext?.documentName || "Uploaded contract";
  const contractRiskTone = getRiskBadgeTone(activeContractContext?.riskLevel);

  const submitQuestion = async (nextQuestion) => {
    const trimmedQuestion = String(nextQuestion || "").trim();

    if (!trimmedQuestion) {
      setError("Please enter a legal question first.");
      return;
    }

    const session = getAuthSession();

    if (!session?.token) {
      setError("Your session expired. Please sign in again.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const payload = { question: trimmedQuestion };

      if (activeAnalysisId) {
        payload.analysisId = activeAnalysisId;
      }

      if (activeContractContext) {
        payload.contractContext = activeContractContext;
      }

      const requestPath =
        activeContractContext || activeAnalysisId
          ? "/api/legal-qa/contract"
          : "/api/legal-qa";

      const response = await fetch(buildApiUrl(requestPath), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data?.error || "Could not answer this legal question.");
        return;
      }

      setResponses((current) => [
        ...current,
        {
          id: `${Date.now()}-${current.length + 1}`,
          question: trimmedQuestion,
          ...data,
        },
      ]);
      setQuestion("");
    } catch {
      setError("Could not connect to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await submitQuestion(question);
  };

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
                {activeContractContext || activeAnalysisId
                  ? "Ask about this contract or switch back to Iraq law"
                  : "Ask questions about Iraq law and get grounded answers"}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-300 md:text-base">
                {activeContractContext || activeAnalysisId
                  ? "This chat is currently focused on a contract context from upload analysis or saved history. Clear the contract context any time if you want to go back to the general law library."
                  : "This assistant searches the legal texts loaded in your project, cites the closest matching sections, and uses your local model when the answer stays close to those citations."}
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
                    {activeContractContext || activeAnalysisId
                      ? "Tap one to ask about the uploaded contract currently attached to this chat."
                      : "Tap one to run a quick question against the loaded law library."}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {promptButtons.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => submitQuestion(prompt)}
                    disabled={isSubmitting}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-brand-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card-surface mt-6 p-6 md:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
          <div>
            <p className="eyebrow">Ask A Question</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-brand-ink">
              {activeContractContext || activeAnalysisId
                ? "Ask about this uploaded contract"
                : "Ask about rights, duties, limits, or specific articles across the loaded laws"}
            </h2>

            <form className="mt-5" onSubmit={handleSubmit}>
              <label
                className="block text-sm font-semibold text-brand-ink"
                htmlFor="legal-qa-input"
              >
                Your legal question
              </label>
              <textarea
                id="legal-qa-input"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                rows={5}
                placeholder={
                  activeContractContext || activeAnalysisId
                    ? "Example: Which clauses are highest risk in this contract?"
                    : "Example: What does the Banking Law say about licenses?"
                }
                className="mt-3 w-full rounded-[1.75rem] border border-brand-line bg-brand-surface px-5 py-4 text-sm leading-7 text-brand-ink outline-none transition focus:border-brand-accent"
              />

              {error ? (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-ink px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-inkSoft disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Search size={18} />
                  )}
                  {isSubmitting
                    ? activeContractContext || activeAnalysisId
                      ? "Searching the contract..."
                      : "Searching the law..."
                    : activeContractContext || activeAnalysisId
                      ? "Ask About This Contract"
                      : "Ask the assistant"}
                </button>
                <p className="text-sm text-slate-500">
                  {activeContractContext || activeAnalysisId
                    ? "Single-turn mode: each question is answered on its own using the attached contract context."
                    : "Single-turn mode: each question is answered on its own with fresh citations."}
                </p>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            {activeContractContext || activeAnalysisId ? (
              <div className="rounded-[2rem] border border-brand-line bg-brand-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-brand-ink">
                      Current contract context
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Questions in this chat will stay focused on this uploaded
                      contract until you clear it.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveContractContext(null);
                      setActiveAnalysisId(null);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-brand-line bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-600 transition hover:border-brand-accent hover:text-brand-accentDeep"
                  >
                    <X size={14} />
                    Clear
                  </button>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-brand-line bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
                        Attached contract
                      </p>
                      <h3 className="mt-2 text-xl font-bold text-brand-ink">
                        {activeContractName}
                      </h3>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${contractRiskTone}`}
                    >
                      {activeContractContext.riskLevel || "Low"} Risk
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {truncateText(activeContractContext?.summary, 320) ||
                      "This contract context includes the uploaded summary and matched clauses from the analysis page."}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold">
                    <span className="rounded-full bg-brand-surface px-3 py-2 text-brand-ink">
                      {activeContractContext?.totalClauses || 0} section
                      {(activeContractContext?.totalClauses || 0) === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-full bg-brand-surface px-3 py-2 text-brand-ink">
                      {activeContractContext?.highRiskCount || 0} high-risk
                    </span>
                    <span className="rounded-full bg-brand-surface px-3 py-2 text-brand-ink">
                      {activeContractContext?.mediumRiskCount || 0} medium-risk
                    </span>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="rounded-[2rem] border border-brand-line bg-brand-surface p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-ink text-white">
                  <Sparkles size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-ink">
                    How answers are built
                  </p>
                  <p className="text-sm leading-7 text-slate-600">
                    {activeContractContext || activeAnalysisId
                      ? "With contract context attached, the assistant answers from the uploaded contract summary and the best-matching contract clauses. Clear the contract context to search the law library again."
                      : "The backend searches the loaded law library first, then rewrites the result with your local model when the model stays close to the cited sections."}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="mt-1 shrink-0" />
                  <p>
                    AI can help explain legal text and contract wording, but it
                    does not replace a licensed lawyer. High-risk questions will
                    show a stronger escalation prompt.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 space-y-6">
        {responses.length === 0 ? (
          <div className="card-surface p-8 text-center">
            <MessageSquareText
              className="mx-auto text-brand-accent"
              size={26}
            />
            <h3 className="mt-4 text-xl font-bold text-brand-ink">
              No questions yet
            </h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {activeContractContext || activeAnalysisId
                ? "Start with a question about the uploaded contract's payment terms, termination wording, liability allocation, confidentiality, or highest-risk sections."
                : "Start with a question about constitutional rights, banking, investment, retirement, employment, or a specific article number."}
            </p>
          </div>
        ) : null}

        {responses.map((item) => {
          const hasContractMatches = Array.isArray(item.contractMatches)
            ? item.contractMatches.length > 0
            : false;
          const hasCitations = Array.isArray(item.citations)
            ? item.citations.length > 0
            : false;

          return (
            <article key={item.id} className="card-surface p-6 md:p-7">
              <div className="flex justify-end">
                <div className="max-w-3xl rounded-[1.75rem] bg-brand-ink px-5 py-4 text-white">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accent">
                    Your Question
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-100">
                    {item.question}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[2rem] border border-brand-line bg-brand-surface p-5 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-brand-accent shadow-sm">
                      <Sparkles size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-ink">
                        Assistant answer
                      </p>
                      <p className="text-sm text-slate-500">
                        {hasContractMatches
                          ? `Grounded in ${item.contractMatches.length} matching contract section${
                              item.contractMatches.length === 1 ? "" : "s"
                            }`
                          : `Grounded in ${item.citations?.length || 0} cited section${
                              item.citations?.length === 1 ? "" : "s"
                            }`}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${getConfidenceTone(
                      item.confidence,
                    )}`}
                  >
                    {item.confidence} confidence
                  </span>
                </div>

                <p className="mt-5 text-sm leading-8 text-slate-700">
                  {item.answer}
                </p>

                {item.needsLawyer ? (
                  <div className="mt-5 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                      <Scale
                        size={18}
                        className="mt-1 shrink-0 text-amber-700"
                      />
                      <div className="text-sm leading-7 text-amber-900">
                        <p className="font-bold">Lawyer review recommended</p>
                        <p className="mt-1">
                          {item.lawyerSuggestion ||
                            "This question may involve remedies, disputes, or facts that are safer to review with a lawyer."}
                        </p>
                        <Link
                          to="/lawyers"
                          className="mt-3 inline-flex rounded-full bg-amber-900 px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-amber-800"
                        >
                          Open Lawyer Directory
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : null}

                {hasContractMatches ? (
                  <div className="mt-6">
                    <p className="text-sm font-bold text-brand-ink">
                      Matching contract sections
                    </p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {item.contractMatches.map((match) => (
                        <div
                          key={`${item.id}-${match.id}`}
                          className="rounded-[1.5rem] border border-brand-line bg-white p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-brand-ink">
                                {match.title}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-brand-accentDeep">
                                {match.label || "Contract clause"}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${getRiskBadgeTone(
                                  match.risk,
                                )}`}
                              >
                                {match.risk || "Low"} Risk
                              </span>
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                match {match.match_score}
                              </span>
                            </div>
                          </div>

                          {match.explanation ? (
                            <p className="mt-3 text-sm leading-7 text-slate-600">
                              {match.explanation}
                            </p>
                          ) : null}

                          {match.excerpt ? (
                            <div className="mt-3 rounded-2xl bg-brand-surface px-4 py-4">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                                Clause text
                              </p>
                              <p className="mt-2 text-sm leading-7 text-slate-600">
                                {match.excerpt}
                              </p>
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {hasCitations ? (
                  <div className="mt-6">
                    <p className="text-sm font-bold text-brand-ink">
                      Supporting sections
                    </p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {item.citations.map((citation) => (
                        <div
                          key={
                            citation.citation_id ||
                            `${item.id}-${citation.source_document}-${citation.reference_label}`
                          }
                          className="rounded-[1.5rem] border border-brand-line bg-white p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-brand-ink">
                                {citation.reference_label || citation.article_label}
                              </p>
                              <p className="mt-1 text-xs font-semibold text-brand-accentDeep">
                                {citation.law_title || citation.source_document}
                              </p>
                              <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                                {citation.chapter ||
                                  citation.section_title ||
                                  "Loaded law section"}
                              </p>
                            </div>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                              match {citation.match_score}
                            </span>
                          </div>
                          <p className="mt-3 text-sm leading-7 text-slate-600">
                            {citation.excerpt}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <p className="mt-5 text-xs leading-6 text-slate-500">
                  {item.disclaimer}
                </p>
              </div>
            </article>
          );
        })}
      </section>
    </DashboardLayout>
  );
}
