import {
  AlertTriangle,
  Loader2,
  MessageSquareText,
  Scale,
  Search,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { buildApiUrl } from "../../config/api.js";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getAuthSession } from "../../utils/authSession.js";

const PROMPTS = [
  "What is the minimum working age in Iraq?",
  "Does Iraqi labour law prohibit discrimination?",
  "Does this law apply to public employees?",
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

export default function QA() {
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responses, setResponses] = useState([]);

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
      const response = await fetch(buildApiUrl("/api/legal-qa"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ question: trimmedQuestion }),
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
                Ask questions about Iraq law and get grounded answers
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-300 md:text-base">
                This assistant searches the labour-law articles in your project,
                cites the closest matches, and uses your local model when the
                answer stays close to those citations.
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
                    Tap one to run a quick question against the Iraq labour-law
                    dataset.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {PROMPTS.map((prompt) => (
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
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-start">
          <div>
            <p className="eyebrow">Ask A Question</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-brand-ink">
              Ask about rights, duties, limits, or specific labour-law articles
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
                placeholder="Example: Can an employer discriminate against a worker in Iraq?"
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
                  {isSubmitting ? "Searching the law..." : "Ask the assistant"}
                </button>
                <p className="text-sm text-slate-500">
                  Single-turn mode: each question is answered on its own with
                  fresh citations.
                </p>
              </div>
            </form>
          </div>

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
                  The backend searches the Iraq labour-law dataset first, then
                  rewrites the result with your local model when the model stays
                  close to the cited articles.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="mt-1 shrink-0" />
                <p>
                  AI can help explain legal text, but it does not replace a
                  licensed lawyer. High-risk questions will show a stronger
                  escalation prompt.
                </p>
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
              Start with a question about minimum age, discrimination, wages,
              public employees, or a specific article number.
            </p>
          </div>
        ) : null}

        {responses.map((item) => (
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
                      Grounded in {item.citations?.length || 0} cited article
                      {item.citations?.length === 1 ? "" : "s"}
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

              {item.citations?.length ? (
                <div className="mt-6">
                  <p className="text-sm font-bold text-brand-ink">
                    Supporting articles
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {item.citations.map((citation) => (
                      <div
                        key={`${item.id}-${citation.article_number}`}
                        className="rounded-[1.5rem] border border-brand-line bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-brand-ink">
                              {citation.article_label}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                              {citation.chapter}
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
        ))}
      </section>
    </DashboardLayout>
  );
}
