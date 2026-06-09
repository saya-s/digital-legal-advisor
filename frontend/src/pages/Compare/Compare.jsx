import {
  ArrowRightLeft,
  FileDiff,
  FileText,
  PlusCircle,
  Search,
  ShieldAlert,
  UploadCloud,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../../config/api.js";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getAuthSession } from "../../utils/authSession.js";
import {
  acceptedFormats,
  COMPARISON_MODES,
  formatSelectedFile,
  getTemplateOptionLabel,
} from "./compareConfig.js";
import {
  clearComparisonResult,
  readComparisonResult,
  saveComparisonResult,
} from "./compareSession.js";

// This page collects the files and options needed for a comparison.
export default function Compare() {
  const navigate = useNavigate();
  // These values control the selected mode, files, and template.
  const [comparisonMode, setComparisonMode] = useState("template");
  const [originalFile, setOriginalFile] = useState(null);
  const [revisedFile, setRevisedFile] = useState(null);
  const [contractFile, setContractFile] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [templateLoadError, setTemplateLoadError] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [error, setError] = useState("");
  const [isComparing, setIsComparing] = useState(false);
  const [hasLatestComparison, setHasLatestComparison] = useState(() =>
    // Start with the latest comparison saved in this browser tab.
    Boolean(readComparisonResult()),
  );

  // STEP 1: Load the template choices when the page opens.
  useEffect(() => {
    // Ignore the request if the user leaves before it finishes.
    let isCurrentRequest = true;

    async function loadTemplates() {
      setIsLoadingTemplates(true);
      setTemplateLoadError("");

      try {
        const response = await fetch(buildApiUrl("/api/templates"));
        const data = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error("Could not load templates.");
        }

        if (!isCurrentRequest) {
          return;
        }

        // If the server sends no list, use an empty one so the page still works.
        const nextTemplates = Array.isArray(data) ? data : [];
        setTemplates(nextTemplates);

        if (nextTemplates.length > 0) {
          setSelectedTemplateId((currentValue) => {
            if (currentValue) {
              return currentValue;
            }

            return String(nextTemplates[0].id);
          });
        }
      } catch {
        if (!isCurrentRequest) {
          return;
        }

        setTemplates([]);
        setTemplateLoadError("Could not load the template library right now.");
      } finally {
        if (isCurrentRequest) {
          setIsLoadingTemplates(false);
        }
      }
    }

    loadTemplates();

    // Mark this request as old when the page closes.
    return () => {
      isCurrentRequest = false;
    };
  }, []);

  // Keep the selected template valid after the list changes.
  useEffect(() => {
    if (templates.length === 0) {
      return;
    }

    const selectedTemplateExists = templates.some(
      (template) => String(template.id) === String(selectedTemplateId),
    );

    if (!selectedTemplateExists) {
      setSelectedTemplateId(String(templates[0].id));
    }
  }, [selectedTemplateId, templates]);

  // Find the full settings for the currently selected mode.
  // Read the title and instructions for the chosen comparison type.
  const selectedMode = useMemo(
    () =>
      COMPARISON_MODES.find((mode) => mode.id === comparisonMode) ||
      COMPARISON_MODES[0],
    [comparisonMode],
  );

  // Narrow the template list using the search box.
  const filteredTemplates = useMemo(() => {
    const normalizedQuery = templateSearch.trim().toLowerCase();

    if (!normalizedQuery) {
      return templates;
    }

    // Keep a template when its name, category, or description matches.
    return templates.filter((template) =>
      [template.title, template.category, template.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
    );
  }, [templateSearch, templates]);

  // Get the full record for the selected template.
  const selectedTemplate = useMemo(
    () =>
      templates.find(
        (template) => String(template.id) === String(selectedTemplateId),
      ) || null,
    [selectedTemplateId, templates],
  );

  // Move selection to a visible template after searching.
  useEffect(() => {
    if (comparisonMode !== "template" || filteredTemplates.length === 0) {
      return;
    }

    const selectedTemplateIsVisible = filteredTemplates.some(
      (template) => String(template.id) === String(selectedTemplateId),
    );

    if (!selectedTemplateIsVisible) {
      setSelectedTemplateId(String(filteredTemplates[0].id));
    }
  }, [comparisonMode, filteredTemplates, selectedTemplateId]);

  // Switch comparison mode and clear old errors.
  const handleModeChange = (nextMode) => {
    setComparisonMode(nextMode);
    setError("");
  };

  // STEP 2: Check a chosen file, then save it in the correct box.
  const handleFileChange = (event, side) => {
    // Use no file when the picker was cleared.
    const nextFile = event.target.files?.[0] || null;

    if (!nextFile) {
      if (side === "original") {
        setOriginalFile(null);
      } else if (side === "revised") {
        setRevisedFile(null);
      } else {
        setContractFile(null);
      }
      return;
    }

    const lowerName = nextFile.name.toLowerCase();
    // Accept the file when its name ends with one supported type.
    const supported = acceptedFormats.some((extension) =>
      lowerName.endsWith(extension),
    );

    if (!supported) {
      setError("Upload PDF, DOCX, or TXT files for document comparison.");
      return;
    }

    setError("");

    if (side === "original") {
      setOriginalFile(nextFile);
      return;
    }

    if (side === "revised") {
      setRevisedFile(nextFile);
      return;
    }

    setContractFile(nextFile);
  };

  // STEP 3: Check the setup, send it, and open the results page.
  const compareDocuments = async () => {
    const session = getAuthSession();

    if (!session?.token) {
      setError("Your session expired. Please sign in again.");
      return;
    }

    // Put the files and comparison choices into one request.
    const formData = new FormData();
    formData.append("comparisonMode", comparisonMode);

    // Each comparison mode requires a different set of form fields.
    if (comparisonMode === "template") {
      if (!contractFile) {
        setError("Choose a contract file before comparing it against a template.");
        return;
      }

      if (!selectedTemplateId) {
        setError("Choose a template before running the comparison.");
        return;
      }

      formData.append("contractDocument", contractFile);
      formData.append("templateId", selectedTemplateId);
    } else {
      if (!originalFile || !revisedFile) {
        setError("Choose both files before comparing versions.");
        return;
      }

      formData.append("originalDocument", originalFile);
      formData.append("revisedDocument", revisedFile);
    }

    setIsComparing(true);
    setError("");
    clearComparisonResult();
    setHasLatestComparison(false);

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
        setError(data?.error || "Could not compare these documents.");
        return;
      }

      // Save a temporary copy and also pass it directly to the results route.
      saveComparisonResult(data);
      setHasLatestComparison(true);
      navigate("/compare/results", {
        state: { comparisonResult: data },
      });
    } catch {
      setError("Could not connect to the server.");
    } finally {
      setIsComparing(false);
    }
  };

  return (
    <DashboardLayout>
      {/* SCREEN 1: Page introduction and comparison setup. */}
      <section className="card-surface p-8 md:p-10">
        <p className="eyebrow">Document Comparison</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-brand-ink">
          Set up your document comparison in one place
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
          Choose the comparison mode, upload the files you want to review, and
          open the final results on a dedicated page built for summary metrics,
          risk shifts, and clause-level differences.
        </p>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        {/* Left side contains all comparison setup controls. */}
        <section className="card-surface p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-brand-ink">
                Comparison workspace
              </h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                Supported formats: PDF, DOCX, and TXT.
              </p>
              <p className="mt-1 text-xs leading-6 text-slate-400">
                Lecture slides, notes, and other non-contract documents will be
                rejected.
              </p>
            </div>
            <div className="rounded-2xl bg-brand-surface p-3 text-brand-accent">
              <ArrowRightLeft size={24} />
            </div>
          </div>

          {/* Choose template comparison or version comparison. */}
          <div className="mt-8 grid gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Choose comparison mode
            </p>
            <div className="grid gap-3">
              {/* Create one selectable card for each comparison type. */}
              {COMPARISON_MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => handleModeChange(mode.id)}
                  className={`rounded-[1.75rem] border px-5 py-4 text-left transition ${
                    comparisonMode === mode.id
                      ? "border-brand-accent bg-brand-surface"
                      : "border-brand-line bg-white hover:border-brand-accent"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-brand-ink">
                        {mode.label}
                      </p>
                      <p className="mt-1 text-sm leading-7 text-slate-500">
                        {mode.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Show a short explanation of the active mode. */}
          <div className="mt-8 rounded-[1.75rem] border border-brand-line bg-brand-surface px-5 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
              Active mode
            </p>
            <h3 className="mt-2 text-lg font-bold text-brand-ink">
              {selectedMode.title}
            </h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {selectedMode.description}
            </p>
          </div>

          {/* Each mode shows the files and choices it needs. */}
          {/* Show the controls needed for the selected comparison type. */}
          {comparisonMode === "template" ? (
            <div className="mt-8 grid gap-4">
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-[2rem] border border-dashed border-brand-line bg-brand-surface px-6 py-10 text-center transition hover:border-brand-accent hover:bg-white">
                <input
                  type="file"
                  accept={acceptedFormats.join(",")}
                  onChange={(event) => handleFileChange(event, "contract")}
                  className="hidden"
                />
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-brand-accent shadow-float">
                  <UploadCloud size={28} />
                </div>
                <p className="mt-5 text-lg font-bold text-brand-ink">
                  Upload the contract to review
                </p>
                <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">
                  Use the agreement you received or drafted, then compare it
                  against a standard template.
                </p>
              </label>

              <div className="rounded-2xl border border-brand-line bg-white px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Uploaded contract
                </p>
                <p className="mt-2 text-sm font-semibold text-brand-ink">
                  {formatSelectedFile(contractFile)}
                </p>
              </div>

              <div className="rounded-[2rem] border border-brand-line bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-brand-ink">
                      Select a template
                    </p>
                    <p className="mt-1 text-sm leading-7 text-slate-500">
                      Pick the reference template that should act as your
                      baseline for comparison.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-brand-surface p-3 text-brand-accent">
                    <FileText size={18} />
                  </div>
                </div>

                <div className="mt-5 grid gap-4">
                  <label className="relative block">
                    <Search
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={16}
                    />
                    <input
                      type="text"
                      value={templateSearch}
                      onChange={(event) => setTemplateSearch(event.target.value)}
                      placeholder="Search templates by title, category, or description..."
                      className="w-full rounded-2xl border border-brand-line bg-brand-surface py-3 pl-10 pr-4 text-sm text-brand-ink outline-none transition focus:border-brand-accent"
                    />
                  </label>

                  <select
                    value={selectedTemplateId}
                    onChange={(event) => setSelectedTemplateId(event.target.value)}
                    disabled={isLoadingTemplates || filteredTemplates.length === 0}
                    className="w-full rounded-2xl border border-brand-line bg-brand-surface px-4 py-3 text-sm text-brand-ink outline-none transition focus:border-brand-accent disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {/* Choose loading text, matching options, or an empty option. */}
                    {isLoadingTemplates ? (
                      <option value="">Loading templates...</option>
                    ) : filteredTemplates.length > 0 ? (
                      // Build one dropdown option for every matching template.
                      filteredTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {getTemplateOptionLabel(template)}
                        </option>
                      ))
                    ) : (
                      <option value="">No templates match this search</option>
                    )}
                  </select>

                  {templateLoadError ? (
                    <p className="text-sm text-brand-danger">{templateLoadError}</p>
                  ) : null}

                  {/* Show a preview card only after a template is selected. */}
                  {selectedTemplate ? (
                    <div className="rounded-2xl bg-brand-surface px-4 py-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        Selected template
                      </p>
                      <p className="mt-2 text-sm font-bold text-brand-ink">
                        {selectedTemplate.title || "Untitled template"}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {selectedTemplate.description ||
                          "This template is ready to use as a comparison baseline."}
                      </p>
                      {selectedTemplate.category ? (
                        <span className="mt-3 inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-brand-accentDeep">
                          {selectedTemplate.category}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
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
                  Use the edited version you want to compare against the
                  original.
                </p>
              </label>

              <div className="rounded-2xl border border-brand-line bg-white px-5 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Revised file
                </p>
                <p className="mt-2 text-sm font-semibold text-brand-ink">
                  {formatSelectedFile(revisedFile)}
                </p>
              </div>
            </div>
          )}

          {/* Validation or server errors appear above the action button. */}
          {error ? (
            <div className="mt-4 rounded-2xl border border-brand-danger/20 bg-brand-danger/10 px-4 py-3 text-sm text-brand-danger">
              {error}
            </div>
          ) : null}

          <button
            type="button"
            onClick={compareDocuments}
            disabled={isComparing}
            className="mt-4 w-full rounded-2xl bg-brand-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-inkSoft disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isComparing ? "Preparing comparison results..." : selectedMode.buttonLabel}
          </button>
        </section>

        {/* Right side explains the flow and reopens the latest result. */}
        <section className="space-y-6">
          <div className="card-surface p-6">
            <h2 className="text-xl font-bold text-brand-ink">
              How the split works now
            </h2>
            <div className="mt-5 space-y-4">
              <article className="rounded-2xl bg-brand-surface px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white p-2 text-brand-accent">
                    <ArrowRightLeft size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-brand-ink">
                    This page is only for setup
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Choose the mode, upload files, and pick the template here
                  without mixing the setup with the final review screen.
                </p>
              </article>

              <article className="rounded-2xl bg-brand-surface px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white p-2 text-brand-accent">
                    <PlusCircle size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-brand-ink">
                    Results open on their own page
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Summary cards, change filters, and clause-by-clause results
                  now live on a dedicated comparison results page.
                </p>
              </article>

              <article className="rounded-2xl bg-brand-surface px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white p-2 text-brand-accent">
                    <ShieldAlert size={18} />
                  </div>
                  <h3 className="text-sm font-bold text-brand-ink">
                    Your latest result is reusable
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  The latest comparison stays available during this browser
                  session, so you can reopen the results page without rerunning
                  the comparison.
                </p>
              </article>
            </div>
          </div>

          <div className="card-surface p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-brand-ink">
                  Latest comparison
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-500">
                  Open the newest saved result if you want to continue reviewing
                  an earlier comparison.
                </p>
              </div>
              <div className="rounded-2xl bg-brand-surface p-3 text-brand-accent">
                <FileDiff size={20} />
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/compare/results")}
              disabled={!hasLatestComparison}
              className="mt-5 w-full rounded-2xl border border-brand-line bg-white px-5 py-3 text-sm font-bold text-brand-ink transition hover:border-brand-accent disabled:cursor-not-allowed disabled:text-slate-400"
            >
              {hasLatestComparison
                ? "Open Latest Comparison Results"
                : "No comparison results saved yet"}
            </button>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
