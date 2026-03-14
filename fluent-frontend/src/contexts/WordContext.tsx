import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";
import { fetchWordTags, fetchWords, saveNewWord, editRemoteWord, deleteRemoteWord, saveNewWordTag } from "../APICalls";
import { Word, WordTag } from "../types";
import { formatWord, updateCacheWithNewWordTags } from "../utils/wordUtils";
import { LocalStorageService } from "../services/localStorageService";
import { ApiError } from "../utils/http-helpers";

function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.userMessage;
  if (err instanceof Error) return err.message;
  return String(err);
}

interface WordContextType {
  words: { [id: string]: Word };
  wordTags: WordTag[];
  isLoadingWords: boolean;
  wordLoadError: string | null;
  saveWord: (infos: Word) => Promise<Word | undefined>;
  deleteWord: (id: string) => Promise<void>;
  saveWordTag: (args: { language: string; label: string }) => Promise<WordTag | undefined>;
}

const WordContext = createContext<WordContextType | undefined>(undefined);

export const useWords = () => {
  const context = useContext(WordContext);
  if (!context) throw new Error("useWords must be used within a WordProvider");
  return context;
};

export const WordProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { sourceLanguage, targetLanguage } = useLanguage();

  const [words, setWords] = useState<{ [id: string]: Word }>({});
  const [wordTags, setWordTags] = useState<WordTag[]>([]);
  const [isLoadingWords, setIsLoadingWords] = useState(false);
  const [wordLoadError, setWordLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadWords();
    } else {
      setWords({});
      setWordTags([]);
    }
  }, [isAuthenticated, sourceLanguage, targetLanguage]);

  const loadWords = async () => {
    if (!isAuthenticated) return;
    setIsLoadingWords(true);
    setWordLoadError(null);
    try {
      const localStorageService = new LocalStorageService(sourceLanguage, targetLanguage);
      if (localStorageService.localStorageWords) setWords(localStorageService.localStorageWords);

      const [wordTagsData, newWords] = await Promise.all([
        fetchWordTags(),
        fetchWords(localStorageService.lastUpdateDate),
      ]);

      setWordTags(wordTagsData || []);
      localStorageService.updateLocalStorageWords(newWords);
      setWords((prev) => ({ ...prev, ...newWords }));
    } catch (error) {
      setWordLoadError(getErrorMessage(error));
    } finally {
      setIsLoadingWords(false);
    }
  };

  const saveWord = async (infos: Word): Promise<Word | undefined> => {
    const res = await (infos._id
      ? editRemoteWord(infos, sourceLanguage, targetLanguage)
      : saveNewWord(infos, sourceLanguage, targetLanguage));

    if (res.success) {
      const { _id } = res.data;
      if (_id) {
        const formattedWord = formatWord(res.data);
        setWords((words) => ({ ...words, [_id]: formattedWord }));
        return formattedWord;
      }
    }
  };

  const deleteWord = async (id: string) => {
    const res = await deleteRemoteWord(id);
    if (res.success) {
      setWords((words) => {
        const newState = { ...words };
        delete newState[id];
        return newState;
      });
    }
  };

  const saveWordTag = async (args: { language: string; label: string }) => {
    const res = await saveNewWordTag(args);
    if (res.success) {
      setWordTags((wordTags) => updateCacheWithNewWordTags(wordTags, [res.data]));
      return res.data;
    }
  };

  return (
    <WordContext.Provider value={{ words, wordTags, isLoadingWords, wordLoadError, saveWord, deleteWord, saveWordTag }}>
      {children}
    </WordContext.Provider>
  );
};
