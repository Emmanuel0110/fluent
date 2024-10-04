import "../../App.css";
import { Dispatch, useContext, useEffect, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import { saveNewTag } from "../flashcardActions";
import { ConfigContext, url } from "../../App";
import { Context, Language, MultiLingualSentence, Sentence, Word } from "../../types";
import { Flashcard, Tag } from "../../types";
import AutoComplete from "../../utils/Autocomplete";
import { WordLine } from "./WordLine";
import { authHeaders, customFetch } from "../../utils/http-helpers";

export default function CreationForm() {
  const [sourceSentence, setSourceSentence] = useState<Sentence | null>(null);
  const [sourcePrerequisites, setSourcePrerequisites] = useState<string[] | null>(null);
  const [targetSentence, setTargetSentence] = useState<Sentence | null>(null);
  const [targetPrerequisites, setTargetPrerequisites] = useState<string[] | null>(null);
  const newSourceWordTextRef = useRef<HTMLInputElement | null>(null);
  const newTargetWordTextRef = useRef<HTMLInputElement | null>(null);
  const selectedSourceSentenceRef = useRef<HTMLInputElement | null>(null);
  const selectedTargetSentenceRef = useRef<HTMLInputElement | null>(null);
  const selectedSourceWordRef = useRef<Word | null>(null);
  const selectedSourceTranslationRef = useRef<Word | null>(null);
  const selectedTargetWordRef = useRef<Word | null>(null);
  const selectedTargetTranslationRef = useRef<Word | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState<Language>("fr");
  const [targetLanguage, setTargetLanguage] = useState<Language>("en");
  const [conversationData, setConversationData] = useState<string[]>([]);

  const {
    words,
    setWords,
    tags,
    setTags,
    saveSentence,
    sentences,
    multiLingualSentences,
    setMultiLingualSentences,
    sourceLanguage: appSourceLanguage,
    targetLanguage: appTargetLanguage,
  } = useContext(ConfigContext) as Context;

  useEffect(() => {
    setSourceLanguage(appSourceLanguage);
    setTargetLanguage(appTargetLanguage);
  }, []);

  const save = ({ _id, text, prerequisites }: Sentence) => {
    saveSentence({
      _id,
      text,
      prerequisites,
    });
  };

  const availableWordsIds = (language: string, sentence: Sentence) =>
    words[language]
      .map(({ _id, text }) => ({ _id, label: text }))
      .filter(({ _id }) => !sentence.prerequisites.includes(_id));

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

  const addSentenceToConversation = ({
    _id,
    label,
    setLocalDescription,
  }: {
    _id?: string;
    label?: string;
    setLocalDescription: Dispatch<React.SetStateAction<string>>;
  }) => {
    if (_id) {
      const id = multiLingualSentences.find(
        (multiLingualSentence) => multiLingualSentence[sourceLanguage] === _id
      )?._id;
      if (id) {
        setConversationData((conversationData) => [...conversationData, id]);
      }
      setLocalDescription("");
    } else if (label) {
      setLocalDescription("");
    }
  };

  const saveNewMultilingualSentence =
    (
      source: React.MutableRefObject<HTMLInputElement | null>,
      target: React.MutableRefObject<HTMLInputElement | null>
    ) =>
    () => {
      const sourceSentence = source.current?.value;
      const targetSentence = target.current?.value;
      if (sourceSentence && targetSentence) {
        const formattedArgs1 = {
          language: sourceLanguage,
          text: sourceSentence,
          prerequisites: [],
        };
        const formattedArgs2 = {
          language: targetLanguage,
          text: targetSentence,
          prerequisites: [],
        };
        const body1 = JSON.stringify(formattedArgs1);
        const body2 = JSON.stringify(formattedArgs2);
        const promises: Promise<String>[] = [
          customFetch(url + "sentences", { method: "POST", headers: authHeaders(), body: body1 }),
          customFetch(url + "sentences", { method: "POST", headers: authHeaders(), body: body2 }),
        ];
        Promise.all(promises).then(([sourceSentenceId, targetSentenceId]) => {
          const formattedArgs = {
            [sourceLanguage]: sourceSentenceId,
            [targetLanguage]: targetSentenceId,
            tags: [],
          };
          const body = JSON.stringify(formattedArgs);
          customFetch(url + "multilingualsentences", { method: "POST", headers: authHeaders(), body })
            .then(({ data: newMultiLingualSentence }) => {
              setMultiLingualSentences((multiLingualSentences) => ({
                ...multiLingualSentences,
                newMultiLingualSentence,
              }));
            })
            .catch((err: Error) => {
              console.log(err);
            });
        });
      }
    };

  const saveNewTranslation =
    (source: React.MutableRefObject<Word | null>, target: React.MutableRefObject<Word | null>) => () => {
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
      tags: [],
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
      <div id="form">
        <div style={{ display: "flex" }}>
          <select defaultValue={sourceLanguage} onChange={(e) => setSourceLanguage(e.target.value as Language)}>
            <option value="" disabled>
              Source language
            </option>
            <option value="en">English</option>
            <option value="fr">French</option>
            <option value="ko">Korean</option>
          </select>
          <div style={{ margin: "0 20px" }}>{"-->"}</div>
          <select defaultValue={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value as Language)}>
            <option value="" disabled selected>
              Target language
            </option>
            <option value="en">English</option>
            <option value="fr">French</option>
            <option value="ko">Korean</option>
          </select>
        </div>
        <div>
          {conversationData.map((multiLingualSentenceId) => (
            <div>
              {sentences.find(
                ({ _id }) =>
                  _id === multiLingualSentences.find(({ _id }) => _id === multiLingualSentenceId)![sourceLanguage]
              )?.text || ""}
            </div>
          ))}
        </div>
        <div className="prerequisiteInput">
          <AutoComplete
            dropdownList={sentences.map(({ _id, text }) => ({ _id, label: text }))}
            callback={addSentenceToConversation}
            placeholder="Sentence"
            placement="bottom-start"
          />
        </div>
        <button onClick={saveNewTranslation(selectedSourceWordRef, selectedSourceTranslationRef)}>
          Save conversation
        </button>
        <div id="sourceText">
          <input ref={selectedSourceSentenceRef} style={{ width: "100%" }} type="text" placeholder="Sentence" />
        </div>
        <div id="targetText">
          <input ref={selectedTargetSentenceRef} style={{ width: "100%" }} type="text" placeholder="Translation" />
        </div>
        <button onClick={saveNewMultilingualSentence(selectedSourceSentenceRef, selectedTargetSentenceRef)}>
          Save sentence
        </button>
        <div id="container2">
          <div id="sourceLanguageForm">
            {sourceLanguage && targetLanguage && (
              <div id="sourceLanguage">
                <div id="newSourceTranslation">
                  <div className="prerequisiteInput">
                    <AutoComplete
                      dropdownList={words[sourceLanguage].map(({ _id, text }) => ({ _id, label: text }))}
                      callback={selectSourceWord}
                      placeholder="Word"
                      placement="bottom-start"
                    />
                  </div>
                  <div className="prerequisiteInput">
                    <AutoComplete
                      dropdownList={words[targetLanguage].map(({ _id, text }) => ({ _id, label: text }))}
                      callback={selectSourceTranslation}
                      placeholder="Translation"
                      placement="bottom-start"
                    />
                  </div>
                  <button onClick={saveNewTranslation(selectedSourceWordRef, selectedSourceTranslationRef)}>
                    Save translation
                  </button>
                </div>
                <div id="newSourceWord">
                  <input ref={newSourceWordTextRef} type="text" placeholder="Type word" />
                  <button onClick={saveNewWord(sourceLanguage, newSourceWordTextRef)}>Save word</button>
                </div>
              </div>
            )}
          </div>
          <div id="targetLanguageForm">
            {sourceLanguage && targetLanguage && (
              <div id="targetLanguage">
                <div id="newTargetTranslation">
                  <div className="prerequisiteInput">
                    <AutoComplete
                      dropdownList={words[targetLanguage].map(({ _id, text }) => ({ _id, label: text }))}
                      callback={selectTargetWord}
                      placeholder="Word"
                      placement="bottom-start"
                    />
                  </div>
                  <div className="prerequisiteInput">
                    <AutoComplete
                      dropdownList={words[sourceLanguage].map(({ _id, text }) => ({ _id, label: text }))}
                      callback={selectTargetTranslation}
                      placeholder="Translation"
                      placement="bottom-start"
                    />
                  </div>
                  <button onClick={saveNewTranslation(selectedTargetWordRef, selectedTargetTranslationRef)}>
                    Save translation
                  </button>
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
