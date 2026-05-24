import { Dispatch, SetStateAction, useContext } from "react";
import { Context, Conversation, Sentence } from "../types";
import AutoComplete from "../utils/Autocomplete";
import { useData } from "../contexts/DataContext";
import { ConfigContext } from "../contexts/ConfigContext";
import { WordDefinition } from "./WordDefinition";
import { useTranslation } from "react-i18next";

type SourceOrTarget = "sourceLanguage" | "targetLanguage";

type Callback = {
  _id?: string;
  label?: string;
  setLocalDescription: Dispatch<React.SetStateAction<string>>;
};

export const SentenceEdit = ({
  type,
  index,
  listOfWords,
  style,
  sentence,
  placeholder,
  setConversation,
}: {
  type: "sourceLanguage" | "targetLanguage";
  index: number;
  listOfWords: { _id: string; label: string }[];
  style: "sourceSentence" | "targetSentence";
  sentence: Sentence;
  placeholder: string;
  setConversation: Dispatch<SetStateAction<Conversation | undefined>>;
}) => {
  const { t } = useTranslation();
  const { words } = useData();
  const { openWord } = useContext(ConfigContext) as Context;

  const changeSentence = (sentenceIndex: number, sourceOrTarget: SourceOrTarget, text: string) => {
    setConversation((conversation) =>
      conversation
        ? {
            ...conversation,
            multiLingualSentences: conversation.multiLingualSentences.map((sentence, index) => {
              if (index === sentenceIndex) {
                return { ...sentence, [sourceOrTarget]: { ...sentence[sourceOrTarget], text } };
              } else {
                return sentence;
              }
            }),
          }
        : undefined
    );
  };

  const removeSentence = (sentenceIndex: number, sourceOrTarget: SourceOrTarget) => {
    setConversation((conversation) =>
      conversation
        ? {
            ...conversation,
            multiLingualSentences: conversation.multiLingualSentences.filter((sentence, index) => {
              return index !== sentenceIndex;
            }),
          }
        : undefined
    );
  };

  const addPrerequisite =
    (sentenceIndex: number, sourceOrTarget: SourceOrTarget) =>
    ({ _id, label, setLocalDescription }: Callback) => {
      if (_id) {
        setConversation((conversation) =>
          conversation
            ? {
                ...conversation,
                multiLingualSentences: conversation.multiLingualSentences.map((sentence, index) => {
                  if (index === sentenceIndex) {
                    return {
                      ...sentence,
                      [sourceOrTarget]: {
                        ...sentence[sourceOrTarget],
                        prerequisites: [...sentence[sourceOrTarget].prerequisites, _id],
                      },
                    };
                  } else {
                    return sentence;
                  }
                }),
              }
            : undefined
        );
        setLocalDescription("");
      }
    };

  const removePrerequisite = (
    e: React.MouseEvent,
    sentenceIndex: number,
    sourceOrTarget: SourceOrTarget,
    wordId: string
  ) => {
    e.stopPropagation();
    setConversation((conversation) =>
      conversation
        ? {
            ...conversation,
            multiLingualSentences: conversation.multiLingualSentences.map((sentence, index) => {
              return index !== sentenceIndex
                ? sentence
                : {
                    ...sentence,
                    [sourceOrTarget]: {
                      ...sentence[sourceOrTarget],
                      prerequisites: sentence[sourceOrTarget].prerequisites.filter((id) => id !== wordId),
                    },
                  };
            }),
          }
        : undefined
    );
  };

  return (
    <div className={style}>
      <input
        type="text"
        value={sentence.text}
        onChange={(e) => changeSentence(index, type, e.target.value)}
        placeholder={placeholder}
      />
      {sentence.prerequisites.length > 0 && (
        <div className="conversation-prerequisites">
          {sentence.prerequisites.map((wordId) => {
            const prerequisite = words[wordId];
            return prerequisite ? (
              <div key={wordId} className="conversation-prerequisite">
                <div className="line" onClick={() => openWord(prerequisite._id)}>
                  <WordDefinition word={prerequisite} />
                  <div className="lineOptions">
                    <div className="delete" onClick={(e) => removePrerequisite(e, index, type, wordId)}></div>
                  </div>
                </div>
              </div>
            ) : null;
          })}
        </div>
      )}
      <div className="prerequisiteInput">
        <AutoComplete
          dropdownList={listOfWords}
          callback={addPrerequisite(index, type)}
          placeholder={t("conversation.add_prerequisite")}
          placement="bottom-start"
        />
      </div>
    </div>
  );
};
