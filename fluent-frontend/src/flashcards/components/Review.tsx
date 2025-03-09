import React, { useContext, useEffect } from "react";
import { ConfigContext, updateCacheWithNewConversations } from "../../App";
import { Context, Conversation } from "../../types";
import { getReviewList } from "../flashcardActions";
import ReviewItemComponent from "./ReviewItemComponent";

function Review() {
  const { reviewList, setReviewList, targetLanguage, updateConversationReviewStatus } = useContext(
    ConfigContext
  ) as Context;

  useEffect(() => {
    getReviewList().then((newReviewList: Conversation[]) =>
      setReviewList((reviewList) =>
        updateCacheWithNewConversations(reviewList, newReviewList, targetLanguage).map((reviewItem) => ({
          ...reviewItem,
          alreadyFailed: false,
        }))
      )
    );
  }, []);

  const nextConversation = (success: boolean): void => {
    const currenConversation = reviewList[0];
    if (success) {
      setReviewList((reviewList) => reviewList.slice(1));
      updateConversationReviewStatus(currenConversation);
    } else {
      currenConversation.alreadyFailed = true;
      setReviewList((reviewList) => [...reviewList.slice(1), currenConversation]);
    }
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
