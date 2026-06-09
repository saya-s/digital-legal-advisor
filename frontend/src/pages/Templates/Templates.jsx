import { Download, FileText, FolderKanban, Globe, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../../config/api.js";
import DashboardLayout from "../../layouts/DashboardLayout.jsx";
import MainLayout from "../../layouts/MainLayout.jsx";
import { hasAuthSession } from "../../utils/authSession.js";
import { formatShortDate } from "../../utils/formatDate.js";

// Category buttons shown above the template cards.
const CATEGORIES = [
  "All",
  "Employment",
  "NDA",
  "Lease",
  "Loan",
  "Investment",
  "Services",
  "Real Estate",
];

// Get the file link for one template.
function getTemplateFileUrl(template) {
  return (template?.preview_url || template?.previewUrl || "").trim();
}

// Build a simple file name for download.
function getTemplateFileName(fileUrl) {
  if (!fileUrl) return "template.pdf";

  const fileName = fileUrl.split("/").pop();
  return fileName || "template.pdf";
}

// This page shows the template library.
export default function TemplateLibrary() {
  const navigate = useNavigate();
  // Guests and signed-in users see the same page inside different layouts.
  const isSignedIn = hasAuthSession();
  const PageLayout = isSignedIn ? DashboardLayout : MainLayout;

  // These keep track of the template list and the current filters.
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Reload templates whenever the category or search text changes.
  useEffect(() => {
    // Ignore an old request after the filters change or the user leaves.
    let isCurrentRequest = true;

    // Load templates again when the category or search text changes.
    async function loadTemplates() {
      setLoading(true);

      const params = new URLSearchParams();

      // Add only the filters that currently have a value.
      if (activeCategory !== "All") {
        params.append("category", activeCategory);
      }

      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      const requestUrl = params.toString()
        ? `/api/templates?${params.toString()}`
        : "/api/templates";

      try {
        // buildApiUrl joins this path with the configured backend address.
        const response = await fetch(buildApiUrl(requestUrl));

        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }

        const data = await response.json();

        if (isCurrentRequest) {
          setTemplates(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error("Template fetch error:", err);

        if (isCurrentRequest) {
          setTemplates([]);
        }
      } finally {
        if (isCurrentRequest) {
          setLoading(false);
        }
      }
    }

    loadTemplates();

    // Mark this request as old before another request starts.
    return () => {
      isCurrentRequest = false;
    };
  }, [activeCategory, searchTerm]);

  return (
    // Use the public layout for guests and dashboard layout for signed-in users.
    <PageLayout>
      {/* Page heading. */}
      <section className="card-surface mt-6 overflow-hidden bg-brand-ink text-white">
        <div className="relative px-6 py-10 md:px-8 md:py-12">
          {/* Blur Effects */}
          {/* Background decoration. */}
          <div className="absolute -right-16 -top-12 h-48 w-48 rounded-full bg-brand-accent/10 blur-3xl" />
          <div className="absolute -bottom-20 left-0 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

          <div className="relative z-10 grid gap-8 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
            <div>
              <p className="eyebrow">Templates</p>
              <h1 className="mt-3 font-display text-4xl font-bold text-white">
                Contract template library
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-8 text-slate-300 md:text-base">
                Browse reusable contract templates, filter them by category, and
                review sample records in a clean, searchable library.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Search bar and category buttons. */}
      <section className="card-surface mt-6 p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accentDeep">
              Template Explorer
            </p>
            <h2 className="mt-3 text-2xl font-bold text-brand-ink">
              Find the right starting contract
            </h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              Search by title, description, or clause wording, or select a
              category below.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-4">
          {/* Keep the visible search text connected to the value above. */}
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search templates by title or clause phrase..."
              className="w-full rounded-2xl border border-brand-line bg-brand-surface py-3.5 pl-10 pr-4 text-sm text-brand-ink outline-none transition focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Create one filter button for every category. */}
            {CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition ${
                  activeCategory === category
                    ? "bg-brand-ink text-white"
                    : "border border-brand-line bg-white text-slate-500 hover:border-brand-accent hover:text-brand-accentDeep"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <p className="text-sm text-slate-500">
            Showing{" "}
              <span className="font-bold text-brand-ink">
                {templates.length}
              </span>{" "}
              templates
            </p>
        </div>

        {/* Template cards. */}
        {/* Show loading, no results, or the template cards. */}
        {loading ? (
          <div className="mt-6 rounded-[1.75rem] bg-brand-surface px-5 py-12 text-center text-sm font-semibold text-slate-500">
            Loading template library...
          </div>
        ) : templates.length === 0 ? (
          <div className="mt-6 rounded-[1.75rem] border border-dashed border-brand-line bg-brand-surface px-5 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-white text-brand-accent shadow-sm">
              <FolderKanban size={24} />
            </div>
            <h3 className="mt-5 text-xl font-bold text-brand-ink">
              No templates match your filters
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500">
              Try another search term or change the selected category.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {/* Build one library card for every returned template. */}
            {templates.map((template) => {
              // Calculate download details once for this template card.
              const templateFileUrl = getTemplateFileUrl(template);
              const templateFileName = getTemplateFileName(templateFileUrl);

              return (
                <div
                  key={template.id}
                  className="card-surface flex flex-col justify-between p-6 transition hover:-translate-y-1"
                >
                <div>
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-surface text-brand-accent">
                      <FileText size={24} />
                    </div>
                    <span className="rounded-full bg-brand-surface px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-brand-accentDeep">
                      {template.category || "Uncategorized"}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-brand-ink">
                    {template.title || "Untitled Document"}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600 line-clamp-3">
                    {template.description ||
                      "Detailed explanation of this contract template will appear here."}
                  </p>

                  {/* Show matched clause text only for a search result that includes it. */}
                  {searchTerm.trim() && template.searchSnippet ? (
                    <div className="mt-4 rounded-2xl border border-brand-line bg-white px-4 py-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        Matching clause text
                      </p>
                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {template.searchSnippet}
                      </p>
                      {template.matchedClauseCount ? (
                        <p className="mt-3 text-xs font-bold uppercase tracking-[0.16em] text-brand-accentDeep">
                          {template.matchedClauseCount} matching clause
                          {template.matchedClauseCount === 1 ? "" : "s"}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Show metadata only when at least one metadata value exists. */}
                  {(template.jurisdiction ||
                    template.language ||
                    template.updatedAt) && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {template.jurisdiction && (
                        <span className="rounded-full bg-brand-surface px-3 py-2 text-xs font-semibold text-brand-ink">
                          <Globe size={12} className="mr-1.5 inline" />
                          {template.jurisdiction}
                        </span>
                      )}
                      {template.language && (
                        <span className="rounded-full bg-brand-surface px-3 py-2 text-xs font-semibold text-brand-ink">
                          {template.language}
                        </span>
                      )}
                      {template.updatedAt && (
                        <span className="rounded-full bg-brand-surface px-3 py-2 text-xs font-semibold text-brand-ink">
                          Updated {formatShortDate(template.updatedAt)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  {/* Guests sign in; members view/download; missing files show disabled UI. */}
                  {!isSignedIn ? (
                    <>
                      {/* Guests can browse the library, but deeper actions stay gated. */}
                      <button
                        type="button"
                        onClick={() => navigate("/login", { state: { from: "/templates" } })}
                        className="cta-primary w-full"
                      >
                        Sign In to Use Templates
                      </button>
                      <p className="text-center text-xs text-slate-500">
                        Browse first, then sign in to open template files.
                      </p>
                    </>
                  ) : templateFileUrl ? (
                    <>
                      <a
                        href={templateFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="cta-primary w-full text-center"
                      >
                        View Template
                      </a>
                      <a
                        href={templateFileUrl}
                        download={templateFileName}
                        className="cta-secondary inline-flex w-full items-center justify-center gap-2"
                      >
                        <Download size={16} />
                        Download PDF
                      </a>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full rounded-full border border-brand-line bg-brand-surface px-6 py-3 text-sm font-bold text-slate-400"
                    >
                      File Link Pending
                    </button>
                  )}

                </div>
              </div>
              );
            })}
          </div>
        )}
      </section>
    </PageLayout>
  );
}
