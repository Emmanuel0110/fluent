import React, { useContext, useEffect, useRef, useCallback } from "react";
import { ReviewItem as ReviewItemType, Context } from "../types";
import { ConfigContext } from "../contexts/ConfigContext";
import { useReviewSettings } from "../contexts/ReviewSettingsContext";
import ReviewSentence from "./ReviewSentence";
import { useSwipeAndKeyboard } from "../hooks/useSwipeAndKeyboard";
import "./ReviewItemComponent.css";
import { useTranslation } from "react-i18next";

function ReviewItem({
  conversation,
  nextConversation,
}: {
  conversation: ReviewItemType;
  nextConversation: (successArray: boolean[], answersRevealed: boolean[]) => void;
}) {
  const { t } = useTranslation();
  const { getReviewDelay, shouldShowAnswerAutomatically } = useReviewSettings();
  const isAutoMode = shouldShowAnswerAutomatically();
  const { reviewProgress, setReviewProgress } = useContext(ConfigContext) as Context;

  // Progress is stored in the context (not local state) so it survives unmounting
  // when the user navigates to another page and comes back to the review.
  const isCurrent = reviewProgress.conversationId === conversation._id;
  const currentSentenceNumber = isCurrent ? reviewProgress.currentSentenceNumber : 0;
  const answersRevealed = isCurrent
    ? reviewProgress.answersRevealed
    : conversation.multiLingualSentences.map(() => false);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setCurrentSentenceNumber = useCallback(
    (n: number) => setReviewProgress((progress) => ({ ...progress, currentSentenceNumber: n })),
    [setReviewProgress],
  );

  const setAnswersRevealed = useCallback(
    (revealed: boolean[]) => setReviewProgress((progress) => ({ ...progress, answersRevealed: revealed })),
    [setReviewProgress],
  );

  const handleAdvance = useCallback(() => {
    const numberOfSentences = conversation.multiLingualSentences.length;
    const isCompleted = currentSentenceNumber >= numberOfSentences - 1;

    if (isCompleted) {
      const successArr = conversation.multiLingualSentences.map((sentence) => sentence.success);
      // Reset for the (possibly re-queued) conversation; the effect below re-inits when a different one comes up.
      setReviewProgress({
        conversationId: conversation._id,
        currentSentenceNumber: 0,
        answersRevealed: conversation.multiLingualSentences.map(() => false),
      });
      nextConversation(successArr, answersRevealed);
    } else {
      setCurrentSentenceNumber(currentSentenceNumber + 1);
    }
  }, [
    answersRevealed,
    currentSentenceNumber,
    conversation._id,
    conversation.multiLingualSentences,
    nextConversation,
    setCurrentSentenceNumber,
    setReviewProgress,
  ]);

  useSwipeAndKeyboard({
    callback: handleAdvance,
    dependencies: [currentSentenceNumber, answersRevealed],
  });

  // Initialise progress whenever a different conversation comes up for review.
  useEffect(() => {
    if (reviewProgress.conversationId !== conversation._id) {
      setReviewProgress({
        conversationId: conversation._id,
        currentSentenceNumber: 0,
        answersRevealed: conversation.multiLingualSentences.map(() => false),
      });
    }
  }, [conversation, reviewProgress.conversationId, setReviewProgress]);

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
      {!isAutoMode && (
        <div className="reveal-answer-container">
          {!answersRevealed[currentSentenceNumber] && (
            <button onClick={handleRevealAnswer} className="reveal-answer-btn">
              {t("review.reveal")}
            </button>
          )}
          <button onClick={handleAdvance} className="next-btn">
            {t("review.next")}
          </button>
        </div>
      )}
    </div>
  );
}

export default ReviewItem;
