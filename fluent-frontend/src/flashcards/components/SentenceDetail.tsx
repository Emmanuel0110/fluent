import { useContext, useState } from "react";
import { ConfigContext } from "../../App";
import { Context, Sentence } from "../../types";
import { WordLine } from "./WordLine";

export default function SentenceDetail({
  multiLingualSentence: { sourceLanguage: sourceSentence, targetLanguage: targetSentence },
}: {
  multiLingualSentence: {
    sourceLanguage: Sentence;
    targetLanguage: Sentence;
  };
}) {
  const { words } = useContext(ConfigContext) as Context;
  const [isTargetSentenceSelected, setIsTargetSentenceSelected] = useState(false);
  return (
    <div id="flashCardComponent">
      <div id="flashcard">
        <div id="middle">
          <div onClick={() => setIsTargetSentenceSelected(false)}>{sourceSentence.text}</div>
          <div onClick={() => setIsTargetSentenceSelected(true)}>{targetSentence.text}</div>
          {sourceSentence.prerequisites.length > 0 && !isTargetSentenceSelected && (
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
      </div>
    </div>
  );
}
