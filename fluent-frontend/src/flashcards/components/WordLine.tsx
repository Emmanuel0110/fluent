import { useParams } from "react-router-dom";
import { Word } from "../../types";
import { useContext, useEffect, useRef } from "react";
import { ConfigContext } from "../../App";
import { Context } from "../../types";

export const WordLine = ({ word }: { word: Word }) => {
  const { wordId } = useParams();
  const {
    user, // TODO: add condition on user.admin to edit/delete
    openWord,
    editWord,
    deleteWord,
  } = useContext(ConfigContext) as Context;

  const lineRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const { current } = lineRef;
    if (current !== null && word._id === wordId) {
      current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [wordId]);

  const onEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    editWord(word._id);
  };

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteWord(word._id);
  };

  return (
    <div
      ref={lineRef}
      className={"line" + (word._id === wordId ? " selectedFlashcard" : "")}
      onClick={() => openWord(word._id)}
    >
      <div className={"lineTitle"}>
        {word.sourceLanguage +
          " : " +
          word.targetLanguage.map(({ id, label }) => (
            <span className="wordLabel" onClick={e => openWord(id)}>
              {label}
            </span>
          ))}
      </div>
      <div className="lineOptions">
        <div
          className={"subscribe" + (word.subscribed ? " subscribed" : "")}
        ></div>
        <div className="edit" onClick={onEdit}></div>
        <div className="delete" onClick={onDelete}></div>
      </div>
    </div>
  );
};
