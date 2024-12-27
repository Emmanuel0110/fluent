import { useParams } from "react-router-dom";
import { Flashcard, Sentence, Word } from "../../types";
import { Fragment, useContext, useEffect, useRef } from "react";
import { ConfigContext } from "../../App";
import { Context } from "../../types";

export const SentenceLine = ({
  multiLingualSentence,
}: {
  multiLingualSentence: { sourceLanguage: Sentence};
}) => {
  const { sourceLanguage } = multiLingualSentence;
  return <div className={"lineTitle"}>{sourceLanguage.text}</div>;
};
