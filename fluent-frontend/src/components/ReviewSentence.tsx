import React, { useContext } from "react";
import { Context, Conversation } from "../types";
import { ConfigContext } from "../contexts/ConfigContext";

interface ReviewSentenceProps {
  index: number;
  currentSentenceNumber: number;
  answerRevealed: boolean;
  conversation: Conversation;
}

function ReviewSentence({ index, currentSentenceNumber, answerRevealed, conversation }: ReviewSentenceProps) {
  const { openConversation } = useContext(ConfigContext) as Context;

  const handleSentenceClick = (sentenceIndex: number, sourceOrTarget: "source" | "target") => {
    if (answerRevealed) openConversation(conversation._id, sentenceIndex, sourceOrTarget);
  };

  return (
    <div className={index <= currentSentenceNumber ? "green" : "gray"}>
      <div className={answerRevealed ? "clickable-sentence" : ""} onClick={() => handleSentenceClick(index, "source")}>
        {conversation.multiLingualSentences[index].sourceLanguage.text}
      </div>
      <div className="translationSpaceholder">
        {answerRevealed && (
          <div className="clickable-sentence bold" onClick={() => handleSentenceClick(index, "target")}>
            {conversation.multiLingualSentences[index].targetLanguage.text}
          </div>
        )}
      </div>
      <br />
    </div>
  );
}

export default ReviewSentence;
