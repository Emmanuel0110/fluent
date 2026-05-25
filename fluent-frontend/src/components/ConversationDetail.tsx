import { useContext } from "react";
import { ConfigContext } from "../contexts/ConfigContext";
import { Context, Conversation } from "../types";
import SentenceDetail from "./SentenceDetail";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";

export default function ConversationDetail({ conversation }: { conversation: Conversation }) {
  const { subscribeToConversation, unsubscribeToConversation } = useData();
  const { editConversation } = useContext(ConfigContext) as Context;
  const { user } = useAuth();

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
          {user?.isAdmin && (
            <div className="edit" onClick={() => editConversation(conversation._id)}></div>
          )}
        </div>
        <div id="detail-card-main">
          {conversation.multiLingualSentences.map((multiLingualSentence, index) => (
            <SentenceDetail key={index} index={index} multiLingualSentence={multiLingualSentence} />
          ))}
        </div>
      </div>
    </div>
  );
}
