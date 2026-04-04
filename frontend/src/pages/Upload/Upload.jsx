import { FileText, ShieldAlert, Sparkles, UploadCloud } from "lucide-react";
import { useMemo, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { buildApiUrl } from "../../config/api.js";
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

export default function Upload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");

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
      setFileError("");
      return;
    }

    const lowerName = nextFile.name.toLowerCase();
    const supported = acceptedFormats.some((extension) =>
      lowerName.endsWith(extension),
    );

    if (!supported) {
      setSelectedFile(null);
      setFileError("Upload a PDF, DOCX, or TXT file.");
      return;
    }

    setSelectedFile(nextFile);
    setFileError("");
  };

  const saveAnalysisHistory = async () => {
    if (!selectedFile) {
      setFileError("Please choose a file first.");
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
          document_name: selectedFile.name,
          risk_level: "Medium",
          summary: "Contract uploaded for review.",
          status: "Review Needed",
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
          </div>

          <button
            type="button"
            onClick={saveAnalysisHistory}
            className="mt-4 w-full rounded-2xl bg-brand-ink px-5 py-3 text-sm font-bold text-white"
          >
            Save to History
          </button>
        </section>

        <section className="space-y-6">
          <div className="card-surface p-6">
            <h2 className="text-xl font-bold text-brand-ink">
              What the user should receive
            </h2>
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
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
