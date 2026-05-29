import { useContext } from "react";
import { ConfigContext } from "../contexts/ConfigContext";
import { Context, Conversation } from "../types";
import SentenceDetail from "./SentenceDetail";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ConversationDetail({ conversation }: { conversation: Conversation }) {
  const { subscribeToConversation, unsubscribeToConversation, conversationTags } = useData();
  const { editConversation, setConversationTagFilter } = useContext(ConfigContext) as Context;
  const { user } = useAuth();
  const navigate = useNavigate();

  const searchTag = (tagId: string) => {
    const tag = conversationTags.find(({ _id }) => _id === tagId);
    if (tag) {
      setConversationTagFilter(tag);
      navigate("/conversations");
    }
  };

  const handleSubscribe = () => {
    if (conversation.subscribed) {
      unsubscribeToConversation(conversation);
    } else {
      subscribeToConversation(conversation);
    }
  };

  return (
    <div id="detail-container">
      <div id="detail-card">
        <div id="detail-card-left">
          <div className={"subscribe" + (conversation.subscribed ? " subscribed" : "")} onClick={handleSubscribe}></div>
          {user?.isAdmin && <div className="edit" onClick={() => editConversation(conversation._id)}></div>}
        </div>
        <div id="detail-card-main">
          {conversation.multiLingualSentences.map((multiLingualSentence, index) => (
            <SentenceDetail key={index} index={index} multiLingualSentence={multiLingualSentence} />
          ))}
          {conversation.tags.length > 0 && (
            <div className="tags">
              {conversation.tags.map((tagId) => {
                const tag = conversationTags.find(({ _id }) => _id === tagId);
                return tag ? (
                  <div key={tagId} className="word-tag" style={{ cursor: "pointer" }} onClick={() => searchTag(tagId)}>
                    {tag.sourceLabel}
                  </div>
                ) : null;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
