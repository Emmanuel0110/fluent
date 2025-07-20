import { useContext } from "react";
import { ConfigContext } from "../../App";
import { Context, Conversation } from "../../types";
import SentenceDetail from "./SentenceDetail";
import { useData } from "../../contexts/DataContext";

export default function ConversationDetail({ conversation }: { conversation: Conversation }) {
  const { conversationTags, subscribeToConversation, unsubscribeToConversation } = useData();
  const { setSearchFilter } = useContext(ConfigContext) as Context;

  const searchTag = (tagLabel: string) => {
    setSearchFilter([{ isActive: true, data: ["#" + tagLabel] }]);
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
        </div>
        <div id="detail-card-main">
          {conversation.multiLingualSentences.map((multiLingualSentence, index) => (
            <SentenceDetail key={index} multiLingualSentence={multiLingualSentence} />
          ))}
          <div id="tags">
            {conversation.tags.map((tagId, index) => {
              const tag = conversationTags.find((tag) => tag._id === tagId);
              return tag ? (
                <div key={index} className="tag" onClick={(e) => searchTag(tag.sourceLabel)}>
                  {"#" + tag.sourceLabel}
                </div>
              ) : (
                <div />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
