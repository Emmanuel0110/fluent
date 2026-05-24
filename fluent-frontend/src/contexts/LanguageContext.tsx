import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchLanguages, updateLanguages } from "../APICalls";
import { useAuth } from "./AuthContext";
import { useTranslation } from "react-i18next";

interface Language {
  _id: string;
  label: string;
}

interface LanguageContextType {
  languages: Language[];
  sourceLanguage: string;
  targetLanguage: string;
  setSourceLanguage: React.Dispatch<React.SetStateAction<string>>;
  setTargetLanguage: React.Dispatch<React.SetStateAction<string>>;
  updateUserLanguages: (source: string, target: string) => Promise<boolean>;
  loadLanguages: () => Promise<Language[]>;
  getLanguageLabel: (languageId: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [sourceLanguage, setSourceLanguage] = useState<string>("");
  const [targetLanguage, setTargetLanguage] = useState<string>("");
  const { i18n } = useTranslation();

  const loadLanguages = async (): Promise<Language[]> => {
    const data = await fetchLanguages();
    if (data) {
      setLanguages(data);
      return data;
    }
    return [];
  };

  const getLanguageLabel = (languageId: string) => {
    const language = languages.find((lang) => lang._id === languageId);
    return language ? language.label : "";
  };

  const updateUserLanguages = async (source: string, target: string): Promise<boolean> => {
    const result = await updateLanguages({
      sourceLanguage: source,
      targetLanguage: target,
    });

    if (result) {
      setSourceLanguage(source);
      setTargetLanguage(target);
      const lang = languages.find((l) => l._id === source);
      if (lang) i18n.changeLanguage(lang.label);
      return true;
    }
    return false;
  };

  useEffect(() => {
    if (user?.sourceLanguage && user?.targetLanguage) {
      setSourceLanguage(user.sourceLanguage);
      setTargetLanguage(user.targetLanguage);
      loadLanguages().then((langs) => {
        const lang = langs.find((l) => l._id === user.sourceLanguage);
        if (lang) i18n.changeLanguage(lang.label);
      });
    }
  }, [user]);

  return (
    <LanguageContext.Provider
      value={{
        languages,
        sourceLanguage,
        targetLanguage,
        setSourceLanguage,
        setTargetLanguage,
        updateUserLanguages,
        loadLanguages,
        getLanguageLabel,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
