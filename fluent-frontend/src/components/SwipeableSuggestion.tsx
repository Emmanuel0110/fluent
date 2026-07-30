import { useRef, useState } from "react";
import { Conversation } from "../types";
import { ConversationLine } from "./ConversationLine";
import { ConfirmDialog } from "./ConfirmDialog";
import { useTranslation } from "react-i18next";

// Distance (px) the row must be dragged left before releasing triggers the confirm.
const SWIPE_THRESHOLD = 80;
// How far the row can slide open, revealing the action underneath.
const MAX_TRANSLATE = 120;

/**
 * Wraps a suggested ConversationLine with a Gmail-style left swipe: dragging the
 * row left reveals a "remove" action, and releasing past the threshold asks the
 * user to confirm removing the conversation from their suggestions.
 */
export function SwipeableSuggestion({
  conversation,
  onDismiss,
  selected,
  onSelect,
}: {
  conversation: Conversation;
  onDismiss: (id: string) => void;
  selected: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const [offset, setOffset] = useState(0); // current translateX (<= 0, left only)
  const [dragging, setDragging] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const swiping = useRef(false); // horizontal gesture engaged (vs. a vertical scroll)
  const justSwiped = useRef(false); // suppress the click that follows a swipe

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    swiping.current = false;
    setDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX.current === null || startY.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    // Only engage the horizontal swipe once it clearly dominates vertical motion,
    // so a normal scroll of the list is never mistaken for a swipe.
    if (!swiping.current && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      swiping.current = true;
    }
    if (swiping.current && dx < 0) {
      setOffset(Math.max(dx, -MAX_TRANSLATE));
    }
  };

  const handleTouchEnd = () => {
    setDragging(false);
    if (swiping.current) justSwiped.current = true;
    if (offset <= -SWIPE_THRESHOLD) {
      setOffset(-MAX_TRANSLATE); // hold open while the confirm is shown
      setShowConfirm(true);
    } else {
      setOffset(0); // snap back
    }
    startX.current = null;
    startY.current = null;
  };

  // A swipe ends in a synthetic click on the row; swallow it so the conversation
  // does not open when the user only meant to swipe.
  const handleClickCapture = (e: React.MouseEvent) => {
    if (justSwiped.current) {
      e.preventDefault();
      e.stopPropagation();
      justSwiped.current = false;
    }
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    onDismiss(conversation._id);
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setOffset(0);
  };

  return (
    <>
      {showConfirm && (
        <ConfirmDialog
          message={t("conversation.remove_suggestion_confirm")}
          confirmLabel={t("common.confirm")}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
      <div className="swipeContainer">
        <div className="swipeAction">{t("conversation.remove_suggestion")}</div>
        <div
          className="swipeContent"
          style={{
            transform: `translateX(${offset}px)`,
            transition: dragging ? "none" : "transform 0.2s ease",
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClickCapture={handleClickCapture}
        >
          <ConversationLine conversation={conversation} selected={selected} onSelect={onSelect} />
        </div>
      </div>
    </>
  );
}
