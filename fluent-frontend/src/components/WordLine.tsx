import { Word } from "../types";
import { useContext, useEffect, useRef, useState, memo } from "react";
import { ConfigContext } from "../contexts/ConfigContext";
import { Context } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { WordDefinition } from "./WordDefinition";
import { ConfirmDialog } from "./ConfirmDialog";

export const WordLine = memo(function WordLine({
  word,
  readonly = false,
  isSelected = false,
}: {
  word: Word;
  readonly?: boolean;
  isSelected?: boolean;
}) {
  const { user } = useAuth();
  const { deleteWord } = useData();
  const { openWord, editWord } = useContext(ConfigContext) as Context;
  const lineRef = useRef<HTMLDivElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (lineRef.current && isSelected) {
      lineRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [isSelected]);

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
      {showConfirm && (
        <ConfirmDialog
          message="Are you sure you want to delete this word?"
          onConfirm={() => { setShowConfirm(false); deleteWord(word._id); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      <div
        ref={lineRef}
        className={"line" + (isSelected ? " selectedLine" : "")}
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
});
