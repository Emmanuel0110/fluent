import React, { useEffect, useRef, useState } from "react";
import { Conversation } from "../../types";
import { REVIEW_ITEM_DELAY } from "../../constants";

function ReviewItemComponent({
  conversation,
  nextConversation,
}: {
  conversation: Conversation;
  nextConversation: (success: boolean) => void;
}) {
  const [timeIsUp, setTimeIsUp] = useState(false);
  const [currentSentenceNumber, setCurrentSentenceNumber] = useState(0);
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    if (timer.current) clearTimeout(timer.current);
    if (!timeIsUp) {
      timer.current = setTimeout(function () {
        setTimeIsUp(true);
      }, REVIEW_ITEM_DELAY);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [currentSentenceNumber, timeIsUp]);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowRight":
        if (timeIsUp || (!timeIsUp && conversationIsCompleted())) {
          const success = !timeIsUp;
          setTimeIsUp(false);
          setCurrentSentenceNumber(0);
          nextConversation(success);
        } else {
          nextSentence();
        }
        break;
      default:
    }
  };
  const conversationIsCompleted = () => {
    const numberOfSentences = conversation.multiLingualSentences.length;
    return currentSentenceNumber >= numberOfSentences - 1;
  };
  const nextSentence = () => {
    setCurrentSentenceNumber((n) => n + 1);
  };
  return (
    <div id="reviewItem">
      {conversation.multiLingualSentences
        .slice(0, currentSentenceNumber + 1)
        .map(({ sourceLanguage, targetLanguage }, index) => (
          <div key={index}>
            <div>{sourceLanguage.text}</div>
            <div className="translationSpaceholder">{timeIsUp && <div>{targetLanguage.text}</div>}</div>
            <br />
          </div>
        ))}
    </div>
  );
}

export default ReviewItemComponent;
