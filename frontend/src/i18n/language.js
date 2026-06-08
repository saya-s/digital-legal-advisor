import { createContext, useContext, useEffect, useState } from "react";
import { messages } from "./messages.js";

const STORAGE_KEY = "misharu_locale";

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

function getNestedValue(source, key) {
  return key.split(".").reduce((value, segment) => {
    if (value && Object.prototype.hasOwnProperty.call(value, segment)) {
      return value[segment];
    }

    return undefined;
  }, source);
}

function interpolateMessage(value, variables) {
  if (typeof value !== "string") {
    return value;
  }

  return value.replace(/\{(\w+)\}/g, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(variables, key)) {
      return String(variables[key]);
    }

    return `{${key}}`;
  });
}

function getStoredLocale() {
  if (typeof window === "undefined") {
    return "en";
  }

  const storedLocale = window.localStorage.getItem(STORAGE_KEY);
  return LANGUAGE_META[storedLocale] ? storedLocale : "en";
}

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(getStoredLocale);

  useEffect(() => {
    const meta = LANGUAGE_META[locale] || LANGUAGE_META.en;

    window.localStorage.setItem(STORAGE_KEY, locale);
    document.documentElement.lang = meta.documentLang;
    document.documentElement.dir = meta.dir;
    document.body.dir = meta.dir;
  }, [locale]);

  const meta = LANGUAGE_META[locale] || LANGUAGE_META.en;

  function setLocale(nextLocale) {
    if (!LANGUAGE_META[nextLocale]) {
      return;
    }

    setLocaleState(nextLocale);
  }

  function tm(key, fallback = null) {
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

  function t(key, variables = {}, fallback = key) {
    const value = tm(key, fallback);
    return interpolateMessage(value, variables);
  }

  return (
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

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }

  return context;
}
