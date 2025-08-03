import { Context, Conversation } from "../types";
import FilterBar from "./FilterBar";
import { ConversationLine } from "./ConversationLine";
import { useContext } from "react";
import { ConfigContext } from "../contexts/ConfigContext";

export default function ConversationList() {
  const { filteredConversations } = useContext(ConfigContext) as Context;
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
