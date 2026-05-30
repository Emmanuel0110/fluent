import { useState } from "react";
import { Sentence } from "../types";
import { WordLine } from "./WordLine";
import { useData } from "../contexts/DataContext";
import { useLanguage } from "../contexts/LanguageContext";
import { TextToSpeech } from "./textToSpeech/TextToSpeech";
import { useSearchParams } from "react-router-dom";

export default function SentenceDetail({
  index,
  multiLingualSentence: { sourceLanguage: sourceSentence, targetLanguage: targetSentence },
}: {
  index: number;
  multiLingualSentence: {
    sourceLanguage: Sentence;
    targetLanguage: Sentence;
  };
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { words } = useData();
  const { targetLanguage, getLanguageLabel } = useLanguage();

  const handleSourceSentenceClick = () => {
    setSearchParams({ index: index.toString(), language: "source" });
  };

  const handleTargetSentenceClick = () => {
    setSearchParams({ index: index.toString(), language: "target" });
  };

  return (
    <div>
      <div className="sourceLanguage" onClick={handleSourceSentenceClick}>
        {sourceSentence.text}
      </div>
      <div className="targetLanguage" onClick={handleTargetSentenceClick}>
        {targetSentence.text}
        <TextToSpeech text={targetSentence.text} language={getLanguageLabel(targetLanguage)} />
      </div>
      {sourceSentence.prerequisites.length > 0 &&
        searchParams.get("index") === index.toString() &&
        searchParams.get("language") === "source" && (
          <div id="sourcePrerequisites">
            {sourceSentence.prerequisites.map((wordId, index) =>
              words[wordId] ? <WordLine key={index} word={words[wordId]} readonly /> : null,
            )}
          </div>
        )}
      {targetSentence.prerequisites.length > 0 &&
        searchParams.get("index") === index.toString() &&
        searchParams.get("language") === "target" && (
          <div id="targetPrerequisites">
            {targetSentence.prerequisites.map((wordId, index) =>
              words[wordId] ? <WordLine key={index} word={words[wordId]} readonly /> : null,
            )}
          </div>
        )}
    </div>
  );
}
