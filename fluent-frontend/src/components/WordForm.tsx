import React, { Dispatch, useEffect, useMemo, useState } from "react";
import "../App.css";
import { Word } from "../types";
import AutoComplete from "../utils/Autocomplete";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useData } from "../contexts/DataContext";
import { ConfirmDialog } from "./ConfirmDialog";

type Callback = {
  _id?: string;
  label?: string;
  setLocalDescription: Dispatch<React.SetStateAction<string>>;
};

type SaveState = "idle" | "saving" | "saved";

WordForm.defaultProps = {
  initialSourceWord: { _id: "", tags: [], text: "", translations: [] },
  initialTargetWord: { _id: "", tags: [], text: "", translations: [] },
};

function WordForm({ initialSourceWord, initialTargetWord }: { initialSourceWord: Word; initialTargetWord: Word }) {
  const [sourceWord, setSourceWord] = useState<Word | undefined>();
  const [targetWord, setTargetWord] = useState<Word | undefined>();
  const [sourceSaveState, setSourceSaveState] = useState<SaveState>("idle");
  const [targetSaveState, setTargetSaveState] = useState<SaveState>("idle");
  const [showDeleteSource, setShowDeleteSource] = useState(false);
  const [showDeleteTarget, setShowDeleteTarget] = useState(false);
  const { wordId } = useParams();
  const navigate = useNavigate();
  const { sourceLanguage: appSourceLanguage, targetLanguage: appTargetLanguage } = useLanguage();
  const { words, saveWord, saveWordTag, wordTags, deleteWord } = useData();

  useEffect(() => {
    setSourceWord(wordId ? words[wordId] : { ...initialSourceWord, language: appSourceLanguage });
    setTargetWord({ ...initialTargetWord, language: appTargetLanguage });
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
          message="Are you sure you want to delete this word?"
          onConfirm={() => {
            setShowDeleteSource(false);
            handleDelete(sourceWord._id);
          }}
          onCancel={() => setShowDeleteSource(false)}
        />
      )}
      {showDeleteTarget && targetWord && (
        <ConfirmDialog
          message="Are you sure you want to delete this word?"
          onConfirm={() => {
            setShowDeleteTarget(false);
            handleDelete(targetWord._id);
          }}
          onCancel={() => setShowDeleteTarget(false)}
        />
      )}
      <div id="sourceLanguage">
        <h3 className="word-form-section-title">Source Language</h3>
        <div className="prerequisiteInput">
          <AutoComplete
            dropdownList={sourceWords}
            callback={selectSourceWord}
            placeholder="Add source word"
            placement="bottom-start"
          />
        </div>
        {sourceWord?.text !== undefined && sourceWord.text !== "" && (
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
            <div className="prerequisiteInput">
              <AutoComplete
                dropdownList={targetWords.filter(({ _id }) => !sourceWord.translations.includes(_id))}
                callback={selectSourceTranslation}
                placeholder="Add translation"
                placement="bottom-start"
              />
            </div>
            {sourceWord.tags.length > 0 && (
              <div className="word-tags">
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
            <div className="prerequisiteInput">
              <AutoComplete
                dropdownList={wordTags.filter(({ language }) => language === appSourceLanguage)}
                callback={selectSourceWordTag}
                placeholder="Add tag"
                placement="bottom-start"
              />
            </div>
            <div className="word-form-actions">
              <button
                onClick={() => handleSave(sourceWord, setSourceWord, setSourceSaveState)}
                disabled={sourceSaveState !== "idle"}
              >
                {sourceSaveState === "saved" ? "Saved!" : "Save word"}
              </button>
              <button className="delete-btn" onClick={() => setShowDeleteSource(true)}>
                Delete word
              </button>
            </div>
          </div>
        )}
      </div>
      <div id="targetLanguage">
        <h3 className="word-form-section-title">Target Language</h3>
        <div className="prerequisiteInput">
          <AutoComplete
            dropdownList={targetWords}
            callback={selectTargetWord}
            placeholder="Add target word"
            placement="bottom-start"
          />
        </div>
        {targetWord?.text !== undefined && targetWord.text !== "" && (
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
            <div className="prerequisiteInput">
              <AutoComplete
                dropdownList={sourceWords.filter(({ _id }) => !targetWord.translations.includes(_id))}
                callback={selectTargetTranslation}
                placeholder="Add translation"
                placement="bottom-start"
              />
            </div>
            {targetWord.tags.length > 0 && (
              <div className="word-tags">
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
            <div className="prerequisiteInput">
              <AutoComplete
                dropdownList={wordTags.filter(({ language }) => language === appTargetLanguage)}
                callback={selectTargetWordTag}
                placeholder="Add tag"
                placement="bottom-start"
              />
            </div>
            <div className="word-form-actions">
              <button
                onClick={() => handleSave(targetWord, setTargetWord, setTargetSaveState)}
                disabled={targetSaveState !== "idle"}
              >
                {targetSaveState === "saved" ? "Saved!" : "Save word"}
              </button>
              <button className="delete-btn" onClick={() => setShowDeleteTarget(true)}>
                Delete word
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WordForm;
