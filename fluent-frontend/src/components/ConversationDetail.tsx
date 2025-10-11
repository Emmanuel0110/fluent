import { useContext } from "react";
import { ConfigContext } from "../contexts/ConfigContext";
import { Context, Conversation } from "../types";
import SentenceDetail from "./SentenceDetail";
import { useData } from "../contexts/DataContext";

export default function ConversationDetail({ conversation }: { conversation: Conversation }) {
  const { subscribeToConversation, unsubscribeToConversation } = useData();

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
