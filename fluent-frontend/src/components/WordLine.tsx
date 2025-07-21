import { useParams } from "react-router-dom";
import { Word } from "../types";
import { useContext, useEffect, useRef } from "react";
import { ConfigContext } from "../App";
import { Context } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { useData } from "../contexts/DataContext";
import { WordDefinition } from "./WordDefinition";

export const WordLine = ({ word }: { word: Word }) => {
  const { wordId } = useParams();
  const { user } = useAuth(); // TODO: add condition on user.admin to edit/delete
  const { words, deleteWord } = useData();
  const { openWord, editWord } = useContext(ConfigContext) as Context;
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
    if (window.confirm("Are you sure you want to delete this word?")) {
      deleteWord(word._id);
    }
  };

  return (
    <div
      ref={lineRef}
      className={"line" + (word._id === wordId ? " selectedLine" : "")}
      onClick={() => openWord(word._id)}
    >
      <WordDefinition word={word} />
      <div className="lineOptions">
        <div className="edit" onClick={onEdit}></div>
        <div className="delete" onClick={onDelete}></div>
      </div>
    </div>
  );
};
