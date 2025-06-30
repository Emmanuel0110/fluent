import { useState } from "react";
import { Sentence } from "../../types";
import { WordLine } from "./WordLine";
import { useData } from "../../contexts/DataContext";

export default function SentenceDetail({
  multiLingualSentence: { sourceLanguage: sourceSentence, targetLanguage: targetSentence },
}: {
  multiLingualSentence: {
    sourceLanguage: Sentence;
    targetLanguage: Sentence;
  };
}) {
  const { words } = useData();
  const [isTargetSentenceSelected, setIsTargetSentenceSelected] = useState(false);
  const [isSourceSentenceSelected, setIsSourceSentenceSelected] = useState(false);

  const handleSourceSentenceClick = () => {
    if (isSourceSentenceSelected) {
      setIsSourceSentenceSelected(false);
    } else {
      setIsSourceSentenceSelected(true);
      setIsTargetSentenceSelected(false);
    }
  };

  const handleTargetSentenceClick = () => {
    if (isTargetSentenceSelected) {
      setIsTargetSentenceSelected(false);
    } else {
      setIsTargetSentenceSelected(true);
      setIsSourceSentenceSelected(false);
    }
  };

  return (
    <div>
      <div className="sourceLanguage" onClick={handleSourceSentenceClick}>
        {sourceSentence.text}
      </div>
      <div className="targetLanguage" onClick={handleTargetSentenceClick}>
        {targetSentence.text}
      </div>
      {sourceSentence.prerequisites.length > 0 && isSourceSentenceSelected && (
        <div id="sourcePrerequisites">
          {sourceSentence.prerequisites.map((wordId, index) =>
            words[wordId] ? <WordLine key={index} word={words[wordId]} /> : null
          )}
        </div>
      )}
      {targetSentence.prerequisites.length > 0 && isTargetSentenceSelected && (
        <div id="targetPrerequisites">
          {targetSentence.prerequisites.map((wordId, index) =>
            words[wordId] ? <WordLine key={index} word={words[wordId]} /> : null
          )}
        </div>
      )}
    </div>
  );
}
