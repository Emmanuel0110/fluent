import { useContext, useMemo } from "react";
import { Context } from "../types";
import FilterBar from "./FilterBar";
import { WordLine } from "./WordLine";
import { ConfigContext } from "../contexts/ConfigContext";
import { useLanguage } from "../contexts/LanguageContext";
import { FlagIcon } from "../utils/FlagIcon";

export default function WordList({ selectedWordId }: { selectedWordId?: string }) {
  const { filteredWords } = useContext(ConfigContext) as Context;
  const { sourceLanguage, targetLanguage, getLanguageLabel } = useLanguage();

  const sourceWords = useMemo(
    () => filteredWords.filter((w) => w.language === sourceLanguage),
    [filteredWords, sourceLanguage],
  );
  const targetWords = useMemo(
    () => filteredWords.filter((w) => w.language === targetLanguage),
    [filteredWords, targetLanguage],
  );

  const sourceLabel = getLanguageLabel(sourceLanguage);
  const targetLabel = getLanguageLabel(targetLanguage);

  return (
    <div style={{ height: "100%", overflow: "auto" }}>
      <FilterBar />
      <div id="wordList">
        {sourceWords.length > 0 && (
          <>
            <div className="word-list-section-header">
              <FlagIcon languageLabel={sourceLabel} />
              <span className="word-list-section-arrow">→</span>
              <FlagIcon languageLabel={targetLabel} />
            </div>
            {sourceWords.map((word) => (
              <WordLine key={word._id} word={word} isSelected={word._id === selectedWordId} />
            ))}
          </>
        )}
        {targetWords.length > 0 && (
          <>
            <div className="word-list-section-header">
              <FlagIcon languageLabel={targetLabel} />
              <span className="word-list-section-arrow">→</span>
              <FlagIcon languageLabel={sourceLabel} />
            </div>
            {targetWords.map((word) => (
              <WordLine key={word._id} word={word} isSelected={word._id === selectedWordId} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
