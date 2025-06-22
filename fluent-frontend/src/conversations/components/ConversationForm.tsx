import React, { Dispatch, Fragment, useEffect, useMemo, useState } from "react";
import "../../App.css";
import { Conversation, ConversationTag, Word } from "../../types";
import AutoComplete from "../../utils/Autocomplete";
import { WordLine } from "./WordLine";
import { useParams } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import { useData } from "../../contexts/DataContext";

type SourceOrTarget = "sourceLanguage" | "targetLanguage";
type Callback = {
  _id?: string;
  label?: string;
  setLocalDescription: Dispatch<React.SetStateAction<string>>;
};

ConversationForm.defaultProps = {
  initialConversation: { _id: "", tags: [], multiLingualSentences: [], subscribed: false },
};

function ConversationForm({ initialConversation }: { initialConversation: Conversation }) {
  const [conversation, setConversation] = useState<Conversation | undefined>();
  const [conversationTag, setConversationTag] = useState<ConversationTag | undefined>();
  const { conversationId } = useParams();
  const { sourceLanguage: appSourceLanguage, targetLanguage: appTargetLanguage } = useLanguage();
  const { words, conversations, saveConversation, conversationTags, saveConversationTag } = useData();

  useEffect(() => {
    setConversation(conversationId ? conversations.find(({ _id }) => _id === conversationId) : initialConversation);
  }, []);

  const getWordList = (words: { [key: string]: Word }, language: string) => {
    return Object.values(words)
      .filter((word) => word.language === language)
      .map(({ _id, text }) => ({ _id, label: text }));
  };

  const [sourceWords, targetWords] = useMemo(
    () => [getWordList(words, appSourceLanguage), getWordList(words, appTargetLanguage)],
    [words, appSourceLanguage]
  );

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

  const selectConversationTag = ({ _id, label, setLocalDescription }: Callback) => {
    if (_id) {
      setConversationTag(conversationTags.find((tag) => tag._id === _id));
      setLocalDescription("");
    }
  };

  const changeConversationTagTranslation = (text: string) => {
    setConversationTag((tag) => (tag ? { ...tag, targetLabel: text } : undefined));
  };

  const addTagToConversation = () => {
    setConversation((conversation) =>
      conversation
        ? { ...conversation, tags: conversationTag ? [...conversation.tags, conversationTag._id] : conversation.tags }
        : undefined
    );
    setConversationTag(undefined);
  };

  return (
    <Fragment>
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
                  dropdownList={sourceWords}
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
                  dropdownList={targetWords}
                  callback={addPrerequisite(index, "targetLanguage")}
                  placeholder="Add prerequisite"
                  placement="bottom-start"
                />
              </div>
            </div>
          </div>
        ))}
      <button type="button" onClick={(e) => addSentence()}>
        Add sentence
      </button>
      <div className="prerequisiteInput">
        <AutoComplete
          dropdownList={conversationTags.map(({ _id, sourceLabel }) => ({ _id, label: sourceLabel }))}
          callback={selectConversationTag}
          placeholder="Add tag"
          placement="bottom-start"
        />
      </div>
      {conversationTag && (
        <div>
          <div>{`${conversationTag.sourceLabel}: ${conversationTag.targetLabel}`}</div>
          <input
            type="text"
            value={conversationTag.targetLabel}
            onChange={(e) => changeConversationTagTranslation(e.target.value)}
          />
          <button onClick={() => saveConversationTag(conversationTag)}>Save tag translation</button>
          <button onClick={() => addTagToConversation()}>Add tag to conversation</button>
        </div>
      )}
      <button
        onClick={() => {
          if (conversation) {
            saveConversation(conversation);
          }
        }}
      >
        Save conversation
      </button>
    </Fragment>
  );
}

export default ConversationForm;
