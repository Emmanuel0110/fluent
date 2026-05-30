import React, { Dispatch, useEffect, useMemo, useState } from "react";
import "../App.css";
import { Conversation, ConversationTag, Word } from "../types";
import AutoComplete from "../utils/Autocomplete";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useData } from "../contexts/DataContext";
import { SentenceEdit } from "./SentenceEdit";
import { useTranslation } from "react-i18next";

type Callback = {
  _id?: string;
  label?: string;
  setLocalDescription: Dispatch<React.SetStateAction<string>>;
};

const emptyConversation: Conversation = { _id: "", tags: [], multiLingualSentences: [], subscribed: false };

function ConversationForm({ initialConversation = emptyConversation }: { initialConversation?: Conversation }) {
  const { t } = useTranslation();
  const [conversation, setConversation] = useState<Conversation | undefined>();
  const [conversationTag, setConversationTag] = useState<ConversationTag | undefined>();
  const { conversationId } = useParams();
  const navigate = useNavigate();
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
    [words, appSourceLanguage],
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
        : undefined,
    );
  };

  const selectConversationTag = ({ _id, setLocalDescription }: Callback) => {
    if (_id) {
      setConversationTag(conversationTags.find((tag) => tag._id === _id));
      setLocalDescription("");
    }
  };

  const changeConversationTagTranslation = (text: string) => {
    setConversationTag((tag) => (tag ? { ...tag, targetLabel: text } : undefined));
  };

  const addTagToConversation = () => {
    if (conversationTag) {
      setConversation((conversation) =>
        conversation && !conversation.tags.includes(conversationTag._id)
          ? { ...conversation, tags: [...conversation.tags, conversationTag._id] }
          : conversation,
      );
    }
    setConversationTag(undefined);
  };

  const removeTagFromConversation = (tagId: string) => {
    setConversation((conversation) =>
      conversation ? { ...conversation, tags: conversation.tags.filter((id) => id !== tagId) } : undefined,
    );
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
              placeholder={t("conversation.source_sentence")}
              setConversation={setConversation}
              index={index}
            />
            <SentenceEdit
              type="targetLanguage"
              listOfWords={targetWords}
              style="targetSentence"
              sentence={sentence.targetLanguage}
              placeholder={t("conversation.target_sentence")}
              setConversation={setConversation}
              index={index}
            />
          </div>
        ))}
      <div className="conversation-form-actions">
        <button type="button" onClick={() => addSentence()}>
          {t("conversation.add_sentence")}
        </button>
      </div>
      <div className="conversation-tag-section">
        {conversation && conversation.tags.length > 0 && (
          <div className="tags">
            {conversation.tags.map((tagId) => {
              const tag = conversationTags.find((t) => t._id === tagId);
              return tag ? (
                <span key={tagId} className="word-tag">
                  {tag.sourceLabel}
                  <span className="item-delete-btn" onClick={() => removeTagFromConversation(tagId)}>
                    ×
                  </span>
                </span>
              ) : null;
            })}
          </div>
        )}
        <div className="autocomplete-field">
          <AutoComplete
            dropdownList={conversationTags.map(({ _id, sourceLabel }) => ({ _id, label: sourceLabel }))}
            callback={selectConversationTag}
            placeholder={t("conversation.add_tag")}
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
              placeholder={t("conversation.tag_translation")}
            />
            <div className="conversation-tag-actions">
              <button onClick={() => saveConversationTag(conversationTag)}>{t("conversation.save_tag")}</button>
              <button onClick={() => addTagToConversation()}>{t("conversation.add_tag_to")}</button>
            </div>
          </div>
        )}
      </div>
      <div className="conversation-form-actions">
        <button
          onClick={async () => {
            if (conversation) {
              const id = await saveConversation(conversation);
              if (id) navigate("/conversations/" + id);
            }
          }}
        >
          {t("conversation.save")}
        </button>
      </div>
    </div>
  );
}

export default ConversationForm;
