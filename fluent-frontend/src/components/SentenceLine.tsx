import { Sentence } from "../types";
import { TextToSpeech } from "./textToSpeech/TextToSpeech";
import { useLanguage } from "../contexts/LanguageContext";

export const SentenceLine = ({
  multiLingualSentence,
  sentenceIndex,
}: {
  multiLingualSentence: { sourceLanguage: Sentence; targetLanguage: Sentence };
  sentenceIndex: number;
}) => {
  const { sourceLanguage, targetLanguage } = multiLingualSentence;
  const { targetLanguage: targetLangId, getLanguageLabel } = useLanguage();

  return (
    <div className={"lineTitle " + (sentenceIndex % 2 === 0 ? "alignLeft" : "alignRight")}>
      <div className="sourceLanguage">{sourceLanguage.text}</div>
      <div className="targetLanguage">
        {targetLanguage.text}
        <TextToSpeech text={targetLanguage.text} language={getLanguageLabel(targetLangId)} />
      </div>
    </div>
  );
};
