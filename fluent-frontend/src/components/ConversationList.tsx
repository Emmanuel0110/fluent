import { Conversation } from "../types";
import FilterBar from "./FilterBar";
import { ConversationLine } from "./ConversationLine";

export default function ConversationList({ filteredConversations }: { filteredConversations: Conversation[] }) {
  return (
    <>
      <FilterBar />
      <div id="conversationList">
        {filteredConversations.map((conversation, index) => (
          <ConversationLine key={index} conversation={conversation} />
        ))}
      </div>
    </>
  );
}
