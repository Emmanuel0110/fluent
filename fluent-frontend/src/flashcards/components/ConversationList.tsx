import { Fragment, useContext } from "react";
import { Conversation, Flashcard, Word } from "../../types";
import { ConfigContext } from "../../App";
import { Context } from "../../types";
import InfiniteScrollComponent from "../../utils/InfiniteScrollComponent";
import FilterBar from "./FilterBar";
import { WordLine } from "./WordLine";
import { ConversationLine } from "./ConversationLine";

export default function ConversationList({ filteredConversations }: { filteredConversations: Conversation[] }) {
  const { sourceLanguage, targetLanguage, sentences, multiLingualSentences } = useContext(ConfigContext) as Context;
  return (
    <Fragment>
      <FilterBar />
      <div id="conversationList">
        {filteredConversations.map((conversation, index) => {
          const filledConversation = {
            ...conversation,
            multiLingualSentences: conversation.multiLingualSentences.map((multiLingualSentenceId) => {
              const multiLingualSentence = multiLingualSentences.find(({ _id }) => _id === multiLingualSentenceId)!;
              return {
                ...multiLingualSentence,
                [sourceLanguage]: sentences.find(({ _id }) => _id === multiLingualSentence[sourceLanguage])?.text,
                [targetLanguage]: sentences.find(({ _id }) => _id === multiLingualSentence[targetLanguage])?.text,
              };
            }),
          };
          return <ConversationLine key={index} conversation={filledConversation} />;
        })}
      </div>
    </Fragment>
  );
}
