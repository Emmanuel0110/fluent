import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfigContext } from "../../App";
import {
  Context,
  Conversation,
  Sentence,
  Word,
} from "../../types";
import { Flashcard } from "../../types";
import DotOptions from "../../utils/DotOptions/DotOptions";
import { Button } from "react-bootstrap";
import { editUserFlashcardInfo } from "../flashcardActions";
import { WordLine } from "./WordLine";
import { Editor } from "@tinymce/tinymce-react";
import { ConversationLine } from "./ConversationLine";

export default function SentenceDetail({
  multiLingualSentence: { sourceLanguage: sourceSentence, targetLanguage: targetSentence },
}: {
  multiLingualSentence: {
    sourceLanguage: Sentence;
    targetLanguage: Sentence;
  };
}) {
  const { words, subscribeToConversation, sourceLanguage, targetLanguage } = useContext(ConfigContext) as Context;
  const [isTargetSentenceSelected, setIsTargetSentenceSelected] = useState(false);
  return (
    <div id="flashCardComponent">
      <div id="flashcard">
        <div id="middle">
          <div onClick={() => setIsTargetSentenceSelected(false)}>{sourceSentence.text}</div>
          <div onClick={() => setIsTargetSentenceSelected(true)}>{targetSentence.text}</div>
          {sourceSentence.prerequisites.length > 0 && !isTargetSentenceSelected && (
            <div id="sourcePrerequisites">
              {sourceSentence.prerequisites.map((wordId, index) =>
                words[wordId] ? <WordLine key={index} word={words[wordId]} /> : null
              )}
            </div>
          )}
          {targetSentence.prerequisites.length > 0 && isTargetSentenceSelected && (
            <div id="targetPrerequisites">
              {targetSentence.prerequisites.map((wordId, index) =>
                words[wordId] ? <WordLine key={index} word={words[wordId]} /> : null
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
