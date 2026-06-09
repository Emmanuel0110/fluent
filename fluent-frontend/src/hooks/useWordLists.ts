import { useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useData } from "../contexts/DataContext";
import { Word } from "../types";

const getWordList = (words: { [key: string]: Word }, language: string) =>
  Object.values(words)
    .filter((word) => word.language === language)
    .map(({ _id, text }) => ({ _id, label: text }));

export function useWordLists() {
  const { sourceLanguage, targetLanguage } = useLanguage();
  const { words } = useData();

  return useMemo(
    () => ({
      sourceWords: getWordList(words, sourceLanguage),
      targetWords: getWordList(words, targetLanguage),
    }),
    [words, sourceLanguage, targetLanguage],
  );
}
