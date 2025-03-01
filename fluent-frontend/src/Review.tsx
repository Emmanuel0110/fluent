import React, { useContext, useEffect } from "react";
import { ConfigContext, updateCacheWithNewConversations } from "./App";
import { Context } from "./types";
import { getReviewList } from "./flashcards/flashcardActions";
import ReviewItemComponent from "./ReviewItemComponent";

function Review() {
  const { reviewList, setReviewList, targetLanguage, updateConversationReviewStatus } = useContext(ConfigContext) as Context;

  useEffect(() => {
    getReviewList().then((newReviewList: any) =>
      setReviewList((reviewList) => updateCacheWithNewConversations(reviewList, newReviewList, targetLanguage))
    );
  }, []);

  const nextConversation = (success: boolean): void => {
    const currenConversation = reviewList[0];
    setReviewList((reviewList) => (success ? reviewList.slice(1) : [...reviewList.slice(1), currenConversation]));
    updateConversationReviewStatus(currenConversation, success);
  };

  return reviewList.length === 0 ? (
    <div>Nothing to review</div>
  ) : (
    <div>
      <ReviewItemComponent conversation={reviewList[0]} nextConversation={nextConversation} />
    </div>
  );
}

export default Review;
