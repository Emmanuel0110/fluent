import React, { useEffect, useRef, useState, useCallback } from "react";
import { Conversation } from "../types";
import { useReviewSettings } from "../contexts/ReviewSettingsContext";
import ReviewSentence from "./ReviewSentence";
import { useSwipeAndKeyboard } from "../hooks/useSwipeAndKeyboard";
import "./ReviewItemComponent.css";

function ReviewItem({
  conversation,
  nextConversation,
}: {
  conversation: Conversation;
  nextConversation: (success: boolean) => void;
}) {
  const { getReviewDelay, shouldShowAnswerAutomatically } = useReviewSettings();
  const isAutoMode = shouldShowAnswerAutomatically();

  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [currentSentenceNumber, setCurrentSentenceNumber] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAdvance = useCallback(() => {
    const numberOfSentences = conversation.multiLingualSentences.length;
    const isCompleted = currentSentenceNumber >= numberOfSentences - 1;

    if (isAnswerRevealed || isCompleted) {
      const success = !isAnswerRevealed;
      setIsAnswerRevealed(false);
      setCurrentSentenceNumber(0);
      nextConversation(success);
    } else {
      setCurrentSentenceNumber((n) => n + 1);
    }
  }, [isAnswerRevealed, currentSentenceNumber, conversation.multiLingualSentences.length, nextConversation]);

  useSwipeAndKeyboard({
    onAdvance: handleAdvance,
    dependencies: [currentSentenceNumber, isAnswerRevealed],
  });

  // Timer effect for auto-revealing answers (only in auto mode)
  useEffect(() => {
    if (!isAutoMode) return;

    if (timer.current) clearTimeout(timer.current);
    if (!isAnswerRevealed) {
      const delay = getReviewDelay();
      if (delay > 0) {
        timer.current = setTimeout(() => {
          setIsAnswerRevealed(true);
        }, delay);
      }
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [currentSentenceNumber, isAnswerRevealed, isAutoMode, getReviewDelay]);

  const handleRevealAnswer = () => {
    setIsAnswerRevealed(true);
  };

  return (
    <div id="reviewItem">
      <div id="reviewSentences">
        {conversation.multiLingualSentences.map((_, index) => (
          <ReviewSentence
            key={index}
            index={index}
            currentSentenceNumber={currentSentenceNumber}
            success={!isAnswerRevealed}
            conversation={conversation}
          />
        ))}
      </div>
      {!isAutoMode && !isAnswerRevealed && (
        <div className="reveal-answer-container">
          <button onClick={handleRevealAnswer} className="reveal-answer-btn">
            Reveal Answer
          </button>
        </div>
      )}
    </div>
  );
}

export default ReviewItem;
