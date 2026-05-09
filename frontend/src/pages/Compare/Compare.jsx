import {
  ArrowRightLeft,
  FileDiff,
  FileText,
  Loader2,
  PlusCircle,
  ShieldAlert,
  UploadCloud,
} from "lucide-react";
import { useMemo, useState } from "react";
import { buildApiUrl } from "../../config/api.js";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getAuthSession } from "../../utils/authSession.js";

const acceptedFormats = [".pdf", ".docx", ".txt"];

const FILTERS = [
  { id: "all", label: "All changes" },
  { id: "modified", label: "Modified" },
  { id: "added", label: "Added" },
  { id: "removed", label: "Removed" },
  { id: "unchanged", label: "Unchanged" },
];

function getRiskTone(riskLevel = "Low") {
  if (riskLevel === "High") {
    return {
      badge: "bg-red-100 text-red-700",
      border: "border-red-200",
      dot: "bg-red-500",
    };
  }

  if (riskLevel === "Medium") {
    return {
      badge: "bg-amber-100 text-amber-700",
      border: "border-amber-200",
      dot: "bg-amber-500",
    };
  }

  return {
    badge: "bg-emerald-100 text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  };
}

function getStatusTone(status) {
  switch (status) {
    case "modified":
      return "bg-amber-100 text-amber-800";
    case "added":
      return "bg-emerald-100 text-emerald-800";
    case "removed":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatSelectedFile(file) {
  if (!file) {
    return "No file selected yet";
  }

  return `${file.name} • ${(file.size / 1024).toFixed(1)} KB`;
}

export default function Compare() {
  const [originalFile, setOriginalFile] = useState(null);
  const [revisedFile, setRevisedFile] = useState(null);
  const [error, setError] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredItems = useMemo(() => {
    const items = Array.isArray(comparisonResult?.comparisonItems)
      ? comparisonResult.comparisonItems
      : [];

    if (activeFilter === "all") {
      return items;
    }

    return items.filter((item) => item.status === activeFilter);
  }, [activeFilter, comparisonResult]);

  const handleFileChange = (event, side) => {
    const nextFile = event.target.files?.[0] || null;

    if (!nextFile) {
      if (side === "original") {
        setOriginalFile(null);
      } else {
        setRevisedFile(null);
      }
      return;
    }

    const lowerName = nextFile.name.toLowerCase();
    const supported = acceptedFormats.some((extension) =>
      lowerName.endsWith(extension),
    );

    if (!supported) {
      setError("Upload PDF, DOCX, or TXT files for both documents.");
      return;
    }

    setError("");

    if (side === "original") {
      setOriginalFile(nextFile);
      return;
    }

    setRevisedFile(nextFile);
  };

  const compareDocuments = async () => {
    if (!originalFile || !revisedFile) {
      setError("Choose both files before comparing.");
      return;
    }

    const session = getAuthSession();

    if (!session?.token) {
      setError("Your session expired. Please sign in again.");
      return;
    }

    const formData = new FormData();
    formData.append("originalDocument", originalFile);
    formData.append("revisedDocument", revisedFile);

    setIsComparing(true);
    setError("");

    try {
      const response = await fetch(buildApiUrl("/api/compare"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setComparisonResult(null);
        setError(data?.error || "Could not compare these documents.");
        return;
      }

      setComparisonResult(data);
      setActiveFilter("all");
    } catch {
      setComparisonResult(null);
      setError("Could not connect to the server.");
    } finally {
      setIsComparing(false);
    }
  };

  const originalRiskTone = getRiskTone(comparisonResult?.originalDocument?.riskLevel);
  const revisedRiskTone = getRiskTone(comparisonResult?.revisedDocument?.riskLevel);

  return (
    <DashboardLayout>
      <section className="card-surface p-8 md:p-10">
        <p className="eyebrow">Document Comparison</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-brand-ink">
          Compare two contract versions clause by clause
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
          Upload an original file and a revised file to spot wording changes,
          missing sections, new additions, and risk shifts in one workspace.
        </p>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="card-surface p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-brand-ink">
                Comparison workspace
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                Supported formats: PDF, DOCX, and TXT.
              </p>
            </div>
            <div className="rounded-2xl bg-brand-surface p-3 text-brand-accent">
              <ArrowRightLeft size={24} />
            </div>
          </div>

          <div className="mt-8 grid gap-4">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-[2rem] border border-dashed border-brand-line bg-brand-surface px-6 py-10 text-center transition hover:border-brand-accent hover:bg-white">
              <input
                type="file"
                accept={acceptedFormats.join(",")}
                onChange={(event) => handleFileChange(event, "original")}
                className="hidden"
              />
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-brand-accent shadow-float">
                <UploadCloud size={28} />
              </div>
              <p className="mt-5 text-lg font-bold text-brand-ink">
                Choose the original document
              </p>
              <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">
                Use the earlier version, signed version, or baseline contract.
              </p>
            </label>

            <div className="rounded-2xl border border-brand-line bg-white px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Original file
              </p>
              <p className="mt-2 text-sm font-semibold text-brand-ink">
                {formatSelectedFile(originalFile)}
              </p>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-[2rem] border border-dashed border-brand-line bg-brand-surface px-6 py-10 text-center transition hover:border-brand-accent hover:bg-white">
              <input
                type="file"
                accept={acceptedFormats.join(",")}
                onChange={(event) => handleFileChange(event, "revised")}
                className="hidden"
              />
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-brand-accent shadow-float">
                <FileDiff size={28} />
              </div>
              <p className="mt-5 text-lg font-bold text-brand-ink">
                Choose the revised document
              </p>
              <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">
                Use the edited version you want to compare against the original.
              </p>
            </label>

            <div className="rounded-2xl border border-brand-line bg-white px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                Revised file
              </p>
              <p className="mt-2 text-sm font-semibold text-brand-ink">
                {formatSelectedFile(revisedFile)}
              </p>
              {error ? (
                <p className="mt-2 text-sm text-brand-danger">{error}</p>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={compareDocuments}
            disabled={isComparing}
            className="mt-4 w-full rounded-2xl bg-brand-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-inkSoft disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isComparing ? "Comparing documents..." : "Compare Documents"}
          </button>
        </section>

        <section className="space-y-6">
          {!comparisonResult ? (
            <div className="card-surface p-6">
              <h2 className="text-xl font-bold text-brand-ink">
                Comparison output
              </h2>
              <div className="mt-5 space-y-4">
                <article className="rounded-2xl bg-brand-surface px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white p-2 text-brand-accent">
                      <FileText size={18} />
                    </div>
                    <h3 className="text-sm font-bold text-brand-ink">
                      Clause pairing
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    The engine matches the closest sections between the two
                    documents so you can review each difference side by side.
                  </p>
                </article>

                <article className="rounded-2xl bg-brand-surface px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white p-2 text-brand-accent">
                      <PlusCircle size={18} />
                    </div>
                    <h3 className="text-sm font-bold text-brand-ink">
                      Added and removed clauses
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    New sections and missing sections are surfaced clearly so
                    major structural changes are easy to catch.
                  </p>
                </article>

                <article className="rounded-2xl bg-brand-surface px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white p-2 text-brand-accent">
                      <ShieldAlert size={18} />
                    </div>
                    <h3 className="text-sm font-bold text-brand-ink">
                      Risk shifts
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Changes that increase clause risk are kept near the top so
                    the review starts with what matters most.
                  </p>
                </article>
              </div>
            </div>
          ) : (
            <>
              <div className="card-surface p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
                      Comparison Summary
                    </p>
                    <h2 className="mt-2 text-2xl font-bold text-brand-ink">
                      {comparisonResult.originalDocument?.name} vs{" "}
                      {comparisonResult.revisedDocument?.name}
                    </h2>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs font-bold">
                    <span
                      className={`rounded-full px-3 py-1.5 ${originalRiskTone.badge}`}
                    >
                      Original {comparisonResult.originalDocument?.riskLevel} Risk
                    </span>
                    <span
                      className={`rounded-full px-3 py-1.5 ${revisedRiskTone.badge}`}
                    >
                      Revised {comparisonResult.revisedDocument?.riskLevel} Risk
                    </span>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-8 text-slate-600">
                  {comparisonResult.summary}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-brand-surface px-4 py-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      Modified
                    </p>
                    <p className="mt-2 text-2xl font-bold text-brand-ink">
                      {comparisonResult.counts?.modified || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-brand-surface px-4 py-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      Added
                    </p>
                    <p className="mt-2 text-2xl font-bold text-brand-ink">
                      {comparisonResult.counts?.added || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-brand-surface px-4 py-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      Removed
                    </p>
                    <p className="mt-2 text-2xl font-bold text-brand-ink">
                      {comparisonResult.counts?.removed || 0}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-brand-surface px-4 py-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      Higher-risk changes
                    </p>
                    <p className="mt-2 text-2xl font-bold text-brand-ink">
                      {comparisonResult.higherRiskChanges || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card-surface p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-brand-ink">
                      Clause-by-clause review
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Filter the results to focus on the changes you care about.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {FILTERS.map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        onClick={() => setActiveFilter(filter.id)}
                        className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                          activeFilter === filter.id
                            ? "bg-brand-ink text-white"
                            : "bg-brand-surface text-slate-600 hover:text-brand-ink"
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {filteredItems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-brand-line bg-brand-surface px-6 py-10 text-center">
                      {isComparing ? (
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="animate-spin text-brand-accent" size={24} />
                          <p className="text-sm font-semibold text-brand-ink">
                            Comparing sections...
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-brand-ink">
                          No sections match this filter yet.
                        </p>
                      )}
                    </div>
                  ) : null}

                  {filteredItems.map((item) => {
                    const originalClause = item.originalClause;
                    const revisedClause = item.revisedClause;
                    const originalClauseTone = getRiskTone(originalClause?.risk);
                    const revisedClauseTone = getRiskTone(revisedClause?.risk);

                    return (
                      <article
                        key={item.id}
                        className="rounded-[2rem] border border-brand-line bg-brand-surface p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${getStatusTone(
                                  item.status,
                                )}`}
                              >
                                {item.status}
                              </span>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
                                similarity {item.similarity}
                              </span>
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
                                risk {item.riskShift}
                              </span>
                            </div>
                            <h3 className="mt-3 text-xl font-bold text-brand-ink">
                              {revisedClause?.label ||
                                originalClause?.label ||
                                "Clause change"}
                            </h3>
                            <p className="mt-2 text-sm leading-7 text-slate-600">
                              {item.changeSummary}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-4 xl:grid-cols-2">
                          <div className="rounded-[1.5rem] border border-brand-line bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                                  Original
                                </p>
                                <p className="mt-2 text-sm font-bold text-brand-ink">
                                  {originalClause?.title || "No matching clause"}
                                </p>
                              </div>
                              {originalClause ? (
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${originalClauseTone.badge}`}
                                >
                                  {originalClause.risk} Risk
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-4 text-sm leading-7 text-slate-600">
                              {originalClause?.preview ||
                                "This section does not appear in the original document."}
                            </p>
                          </div>

                          <div className="rounded-[1.5rem] border border-brand-line bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                                  Revised
                                </p>
                                <p className="mt-2 text-sm font-bold text-brand-ink">
                                  {revisedClause?.title || "No matching clause"}
                                </p>
                              </div>
                              {revisedClause ? (
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${revisedClauseTone.badge}`}
                                >
                                  {revisedClause.risk} Risk
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-4 text-sm leading-7 text-slate-600">
                              {revisedClause?.preview ||
                                "This section does not appear in the revised document."}
                            </p>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
