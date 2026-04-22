import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { Language } from "../models/domain";
import en from "./en/common.json";
import fr from "./fr/common.json";

type Dictionary = typeof fr;
type TranslationKey = keyof Dictionary;

type I18nContextValue = {
  language: Language;
  t: (key: TranslationKey) => string;
};

const dictionaries: Record<Language, Dictionary> = {
  "fr-FR": fr,
  "en-US": en,
};

const I18nContext = createContext<I18nContextValue>({
  language: "fr-FR",
  t: (key) => key,
});

export function I18nProvider({
  language,
  children,
}: Readonly<{
  language: Language;
  children: ReactNode;
}>) {
  const value = useMemo<I18nContextValue>(() => {
    const dictionary = dictionaries[language];

    return {
      language,
      t: (key) => dictionary[key] ?? key,
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
