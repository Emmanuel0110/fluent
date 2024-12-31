import React, { Dispatch, useContext, useEffect, useState } from "react";
import "../../App.css";
import { Context, Conversation } from "../../types";
import { ConfigContext, updateCacheWithNewConversations } from "../../App";
import AutoComplete from "../../utils/Autocomplete";
import { WordLine } from "./WordLine";
import { editRemoteConversation, saveNewConversation } from "../flashcardActions";
import { useNavigate } from "react-router-dom";

type SourceOrTarget = "sourceLanguage" | "targetLanguage";

CreationForm.defaultProps = {
  initialConversation: { _id: "", tags: [], multiLingualSentences: [], subscribed: false },
};

function CreationForm({ initialConversation }: { initialConversation?: Conversation }) {
  const [conversation, setConversation] = useState<Conversation | undefined>();
  const {
    words,
    setConversations,
    saveConversation,
    sourceLanguage: appSourceLanguage,
    targetLanguage: appTargetLanguage,
  } = useContext(ConfigContext) as Context;
  const navigate = useNavigate();
  useEffect(() => {
    setConversation(initialConversation);
  }, [initialConversation]);

  const addSentence = () => {
    setConversation((conversation) =>
      conversation
        ? {
            ...conversation,
            multiLingualSentences: [
              ...conversation.multiLingualSentences,
              {
                sourceLanguage: { text: "", prerequisites: [] },
                targetLanguage: { text: "", prerequisites: [] },
              },
            ],
          }
        : undefined
    );
  };

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
    ({
      _id,
      label,
      setLocalDescription,
    }: {
      _id?: string;
      label?: string;
      setLocalDescription: Dispatch<React.SetStateAction<string>>;
    }) => {
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

  const removePrerequisite = (sentenceIndex: number, prerequisiteIndex: number, sourceOrTarget: SourceOrTarget) => {};

  const addTag = (tagId: string) => {};

  const removeTag = (index: number) => {};

  const onSubmit = async () => {
    if (conversation) {
      await saveConversation(conversation);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      {conversation &&
        conversation.multiLingualSentences.map((sentence, index) => (
          <div key={index} style={{ marginBottom: "1em" }}>
            <div className="sourceSentence">
              <input
                type="text"
                value={sentence.sourceLanguage.text}
                onChange={(e) => changeSentence(index, "sourceLanguage", e.target.value)}
              />
              {sentence.sourceLanguage.prerequisites.map((wordId) => {
                const prerequisite = words[wordId];
                return prerequisite ? <WordLine word={prerequisite} /> : null;
              })}
              <div className="prerequisiteInput">
                <AutoComplete
                  dropdownList={Object.values(words)
                    .filter(({ sourceLanguage }) => sourceLanguage === appSourceLanguage)
                    .map(({ _id, sourceLanguage }) => ({ _id, label: sourceLanguage }))}
                  callback={addPrerequisite(index, "sourceLanguage")}
                  placeholder="add prerequisite"
                  placement="bottom-start"
                />
              </div>
            </div>
            <div className="targetSentence">
              <input
                type="text"
                value={sentence.targetLanguage.text}
                onChange={(e) => changeSentence(index, "targetLanguage", e.target.value)}
              />
              {sentence.targetLanguage.prerequisites.map((wordId) => {
                const prerequisite = words[wordId];
                return prerequisite ? <WordLine word={prerequisite} /> : null;
              })}
              <div className="prerequisiteInput">
                <AutoComplete
                  dropdownList={Object.values(words)
                    .filter(({ language }) => language === appTargetLanguage)
                    .map(({ _id, sourceLanguage }) => ({ _id, label: sourceLanguage }))}
                  callback={addPrerequisite(index, "targetLanguage")}
                  placeholder="add prerequisite"
                  placement="bottom-start"
                />
              </div>
            </div>
          </div>
        ))}
      <button type="button" onClick={(e) => addSentence()}>
        Add sentence
      </button>
      <button type="submit">Save conversation</button>
    </form>
  );
}

export default CreationForm;
