import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../../i18n/language.js";
import { navigateToSection } from "../../utils/sectionNavigation";

// This is the shared footer for public pages.
export default function PublicFooter() {
  // These helpers let footer buttons open pages or landing-page sections.
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  // Links that jump to sections on the landing page.
  const exploreLinks = [
    { label: t("footer.links.whoItsFor"), sectionId: "who-its-for" },
    { label: t("footer.links.howItWorks"), sectionId: "how-it-works" },
    { label: t("footer.links.coreFeatures"), sectionId: "core-features" },
  ];

  // These links open complete public pages rather than page sections.
  const publicLinks = [
    { label: t("footer.links.createAccount"), path: "/register" },
    { label: t("footer.links.templateLibrary"), path: "/templates" },
    { label: t("footer.links.findLawyer"), path: "/lawyers" },
  ];

  return (
    // Full footer block.
    <footer className="border-t border-brand-line bg-brand-ink text-brand-surface">
      <div className="section-shell py-16">
        {/* Footer content in four columns. */}
        {/* Stack sections on phones and show four columns on larger screens. */}
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand and short project summary. */}
          <div>
            <h2 className="font-display text-3xl font-bold text-white">
              Misharu
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              {/*leading, spacing between lines */}
              {t("footer.summary")}
            </p>
          </div>

          {/* Quick links to landing-page sections. */}
          <div>
            <h3 className="eyebrow">{t("footer.explore")}</h3>
            <ul className="mt-5 space-y-3 text-sm text-slate-300">
              {/* Build one list item for every landing-page section link. */}
              {exploreLinks.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() =>
                      navigateToSection({
                        id: link.sectionId,
                        location,
                        navigate,
                      })
                    }
                    className="transition hover:text-brand-accent"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick links to public pages. */}
          <div>
            <h3 className="eyebrow">{t("footer.publicPages")}</h3>
            <ul className="mt-5 space-y-3 text-sm text-slate-300">
              {/* Build one list item for every public page link. */}
              {publicLinks.map((link) => (
                <li key={link.label}>
                  <button
                    type="button"
                    onClick={() => navigate(link.path)}
                    className="transition hover:text-brand-accent"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Team names and small disclaimer. */}
          <div>
            <h3 className="eyebrow">{t("footer.projectTeam")}</h3>
            <ul className="mt-5 space-y-2 text-sm text-slate-300">
              <li>Saya Sardar Mohammed</li>
              <li>Sewa Adnan Mustafa</li>
              <li className="pt-2 text-xs text-slate-400">
                {t("footer.capstoneLabel")}
              </li>
            </ul>
            <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-6 text-slate-400">
              {t("footer.disclaimer")}
            </p>
          </div>
        </div>

        {/* Bottom line of the footer. */}
        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>{t("footer.copyright")}</p>
          <p className="max-w-2xl">
            {t("footer.audienceLine")}
          </p>
        </div>
      </div>
    </footer>
  );
}
