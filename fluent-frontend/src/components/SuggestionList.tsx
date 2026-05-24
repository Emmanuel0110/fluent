import { Context } from "../types";
import { ConversationLine } from "./ConversationLine";
import { useEffect, useState } from "react";
import { useData } from "../contexts/DataContext";
import { useTranslation } from "react-i18next";

export default function SuggestionList() {
  const { t } = useTranslation();
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

  return suggestionIds ? (
    <div style={{ height: "100%", overflow: "auto" }}>
      <div id="conversationList">
        {conversations
          .filter(({ _id }) => suggestionIds.includes(_id))
          .map((conversation, index) => (
            <ConversationLine key={index} conversation={conversation} />
          ))}
      </div>
    </div>
  ) : (
    <div id="nothingToReview">{t("conversation.no_suggestion")}</div>
  );
}
