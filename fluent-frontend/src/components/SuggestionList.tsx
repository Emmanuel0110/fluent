import { SwipeableSuggestion } from "./SwipeableSuggestion";
import { useEffect, useState } from "react";
import { useData } from "../contexts/DataContext";
import { useTranslation } from "react-i18next";

export default function SuggestionList() {
  const { t } = useTranslation();
  const { conversations, fetchSuggestions, dismissSuggestion } = useData();
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

  const handleDismiss = (conversationId: string) => {
    dismissSuggestion(conversationId).then((success) => {
      if (success) {
        setSuggestionIds((ids) => {
          const remaining = (ids || []).filter((id) => id !== conversationId);
          return remaining.length ? remaining : null;
        });
      }
    });
  };

  return suggestionIds ? (
    <div style={{ height: "100%", overflow: "auto" }}>
      <div id="conversationList">
        {conversations
          .filter(({ _id }) => suggestionIds.includes(_id))
          .map((conversation) => (
            <SwipeableSuggestion key={conversation._id} conversation={conversation} onDismiss={handleDismiss} />
          ))}
      </div>
    </div>
  ) : (
    <div id="nothingToReview">{t("conversation.no_suggestion")}</div>
  );
}
