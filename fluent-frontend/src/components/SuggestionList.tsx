import { Context, RowConversation } from "../types";
import { ConversationLine } from "./ConversationLine";
import { useContext, useEffect, useState } from "react";
import { ConfigContext } from "../contexts/ConfigContext";
import { getSuggestions } from "../APICalls";
import { formatConversations, updateCacheWithNewConversations } from "../utils/conversationUtils";
import { useLanguage } from "../contexts/LanguageContext";
import { useData } from "../contexts/DataContext";

export default function SuggestionList() {
  const { conversations, fetchSuggestions } = useData();
  const [suggestionIds, setSuggestionIds] = useState([] as string[] | null);

  useEffect(() => {
    fetchSuggestions().then((suggestions) => {
      if (suggestions.length) {
        setSuggestionIds(suggestions);
      } else {
        setSuggestionIds(null);
      }
    });
  }, []);

  useEffect(() => {}, []);

  return suggestionIds ? (
    <div id="conversationList">
      {conversations
        .filter(({ _id }) => suggestionIds.includes(_id))
        .map((conversation, index) => (
          <ConversationLine key={index} conversation={conversation} />
        ))}
    </div>
  ) : (
    <div id="nothingToReview">No suggestion available</div>
  );
}
