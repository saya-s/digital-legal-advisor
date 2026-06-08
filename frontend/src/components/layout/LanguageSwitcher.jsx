import { Languages } from "lucide-react";
import { useLanguage } from "../../i18n/language.js";

export default function LanguageSwitcher({ compact = false }) {
  const { locale, setLocale, languages, t } = useLanguage();

  return (
    <label
      className={`inline-flex items-center gap-2 rounded-full border border-brand-line bg-white px-3 py-2 text-sm text-brand-ink shadow-sm ${
        compact ? "min-w-0" : ""
      }`}
    >
      <Languages size={16} className="shrink-0 text-brand-accentDeep" />
      <span className="sr-only">{t("language.label")}</span>
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value)}
        aria-label={t("language.label")}
        className="min-w-0 bg-transparent font-semibold outline-none"
      >
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {t(`language.options.${language.code}`, {}, language.label)}
          </option>
        ))}
      </select>
    </label>
  );
}
