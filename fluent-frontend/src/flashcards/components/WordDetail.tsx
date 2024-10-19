import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfigContext } from "../../App";
import { Context, MultiLingualSentence, Word } from "../../types";
import { Flashcard } from "../../types";
import DotOptions from "../../utils/DotOptions/DotOptions";
import { Button } from "react-bootstrap";
import { editUserFlashcardInfo, readRemoteFlashcard } from "../flashcardActions";
import { WordLine } from "./WordLine";
import { Editor } from "@tinymce/tinymce-react";
import { SentenceLine } from "./SentenceLine";

export default function WordDetail({ word, usedIn }: { word: Word; usedIn: MultiLingualSentence[] }) {
  const {
    flashcards,
    setFlashcards,
    openedMultiLingualSentences,
    setOpenedMultiLingualSentences,
    user,
    status,
    setStatus,
    words,
    setSearchFilter,
    saveAsNewFlashcard,
    editCurrentFlashcard,
    subscribeToWord,
    setTreeFilter,
    sourceLanguage,
    targetLanguage,
  } = useContext(ConfigContext) as Context;

  const searchTag = (tagLabel: string) => {
    setSearchFilter([{ isActive: true, data: ["#" + tagLabel] }]);
  };

  const onSubscribe = (e: React.MouseEvent, word: Word) => {
    e.stopPropagation();
    subscribeToWord(word);
  };

  const translation = useMemo(() => {
    if (word.sourceLanguage === sourceLanguage) {
      return words[targetLanguage]!.filter(({_id}) => word[targetLanguage]!.includes(_id)).map(({text}) => text).join(",");
    } else if (word.sourceLanguage === targetLanguage) {
      return words[sourceLanguage]!.filter(({_id}) => word[sourceLanguage]!.includes(_id)).map(({text}) => text).join(",");
    }
  }, [word, sourceLanguage, targetLanguage]);

  return (
    <div id="flashCardComponent">
      <div id="flashcard">
        <div id="previous">
          <div
            className={"subscribe" + (word.nextReviewDate instanceof Date ? " subscribed" : "")}
            onClick={(e) => onSubscribe(e, word)}
          ></div>
        </div>
        <div id="middle">
          <div>{word.text + " : " + translation}</div>

          <div id="tags">
            {word &&
              word.tags.map((tag, index) => (
                <div key={index} className="tag" onClick={(e) => searchTag(tag.label)}>
                  {"#" + tag.label}
                </div>
              ))}
          </div>

          {usedIn.length > 0 && (
            <div id="usedIn">
              <div className="flashcardSection">Used in</div>
              {usedIn.map((multiLingualSentence, index) => (
                <SentenceLine key={index} multiLingualSentence={multiLingualSentence} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
