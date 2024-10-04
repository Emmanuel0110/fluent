import { useParams } from "react-router-dom";
import { Flashcard, MultiLingualSentence, Word } from "../../types";
import { useContext, useEffect, useRef } from "react";
import { ConfigContext } from "../../App";
import { Context } from "../../types";

export const SentenceLine = ({ multiLingualSentence }: { multiLingualSentence: MultiLingualSentence }) => {
  const { multilingualsentenceId } = useParams();
  const {
    sourceLanguage,
    targetLanguage,
    user,
    openMultiLingualSentence,
    deleteFlashcard,
    editFlashcard,
    subscribeToWord: subscribeToFlashcard,
  } = useContext(ConfigContext) as Context;

  const lineRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const { current } = lineRef;
    if (current !== null && _id === multilingualsentenceId) {
      current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [multilingualsentenceId]);

  const { _id, [sourceLanguage]: text, [targetLanguage]: translation, nextReviewDate } = multiLingualSentence;

  const onEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    editFlashcard(id);
  };

  const onDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteFlashcard(id);
  };

  const onSubscribe = (e: React.MouseEvent, { _id, nextReviewDate }: Partial<Flashcard>) => {
    e.stopPropagation();
    subscribeToFlashcard({ _id, nextReviewDate });
  };

  return (
    <div
      ref={lineRef}
      className={"line" + (_id === multilingualsentenceId ? " selectedFlashcard" : "")}
      onClick={() => openMultiLingualSentence(_id)}
    >
      <div className={"lineTitle"}>{text + " : " + translation}</div>
      <div className="lineOptions">
        <div
          className={"subscribe" + (nextReviewDate instanceof Date ? " subscribed" : "")}
          onClick={(e) => onSubscribe(e, { _id, nextReviewDate })}
        ></div>
        <div className="edit" onClick={(e) => onEdit(e, _id)}></div>
        <div className="delete" onClick={(e) => onDelete(e, _id)}></div>
      </div>
    </div>
  );
};
