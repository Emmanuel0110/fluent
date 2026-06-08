import { useParams } from "react-router-dom";
import { Word } from "../types";
import { useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ConfigContext } from "../contexts/ConfigContext";
import { Context } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { WordDefinition } from "./WordDefinition";
import { ConfirmDialog } from "./ConfirmDialog";

export const WordLine = ({ word, readonly = false }: { word: Word; readonly?: boolean }) => {
  const { wordId } = useParams();
  const { user } = useAuth();
  const { deleteWord } = useData();
  const { openWord, editWord } = useContext(ConfigContext) as Context;
  const lineRef = useRef<HTMLDivElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const { current } = lineRef;
    if (current !== null && word._id === wordId) {
      current.scrollIntoView({ block: "nearest" });
    }
  }, [wordId]);

  const onEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    editWord(word._id);
  };

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  return (
    <>
      {showConfirm && createPortal(
        <ConfirmDialog
          message="Are you sure you want to delete this word?"
          onConfirm={() => { setShowConfirm(false); deleteWord(word._id); }}
          onCancel={() => setShowConfirm(false)}
        />,
        document.body
      )}
      <div
        ref={lineRef}
        className={"line" + (word._id === wordId ? " selectedLine" : "")}
        onClick={() => openWord(word._id)}
      >
        <WordDefinition word={word} />
        {user?.isAdmin && !readonly && (
          <div className="lineOptions">
            <div className="edit" onClick={onEdit}></div>
            <div className="delete" onClick={onDelete}></div>
          </div>
        )}
      </div>
    </>
  );
};
