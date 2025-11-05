import { useParams } from "react-router-dom";
import { Conversation } from "../types";
import { useContext, useEffect, useRef } from "react";
import { ConfigContext } from "../contexts/ConfigContext";
import { Context } from "../types";
import { SentenceLine } from "./SentenceLine";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";

export const ConversationLine = ({ conversation }: { conversation: Conversation }) => {
  const { user } = useAuth();
  const { conversationId, wordId } = useParams();
  const { deleteConversation, subscribeToConversation, unsubscribeToConversation } = useData();
  const { openConversation, editConversation } = useContext(ConfigContext) as Context;

  //When inside a WordDetail page, we want to filter the conversations to only show the one that contains the word
  if (wordId) {
    conversation = {
      ...conversation,
      multiLingualSentences: conversation.multiLingualSentences.filter(
        (multiLingualSentence) =>
          multiLingualSentence.sourceLanguage.prerequisites.includes(wordId) ||
          multiLingualSentence.targetLanguage.prerequisites.includes(wordId)
      ),
    };
  }

  const onEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    editConversation(conversation._id);
  };

  const handleSubscribe = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (conversation.subscribed) {
      unsubscribeToConversation(conversation);
    } else {
      subscribeToConversation(conversation);
    }
  };

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation(conversation._id);
  };

  const lineRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const { current } = lineRef;
    if (current !== null && conversation._id === conversationId) {
      current.scrollIntoView({ block: "nearest" });
    }
  }, [conversationId]);

  return (
    <div
      ref={lineRef}
      className={"line" + (conversation._id === conversationId ? " selectedLine" : "")}
      onClick={() => openConversation(conversation._id)}
    >
      <div className="sentenceLines">
        {conversation.multiLingualSentences.map((multiLingualSentence, index) => (
          <SentenceLine key={index} sentenceIndex={index} multiLingualSentence={multiLingualSentence} />
        ))}
      </div>
      <div className="lineOptions">
        <div className={"subscribe" + (conversation.subscribed ? " subscribed" : "")} onClick={handleSubscribe}></div>
        {user?.isAdmin && (
          <>
            <div className="edit" onClick={onEdit}></div>
            <div className="delete" onClick={onDelete}></div>
          </>
        )}
      </div>
    </div>
  );
};
