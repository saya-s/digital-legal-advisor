import { FileText, ShieldAlert, Sparkles, UploadCloud } from "lucide-react";
import { useMemo, useState } from "react";
import { buildApiUrl } from "../../config/api.js";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getAuthSession } from "../../utils/authSession.js";

const acceptedFormats = [".docx", ".txt"];

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

export default function Upload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const selectedLabel = useMemo(() => {
    if (!selectedFile) {
      return "No file selected yet";
    }

    return `${selectedFile.name} • ${(selectedFile.size / 1024).toFixed(1)} KB`;
  }, [selectedFile]);

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0] || null;

    if (!nextFile) {
      setSelectedFile(null);
      setAnalysisResult(null);
      setFileError("");
      return;
    }

    const lowerName = nextFile.name.toLowerCase();
    const supported = acceptedFormats.some((extension) =>
      lowerName.endsWith(extension),
    );

    if (!supported) {
      setSelectedFile(null);
      setAnalysisResult(null);
      setFileError("Upload a DOCX or TXT file.");
      return;
    }

    setSelectedFile(nextFile);
    setAnalysisResult(null);
    setFileError("");
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
        }),
      });

      if (!response.ok) {
        setFileError("Could not save this analysis to history.");
        return;
      }

      setFileError("");
    } catch {
      setFileError("Could not connect to the server.");
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="card-surface p-6 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-brand-ink">
                  Upload workspace
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  Supported formats: DOCX and TXT.
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
                <div className="rounded-2xl bg-brand-surface px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold text-brand-ink">Summary</h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        analysisResult.riskLevel === "High"
                          ? "bg-red-100 text-red-700"
                          : analysisResult.riskLevel === "Medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {analysisResult.riskLevel} Risk
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {analysisResult.summary}
                  </p>
                </div>

                <div className="rounded-2xl bg-brand-surface px-4 py-4">
                  <h3 className="text-sm font-bold text-brand-ink">
                    Detected Clauses
                  </h3>
                  <div className="mt-4 space-y-3">
                    {analysisResult.clauses?.length > 0 ? (
                      analysisResult.clauses.map((clause) => (
                        <article
                          key={clause.id}
                          className="rounded-2xl bg-white px-4 py-4"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-bold text-brand-ink">
                              {clause.title}
                            </p>
                            <div className="flex gap-2">
                              <span className="rounded-full bg-brand-surface px-3 py-1 text-xs font-bold text-brand-accentDeep">
                                {clause.label}
                              </span>
                              <span className="rounded-full bg-brand-surface px-3 py-1 text-xs font-bold text-brand-ink">
                                {clause.risk}
                              </span>
                            </div>
                          </div>
                          <p className="mt-3 text-sm leading-7 text-slate-600">
                            {clause.explanation}
                          </p>
                          <p className="mt-3 text-xs leading-6 text-slate-500">
                            {clause.text}
                          </p>
                        </article>
                      ))
                    ) : (
                      <p className="text-sm leading-7 text-slate-600">
                        No clear clauses were detected.
                      </p>
                    )}
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
