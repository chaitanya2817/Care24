import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import en from "../locales/en.json";
import hi from "../locales/hi.json";
import kn from "../locales/kn.json";

export type Language = "en" | "hi" | "kn";

type TranslationObj = typeof en;

const translations: Record<Language, TranslationObj> = { en, hi, kn };

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: "en",
  setLanguage: () => {},
  t: (k) => k,
});

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  return typeof current === "string" ? current : path;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLangState] = useState<Language>(() => {
    const stored = localStorage.getItem("careai_lang") as Language | null;
    return stored && ["en", "hi", "kn"].includes(stored) ? stored : "en";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLangState(lang);
    localStorage.setItem("careai_lang", lang);
    document.documentElement.lang = lang;
  }, []);

  const t = useCallback((key: string): string => {
    const dict = translations[language] as unknown as Record<string, unknown>;
    const result = getNestedValue(dict, key);
    if (result === key) {
      const fallback = translations["en"] as unknown as Record<string, unknown>;
      return getNestedValue(fallback, key);
    }
    return result;
  }, [language]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
