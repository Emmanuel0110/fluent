import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfigContext } from "../../App";
import { Context, Conversation, MultiLingualSentence, Word } from "../../types";
import { Flashcard } from "../../types";
import DotOptions from "../../utils/DotOptions/DotOptions";
import { Button } from "react-bootstrap";
import { editUserFlashcardInfo, readRemoteFlashcard } from "../flashcardActions";
import { WordLine } from "./WordLine";
import { Editor } from "@tinymce/tinymce-react";
import { ConversationLine } from "./ConversationLine";

export default function SentenceDetail({
  multiLingualSentence,
  sourcePrerequisites,
  targetPrerequisites,
  usedIn,
}: {
  multiLingualSentence: MultiLingualSentence;
  sourcePrerequisites: Word[];
  targetPrerequisites: Word[];
  usedIn: {multiLingualSentences: MultiLingualSentence[]}[];
}) {
  const { subscribeToMultiLingualSentence, sourceLanguage, targetLanguage } = useContext(ConfigContext) as Context;
  const [isTargetSentenceSelected, setIsTargetSentenceSelected] = useState(false);

  const onSubscribe = (e: React.MouseEvent, multiLingualSentence: MultiLingualSentence) => {
    e.stopPropagation();
    subscribeToMultiLingualSentence(multiLingualSentence);
  };

  return (
    <div id="flashCardComponent">
      <div id="flashcard">
        <div id="previous">
          <div
            className={"subscribe" + (multiLingualSentence.nextReviewDate instanceof Date ? " subscribed" : "")}
            onClick={(e) => onSubscribe(e, multiLingualSentence)}
          ></div>
        </div>
        <div id="middle">
          <div onClick={() => setIsTargetSentenceSelected(false)}>{multiLingualSentence[sourceLanguage]}</div>
          <div onClick={() => setIsTargetSentenceSelected(true)}>{multiLingualSentence[targetLanguage]}</div>
          {sourcePrerequisites.length > 0 && !isTargetSentenceSelected && (
            <div id="sourcePrerequisites">
              {sourcePrerequisites.map((word, index) => (
                <WordLine key={index} word={word} />
              ))}
            </div>
          )}
          {targetPrerequisites.length > 0 && isTargetSentenceSelected && (
            <div id="targetPrerequisites">
              {sourcePrerequisites.map((word, index) => (
                <WordLine key={index} word={word} />
              ))}
            </div>
          )}
          {usedIn.length > 0 && (
            <div id="usedIn">
              <div className="flashcardSection">Used in</div>
              {usedIn.map((conversation, index) => (
                <ConversationLine key={index} conversation={conversation} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
