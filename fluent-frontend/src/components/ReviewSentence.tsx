import React, { useContext } from "react";
import { Context, Conversation } from "../types";
import { ConfigContext } from "../contexts/ConfigContext";
import { TextToSpeech } from "./textToSpeech/TextToSpeech";
import { useLanguage } from "../contexts/LanguageContext";

interface ReviewSentenceProps {
  index: number;
  currentSentenceNumber: number;
  answerRevealed: boolean;
  conversation: Conversation;
}

function ReviewSentence({ index, currentSentenceNumber, answerRevealed, conversation }: ReviewSentenceProps) {
  const { openConversation } = useContext(ConfigContext) as Context;
  const { targetLanguage, getLanguageLabel } = useLanguage();

  const handleSentenceClick = (sentenceIndex: number, sourceOrTarget: "source" | "target") => {
    if (answerRevealed) openConversation(conversation._id, sentenceIndex, sourceOrTarget);
  };

  const targetText = conversation.multiLingualSentences[index].targetLanguage.text;

  return (
    <div className={index <= currentSentenceNumber ? "green" : "gray"}>
      <div className="clickable-sentence" onClick={() => handleSentenceClick(index, "source")}>
        {conversation.multiLingualSentences[index].sourceLanguage.text}
      </div>
      <div className={answerRevealed ? "" : "hidden"}>
        <div className="clickable-sentence bold" onClick={() => handleSentenceClick(index, "target")}>
          {targetText}
          {answerRevealed && <TextToSpeech text={targetText} language={getLanguageLabel(targetLanguage)} />}
        </div>
      </div>
    </div>
  );
}

export default ReviewSentence;
