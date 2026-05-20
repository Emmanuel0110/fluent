import { useParams } from "react-router-dom";
import { Word } from "../types";
import { useContext, useEffect, useRef, useState } from "react";
import { ConfigContext } from "../contexts/ConfigContext";
import { Context } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { WordDefinition } from "./WordDefinition";

export const WordLine = ({ word }: { word: Word }) => {
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

  const confirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(false);
    deleteWord(word._id);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(false);
  };

  return (
    <>
      {showConfirm && (
        <div className="blockerDarkBackground" onClick={cancelDelete}>
          <div id="above" onClick={(e) => e.stopPropagation()}>
            <p>Are you sure you want to delete this word?</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
              <button className="btn btn-secondary" onClick={cancelDelete}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
      <div
        ref={lineRef}
        className={"line" + (word._id === wordId ? " selectedLine" : "")}
        onClick={() => openWord(word._id)}
      >
        <WordDefinition word={word} />
        {user?.isAdmin && (
          <div className="lineOptions">
            <div className="edit" onClick={onEdit}></div>
            <div className="delete" onClick={onDelete}></div>
          </div>
        )}
      </div>
    </>
  );
};
