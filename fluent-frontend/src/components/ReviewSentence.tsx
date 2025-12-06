import React, { useContext } from "react";
import { Context, Conversation } from "../types";
import { ConfigContext } from "../contexts/ConfigContext";

interface ReviewSentenceProps {
  index: number;
  currentSentenceNumber: number;
  success: boolean;
  conversation: Conversation;
}

function ReviewSentence({ index, currentSentenceNumber, success, conversation }: ReviewSentenceProps) {
  const { openConversation } = useContext(ConfigContext) as Context;

  const handleSentenceClick = (sentenceIndex: number, sourceOrTarget: "source" | "target") => {
    if (sentenceIndex <= currentSentenceNumber || !success)
      openConversation(conversation._id, sentenceIndex, sourceOrTarget);
  };

  return (
    <div className={index <= currentSentenceNumber || !success ? "green" : "gray"}>
      <div
        className={index <= currentSentenceNumber || !success ? "clickable-sentence" : ""}
        onClick={() => handleSentenceClick(index, "source")}
      >
        {conversation.multiLingualSentences[index].sourceLanguage.text}
      </div>
      <div className="translationSpaceholder">
        {!success && (
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
