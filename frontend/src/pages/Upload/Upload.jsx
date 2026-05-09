import {
  ArrowRightLeft,
  FileText,
  LayoutList,
  ShieldAlert,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { buildApiUrl } from "../../config/api.js";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getAuthSession } from "../../utils/authSession.js";

const acceptedFormats = [".pdf", ".docx", ".txt"];

const analysisOutputs = [
  {
    title: "Contract summary",
    description:
      "A short overview of the document, its purpose, and the clauses that matter most.",
    icon: <Sparkles size={18} />,
  },
  {
    title: "Clause explanations",
    description:
      "Plain-language breakdowns for legal sections that are hard to understand.",
    icon: <FileText size={18} />,
  },
  {
    title: "Risk highlights",
    description:
      "Flagged terms, one-sided wording, and areas that may deserve lawyer review.",
    icon: <ShieldAlert size={18} />,
  },
];

function getRiskTone(riskLevel = "Low") {
  if (riskLevel === "High") {
    return {
      badge: "bg-red-100 text-red-700",
      border: "border-red-200",
      text: "text-red-700",
      dot: "bg-red-500",
    };
  }

  if (riskLevel === "Medium") {
    return {
      badge: "bg-amber-100 text-amber-700",
      border: "border-amber-200",
      text: "text-amber-700",
      dot: "bg-amber-500",
    };
  }

  return {
    badge: "bg-emerald-100 text-emerald-700",
    border: "border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  };
}

function getTextPreview(text, maxLength = 140) {
  if (!text) {
    return "";
  }

  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}...`;
}

export default function Upload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedStructureId, setSelectedStructureId] = useState("overview");

  const selectedLabel = useMemo(() => {
    if (!selectedFile) {
      return "No file selected yet";
    }

    return `${selectedFile.name} • ${(selectedFile.size / 1024).toFixed(1)} KB`;
  }, [selectedFile]);

  const detectedClauses = useMemo(() => {
    return Array.isArray(analysisResult?.clauses) ? analysisResult.clauses : [];
  }, [analysisResult]);

  useEffect(() => {
    if (detectedClauses.length > 0) {
      setSelectedStructureId(`clause-${detectedClauses[0].id}`);
      return;
    }

    setSelectedStructureId("overview");
  }, [analysisResult, detectedClauses]);

  const selectedClause = useMemo(() => {
    return (
      detectedClauses.find(
        (clause) => `clause-${clause.id}` === selectedStructureId,
      ) || null
    );
  }, [detectedClauses, selectedStructureId]);

  const highRiskCount = useMemo(() => {
    return detectedClauses.filter((clause) => clause.risk === "High").length;
  }, [detectedClauses]);

  const mediumRiskCount = useMemo(() => {
    return detectedClauses.filter((clause) => clause.risk === "Medium").length;
  }, [detectedClauses]);

  const documentPreviewText = useMemo(() => {
    const extractedText = analysisResult?.documentText?.trim();

    if (!extractedText) {
      return "No readable text preview is available for this document yet.";
    }

    if (extractedText.length <= 2800) {
      return extractedText;
    }

    return `${extractedText.slice(0, 2800).trim()}\n\n...`;
  }, [analysisResult]);

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;

    if (!nextFile) {
      setSelectedFile(null);
      setAnalysisResult(null);
      setFileError("");
      setSaveMessage("");
      return;
    }

    const lowerName = nextFile.name.toLowerCase();
    const supported = acceptedFormats.some((extension) =>
      lowerName.endsWith(extension),
    );

    if (!supported) {
      setSelectedFile(null);
      setAnalysisResult(null);
      setFileError("Upload a PDF, DOCX, or TXT file.");
      setSaveMessage("");
      return;
    }

    setSelectedFile(nextFile);
    setAnalysisResult(null);
    setFileError("");
    setSaveMessage("");
  };

  const analyzeContract = async () => {
    if (!selectedFile) {
      setFileError("Please choose a file first.");
      return;
    }

    const session = getAuthSession();

    if (!session?.token) {
      setFileError("Your session expired. Please sign in again.");
      return;
    }

    const formData = new FormData();
    formData.append("contractFile", selectedFile);

    setIsAnalyzing(true);
    setFileError("");
    setSaveMessage("");

    try {
      const response = await fetch(buildApiUrl("/api/upload/analyze"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setAnalysisResult(null);
        setFileError(data?.error || "Could not analyze this contract.");
        return;
      }

      setAnalysisResult(data);
    } catch {
      setAnalysisResult(null);
      setFileError("Could not connect to the server.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveAnalysisHistory = async () => {
    if (!analysisResult) {
      setFileError("Please analyze a contract before saving to history.");
      return;
    }

    const session = getAuthSession();

    if (!session?.token) {
      setFileError("Your session expired. Please sign in again.");
      return;
    }

    try {
      const response = await fetch(buildApiUrl("/api/history"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({
          document_name: analysisResult.documentName || selectedFile?.name,
          risk_level: analysisResult.riskLevel,
          summary: analysisResult.summary,
          status: "Analyzed",
          clauses: analysisResult.clauses || [],
          analysis: analysisResult,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setFileError(data?.error || "Could not save this analysis to history.");
        setSaveMessage("");
        return;
      }

      setFileError("");
      setSaveMessage(data?.message || "Analysis saved to history.");
    } catch {
      setFileError("Could not connect to the server.");
      setSaveMessage("");
    }
  };

  return (
    <DashboardLayout>
      <section className="card-surface p-8 md:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
          Document Analysis
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold text-brand-ink">
          Analyze a contract before you sign it
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
          Upload a contract and prepare it for summary, clause explanation, and
          risk review.
        </p>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="card-surface p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-brand-ink">
                  Upload workspace
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  Supported formats: PDF, DOCX, and TXT.
                </p>
            </div>
            <div className="rounded-2xl bg-brand-surface p-3 text-brand-accent">
              <UploadCloud size={24} />
            </div>
          </div>

          <label className="mt-8 flex cursor-pointer flex-col items-center justify-center rounded-[2rem] border border-dashed border-brand-line bg-brand-surface px-6 py-12 text-center transition hover:border-brand-accent hover:bg-white">
            <input
              type="file"
              accept={acceptedFormats.join(",")}
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-brand-accent shadow-float">
              <UploadCloud size={28} />
            </div>
            <p className="mt-5 text-lg font-bold text-brand-ink">
              Choose a contract file
            </p>
            <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">
              Start with the file you already have from a landlord, supplier,
              employee, or service provider.
            </p>
          </label>

          <div className="mt-6 rounded-2xl border border-brand-line bg-white px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Selected file
            </p>
            <p className="mt-2 text-sm font-semibold text-brand-ink">
              {selectedLabel}
            </p>
            {fileError && (
              <p className="mt-2 text-sm text-brand-danger">{fileError}</p>
            )}
            {saveMessage && (
              <p className="mt-2 text-sm text-brand-success">{saveMessage}</p>
            )}
          </div>

          <button
            type="button"
            onClick={analyzeContract}
            disabled={isAnalyzing}
            className="mt-4 w-full rounded-2xl bg-brand-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-inkSoft disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isAnalyzing ? "Analyzing..." : "Analyze Contract"}
          </button>

          <button
            type="button"
            onClick={saveAnalysisHistory}
            disabled={!analysisResult}
            className="mt-4 w-full rounded-2xl border border-brand-line bg-white px-5 py-3 text-sm font-bold text-brand-ink transition hover:border-brand-accent hover:text-brand-accentDeep disabled:cursor-not-allowed disabled:bg-brand-surface disabled:text-slate-400"
          >
            Save to History
          </button>

          <div className="mt-4 rounded-[1.75rem] border border-brand-line bg-brand-surface px-5 py-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-white p-3 text-brand-accent shadow-sm">
                <ArrowRightLeft size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-brand-ink">
                  Need to compare two versions instead?
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Open the comparison workspace to review an original document
                  against a revised one and see what changed clause by clause.
                </p>
                <Link
                  to="/compare"
                  className="mt-4 inline-flex rounded-full bg-brand-ink px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-brand-inkSoft"
                >
                  Go To Compare
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="card-surface p-6">
            <h2 className="text-xl font-bold text-brand-ink">
              Contract Analysis
            </h2>

            {!analysisResult ? (
              <div className="mt-5 space-y-4">
                {analysisOutputs.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-2xl bg-brand-surface px-4 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-white p-2 text-brand-accent">
                        {item.icon}
                      </div>
                      <h3 className="text-sm font-bold text-brand-ink">
                        {item.title}
                      </h3>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {item.description}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5 space-y-5">
                <div className="rounded-[2rem] border border-brand-line bg-brand-surface px-6 py-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="max-w-2xl">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
                        Smart Contract Summary
                      </p>
                      <h3 className="mt-2 text-2xl font-bold text-brand-ink">
                        {analysisResult.documentName || "Uploaded document"}
                      </h3>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                        getRiskTone(analysisResult.riskLevel).badge
                      }`}
                    >
                      {analysisResult.riskLevel} Risk
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-8 text-slate-600">
                    {analysisResult.summary}
                  </p>
                </div>

                <div className="overflow-hidden rounded-[2rem] border border-brand-line bg-white">
                  <div className="grid xl:grid-cols-[280px_1fr]">
                    <aside className="border-b border-brand-line bg-brand-surface/70 xl:border-b-0 xl:border-r">
                      <div className="border-b border-brand-line px-5 py-5">
                        <div className="flex items-center gap-3">
                          <div className="rounded-2xl bg-white p-2 text-brand-accent shadow-sm">
                            <LayoutList size={18} />
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
                              Structure
                            </p>
                            <h3 className="text-lg font-bold text-brand-ink">
                              Contract map
                            </h3>
                          </div>
                        </div>

                        <p className="mt-4 text-sm leading-7 text-slate-500">
                          {detectedClauses.length} detected section
                          {detectedClauses.length === 1 ? "" : "s"}.
                        </p>
                      </div>

                      <div className="max-h-[34rem] space-y-2 overflow-y-auto px-4 py-4">
                        <button
                          type="button"
                          onClick={() => setSelectedStructureId("overview")}
                          className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                            selectedStructureId === "overview"
                              ? "bg-white shadow-sm ring-1 ring-brand-accent/25"
                              : "hover:bg-white/80"
                          }`}
                        >
                          <p className="text-sm font-bold text-brand-ink">
                            Document overview
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            Contract analysis metrics and extracted preview
                          </p>
                        </button>

                        {detectedClauses.length > 0 ? (
                          detectedClauses.map((clause) => {
                            const isSelected =
                              selectedStructureId === `clause-${clause.id}`;
                            const riskTone = getRiskTone(clause.risk);

                            return (
                              <button
                                key={clause.id}
                                type="button"
                                onClick={() =>
                                  setSelectedStructureId(`clause-${clause.id}`)
                                }
                                className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                                  isSelected
                                    ? "bg-white shadow-sm ring-1 ring-brand-accent/25"
                                    : "hover:bg-white/80"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <span
                                    className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${riskTone.dot}`}
                                  />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-brand-ink">
                                      {clause.title}
                                    </p>
                                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                                      {clause.label}
                                    </p>
                                    <p className="mt-2 text-xs leading-5 text-slate-500">
                                      {getTextPreview(clause.text, 100)}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="rounded-2xl border border-dashed border-brand-line bg-white px-4 py-6 text-center">
                            <p className="text-sm font-semibold text-brand-ink">
                              No clear clauses detected
                            </p>
                          </div>
                        )}
                      </div>
                    </aside>

                    <div className="px-6 py-6 md:px-7 md:py-7">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="max-w-2xl">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
                            Contract Analysis
                          </p>
                          <h3 className="mt-2 text-2xl font-bold text-brand-ink">
                            {selectedClause
                              ? selectedClause.title
                              : analysisResult.documentName || "Uploaded document"}
                          </h3>
                        </div>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
                        <span className="rounded-full bg-brand-surface px-3 py-2 text-brand-ink">
                          {detectedClauses.length} section
                          {detectedClauses.length === 1 ? "" : "s"}
                        </span>
                        <span className="rounded-full bg-brand-surface px-3 py-2 text-brand-ink">
                          {highRiskCount} high-risk
                        </span>
                        <span className="rounded-full bg-brand-surface px-3 py-2 text-brand-ink">
                          {mediumRiskCount} medium-risk
                        </span>
                      </div>

                      <div className="mt-6 border-t border-brand-line pt-6">
                        {selectedClause ? (
                          <div className="space-y-5">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
                                  Selected Clause
                                </p>
                                <h4 className="mt-2 text-2xl font-bold text-brand-ink">
                                  {selectedClause.title}
                                </h4>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className="rounded-full bg-brand-surface px-3 py-1.5 text-xs font-bold text-brand-accentDeep">
                                  {selectedClause.label}
                                </span>
                                <span
                                  className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                                    getRiskTone(selectedClause.risk).badge
                                  }`}
                                >
                                  {selectedClause.risk}
                                </span>
                              </div>
                            </div>

                            <p className="text-sm leading-8 text-slate-600">
                              {selectedClause.explanation}
                            </p>

                            <div className="rounded-3xl bg-brand-surface px-5 py-5">
                              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                                Clause text
                              </p>
                              <p className="mt-3 whitespace-pre-line text-sm leading-8 text-slate-600">
                                {selectedClause.text}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
                              Document Preview
                            </p>
                            <h4 className="mt-2 text-xl font-bold text-brand-ink">
                              Extracted contract text
                            </h4>
                            <div className="mt-4 max-h-[28rem] overflow-y-auto rounded-3xl bg-brand-surface px-5 py-5">
                              <p className="whitespace-pre-line text-sm leading-8 text-slate-600">
                                {documentPreviewText}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
