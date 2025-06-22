import { useParams } from "react-router-dom";
import { Conversation } from "../../types";
import { useContext, useEffect, useRef } from "react";
import { ConfigContext } from "../../App";
import { Context } from "../../types";
import { SentenceLine } from "./SentenceLine";
import { useData } from "../../contexts/DataContext";

export const ConversationLine = ({ conversation }: { conversation: Conversation }) => {
  const { conversationId } = useParams();
  const { deleteConversation, subscribeToConversation } = useData();
  const { openConversation, editConversation } = useContext(ConfigContext) as Context;

  const onEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    editConversation(conversation._id);
  };

  const onSubscribe = (e: React.MouseEvent) => {
    e.stopPropagation();
    subscribeToConversation(conversation);
  };

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteConversation(conversation._id);
  };

  const lineRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const { current } = lineRef;
    if (current !== null && conversation._id === conversationId) {
      current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [conversationId]);

  return (
    <div
      ref={lineRef}
      className={"line" + (conversation._id === conversationId ? " selectedFlashcard" : "")}
      onClick={() => openConversation(conversation._id)}
    >
      {conversation.multiLingualSentences.map((multiLingualSentence, index) => (
        <SentenceLine key={index} multiLingualSentence={multiLingualSentence} />
      ))}
      <div className="lineOptions">
        <div className={"subscribe" + (conversation.subscribed ? " subscribed" : "")} onClick={onSubscribe}></div>
        <div className="edit" onClick={onEdit}></div>
        <div className="delete" onClick={onDelete}></div>
      </div>
    </div>
  );
};
