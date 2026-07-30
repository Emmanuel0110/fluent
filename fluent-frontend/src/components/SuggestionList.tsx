import { SwipeableSuggestion } from "./SwipeableSuggestion";
import { useEffect, useRef, useState } from "react";
import { useData } from "../contexts/DataContext";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function SuggestionList() {
  const { t } = useTranslation();
  const { conversations, fetchSuggestions, dismissSuggestion, subscribeToConversations } = useData();
  const [suggestionIds, setSuggestionIds] = useState([] as string[] | null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // How many conversations this visit added, so the bar can offer to review them.
  const [addedCount, setAddedCount] = useState(0);
  // Adding is optimistic, so the review can only be started once the server has
  // actually taken the new conversations — otherwise it would find nothing to review.
  const pendingAdds = useRef<Promise<void>[]>([]);
  const navigate = useNavigate();

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
        setSelectedIds((ids) => ids.filter((id) => id !== conversationId));
        setSuggestionIds((ids) => {
          const remaining = (ids || []).filter((id) => id !== conversationId);
          return remaining.length ? remaining : null;
        });
      }
    });
  };

  const toggleSelection = (conversationId: string) => {
    setSelectedIds((ids) =>
      ids.includes(conversationId) ? ids.filter((id) => id !== conversationId) : [...ids, conversationId],
    );
  };

  const handleAdd = () => {
    pendingAdds.current.push(subscribeToConversations(selectedIds));
    setAddedCount((count) => count + selectedIds.length);
    setSuggestionIds((ids) => {
      const remaining = (ids || []).filter((id) => !selectedIds.includes(id));
      return remaining.length ? remaining : null;
    });
    setSelectedIds([]);
  };

  const handleStartReview = async () => {
    await Promise.all(pendingAdds.current);
    navigate("/review");
  };

  // A pending selection always takes priority over the "start review" offer, so the
  // bar shows the action the user is in the middle of.
  const actionBar =
    selectedIds.length > 0 ? (
      <button type="button" className="deckButton add" onClick={handleAdd}>
        {t("conversation.add_to_review_deck")} ({selectedIds.length})
      </button>
    ) : addedCount > 0 ? (
      <button type="button" className="deckButton start" onClick={handleStartReview}>
        {t("review.start")} ({addedCount})
      </button>
    ) : (
      <button type="button" className="deckButton add" disabled>
        {t("conversation.add_to_review_deck")}
      </button>
    );

  return (
    <div className="deckPage">
      <div className="deckPageScroll">
        {suggestionIds ? (
          <div id="conversationList">
            {conversations
              .filter(({ _id }) => suggestionIds.includes(_id))
              .map((conversation) => (
                <SwipeableSuggestion
                  key={conversation._id}
                  conversation={conversation}
                  onDismiss={handleDismiss}
                  selected={selectedIds.includes(conversation._id)}
                  onSelect={() => toggleSelection(conversation._id)}
                />
              ))}
          </div>
        ) : (
          <div id="nothingToReview">{t("conversation.no_suggestion")}</div>
        )}
      </div>
      {(suggestionIds || addedCount > 0) && <div className="deckBar">{actionBar}</div>}
    </div>
  );
}
