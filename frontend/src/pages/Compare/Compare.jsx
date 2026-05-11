import {
  ArrowRightLeft,
  FileDiff,
  FileText,
  Loader2,
  PlusCircle,
  Search,
  ShieldAlert,
  UploadCloud,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { buildApiUrl } from "../../config/api.js";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import { getAuthSession } from "../../utils/authSession.js";
import { getRiskBadgeTone } from "../../utils/riskTone.js";

const acceptedFormats = [".pdf", ".docx", ".txt"];

const FILTERS = [
  { id: "all", label: "All changes" },
  { id: "modified", label: "Modified" },
  { id: "added", label: "Added" },
  { id: "removed", label: "Removed" },
  { id: "unchanged", label: "Unchanged" },
];

const COMPARISON_MODES = [
  {
    id: "template",
    label: "Contract vs template",
    title: "Compare an uploaded contract against a standard template",
    description:
      "Upload one contract, choose a template from your library, and surface missing sections, extra clauses, and risk changes.",
    buttonLabel: "Compare Against Template",
  },
  {
    id: "version",
    label: "Version vs version",
    title: "Compare two versions of the same contract",
    description:
      "Upload an original file and a revised file to track wording changes, added clauses, and higher-risk edits.",
    buttonLabel: "Compare Versions",
  },
];

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

function getTemplateOptionLabel(template) {
  if (!template) {
    return "Untitled template";
  }

  const title = (template.title || "").trim() || "Untitled template";
  const category = (template.category || "").trim();

  return category ? `${title} • ${category}` : title;
}

export default function Compare() {
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
  const [comparisonResult, setComparisonResult] = useState(null);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
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

    return () => {
      isCurrentRequest = false;
    };
  }, []);

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

  const selectedMode = useMemo(
    () =>
      COMPARISON_MODES.find((mode) => mode.id === comparisonMode) ||
      COMPARISON_MODES[0],
    [comparisonMode],
  );

  const filteredTemplates = useMemo(() => {
    const normalizedQuery = templateSearch.trim().toLowerCase();

    if (!normalizedQuery) {
      return templates;
    }

    return templates.filter((template) =>
      [template.title, template.category, template.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery)),
    );
  }, [templateSearch, templates]);

  const selectedTemplate = useMemo(
    () =>
      templates.find((template) => String(template.id) === String(selectedTemplateId)) ||
      null,
    [selectedTemplateId, templates],
  );

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

  const filteredItems = useMemo(() => {
    const items = Array.isArray(comparisonResult?.comparisonItems)
      ? comparisonResult.comparisonItems
      : [];

    if (activeFilter === "all") {
      return items;
    }

    return items.filter((item) => item.status === activeFilter);
  }, [activeFilter, comparisonResult]);

  const originalLabel =
    comparisonResult?.documentLabels?.original ||
    (comparisonMode === "template" ? "Template" : "Original");
  const revisedLabel =
    comparisonResult?.documentLabels?.revised ||
    (comparisonMode === "template" ? "Uploaded contract" : "Revised");
  const originalRiskBadgeTone = getRiskBadgeTone(
    comparisonResult?.originalDocument?.riskLevel,
  );
  const revisedRiskBadgeTone = getRiskBadgeTone(
    comparisonResult?.revisedDocument?.riskLevel,
  );

  const handleModeChange = (nextMode) => {
    setComparisonMode(nextMode);
    setError("");
    setComparisonResult(null);
    setActiveFilter("all");
  };

  const handleFileChange = (event, side) => {
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

  const compareDocuments = async () => {
    const session = getAuthSession();

    if (!session?.token) {
      setError("Your session expired. Please sign in again.");
      return;
    }

    const formData = new FormData();
    formData.append("comparisonMode", comparisonMode);

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

  return (
    <DashboardLayout>
      <section className="card-surface p-8 md:p-10">
        <p className="eyebrow">Document Comparison</p>
        <h1 className="mt-3 font-display text-4xl font-bold text-brand-ink">
          Compare contracts against templates or other versions
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
          Switch between template benchmarking and version-to-version review in
          one workspace, then inspect clause changes, missing sections, and risk
          shifts side by side.
        </p>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
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

          <div className="mt-8 grid gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Choose comparison mode
            </p>
            <div className="grid gap-3">
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

          <div className="mt-8 rounded-[1.75rem] border border-brand-line bg-brand-surface px-5 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
              Active Mode
            </p>
            <h3 className="mt-2 text-lg font-bold text-brand-ink">
              {selectedMode.title}
            </h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {selectedMode.description}
            </p>
          </div>

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
                    {isLoadingTemplates ? (
                      <option value="">Loading templates...</option>
                    ) : filteredTemplates.length > 0 ? (
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
            {isComparing
              ? "Comparing documents..."
              : selectedMode.buttonLabel}
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
                    The engine matches the closest sections between both sides
                    of the comparison so you can review each difference side by
                    side.
                  </p>
                </article>

                <article className="rounded-2xl bg-brand-surface px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-white p-2 text-brand-accent">
                      <PlusCircle size={18} />
                    </div>
                    <h3 className="text-sm font-bold text-brand-ink">
                      Template gaps or version changes
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Removed sections highlight gaps from the baseline side.
                    Added sections highlight wording that appears only in the
                    compared document.
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
                    <p className="mt-2 text-sm text-slate-500">
                      {originalLabel} on the left, {revisedLabel.toLowerCase()} on
                      the right.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs font-bold">
                    <span
                      className={`rounded-full px-3 py-1.5 ${originalRiskBadgeTone}`}
                    >
                      {originalLabel} {comparisonResult.originalDocument?.riskLevel} Risk
                    </span>
                    <span
                      className={`rounded-full px-3 py-1.5 ${revisedRiskBadgeTone}`}
                    >
                      {revisedLabel} {comparisonResult.revisedDocument?.riskLevel} Risk
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
                    {comparisonResult.comparisonMode === "template" ? (
                      <p className="mt-2 text-sm leading-7 text-slate-500">
                        In template mode, removed means the template contains a
                        clause that the uploaded contract does not. Added means
                        the uploaded contract contains wording not found in the
                        template.
                      </p>
                    ) : null}
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
                    const originalClauseRiskBadgeTone = getRiskBadgeTone(
                      originalClause?.risk,
                    );
                    const revisedClauseRiskBadgeTone = getRiskBadgeTone(
                      revisedClause?.risk,
                    );

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
                                  {originalLabel}
                                </p>
                                <p className="mt-2 text-sm font-bold text-brand-ink">
                                  {originalClause?.title || "No matching clause"}
                                </p>
                              </div>
                              {originalClause ? (
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${originalClauseRiskBadgeTone}`}
                                >
                                  {originalClause.risk} Risk
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-4 text-sm leading-7 text-slate-600">
                              {originalClause?.preview ||
                                `This section does not appear in the ${originalLabel.toLowerCase()}.`}
                            </p>
                          </div>

                          <div className="rounded-[1.5rem] border border-brand-line bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
                                  {revisedLabel}
                                </p>
                                <p className="mt-2 text-sm font-bold text-brand-ink">
                                  {revisedClause?.title || "No matching clause"}
                                </p>
                              </div>
                              {revisedClause ? (
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${revisedClauseRiskBadgeTone}`}
                                >
                                  {revisedClause.risk} Risk
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-4 text-sm leading-7 text-slate-600">
                              {revisedClause?.preview ||
                                `This section does not appear in the ${revisedLabel.toLowerCase()}.`}
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
