import { createContext, useContext, useEffect, useState } from "react";
import { messages } from "./messages.js";

const STORAGE_KEY = "misharu_locale";

// Details needed to display each language correctly.
const LANGUAGE_META = {
  en: {
    code: "en",
    label: "English",
    dir: "ltr",
    documentLang: "en",
    dateLocale: "en-US",
  },
  ar: {
    code: "ar",
    label: "العربية",
    dir: "rtl",
    documentLang: "ar",
    dateLocale: "ar-IQ",
  },
  ckb: {
    code: "ckb",
    label: "کوردی",
    dir: "rtl",
    documentLang: "ckb",
    dateLocale: "ckb-IQ",
  },
};

const LanguageContext = createContext(null);

// Find a translation using a key such as "navbar.signIn".
function getNestedValue(source, key) {
  // Follow a key like "dashboard.hero.title" until its saved text is found.
  return key.split(".").reduce((value, segment) => {
    if (value && Object.prototype.hasOwnProperty.call(value, segment)) {
      return value[segment];
    }

    return undefined;
  }, source);
}

// Replace placeholders such as {username} with real values.
function interpolateMessage(value, variables) {
  if (typeof value !== "string") {
    return value;
  }

  // Find words inside braces, such as {username}, and replace them.
  return value.replace(/\{(\w+)\}/g, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(variables, key)) {
      return String(variables[key]);
    }

    return `{${key}}`;
  });
}

// Use the saved language, or English when none is valid.
function getStoredLocale() {
  if (typeof window === "undefined") {
    return "en";
  }

  const storedLocale = window.localStorage.getItem(STORAGE_KEY);
  return LANGUAGE_META[storedLocale] ? storedLocale : "en";
}

// This keeps the chosen language available on every page.
export function LanguageProvider({ children }) {
  // Start with the language saved in the browser.
  const [locale, setLocaleState] = useState(getStoredLocale);

  // Save the language and update page direction when it changes.
  useEffect(() => {
    const meta = LANGUAGE_META[locale] || LANGUAGE_META.en;

    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = meta.documentLang;
    document.documentElement.dir = meta.dir;
    document.body.dir = meta.dir;
  }, [locale]);

  // Fall back to English details if the locale is ever unknown.
  const meta = LANGUAGE_META[locale] || LANGUAGE_META.en;

  // Ignore language codes the app does not support.
  function setLocale(nextLocale) {
    if (!LANGUAGE_META[nextLocale]) {
      return;
    }

    setLocaleState(nextLocale);
  }

  // Get translated text or data, falling back to English.
  function tm(key, fallback = null) {
    // Try the selected language first, then English, then the supplied fallback.
    const localizedValue = getNestedValue(messages[locale], key);
    if (localizedValue !== undefined) {
      return localizedValue;
    }

    const englishValue = getNestedValue(messages.en, key);
    if (englishValue !== undefined) {
      return englishValue;
    }

    return fallback;
  }

  // Get translated text and fill in any placeholders.
  function t(key, variables = {}, fallback = key) {
    const value = tm(key, fallback);
    return interpolateMessage(value, variables);
  }

  return (
    // Give every page access to these language tools.
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        dir: meta.dir,
        isRTL: meta.dir === "rtl",
        dateLocale: meta.dateLocale,
        languages: Object.values(LANGUAGE_META),
        t,
        tm,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

// Pages call this helper when they need translated text or language details.
export function useLanguage() {
  // Read the language tools shared above.
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }

  return context;
}
