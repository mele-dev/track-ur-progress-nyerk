"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { L10n, Locale } from "@/data/types";
import { loadLocale, saveLocale } from "@/lib/storage/progress";
import { DICTIONARIES, fmt, type Dictionary } from "./dictionaries";

interface I18nValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  d: Dictionary;
  /** Texto bilingüe de los datos del juego. */
  l: (text: L10n) => string;
  fmt: typeof fmt;
  num: (n: number) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // El server siempre renderiza en español; después de montar se aplica la preferencia guardada.
  const [locale, setLocaleState] = useState<Locale>("es");

  useEffect(() => {
    const saved = loadLocale();
    const preferred: Locale =
      saved === "es" || saved === "en" ? saved : navigator.language.toLowerCase().startsWith("es") ? "es" : "en";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- la preferencia vive en localStorage (solo cliente)
    if (preferred !== "es") setLocaleState(preferred);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    saveLocale(l);
  }, []);

  const value = useMemo<I18nValue>(() => {
    const nf = new Intl.NumberFormat(locale === "es" ? "es-AR" : "en-US");
    return {
      locale,
      setLocale,
      d: DICTIONARIES[locale] as Dictionary,
      l: (text) => text[locale],
      fmt,
      num: (n) => nf.format(n),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n debe usarse dentro de <I18nProvider>");
  return ctx;
}
