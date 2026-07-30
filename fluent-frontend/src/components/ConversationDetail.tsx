import { useContext, useState } from "react";
import { ConfigContext } from "../contexts/ConfigContext";
import { Context, Conversation } from "../types";
import SentenceDetail from "./SentenceDetail";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "./ConfirmDialog";
import { useTranslation } from "react-i18next";

export default function ConversationDetail({ conversation }: { conversation: Conversation }) {
  const { subscribeToConversations, unsubscribeToConversation, conversationTags } = useData();
  const { editConversation, setConversationTagFilter } = useContext(ConfigContext) as Context;
  const { user } = useAuth();
  const { t } = useTranslation();
  const [showConfirm, setShowConfirm] = useState(false);
  // Id — not a flag — of the conversation added from here, so the "Ajouté"
  // confirmation stays on that one conversation. Switching tabs re-renders this
  // component instead of remounting it, so a flag would follow the user around.
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const navigate = useNavigate();

  const searchTag = (tagId: string) => {
    const tag = conversationTags.find(({ _id }) => _id === tagId);
    if (tag) {
      setConversationTagFilter(tag);
      navigate("/conversations");
    }
  };

  const handleAdd = () => {
    setJustAddedId(conversation._id);
    subscribeToConversations([conversation._id]);
  };

  const handleRemove = () => {
    setShowConfirm(false);
    setJustAddedId(null);
    unsubscribeToConversation(conversation);
  };

  return (
    <>
      {showConfirm && (
        <ConfirmDialog
          message={t("conversation.remove_from_review_deck_confirm")}
          onConfirm={handleRemove}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      <div id="detail-container">
        <div id="detail-card">
          <div id="detail-card-left">
            {user?.isAdmin && <div className="edit" onClick={() => editConversation(conversation._id)}></div>}
          </div>
          <div id="detail-card-main">
            {conversation.multiLingualSentences.map((multiLingualSentence, index) => (
              <SentenceDetail key={index} index={index} multiLingualSentence={multiLingualSentence} />
            ))}
            {conversation.tags.length > 0 && (
              <div className="tags">
                {conversation.tags.map((tagId) => {
                  const tag = conversationTags.find(({ _id }) => _id === tagId);
                  return tag ? (
                    <div key={tagId} className="word-tag" style={{ cursor: "pointer" }} onClick={() => searchTag(tagId)}>
                      {tag.sourceLabel}
                    </div>
                  ) : null;
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Sits below the scrolling detail, inside the panel's flex column, so it stays
          attached to the conversation it acts on rather than to the whole viewport. */}
      <div className="deckBar">
        {conversation.subscribed ? (
          <button type="button" className="deckButton inDeck" onClick={() => setShowConfirm(true)}>
            <span className="checkIcon"></span>
            {/* Short confirmation right after the click, then the wording that makes
                sense on a later visit. Both states remove, so a mistaken add is
                undone from the same button. */}
            {justAddedId === conversation._id ? t("conversation.added_to_review_deck") : t("conversation.in_review_deck")}
          </button>
        ) : (
          <button type="button" className="deckButton add" onClick={handleAdd}>
            {t("conversation.add_to_review_deck")}
          </button>
        )}
      </div>
    </>
  );
}
