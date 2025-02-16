import { useContext } from "react";
import { ConfigContext } from "../../App";
import { Context, Conversation } from "../../types";
import SentenceDetail from "./SentenceDetail";

export default function ConversationDetail({ conversation }: { conversation: Conversation }) {
  const { conversationTags, setSearchFilter, subscribeToConversation } = useContext(ConfigContext) as Context;

  const searchTag = (tagLabel: string) => {
    setSearchFilter([{ isActive: true, data: ["#" + tagLabel] }]);
  };

  const getWordsFromConversation = (conversation: Conversation) => {
    return conversation.multiLingualSentences.reduce((acc, value) => {
      return [...acc, ...value.sourceLanguage.prerequisites, ...value.targetLanguage.prerequisites];
    }, [] as string[]);
  }

  return (
    <div id="flashCardComponent">
      <div id="flashcard">
        <div id="previous">
          <div
            className={"subscribe" + (conversation.subscribed ? " subscribed" : "")}
            onClick={(e) => subscribeToConversation(conversation._id, getWordsFromConversation(conversation))}
          ></div>
        </div>
        <div id="middle">
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
                ) : <div/>;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
