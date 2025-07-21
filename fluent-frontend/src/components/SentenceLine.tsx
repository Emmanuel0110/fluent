import { Sentence } from "../types";

export const SentenceLine = ({
  multiLingualSentence,
  sentenceIndex,
}: {
  multiLingualSentence: { sourceLanguage: Sentence; targetLanguage: Sentence };
  sentenceIndex: number;
}) => {
  const { sourceLanguage, targetLanguage } = multiLingualSentence;

  return (
    <div className={"lineTitle " + (sentenceIndex % 2 === 0 ? "alignLeft" : "alignRight")}>
      <div className="sourceLanguage">{sourceLanguage.text}</div>
      <div className="targetLanguage">{targetLanguage.text}</div>
    </div>
  );
};
