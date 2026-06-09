import {
  ArrowRightLeft,
  FileText,
  LayoutList,
  MessageSquareText,
  ShieldAlert,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { buildApiUrl } from "../../config/api.js";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getAuthSession } from "../../utils/authSession.js";
import { buildContractQaState } from "../../utils/contractQaState.js";
import { getRiskBadgeTone, getRiskDotTone } from "../../utils/riskTone.js";

// Upload limits used before a file is sent to the backend.
const acceptedFormats = [".pdf", ".docx", ".txt"];
const maxUploadSizeBytes = 10 * 1024 * 1024;

// Cards shown before the user has run an analysis.
const analysisOutputs = [
  {
    title: "Contract summary",
    description:
      "An automated overview built from detected clauses, contract-type hints, and flagged risk patterns.",
    icon: <Sparkles size={18} />,
  },
  {
    title: "Clause explanations",
    description:
      "Plain-language breakdowns generated from clause labels, surrounding context, and highlighted wording.",
    icon: <FileText size={18} />,
  },
  {
    title: "Risk highlights",
    description:
      "Pattern-based warnings for one-sided terms and sections that may deserve lawyer review.",
    icon: <ShieldAlert size={18} />,
  },
];

// Shorten long clause text for the structure menu.
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

// This page uploads a contract and displays its analysis.
export default function Upload() {
  // Remember the file, result, messages, and clause the user opens.
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isSavingHistory, setIsSavingHistory] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedStructureId, setSelectedStructureId] = useState("overview");

  // Build the file name and size shown under the upload box.
  // Update this label whenever the user chooses a different file.
  const selectedLabel = useMemo(() => {
    if (!selectedFile) {
      return "No file selected yet";
    }

    return `${selectedFile.name} • ${(selectedFile.size / 1024).toFixed(1)} KB`;
  }, [selectedFile]);

  // Keep the detected clauses in a safe list.
  const detectedClauses = useMemo(() => {
    // Before analysis there may be no clause list, so use an empty list.
    return Array.isArray(analysisResult?.clauses) ? analysisResult.clauses : [];
  }, [analysisResult]);

  // Select the first clause when a new analysis arrives.
  useEffect(() => {
    if (detectedClauses.length > 0) {
      setSelectedStructureId(`clause-${detectedClauses[0].id}`);
      return;
    }

    setSelectedStructureId("overview");
  }, [analysisResult, detectedClauses]);

  // Find the clause chosen from the structure menu.
  const selectedClause = useMemo(() => {
    return (
      detectedClauses.find(
        (clause) => `clause-${clause.id}` === selectedStructureId,
      ) || null
    );
  }, [detectedClauses, selectedStructureId]);

  // Count higher-risk clauses for the result summary.
  const highRiskCount = useMemo(() => {
    return detectedClauses.filter((clause) => clause.risk === "High").length;
  }, [detectedClauses]);

  // Count medium-risk clauses whenever the detected clause list changes.
  const mediumRiskCount = useMemo(() => {
    return detectedClauses.filter((clause) => clause.risk === "Medium").length;
  }, [detectedClauses]);

  // Keep warnings and document preview text ready for display.
  const analysisWarnings = useMemo(() => {
    return Array.isArray(analysisResult?.analysisWarnings)
      ? analysisResult.analysisWarnings
      : [];
  }, [analysisResult]);

  // Prepare a readable document preview whenever the result changes.
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

  // Prepare this analysis to open inside the contract Q&A page.
  const askAboutThisContractState = useMemo(() => {
    return buildContractQaState({
      analysisResult,
      selectedFileName: selectedFile?.name || "",
      selectedClause,
      analysisId: null,
    });
  }, [
    analysisResult,
    selectedClause,
    selectedFile,
  ]);

  // STEP 1: Check the selected file type and size before accepting it.
  const handleFileChange = (event) => {
    // Read the first chosen file, or null when the picker was cleared.
    const nextFile = event.target.files?.[0] || null;

    if (!nextFile) {
      setSelectedFile(null);
      setAnalysisResult(null);
      setFileError("");
      setSaveError("");
      setSaveMessage("");
      setIsSavingHistory(false);
      return;
    }

    const lowerName = nextFile.name.toLowerCase();
    // Accept the file when its name ends with one supported type.
    const supported = acceptedFormats.some((extension) =>
      lowerName.endsWith(extension),
    );

    if (!supported) {
      setSelectedFile(null);
      setAnalysisResult(null);
      setFileError("Upload a PDF, DOCX, or TXT file.");
      setSaveError("");
      setSaveMessage("");
      setIsSavingHistory(false);
      return;
    }

    if (nextFile.size > maxUploadSizeBytes) {
      setSelectedFile(null);
      setAnalysisResult(null);
      setFileError("Upload a file up to 10 MB.");
      setSaveError("");
      setSaveMessage("");
      setIsSavingHistory(false);
      return;
    }

    setSelectedFile(nextFile);
    setAnalysisResult(null);
    setFileError("");
    setSaveError("");
    setSaveMessage("");
    setIsSavingHistory(false);
  };

  // STEP 3: Save the completed analysis in Dashboard history.
  const saveAnalysisHistory = async ({ analysisData, token, documentName }) => {
    // This is a second request made after analysis succeeds.
    const response = await fetch(buildApiUrl("/api/history"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        document_name: documentName,
        risk_level: analysisData.riskLevel,
        summary: analysisData.summary,
        status: "Analyzed",
        clauses: analysisData.clauses || [],
        analysis: analysisData,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data?.error || "Could not save this analysis to history automatically.",
      );
    }

    return data;
  };

  // STEP 2: Send the contract for analysis and show the returned result.
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

    // Put the selected file into the upload request.
    const formData = new FormData();
    formData.append("contractFile", selectedFile);

    setIsAnalyzing(true);
    setFileError("");
    setSaveError("");
    setSaveMessage("");
    setIsSavingHistory(false);

    try {
      const response = await fetch(buildApiUrl("/api/upload/analyze"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.token}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setAnalysisResult(null);
        setFileError(data?.error || "Could not analyze this contract.");
        return;
      }

      // First display the analysis, then try to save it in history.
      setAnalysisResult(data);
      setIsSavingHistory(true);
      setSaveMessage("Saving analysis to history...");

      // Keep the result visible even if saving it to Dashboard fails.
      try {
        await saveAnalysisHistory({
          analysisData: data,
          documentName: data.documentName || selectedFile.name,
          token: session.token,
        });

        setSaveError("");
        setSaveMessage("Analysis saved automatically to history.");
      } catch (error) {
        setSaveMessage("");
        setSaveError(
          error?.message ||
            "Could not save this analysis to history automatically.",
        );
      } finally {
        setIsSavingHistory(false);
      }
    } catch (error) {
      setAnalysisResult(null);
      setIsSavingHistory(false);
      setFileError(error?.message || "Could not connect to the server.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <DashboardLayout>
      {/* SCREEN 1: Page introduction and upload controls. */}
      <section className="card-surface p-8 md:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
          Document Analysis
        </p>
        <h1 className="mt-3 font-display text-4xl font-bold text-brand-ink">
          Analyze a contract before you sign it
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
          Upload a contract and prepare it for automated summary, clause
          explanation, and risk review.
        </p>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        {/* Left side handles file selection and related actions. */}
        <section className="card-surface p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-brand-ink">
                  Upload workspace
                </h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                  Supported formats: PDF, DOCX, and TXT up to 10 MB.
                </p>
            </div>
            <div className="rounded-2xl bg-brand-surface p-3 text-brand-accent">
              <UploadCloud size={24} />
            </div>
          </div>

          {/* Clicking this area opens the file picker. */}
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
            <p className="mt-2 max-w-md text-xs leading-6 text-slate-400">
              Scanned image PDFs may fail if they do not contain selectable text.
            </p>
            <p className="mt-2 max-w-md text-xs leading-6 text-slate-400">
              Lecture slides, notes, articles, and other non-contract documents
              are not valid for contract analysis.
            </p>
          </label>

          {/* Selected file and request status messages. */}
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
            {saveError && (
              <p className="mt-2 text-sm text-brand-danger">{saveError}</p>
            )}
            {saveMessage && (
              <p
                className={`mt-2 text-sm ${
                  isSavingHistory ? "text-slate-500" : "text-brand-success"
                }`}
              >
                {saveMessage}
              </p>
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

          <p className="mt-4 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Completed analyses save to history automatically
          </p>

          {/* Explain the limits of the current automated analysis. */}
          <div className="mt-4 rounded-[1.75rem] border border-amber-200 bg-amber-50 px-5 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-800">
              Demo note
            </p>
            <p className="mt-2 text-sm leading-7 text-amber-900">
              The current upload analysis is automated with rule-based clause
              detection, summary logic, and risk heuristics. It is meant to
              support review, not to act as a fully trained contract model or a
              substitute for licensed legal advice.
            </p>
          </div>

          {/* Continue from this result into contract Q&A. */}
          {analysisResult ? (
            <div className="mt-4 rounded-[1.75rem] border border-brand-line bg-brand-surface px-5 py-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white p-3 text-brand-accent shadow-sm">
                  <MessageSquareText size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-ink">
                    Need to ask about this contract next?
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Open the legal chat with this analyzed contract attached so
                    the next question stays focused on its clauses, risks, and
                    summary.
                  </p>
                  <Link
                    to="/qa"
                    state={askAboutThisContractState}
                    className="mt-4 inline-flex rounded-full bg-brand-ink px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white transition hover:bg-brand-inkSoft"
                  >
                    Ask About This Contract
                  </Link>
                </div>
              </div>
            </div>
          ) : null}

          {/* Shortcut to the separate comparison workspace. */}
          <div className="mt-4 rounded-[1.75rem] border border-brand-line bg-brand-surface px-5 py-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-white p-3 text-brand-accent shadow-sm">
                <ArrowRightLeft size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-brand-ink">
                  Need a contract comparison next?
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Open the comparison workspace to benchmark this contract
                  against a template or review an original and revised version
                  clause by clause.
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

        {/* Right side previews features or shows the completed analysis. */}
        <section className="space-y-6">
          <div className="card-surface p-6">
            <h2 className="text-xl font-bold text-brand-ink">
              Contract Analysis
            </h2>

            {/* Show feature previews first, then replace them with the result. */}
            {!analysisResult ? (
              /* Before analysis, explain the outputs the user will receive. */
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
                        Automated Contract Summary
                      </p>
                      <h3 className="mt-2 text-2xl font-bold text-brand-ink">
                        {analysisResult.documentName || "Uploaded document"}
                      </h3>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                        getRiskBadgeTone(analysisResult.riskLevel)
                      }`}
                    >
                      {analysisResult.riskLevel} Risk
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-8 text-slate-600">
                    {analysisResult.summary}
                  </p>

                  {analysisWarnings.length > 0 ? (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-800">
                        Analysis notes
                      </p>
                      <div className="mt-2 space-y-2">
                        {/* Create one paragraph for every returned warning. */}
                        {analysisWarnings.map((warning) => (
                          <p
                            key={warning}
                            className="text-sm leading-7 text-amber-900"
                          >
                            {warning}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Contract map on the left and selected details on the right. */}
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

                        {/* Show clause buttons when found, otherwise an empty message. */}
                        {detectedClauses.length > 0 ? (
                          detectedClauses.map((clause) => {
                            // This boolean controls the selected button styling.
                            const isSelected =
                              selectedStructureId === `clause-${clause.id}`;

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
                                    className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${getRiskDotTone(
                                      clause.risk,
                                    )}`}
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
                        {/* Show the chosen clause, or the full document when none is chosen. */}
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
                                    getRiskBadgeTone(selectedClause.risk)
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
