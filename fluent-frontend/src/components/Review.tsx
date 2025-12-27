import React, { useContext, useEffect } from "react";
import { ConfigContext } from "../contexts/ConfigContext";
import { Context, RowConversation } from "../types";
import { getReviewList, updateRemoteConversationReviewStatus } from "../APICalls";
import { useLanguage } from "../contexts/LanguageContext";
import { updateCacheWithNewConversations } from "../utils/conversationUtils";
import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import ReviewItem from "./ReviewItem";

function Review() {
  const { targetLanguage } = useLanguage();
  const { reviewList, setReviewList } = useContext(ConfigContext) as Context;
  const navigate = useNavigate();

  useEffect(() => {
    fetchNewReviewItems();
  }, []);

  const nextConversation = async (successArray: boolean[]): Promise<void> => {
    const currentConversation = reviewList[0];
    if (successArray.every((success) => success)) {
      setReviewList((reviewList) => reviewList.slice(1));
      await updateRemoteConversationReviewStatus(currentConversation._id, successArray);
      if (reviewList.length <= 1) fetchNewReviewItems();
    } else {
      setReviewList((reviewList) => [...reviewList.slice(1), currentConversation]);
    }
  };

  const fetchNewReviewItems = () => {
    getReviewList().then((newReviewList: RowConversation[]) => {
      if (newReviewList.length) {
        setReviewList((reviewList) =>
          updateCacheWithNewConversations(reviewList, newReviewList, targetLanguage).map((reviewItem) => ({
            ...reviewItem,
            multiLingualSentences: reviewItem.multiLingualSentences.map((multiLingualSentence) => ({
              ...multiLingualSentence,
              success: true,
            })),
          }))
        );
      }
    });
  };

  return reviewList.length === 0 ? (
    <div>
      <div id="nothingToReview">Nothing to review</div>
      <div className="hcenter">
        <Button onClick={() => navigate("/suggestions")}>See suggestions</Button>
      </div>
    </div>
  ) : (
    <ReviewItem conversation={reviewList[0]} nextConversation={nextConversation} />
  );
}

export default Review;
