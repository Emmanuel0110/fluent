import React, { Dispatch, useEffect, useMemo, useState } from "react";
import "../App.css";
import { Word } from "../types";
import AutoComplete from "../utils/Autocomplete";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useData } from "../contexts/DataContext";
import { ConfirmDialog } from "./ConfirmDialog";
import { useTranslation } from "react-i18next";

type Callback = {
  _id?: string;
  label?: string;
  setLocalDescription: Dispatch<React.SetStateAction<string>>;
};

type SaveState = "idle" | "saving" | "saved";

const getWordList = (words: { [key: string]: Word }, language: string) => {
  return Object.values(words)
    .filter((word) => word.language === language)
    .map(({ _id, text }) => ({ _id, label: text }));
};

function WordForm() {
  const { t } = useTranslation();
  const { wordId } = useParams();
  const navigate = useNavigate();
  const { sourceLanguage: appSourceLanguage, targetLanguage: appTargetLanguage } = useLanguage();
  const { words, saveWord, saveWordTag, wordTags, deleteWord } = useData();
  const initialWord = wordId ? words[wordId] : undefined;
  const [sourceWord, setSourceWord] = useState<Word | undefined>(
    initialWord?.language === appSourceLanguage ? initialWord : undefined,
  );
  const [targetWord, setTargetWord] = useState<Word | undefined>(
    initialWord?.language === appTargetLanguage ? initialWord : undefined,
  );
  const [sourceSaveState, setSourceSaveState] = useState<SaveState>("idle");
  const [targetSaveState, setTargetSaveState] = useState<SaveState>("idle");
  const [showDeleteSource, setShowDeleteSource] = useState(false);
  const [showDeleteTarget, setShowDeleteTarget] = useState(false);

  useEffect(() => {
    if (wordId && words[wordId]) {
      const word = words[wordId];
      if (word.language === appSourceLanguage && !sourceWord) {
        setSourceWord(word);
      } else if (word.language === appTargetLanguage && !targetWord) {
        setTargetWord(word);
      }
    }
  }, [words, wordId]);

  const [sourceWords, targetWords] = useMemo(
    () => [getWordList(words, appSourceLanguage), getWordList(words, appTargetLanguage)],
    [words, appSourceLanguage],
  );

  const handleSave = (
    word: Word,
    setWord: Dispatch<React.SetStateAction<Word | undefined>>,
    setSaveState: Dispatch<React.SetStateAction<SaveState>>,
  ) => {
    setSaveState("saving");
    saveWord(word).then((savedWord) => {
      if (savedWord) setWord(savedWord);
      setSaveState("saved");
      setTimeout(() => setSaveState("idle"), 1000);
    });
  };

  const handleDelete = (id: string) => {
    deleteWord(id).then(() => navigate("/words"));
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
    } else if (label) {
      saveWord({ _id: "", language: appSourceLanguage, text: label, translations: [], tags: [] }).then((word) => {
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
      setSourceWord((word) => (word ? { ...word, translations: [...word.translations, _id] } : undefined));
      setLocalDescription("");
    } else if (label && sourceWord) {
      saveWord({
        _id: "",
        language: appTargetLanguage,
        text: label,
        translations: [sourceWord._id],
        tags: [],
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
      if (!sourceWord.tags.includes(_id)) setSourceWord({ ...sourceWord, tags: [...sourceWord.tags, _id!] });
      setLocalDescription("");
    } else if (label && sourceWord) {
      saveWordTag({ language: appSourceLanguage, label }).then((tag) => {
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
      if (!targetWord.tags.includes(_id)) setTargetWord({ ...targetWord, tags: [...targetWord.tags, _id!] });
      setLocalDescription("");
    } else if (label && targetWord) {
      saveWordTag({ language: appTargetLanguage, label }).then((tag) => {
        if (tag) {
          saveWord({ ...targetWord, tags: [...targetWord.tags, tag._id] }).then((word) => {
            if (word) {
              setTargetWord(word);
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
    } else if (label) {
      saveWord({ _id: "", language: appTargetLanguage, text: label, translations: [], tags: [] }).then((word) => {
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
      setTargetWord((word) => (word ? { ...word, translations: [...word.translations, _id] } : undefined));
      setLocalDescription("");
    } else if (label && targetWord) {
      saveWord({
        _id: "",
        language: appSourceLanguage,
        text: label,
        translations: [targetWord._id],
        tags: [],
      }).then((word) => {
        if (word) {
          setTargetWord({ ...targetWord, translations: [...targetWord.translations, word._id] });
        }
      });
    }
  };

  return (
    <div className="word-form">
      {showDeleteSource && sourceWord && (
        <ConfirmDialog
          message={t("word.delete_confirm")}
          onConfirm={() => {
            setShowDeleteSource(false);
            handleDelete(sourceWord._id);
          }}
          onCancel={() => setShowDeleteSource(false)}
        />
      )}
      {showDeleteTarget && targetWord && (
        <ConfirmDialog
          message={t("word.delete_confirm")}
          onConfirm={() => {
            setShowDeleteTarget(false);
            handleDelete(targetWord._id);
          }}
          onCancel={() => setShowDeleteTarget(false)}
        />
      )}
      <div id="sourceLanguage">
        <h3 className="word-form-section-title">{t("word.source_language")}</h3>
        {!sourceWord && (
          <div className="autocomplete-field">
            <AutoComplete
              dropdownList={sourceWords}
              callback={selectSourceWord}
              placeholder={t("word.add_source")}
              placement="bottom-start"
            />
          </div>
        )}
        {sourceWord && (
          <div className="word-display">
            <div className="word-text-display">
              <input
                className="word-text-input"
                value={sourceWord.text}
                onChange={(e) => setSourceWord({ ...sourceWord, text: e.target.value })}
              />
              <span>{": "}</span>
              <span>
                {sourceWord.translations.map((translationId, index) => (
                  <span key={translationId}>
                    {index !== 0 && <span>{", "}</span>}
                    <span>{words[translationId]?.text}</span>
                    <span
                      className="item-delete-btn"
                      onClick={() =>
                        setSourceWord({
                          ...sourceWord,
                          translations: sourceWord.translations.filter((id) => id !== translationId),
                        })
                      }
                    >
                      ×
                    </span>
                  </span>
                ))}
              </span>
            </div>
            <div className="autocomplete-field">
              <AutoComplete
                dropdownList={targetWords.filter(({ _id }) => !sourceWord.translations.includes(_id))}
                callback={selectSourceTranslation}
                placeholder={t("word.add_translation")}
                placement="bottom-start"
              />
            </div>
            {sourceWord.tags.length > 0 && (
              <div className="tags">
                {sourceWord.tags.map((tagId) => {
                  const tag = wordTags.find((tag) => tag._id === tagId);
                  return tag ? (
                    <span key={tagId} className="word-tag">
                      {tag.label}
                      <span
                        className="item-delete-btn"
                        onClick={() =>
                          setSourceWord({ ...sourceWord, tags: sourceWord.tags.filter((id) => id !== tagId) })
                        }
                      >
                        ×
                      </span>
                    </span>
                  ) : undefined;
                })}
              </div>
            )}
            <div className="autocomplete-field">
              <AutoComplete
                dropdownList={wordTags.filter(({ language }) => language === appSourceLanguage)}
                callback={selectSourceWordTag}
                placeholder={t("word.add_tag")}
                placement="bottom-start"
              />
            </div>
            <div className="word-form-actions">
              <button
                onClick={() => handleSave(sourceWord, setSourceWord, setSourceSaveState)}
                disabled={sourceSaveState !== "idle"}
              >
                {sourceSaveState === "saved" ? t("word.saved") : t("word.save")}
              </button>
              <button className="delete-btn" onClick={() => setShowDeleteSource(true)}>
                {t("word.delete")}
              </button>
            </div>
          </div>
        )}
      </div>
      <div id="targetLanguage">
        <h3 className="word-form-section-title">{t("word.target_language")}</h3>
        {!targetWord && (
          <div className="autocomplete-field">
            <AutoComplete
              dropdownList={targetWords}
              callback={selectTargetWord}
              placeholder={t("word.add_target")}
              placement="bottom-start"
            />
          </div>
        )}
        {targetWord && (
          <div className="word-display">
            <div className="word-text-display">
              <input
                className="word-text-input"
                value={targetWord.text}
                onChange={(e) => setTargetWord({ ...targetWord, text: e.target.value })}
              />
              <span>{": "}</span>
              <span>
                {targetWord.translations.map((translationId, index) => (
                  <span key={translationId}>
                    {index !== 0 && <span>{", "}</span>}
                    <span>{words[translationId]?.text}</span>
                    <span
                      className="item-delete-btn"
                      onClick={() =>
                        setTargetWord({
                          ...targetWord,
                          translations: targetWord.translations.filter((id) => id !== translationId),
                        })
                      }
                    >
                      ×
                    </span>
                  </span>
                ))}
              </span>
            </div>
            <div className="autocomplete-field">
              <AutoComplete
                dropdownList={sourceWords.filter(({ _id }) => !targetWord.translations.includes(_id))}
                callback={selectTargetTranslation}
                placeholder={t("word.add_translation")}
                placement="bottom-start"
              />
            </div>
            {targetWord.tags.length > 0 && (
              <div className="tags">
                {targetWord.tags.map((tagId) => {
                  const tag = wordTags.find((tag) => tag._id === tagId);
                  return tag ? (
                    <span key={tagId} className="word-tag">
                      {tag.label}
                      <span
                        className="item-delete-btn"
                        onClick={() =>
                          setTargetWord({ ...targetWord, tags: targetWord.tags.filter((id) => id !== tagId) })
                        }
                      >
                        ×
                      </span>
                    </span>
                  ) : undefined;
                })}
              </div>
            )}
            <div className="autocomplete-field">
              <AutoComplete
                dropdownList={wordTags.filter(({ language }) => language === appTargetLanguage)}
                callback={selectTargetWordTag}
                placeholder={t("word.add_tag")}
                placement="bottom-start"
              />
            </div>
            <div className="word-form-actions">
              <button
                onClick={() => handleSave(targetWord, setTargetWord, setTargetSaveState)}
                disabled={targetSaveState !== "idle"}
              >
                {targetSaveState === "saved" ? t("word.saved") : t("word.save")}
              </button>
              <button className="delete-btn" onClick={() => setShowDeleteTarget(true)}>
                {t("word.delete")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WordForm;
