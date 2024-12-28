import { Sentence } from "../../types";

export const SentenceLine = ({
  multiLingualSentence,
}: {
  multiLingualSentence: { sourceLanguage: Sentence};
}) => {
  const { sourceLanguage } = multiLingualSentence;
  return <div className={"lineTitle"}>{sourceLanguage.text}</div>;
};
