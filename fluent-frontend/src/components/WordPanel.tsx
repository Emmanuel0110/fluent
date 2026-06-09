import React, { Dispatch, useEffect, useState } from "react";
import { Word } from "../types";
import AutoComplete from "../utils/Autocomplete";
import { useData } from "../contexts/DataContext";
import { useTranslation } from "react-i18next";

type Callback = {
  _id?: string;
  label?: string;
  setLocalDescription: Dispatch<React.SetStateAction<string>>;
};

type SaveState = "idle" | "saving" | "saved";

type DropdownItem = { _id: string; label: string };

type Props = {
  initialWord: Word | undefined;
  ownLanguage: string;
  otherLanguage: string;
  ownWords: DropdownItem[];
  otherWords: DropdownItem[];
  emptyPlaceholder: string;
};

function WordPanel({ initialWord, ownLanguage, otherLanguage, ownWords, otherWords, emptyPlaceholder }: Props) {
  const { t } = useTranslation();
  const { words, saveWord, saveWordTag, wordTags } = useData();
  const [word, setWord] = useState<Word | undefined>(initialWord);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  useEffect(() => {
    if (initialWord && !word) {
      setWord(initialWord);
    }
  }, [initialWord]);

  const handleSave = () => {
    if (!word) return;
    setSaveState("saving");
    saveWord(word).then(() => {
      setSaveState("saved");
      setTimeout(() => {
        setSaveState("idle");
        setWord(undefined);
      }, 1000);
    });
  };

  const selectWord = ({ _id, label, setLocalDescription }: Callback) => {
    if (label) {
      const labelId = ownWords.find((w) => w.label === label)?._id;
      if (labelId) {
        _id = labelId;
      }
    }
    if (_id) {
      setWord(words[_id]);
      setLocalDescription("");
    } else if (label) {
      saveWord({ _id: "", language: ownLanguage, text: label, translations: [], tags: [] }).then((newWord) => {
        if (newWord) {
          setWord(newWord);
          setLocalDescription("");
        }
      });
    }
  };

  const selectTranslation = ({ _id, label, setLocalDescription }: Callback) => {
    if (label) {
      const labelId = otherWords.find((w) => w.label === label)?._id;
      if (labelId) {
        _id = labelId;
      }
    }
    if (_id) {
      setWord((w) => (w ? { ...w, translations: [...w.translations, _id] } : undefined));
      setLocalDescription("");
    } else if (label && word) {
      saveWord({
        _id: "",
        language: otherLanguage,
        text: label,
        translations: [word._id],
        tags: [],
      }).then((newWord) => {
        if (newWord) {
          setWord({ ...word, translations: [...word.translations, newWord._id] });
          setLocalDescription("");
        }
      });
    }
  };

  const selectWordTag = ({ _id, label, setLocalDescription }: Callback) => {
    if (label) {
      const labelId = wordTags.find((tag) => tag.label === label)?._id;
      if (labelId) {
        _id = labelId;
      }
    }
    if (_id && word) {
      if (!word.tags.includes(_id)) setWord({ ...word, tags: [...word.tags, _id!] });
      setLocalDescription("");
    } else if (label && word) {
      saveWordTag({ language: ownLanguage, label }).then((tag) => {
        if (tag) {
          saveWord({ ...word, tags: [...word.tags, tag._id] }).then((newWord) => {
            if (newWord) {
              setWord(newWord);
              setLocalDescription("");
            }
          });
        }
      });
    }
  };

  if (!word) {
    return (
      <div className="autocomplete-field">
        <AutoComplete
          dropdownList={ownWords}
          callback={selectWord}
          placeholder={emptyPlaceholder}
          placement="bottom-start"
        />
      </div>
    );
  }

  return (
    <div className="word-display">
      <div className="word-text-display">
        <input
          className="word-text-input"
          value={word.text}
          onChange={(e) => setWord({ ...word, text: e.target.value })}
        />
        <span>{": "}</span>
        <span>
          {word.translations.map((translationId, index) => (
            <span key={translationId}>
              {index !== 0 && <span>{", "}</span>}
              <span>{words[translationId]?.text}</span>
              <span
                className="item-delete-btn"
                onClick={() =>
                  setWord({
                    ...word,
                    translations: word.translations.filter((id) => id !== translationId),
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
          dropdownList={otherWords.filter(({ _id }) => !word.translations.includes(_id))}
          callback={selectTranslation}
          placeholder={t("word.add_translation")}
          placement="bottom-start"
        />
      </div>
      {word.tags.length > 0 && (
        <div className="tags">
          {word.tags.map((tagId) => {
            const tag = wordTags.find((tag) => tag._id === tagId);
            return tag ? (
              <span key={tagId} className="word-tag">
                {tag.label}
                <span
                  className="item-delete-btn"
                  onClick={() => setWord({ ...word, tags: word.tags.filter((id) => id !== tagId) })}
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
          dropdownList={wordTags.filter(({ language }) => language === ownLanguage)}
          callback={selectWordTag}
          placeholder={t("word.add_tag")}
          placement="bottom-start"
        />
      </div>
      <div className="word-form-actions">
        <button onClick={handleSave} disabled={saveState !== "idle"}>
          {saveState === "saved" ? t("word.saved") : t("word.save")}
        </button>
        <button className="btn" onClick={() => setWord(undefined)}>
          {t("word.cancel")}
        </button>
      </div>
    </div>
  );
}

export default WordPanel;
