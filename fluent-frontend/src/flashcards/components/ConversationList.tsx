import { Fragment, useContext } from "react";
import { Conversation, Flashcard, Word } from "../../types";
import { ConfigContext } from "../../App";
import { Context } from "../../types";
import InfiniteScrollComponent from "../../utils/InfiniteScrollComponent";
import FilterBar from "./FilterBar";
import { WordLine } from "./WordLine";
import { ConversationLine } from "./ConversationLine";

export default function ConversationList({ filteredConversations }: { filteredConversations: Conversation[] }) {
  return (
    <Fragment>
      <FilterBar />
      <div id="conversationList">
        {filteredConversations.map((conversation, index) => (
          <ConversationLine key={index} conversation={conversation} />
        ))}
      </div>
    </Fragment>
  );
}
