import React, { Dispatch, useEffect, useMemo, useState } from "react";
import "../App.css";
import { Conversation, ConversationTag, Word } from "../types";
import AutoComplete from "../utils/Autocomplete";
import { useParams } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useData } from "../contexts/DataContext";
import { SentenceEdit } from "./SentenceEdit";

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
    <div className="conversation-form">
      {conversation &&
        conversation.multiLingualSentences.map((sentence, index) => (
          <div key={index} className="conversation-sentence-group">
            <SentenceEdit
              type="sourceLanguage"
              listOfWords={sourceWords}
              style="sourceSentence"
              sentence={sentence.sourceLanguage}
              placeholder="Source sentence"
              setConversation={setConversation}
              index={index}
            />
            <SentenceEdit
              type="targetLanguage"
              listOfWords={targetWords}
              style="targetSentence"
              sentence={sentence.targetLanguage}
              placeholder="Target sentence"
              setConversation={setConversation}
              index={index}
            />
          </div>
        ))}
      <div className="conversation-form-actions">
        <button type="button" onClick={(e) => addSentence()}>
          Add sentence
        </button>
      </div>
      <div className="conversation-tag-section">
        <div className="prerequisiteInput">
          <AutoComplete
            dropdownList={conversationTags.map(({ _id, sourceLabel }) => ({ _id, label: sourceLabel }))}
            callback={selectConversationTag}
            placeholder="Add tag"
            placement="bottom-start"
          />
        </div>
        {conversationTag && (
          <div className="conversation-tag-display">
            <div>{`${conversationTag.sourceLabel}: ${conversationTag.targetLabel}`}</div>
            <input
              type="text"
              value={conversationTag.targetLabel}
              onChange={(e) => changeConversationTagTranslation(e.target.value)}
              placeholder="Tag translation"
            />
            <div className="conversation-tag-actions">
              <button onClick={() => saveConversationTag(conversationTag)}>Save tag translation</button>
              <button onClick={() => addTagToConversation()}>Add tag to conversation</button>
            </div>
          </div>
        )}
      </div>
      <div className="conversation-form-actions">
        <button
          onClick={() => {
            if (conversation) {
              saveConversation(conversation);
            }
          }}
        >
          Save conversation
        </button>
      </div>
    </div>
  );
}

export default ConversationForm;
