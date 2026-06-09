export const acceptedFormats = [".pdf", ".docx", ".txt"];

export const FILTERS = [
  { id: "all", label: "All changes" },
  { id: "modified", label: "Modified" },
  { id: "added", label: "Added" },
  { id: "removed", label: "Removed" },
  { id: "unchanged", label: "Unchanged" },
];

export const COMPARISON_MODES = [
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

export function getStatusTone(status) {
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

export function formatSelectedFile(file) {
  if (!file) {
    return "No file selected yet";
  }

  return `${file.name} • ${(file.size / 1024).toFixed(1)} KB`;
}

export function getTemplateOptionLabel(template) {
  if (!template) {
    return "Untitled template";
  }

  const title = (template.title || "").trim() || "Untitled template";
  const category = (template.category || "").trim();

  return category ? `${title} • ${category}` : title;
}
