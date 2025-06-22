import React, { Dispatch, Fragment, useEffect, useMemo, useState } from "react";
import "../../App.css";
import { Word } from "../../types";
import AutoComplete from "../../utils/Autocomplete";
import { useParams } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import { useData } from "../../contexts/DataContext";

type Callback = {
  _id?: string;
  label?: string;
  setLocalDescription: Dispatch<React.SetStateAction<string>>;
};

WordForm.defaultProps = {
  initialSourceWord: { _id: "", tags: [], text: "", translations: [] },
  initialTargetWord: { _id: "", tags: [], text: "", translations: [] },
};

function WordForm({ initialSourceWord, initialTargetWord }: { initialSourceWord: Word; initialTargetWord: Word }) {
  const [sourceWord, setSourceWord] = useState<Word | undefined>();
  const [targetWord, setTargetWord] = useState<Word | undefined>();
  const { wordId } = useParams();
  const { sourceLanguage: appSourceLanguage, targetLanguage: appTargetLanguage } = useLanguage();

  const { words, saveWord, saveWordTag, wordTags } = useData();

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
    [words, appSourceLanguage]
  );

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

  return (
    <Fragment>
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
                {sourceWord.translations.map((wordId, index) => (
                  <span>
                    {index !== 0 && <span>{", "}</span>}
                    <span key={index}>{words[wordId]?.text}</span>
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
                {targetWord.translations.map((wordId, index) => (
                  <span>
                    {index !== 0 && <span>{", "}</span>}
                    <span key={index}>{words[wordId]?.text}</span>
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

export default WordForm;
