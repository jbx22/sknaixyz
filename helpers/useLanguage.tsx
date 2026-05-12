import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type LanguageType = "ar" | "en";
export type DirectionType = "rtl" | "ltr";

interface LanguageContextType {
  language: LanguageType;
  direction: DirectionType;
  setLanguage: (language: LanguageType) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getDirectionFromLanguage = (language: LanguageType): DirectionType => {
  return language === "ar" ? "rtl" : "ltr";
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Default to Arabic (RTL)
  const [language, setLanguageState] = useState<LanguageType>("ar");
  const direction = getDirectionFromLanguage(language);

  // Set document direction on mount and when language changes
  useEffect(() => {
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
  }, [direction, language]);

  const setLanguage = (newLanguage: LanguageType) => {
    setLanguageState(newLanguage);
  };

  return (
    <LanguageContext.Provider value={{ language, direction, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};