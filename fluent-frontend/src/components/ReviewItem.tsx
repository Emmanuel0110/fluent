import React, { useEffect, useRef, useState, useCallback } from "react";
import { ReviewItem as ReviewItemType } from "../types";
import { useReviewSettings } from "../contexts/ReviewSettingsContext";
import ReviewSentence from "./ReviewSentence";
import { useSwipeAndKeyboard } from "../hooks/useSwipeAndKeyboard";
import "./ReviewItemComponent.css";

function ReviewItem({
  conversation,
  nextConversation,
}: {
  conversation: ReviewItemType;
  nextConversation: (successArray: boolean[]) => void;
}) {
  const { getReviewDelay, shouldShowAnswerAutomatically } = useReviewSettings();
  const isAutoMode = shouldShowAnswerAutomatically();

  const [answersRevealed, setAnswersRevealed] = useState(conversation.multiLingualSentences.map((sentence) => false));
  const [currentSentenceNumber, setCurrentSentenceNumber] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleAdvance = useCallback(() => {
    const numberOfSentences = conversation.multiLingualSentences.length;
    const isCompleted = currentSentenceNumber >= numberOfSentences - 1;

    if (isCompleted) {
      const successArr = conversation.multiLingualSentences.map((sentence) => sentence.success);
      setCurrentSentenceNumber(0);
      nextConversation(successArr);
    } else {
      setCurrentSentenceNumber((n) => n + 1);
    }
  }, [answersRevealed, currentSentenceNumber, conversation.multiLingualSentences.length, nextConversation]);

  useSwipeAndKeyboard({
    callback: handleAdvance,
    dependencies: [currentSentenceNumber, answersRevealed],
  });

  useEffect(() => {
    setAnswersRevealed(conversation.multiLingualSentences.map((sentence) => false));
  }, [conversation]);

  // Timer effect for auto-revealing answers (only in auto mode)
  useEffect(() => {
    if (!isAutoMode) return;

    if (timer.current) clearTimeout(timer.current);
    if (!answersRevealed[currentSentenceNumber]) {
      const delay = getReviewDelay();
      if (delay > 0) {
        timer.current = setTimeout(() => {
          handleRevealAnswer();
        }, delay);
      }
    }
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [currentSentenceNumber, answersRevealed, isAutoMode, getReviewDelay]);

  const handleRevealAnswer = () => {
    setAnswersRevealed(answersRevealed.map((answer, index) => (index === currentSentenceNumber ? true : answer)));
    conversation.multiLingualSentences[currentSentenceNumber].success = false;
  };

  return (
    <div id="reviewItem">
      <div id="reviewSentences">
        {conversation.multiLingualSentences.map((_, index) => (
          <ReviewSentence
            key={index}
            index={index}
            currentSentenceNumber={currentSentenceNumber}
            answerRevealed={answersRevealed[index]}
            conversation={conversation}
          />
        ))}
      </div>
      {!isAutoMode && !answersRevealed[currentSentenceNumber] && (
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
