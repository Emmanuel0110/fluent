import { useParams } from "react-router-dom";
import { Conversation, Flashcard, MultiLingualSentence, Word } from "../../types";
import { useContext, useEffect, useRef } from "react";
import { ConfigContext } from "../../App";
import { Context } from "../../types";
import { SentenceLine } from "./SentenceLine";

export const ConversationLine = ({ conversation }: { conversation: {multiLingualSentences: MultiLingualSentence[]} }) => {
  return (
    <div>
      {conversation.multiLingualSentences.map((multiLingualSentence, index) => (
        <SentenceLine key={index} multiLingualSentence={multiLingualSentence} />
      ))}
    </div>
  );
};
