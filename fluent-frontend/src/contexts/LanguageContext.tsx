import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { fetchLanguages, updateLanguages } from "../conversations/APICalls";
import { useAuth } from "./AuthContext";

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
  loadLanguages: () => Promise<void>;
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

  const loadLanguages = async () => {
    const data = await fetchLanguages();
    if (data) {
      setLanguages(data);
    }
  };

  const updateUserLanguages = async (source: string, target: string): Promise<boolean> => {
    const result = await updateLanguages({
      sourceLanguage: source,
      targetLanguage: target,
    });

    if (result) {
      setSourceLanguage(source);
      setTargetLanguage(target);
      return true;
    }
    return false;
  };

  useEffect(() => {
    loadLanguages();
  }, []);

  useEffect(() => {
    if (user?.sourceLanguage && user?.targetLanguage) {
      setSourceLanguage(user.sourceLanguage);
      setTargetLanguage(user.targetLanguage);
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
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};
