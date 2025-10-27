import React, { useContext, useEffect } from "react";
import { ConfigContext } from "../contexts/ConfigContext";
import { Context, RowConversation } from "../types";
import { getReviewList, getSuggestions } from "../APICalls";
import ReviewItemComponent from "./ReviewItemComponent";
import { useLanguage } from "../contexts/LanguageContext";
import { useData } from "../contexts/DataContext";
import { formatConversations, updateCacheWithNewConversations } from "../utils/conversationUtils";
import { ConversationLine } from "./ConversationLine";

function Review() {
  const { targetLanguage } = useLanguage();
  const { updateConversationReviewStatus } = useData();
  const { reviewList, setReviewList, suggestions, setSuggestions } = useContext(ConfigContext) as Context;

  useEffect(() => fetchNewReviewItems(), []);

  const nextConversation = async (success: boolean): Promise<void> => {
    const currentConversation = reviewList[0];
    if (success) {
      setReviewList((reviewList) => reviewList.slice(1));
      await updateConversationReviewStatus(currentConversation);
      if (reviewList.length <= 1) {
        fetchNewReviewItems();
        if (!suggestions.length)
          getSuggestions().then((suggestions) => setSuggestions(formatConversations(suggestions, targetLanguage)));
      }
    } else {
      currentConversation.alreadyFailed = true;
      setReviewList((reviewList) => [...reviewList.slice(1), currentConversation]);
    }
  };

  const fetchNewReviewItems = () => {
    getReviewList().then((newReviewList: RowConversation[]) =>
      setReviewList((reviewList) =>
        updateCacheWithNewConversations(reviewList, newReviewList, targetLanguage).map((reviewItem) => ({
          ...reviewItem,
          alreadyFailed: false,
        }))
      )
    );
  };

  return reviewList.length === 0 ? (
    suggestions.length === 0 ? (
      <div id="nothingToReview">Nothing to review</div>
    ) : (
      <div id="conversationList">
        {suggestions.map((conversation, index) => (
          <ConversationLine key={index} conversation={conversation} />
        ))}
      </div>
    )
  ) : (
    <ReviewItemComponent conversation={reviewList[0]} nextConversation={nextConversation} />
  );
}

export default Review;
