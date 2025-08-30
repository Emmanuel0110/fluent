import React, { useEffect, useRef, useState, useContext } from "react";
import { Conversation } from "../types";
import { useReviewSettings } from "../contexts/ReviewSettingsContext";
import { ConfigContext } from "../contexts/ConfigContext";
import { Context } from "../types";
import "./ReviewItemComponent.css";

function ReviewItemComponent({
  conversation,
  nextConversation,
}: {
  conversation: Conversation;
  nextConversation: (success: boolean) => void;
}) {
  const { getReviewDelay, shouldShowAnswerAutomatically } = useReviewSettings();
  const { openConversation } = useContext(ConfigContext) as Context;
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
    if (!timeIsUp && shouldShowAnswerAutomatically()) {
      const delay = getReviewDelay();
      if (delay > 0) {
        timer.current = setTimeout(function () {
          setTimeIsUp(true);
        }, delay);
      }
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

  const handleRevealAnswer = () => {
    if (!timeIsUp) {
      setTimeIsUp(true);
    }
  };

  const handleSentenceClick = (sentenceIndex: number) => {
    // Navigate to the conversation and open the specific sentence
    openConversation(conversation._id);
    // The sentence will be visible in the conversation detail view
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
            <div
              className="clickable-sentence"
              onClick={() => handleSentenceClick(index)}
              style={{ cursor: "pointer" }}
            >
              {sourceLanguage.text}
            </div>
            <div className="translationSpaceholder">
              {timeIsUp && (
                <div
                  className="clickable-sentence"
                  onClick={() => handleSentenceClick(index)}
                  style={{ cursor: "pointer" }}
                >
                  {targetLanguage.text}
                </div>
              )}
            </div>
            <br />
          </div>
        ))}
      {!timeIsUp && !shouldShowAnswerAutomatically() && (
        <div className="reveal-answer-container">
          <button onClick={handleRevealAnswer} className="reveal-answer-btn">
            Reveal Answer
          </button>
        </div>
      )}
    </div>
  );
}

export default ReviewItemComponent;
