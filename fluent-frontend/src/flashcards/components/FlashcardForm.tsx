import "../../App.css";
import { Dispatch, useContext, useEffect, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import { ConfigContext, url } from "../../App";
import { Context, Language, MultiLingualSentence, Sentence, Word } from "../../types";
import { Flashcard, Tag } from "../../types";
import AutoComplete from "../../utils/Autocomplete";
import { WordLine } from "./WordLine";
import { authHeaders, customFetch } from "../../utils/http-helpers";

export default function FlashcardForm(
  {
  multiLingualSentenceId,
  sourceSentence,
  sourcePrerequisites,
  targetSentence,
  targetPrerequisites,
  updateUnsavedData,
}: {
  multiLingualSentenceId: string;
  sourceSentence: Sentence;
  sourcePrerequisites: Word[];
  targetSentence: Sentence;
  targetPrerequisites: Word[];
  updateUnsavedData: (id: string, args: Partial<Sentence>) => void;
}
) {
  const newSourceWordTextRef = useRef<HTMLInputElement | null>(null);
  const newTargetWordTextRef = useRef<HTMLInputElement | null>(null);
  const selectedSourceWordRef = useRef<Word | null>(null);
  const selectedSourceTranslationRef = useRef<Word | null>(null);
  const selectedTargetWordRef = useRef<Word | null>(null);
  const selectedTargetTranslationRef = useRef<Word | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");

  const {
    flashcards,
    words,
    setWords,
    tags,
    setTags,
    setOpenedMultiLingualSentences,
    saveSentence,
    saveAsNewFlashcard,
  } = useContext(ConfigContext) as Context;

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const save = ({ _id, text, prerequisites }: Sentence) => {
    saveSentence({
      _id,
      text,
      prerequisites,
    });
  }
  
  const onSave = () => {
    save(sourceSentence);
    save(targetSentence);
    setOpenedMultiLingualSentences((openedMultiLingualSentences) =>
      openedMultiLingualSentences.map((openedMultiLingualSentence) =>
        openedMultiLingualSentence.id === multiLingualSentenceId
          ? { ...openedMultiLingualSentence, data: openedMultiLingualSentence.unsavedData!, unsavedData: undefined }
          : openedMultiLingualSentence
      )
    );
  };

  // const addTag = ({
  //   _id,
  //   label,
  //   setLocalDescription,
  // }: {
  //   _id?: string;
  //   label?: string;
  //   setLocalDescription: Dispatch<React.SetStateAction<string>>;
  // }) => {
  //   if (_id && (!flashcard || !flashcard.tags.map((tag) => tag._id).includes(_id))) {
  //     updateUnsavedData(flashcard._id, { tags: [...flashcard.tags, tags.find((tag: Tag) => tag._id === _id)!] });
  //     setLocalDescription("");
  //   } else if (label && !tags.map((tag) => tag.label).includes(label)) {
  //     saveNewTag({ label }).then(({ data: tag }) => {
  //       setTags((tags: Tag[]) => [...tags, tag]);
  //       updateUnsavedData(flashcard._id, { tags: [...flashcard.tags, tag] });
  //       setLocalDescription("");
  //     });
  //   }
  // };

  // const availableTags = tags
  //   .filter((tag) => !flashcard.tags.map((tag) => tag._id).includes(tag._id))
  //   .map((tag) => ({ ...tag, label: "#" + tag.label }));

  const availableWordsIds = (language: string, sentence: Sentence) => words[language]
    .map(({ _id, text }) => ({ _id, label: text }))
    .filter(({ _id }) => !sentence.prerequisites.includes(_id));

  // const onPastePrerequisiteId = (e: React.ClipboardEvent) => {
  //   e.preventDefault();
  //   const copiedText = e.clipboardData.getData("Text");
  //   if (copiedText.length === 24 && !prerequisiteFlashcards.find(({ _id }) => _id === copiedText)) {
  //     getFlashcardById(copiedText).then((prerequisite) => {
  //       if (prerequisite) {
  //         updateUnsavedData(flashcard._id, { prerequisites: [...flashcard.prerequisites, prerequisite._id] });
  //       }
  //     });
  //   }
  // };

  const addPrerequisite = (sentence: Sentence) => ({
    _id,
    label,
    setLocalDescription,
  }: {
    _id?: string;
    label?: string;
    setLocalDescription: Dispatch<React.SetStateAction<string>>;
  }) => {
    if (_id) {
      updateUnsavedData(sentence._id, { prerequisites: [...sentence.prerequisites, _id] });
      setLocalDescription("");
    } else if (label) {
      saveAsNewFlashcard({ title: "", question: label, answer: "" }).then(({ _id }) =>
        updateUnsavedData(sentence._id, { prerequisites: [...sentence.prerequisites, _id] })
      );
      setLocalDescription("");
    }
  };

  const removePrerequisite = (sentence: Sentence, index: number) => {
    updateUnsavedData(sentence._id, { prerequisites: sentence.prerequisites.filter((el, idx) => idx !== index) });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "s":
        if (e.ctrlKey) {
          e.preventDefault();
          onSave();
        }
        break;
    }
  };

  const selectSourceWord = ({
    _id,
    label,
    setLocalDescription,
  }: {
    _id?: string;
    label?: string;
    setLocalDescription: Dispatch<React.SetStateAction<string>>;
  }) => {
    if (_id) {
      let sourceWord = words[sourceLanguage].find((word) => word._id === _id);
      selectedSourceWordRef.current = sourceWord || null;
      setLocalDescription(sourceWord?.text || "");
    } else if (label) {
      setLocalDescription("");
    }
  };

  const selectSourceTranslation = ({
    _id,
    label,
    setLocalDescription,
  }: {
    _id?: string;
    label?: string;
    setLocalDescription: Dispatch<React.SetStateAction<string>>;
  }) => {
    if (_id) {
      let translationWord = words[targetLanguage].find((word) => word._id === _id);
      selectedSourceTranslationRef.current = translationWord || null;
      setLocalDescription(translationWord?.text || "");
    } else if (label) {
      setLocalDescription("");
    }
  };

  const selectTargetWord = ({
    _id,
    label,
    setLocalDescription,
  }: {
    _id?: string;
    label?: string;
    setLocalDescription: Dispatch<React.SetStateAction<string>>;
  }) => {
    if (_id) {
      let sourceWord = words[targetLanguage].find((word) => word._id === _id);
      selectedTargetWordRef.current = sourceWord || null;
      setLocalDescription(sourceWord?.text || "");
    } else if (label) {
      setLocalDescription("");
    }
  };

  const selectTargetTranslation = ({
    _id,
    label,
    setLocalDescription,
  }: {
    _id?: string;
    label?: string;
    setLocalDescription: Dispatch<React.SetStateAction<string>>;
  }) => {
    if (_id) {
      let translationWord = words[sourceLanguage].find((word) => word._id === _id);
      selectedTargetTranslationRef.current = translationWord || null;
      setLocalDescription(translationWord?.text || "");
    } else if (label) {
      setLocalDescription("");
    }
  };

  const saveNewTranslation = (source: React.MutableRefObject<Word | null>, target: React.MutableRefObject<Word | null>) => () => {
    const sourceWord = source.current;
    const targetWord = target.current;
    if (sourceWord && targetWord) {
      const formattedArgs1 = {
        $addToSet: { [targetWord.sourceLanguage]: targetWord._id, targetLanguages: targetLanguage },
      };
      let body = JSON.stringify(formattedArgs1);
      customFetch(url + "words/" + sourceWord._id, { method: "PATCH", headers: authHeaders(), body })
        .then(({ data: patchedWord }) => {
          setWords((words) => ({
            ...words,
            [sourceWord.sourceLanguage]: words[sourceWord.sourceLanguage].map((word) =>
              word._id === patchedWord._id ? patchedWord : word
            ),
          }));
        })
        .catch((err: Error) => {
          console.log(err);
        });
      const formattedArgs2 = {
        $addToSet: { [sourceWord.sourceLanguage]: sourceWord._id, targetLanguages: sourceLanguage },
      };
      body = JSON.stringify(formattedArgs2);
      customFetch(url + "words/" + targetWord._id, { method: "PATCH", headers: authHeaders(), body })
        .then(({ data: patchedWord }) => {
          setWords((words) => ({
            ...words,
            [targetWord.sourceLanguage]: words[targetWord.sourceLanguage].map((word) =>
              word._id === patchedWord._id ? patchedWord : word
            ),
          }));
        })
        .catch((err: Error) => {
          console.log(err);
        });
    }
  };

  const saveNewWord = (language: string, ref: React.MutableRefObject<HTMLInputElement | null>) => () => {
    const formattedArgs = {
      sourceLanguage: language,
      text: ref.current?.value || "",
      context: [],
      targetLanguages: [],
    };
    const body = JSON.stringify(formattedArgs);
    customFetch(url + "words", { method: "POST", headers: authHeaders(), body })
      .then(({ data: newWord }) => {
        setWords((words) => ({
          ...words,
          [formattedArgs.sourceLanguage!]: [...words[formattedArgs.sourceLanguage!], newWord],
        }));
      })
      .catch((err: Error) => {
        console.log(err);
      });
  };

  return (
    <div id="flashcardForm">
      <div className="buttonHeader">
        <Button onClick={onSave}>Save</Button>
      </div>
      <div id="form">
        <div id="container2">
          <div id="sourceLanguageForm">
            <select onChange={(e) => setSourceLanguage(e.target.value)}>
              <option value="" disabled selected>
                Source language
              </option>
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="ko">Korean</option>
            </select>
            {sourceLanguage && targetLanguage && (
              <div id="sourceLanguage">
                <div id="sourceText">
                  <input type="text" placeholder="Type sentence" />
                </div>
                <div className="lexicalItems">
                  <div className="flashcardSection">Prerequisites</div>
                  {sourcePrerequisites.map((word, index) => (
                    <div key={index} className="lineContainer">
                      <div>{`${word.text} : ${(word[targetLanguage as keyof Word] as string[]).join(' ,')}`}</div>
                      <span
                        className="lineClose"
                        onClick={(e: React.MouseEvent<HTMLSpanElement>) => removePrerequisite(sourceSentence, index)}
                      ></span>
                    </div>
                  ))}
                  <div className="prerequisiteInput">
                    <AutoComplete
                      dropdownList={availableWordsIds(sourceLanguage, sourceSentence)}
                      callback={addPrerequisite(sourceSentence)}
                      placeholder="Add a prerequisite"
                      placement="top-start"
                    />
                  </div>
                </div>
                <div id="newSourceTranslation">
                  <div className="prerequisiteInput">
                    <AutoComplete
                      dropdownList={words[sourceLanguage].map(({ _id, text }) => ({ _id, label: text }))}
                      callback={selectSourceWord}
                      placeholder="Word"
                      placement="top-start"
                    />
                  </div>
                  <div className="prerequisiteInput">
                    <AutoComplete
                      dropdownList={words[targetLanguage].map(({ _id, text }) => ({ _id, label: text }))}
                      callback={selectSourceTranslation}
                      placeholder="Translation"
                      placement="top-start"
                    />
                  </div>
                  <button onClick={saveNewTranslation(selectedSourceWordRef, selectedSourceTranslationRef)}>Save translation</button>
                </div>
                <div id="newSourceWord">
                  <input ref={newSourceWordTextRef} type="text" placeholder="Type word" />
                  <button onClick={saveNewWord(sourceLanguage, newSourceWordTextRef)}>Save word</button>
                </div>
              </div>
            )}
          </div>
          <div id="targetLanguageForm">
            <select onChange={(e) => setTargetLanguage(e.target.value)}>
              <option value="" disabled selected>
                Target language
              </option>
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="ko">Korean</option>
            </select>
            {sourceLanguage && targetLanguage && (
              <div id="targetLanguage">
                <div id="targetText">
                  <input type="text" placeholder="Type sentence" />
                </div>
                <div className="lexicalItems">
                  <div className="flashcardSection">Prerequisites</div>
                  {targetPrerequisites.map((word, index) => (
                    <div key={index} className="lineContainer">
                      <div>{`${word.text} : ${(word[sourceLanguage as keyof Word] as string[]).join(', ')}`}</div>
                      <span
                        className="lineClose"
                        onClick={(e: React.MouseEvent<HTMLSpanElement>) => removePrerequisite(targetSentence, index)}
                      ></span>
                    </div>
                  ))}
                  <div className="prerequisiteInput">
                    <AutoComplete
                      dropdownList={availableWordsIds(targetLanguage, targetSentence)}
                      callback={addPrerequisite(targetSentence)}
                      placeholder="Add a prerequisite"
                      placement="top-start"
                    />
                  </div>
                </div>
                <div id="newTargetTranslation">
                  <div className="prerequisiteInput">
                    <AutoComplete
                      dropdownList={words[targetLanguage].map(({ _id, text }) => ({ _id, label: text }))}
                      callback={selectTargetWord}
                      placeholder="Word"
                      placement="top-start"
                    />
                  </div>
                  <div className="prerequisiteInput">
                    <AutoComplete
                      dropdownList={words[sourceLanguage].map(({ _id, text }) => ({ _id, label: text }))}
                      callback={selectTargetTranslation}
                      placeholder="Translation"
                      placement="top-start"
                    />
                  </div>
                  <button onClick={saveNewTranslation(selectedTargetWordRef, selectedTargetTranslationRef)}>Save translation</button>
                </div>
                <div id="newTargetWord">
                  <input ref={newTargetWordTextRef} type="text" placeholder="Type word" />
                  <button onClick={saveNewWord(targetLanguage, newTargetWordTextRef)}>Save word</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
