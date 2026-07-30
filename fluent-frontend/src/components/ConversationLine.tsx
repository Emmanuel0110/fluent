import { useParams } from "react-router-dom";
import { Conversation } from "../types";
import { useContext, useEffect, useRef, useState } from "react";
import { ConfigContext } from "../contexts/ConfigContext";
import { Context } from "../types";
import { SentenceLine } from "./SentenceLine";
import { useData } from "../contexts/DataContext";
import { useAuth } from "../contexts/AuthContext";
import { ConfirmDialog } from "./ConfirmDialog";
import { useTranslation } from "react-i18next";

/**
 * A conversation row. By default clicking it opens the conversation; when
 * `onSelect` is given the row is in selection mode instead (used by the
 * suggestion page), where clicking toggles the selection and the chevron is
 * what opens the detail.
 */
export const ConversationLine = ({
  conversation,
  readOnly = false,
  selected = false,
  onSelect,
}: {
  conversation: Conversation;
  readOnly?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { conversationId, wordId } = useParams();
  const { deleteConversation } = useData();
  const { openConversation, editConversation } = useContext(ConfigContext) as Context;
  const [showConfirm, setShowConfirm] = useState(false);
  const lineRef = useRef<HTMLDivElement>(null);

  //When inside a WordDetail page, we want to filter the conversations to only show the one that contains the word
  if (wordId) {
    conversation = {
      ...conversation,
      multiLingualSentences: conversation.multiLingualSentences.filter(
        (multiLingualSentence) =>
          multiLingualSentence.sourceLanguage.prerequisites.includes(wordId) ||
          multiLingualSentence.targetLanguage.prerequisites.includes(wordId),
      ),
    };
  }

  const onEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    editConversation(conversation._id);
  };

  const onOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    openConversation(conversation._id);
  };

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  return (
    <>
      {showConfirm && (
        <ConfirmDialog
          message={t("conversation.delete_confirm")}
          onConfirm={() => deleteConversation(conversation._id)}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      <div
        ref={lineRef}
        className={
          "line" +
          (conversation._id === conversationId ? " selectedLine" : "") +
          (selected ? " selectedForDeck" : "")
        }
        onClick={onSelect || (() => openConversation(conversation._id))}
      >
        <div className="sentenceLines">
          {conversation.multiLingualSentences.map((multiLingualSentence, index) => (
            <SentenceLine key={index} sentenceIndex={index} multiLingualSentence={multiLingualSentence} />
          ))}
        </div>
        <div className="lineOptions">
          {conversation.subscribed && <div className="inDeckBadge" title={t("conversation.in_review_deck")}></div>}
          {onSelect && <div className="openDetail" onClick={onOpen} title={t("conversation.open_detail")}></div>}
          {!readOnly && user?.isAdmin && (
            <>
              <div className="edit" onClick={onEdit}></div>
              <div className="delete" onClick={onDelete}></div>
            </>
          )}
        </div>
      </div>
    </>
  );
};
