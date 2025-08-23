import React, { useEffect, useRef, useState } from "react";
import { Conversation } from "../types";
import { REVIEW_ITEM_DELAY } from "../constants";

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
  const touchStartY = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchend", handleTouchEnd);

    if (timer.current) clearTimeout(timer.current);
    if (!timeIsUp) {
      timer.current = setTimeout(function () {
        setTimeIsUp(true);
      }, REVIEW_ITEM_DELAY);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [currentSentenceNumber, timeIsUp]);

  const handleTouchStart = (e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartY.current === null) return;

    touchEndY.current = e.changedTouches[0].clientY;
    const diffY = touchStartY.current - touchEndY.current;

    // Detect swipe up (minimum distance of 50px and minimum velocity)
    if (diffY > 50) {
      handleSwipeUp();
    }

    // Reset touch coordinates
    touchStartY.current = null;
    touchEndY.current = null;
  };

  const handleSwipeUp = () => {
    handleAdvance();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowRight":
        handleAdvance();
        break;
      default:
    }
  };

  const handleAdvance = () => {
    if (timeIsUp || (!timeIsUp && conversationIsCompleted())) {
      const success = !timeIsUp;
      setTimeIsUp(false);
      setCurrentSentenceNumber(0);
      nextConversation(success);
    } else {
      nextSentence();
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
