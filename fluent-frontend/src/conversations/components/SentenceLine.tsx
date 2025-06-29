import { Sentence } from "../../types";

export const SentenceLine = ({
  multiLingualSentence,
  sentenceIndex,
}: {
  multiLingualSentence: { sourceLanguage: Sentence };
  sentenceIndex: number;
}) => {
  const { sourceLanguage } = multiLingualSentence;

  return (
    <div className={"lineTitle " + (sentenceIndex % 2 === 0 ? "alignLeft" : "alignRight")}>{sourceLanguage.text}</div>
  );
};
