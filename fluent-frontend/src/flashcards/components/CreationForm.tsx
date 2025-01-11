import React, { Dispatch, Fragment, useContext, useEffect, useMemo, useState } from "react";
import "../../App.css";
import { Context, Conversation, ConversationTag, Word } from "../../types";
import { ConfigContext } from "../../App";
import AutoComplete from "../../utils/Autocomplete";
import { WordLine } from "./WordLine";

type SourceOrTarget = "sourceLanguage" | "targetLanguage";
type Callback = {
  _id?: string;
  label?: string;
  setLocalDescription: Dispatch<React.SetStateAction<string>>;
};

CreationForm.defaultProps = {
  initialConversation: { _id: "", tags: [], multiLingualSentences: [], subscribed: false },
  initialSourceWord: { _id: "", tags: [], sourcelanguage: "", targetLanguage: [] },
  initialTargetWord: { _id: "", tags: [], sourcelanguage: "", targetLanguage: [] },
};

function CreationForm({
  initialConversation,
  initialSourceWord,
  initialTargetWord,
}: {
  initialConversation: Conversation;
  initialSourceWord: Word;
  initialTargetWord: Word;
}) {
  const [conversation, setConversation] = useState<Conversation | undefined>();
  const [conversationTag, setConversationTag] = useState<ConversationTag | undefined>();
  const [sourceWord, setSourceWord] = useState<Word | undefined>();
  const [targetWord, setTargetWord] = useState<Word | undefined>();

  const {
    words,
    saveWord,
    saveWordTag,
    saveConversation,
    conversationTags,
    wordTags,
    saveConversationTag,
    sourceLanguage: appSourceLanguage,
    targetLanguage: appTargetLanguage,
  } = useContext(ConfigContext) as Context;

  useEffect(() => {
    setConversation(initialConversation);
    setSourceWord({ ...initialSourceWord, language: appSourceLanguage });
    setTargetWord({ ...initialTargetWord, language: appTargetLanguage });
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

  const selectSourceWord = ({ _id, label, setLocalDescription }: Callback) => {
    if (label) {
      const labelId = sourceWords.find((word) => word.label === label)?._id;
      if (labelId) {
        _id = labelId;
      }
    }
    if (_id) {
      setSourceWord(words[_id]);
      setLocalDescription("");
    } else if (label && sourceWord) {
      saveWord({ ...sourceWord, text: label }).then((word) => {
        if (word) {
          setSourceWord(word);
          setLocalDescription("");
        }
      });
    }
  };

  const selectSourceTranslation = ({ _id, label, setLocalDescription }: Callback) => {
    if (label) {
      const labelId = targetWords.find((word) => word.label === label)?._id;
      if (labelId) {
        _id = labelId;
      }
    }
    if (_id) {
      setSourceWord((word) => (word ? { ...word, translations: [...word.translations, _id!] } : undefined)); // TS2345 error if I don't put a !
      setLocalDescription("");
    } else if (label && sourceWord) {
      saveWord({
        _id: "",
        language: appTargetLanguage,
        text: label,
        translations: [sourceWord._id],
        tags: [],
        subscribed: false,
      }).then((word) => {
        if (word) {
          setSourceWord({ ...sourceWord, translations: [...sourceWord.translations, word._id] });
          setLocalDescription("");
        }
      });
    }
  };

  const selectSourceWordTag = ({ _id, label, setLocalDescription }: Callback) => {
    if (label) {
      const labelId = wordTags.find((word) => word.label === label)?._id;
      if (labelId) {
        _id = labelId;
      }
    }
    if (_id && sourceWord) {
      if (!sourceWord.tags.includes(_id))
      setSourceWord({ ...sourceWord, tags: [...sourceWord.tags, _id!] });
      setLocalDescription("");
    } else if (label && sourceWord) {
      saveWordTag({language: appSourceLanguage, label}).then((tag) => {
        if (tag) {
          saveWord({ ...sourceWord, tags: [...sourceWord.tags, tag._id] }).then((word) => {
            if (word) {
              setSourceWord(word);
              setLocalDescription("");
            }
          });
        }
      });
    }
  };

  const selectTargetWordTag = ({ _id, label, setLocalDescription }: Callback) => {
    if (label) {
      const labelId = wordTags.find((word) => word.label === label)?._id;
      if (labelId) {
        _id = labelId;
      }
    }
    if (_id && targetWord) {
      if (!targetWord.tags.includes(_id))
      setTargetWord({ ...targetWord, tags: [...targetWord.tags, _id!] });
      setLocalDescription("");
    } else if (label && targetWord) {
      saveWordTag({language: appTargetLanguage, label}).then((tag) => {
        if (tag) {
          saveWord({ ...targetWord, tags: [...targetWord.tags, tag._id] }).then((word) => {
            if (word) {
              setSourceWord(word);
              setLocalDescription("");
            }
          });
        }
      });
    }
  };


  const selectTargetWord = ({ _id, label, setLocalDescription }: Callback) => {
    if (label) {
      const labelId = targetWords.find((word) => word.label === label)?._id;
      if (labelId) {
        _id = labelId;
      }
    }
    if (_id) {
      setTargetWord(words[_id]);
      setLocalDescription("");
    } else if (label && targetWord) {
      saveWord({ ...targetWord, text: label }).then((word) => {
        if (word) {
          setTargetWord(word);
          setLocalDescription("");
        }
      });
    }
  };

  const selectTargetTranslation = ({ _id, label, setLocalDescription }: Callback) => {
    if (label) {
      const labelId = sourceWords.find((word) => word.label === label)?._id;
      if (labelId) {
        _id = labelId;
      }
    }
    if (_id) {
      setTargetWord((word) => (word ? { ...word, targetLanguage: [...word.translations, _id!] } : undefined));
      setLocalDescription("");
    } else if (label && targetWord) {
      saveWord({
        _id: "",
        language: appSourceLanguage,
        text: label,
        translations: [targetWord._id],
        tags: [],
        subscribed: false,
      }).then((word) => {
        if (word) {
          setTargetWord({ ...targetWord, translations: [...targetWord.translations, word._id] });
        }
      });
    }
  };

  const removePrerequisite = (sentenceIndex: number, prerequisiteIndex: number, sourceOrTarget: SourceOrTarget) => {};

  const addTag = (tagId: string) => {};

  const removeTag = (index: number) => {};

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

      <div id="sourceLanguage">
        <div className="prerequisiteInput">
          <AutoComplete
            dropdownList={sourceWords}
            callback={selectSourceWord}
            placeholder="Add source word"
            placement="bottom-start"
          />
        </div>
        {sourceWord?.text && (
          <div>
            <div>
              <span>{`${sourceWord.text}: `}</span>
              <span>
                {sourceWord.translations.map((wordId) => (
                  <span>{words[wordId].text}</span>
                ))}
              </span>
            </div>
            <div className="prerequisiteInput">
              <AutoComplete
                dropdownList={targetWords.filter(({ _id }) => !sourceWord.translations.includes(_id))}
                callback={selectSourceTranslation}
                placeholder="Add translation"
                placement="bottom-start"
              />
            </div>
            {sourceWord.tags.map((tagId) => {
              const tag = wordTags.find((tag) => tag._id === tagId);
              return tag ? <div>{tag.label}</div> : undefined;
            })}
            <div className="prerequisiteInput">
              <AutoComplete
                dropdownList={wordTags.filter(({ language }) => language === appSourceLanguage)}
                callback={selectSourceWordTag}
                placeholder="Add tag"
                placement="bottom-start"
              />
            </div>
            <button onClick={() => saveWord(sourceWord)}>Save word</button>
          </div>
        )}
      </div>
      <div id="targetLanguage">
        <div className="prerequisiteInput">
          <AutoComplete
            dropdownList={targetWords}
            callback={selectTargetWord}
            placeholder="Add target word"
            placement="bottom-start"
          />
        </div>
        {targetWord?.text && (
          <div>
            <div>
              <span>{`${targetWord.text}: `}</span>
              <span>
                {targetWord.translations.map((wordId) => (
                  <span>{words[wordId].text}</span>
                ))}
              </span>
            </div>
            <div className="prerequisiteInput">
              <AutoComplete
                dropdownList={sourceWords.filter(({ _id }) => !targetWord.translations.includes(_id))}
                callback={selectTargetTranslation}
                placeholder="Add translation"
                placement="bottom-start"
              />
            </div>
            {targetWord.tags.map((tagId) => {
              const tag = wordTags.find((tag) => tag._id === tagId);
              return tag ? <div>{tag.label}</div> : undefined;
            })}
            <div className="prerequisiteInput">
              <AutoComplete
                dropdownList={wordTags.filter(({ language }) => language === appTargetLanguage)}
                callback={selectTargetWordTag}
                placeholder="Add tag"
                placement="bottom-start"
              />
            </div>
            <button onClick={() => saveWord(targetWord)}>Save word</button>
          </div>
        )}
      </div>
    </Fragment>
  );
}

export default CreationForm;
