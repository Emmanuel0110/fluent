import { useParams } from "react-router-dom";
import { Flashcard, Word } from "../../types";
import { useContext, useEffect, useRef } from "react";
import { ConfigContext } from "../../App";
import { Context } from "../../types";

export const WordLine = ({ word }: { word: Word }) => {
  const { wordId } = useParams();
  const {
    targetLanguage,
    words,
    user,
    openWord,
    deleteFlashcard,
    editFlashcard,
    subscribeToWord: subscribeToFlashcard,
  } = useContext(ConfigContext) as Context;

  const lineRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const { current } = lineRef;
    if (current !== null && _id === wordId) {
      current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [wordId]);

  const { _id, text, sourceLanguage, [targetLanguage]: translations, nextReviewDate, learntDate } = word;

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
      className={"line" + (_id === wordId ? " selectedFlashcard" : "")}
      onClick={() => openWord(_id, sourceLanguage)}
    >
      <div className={"lineTitle"}>
        {text +
          " : " +
          translations!.map((wordId) => words[targetLanguage].find(({ _id }) => _id === wordId)!.text).join(", ")}
      </div>
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
