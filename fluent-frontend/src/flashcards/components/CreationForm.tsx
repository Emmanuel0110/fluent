import "../../App.css";
import { Dispatch, useContext, useEffect, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import {
  ConfigContext,
  updateCacheWithNewConversations,
  updateCacheWithNewMultiLingualSentences,
  updateCacheWithNewSentences,
  url,
} from "../../App";
import { Context, Language, MultiLingualSentence, Sentence, Word } from "../../types";
import { Flashcard, Tag } from "../../types";
import AutoComplete from "../../utils/Autocomplete";
import { WordLine } from "./WordLine";
import { authHeaders, customFetch } from "../../utils/http-helpers";
import AutoCompleteFetch from "../../utils/AutocompleteFetch";
import _ from "lodash";
import { getRemoteSentenceById } from "../flashcardActions";

export default function CreationForm() {
  const [sourceSentence, setSourceSentence] = useState<Sentence | null>(null);
  const [sourcePrerequisites, setSourcePrerequisites] = useState<Word[] | null>(null);
  const [targetSentence, setTargetSentence] = useState<Sentence | null>(null);
  const [targetPrerequisites, setTargetPrerequisites] = useState<Word[] | null>(null);
  const [sourceWordForTag, setSourceWordForTag] = useState<Word | null>(null);
  const [targetWordForTag, setTargetWordForTag] = useState<Word | null>(null);
  const [sourceTags, setSourceTags] = useState<Tag[] | null>(null);
  const [targetTags, setTargetTags] = useState<Tag[] | null>(null);
  const newSourceWordTextRef = useRef<HTMLInputElement | null>(null);
  const newTargetWordTextRef = useRef<HTMLInputElement | null>(null);
  const selectedSourceSentenceRef = useRef<HTMLInputElement | null>(null);
  const selectedTargetSentenceRef = useRef<HTMLInputElement | null>(null);
  const selectedTagTypeRef = useRef<HTMLSelectElement | null>(null);
  const selectedSourceTagRef = useRef<HTMLInputElement | null>(null);
  const selectedTargetTagRef = useRef<HTMLInputElement | null>(null);
  const selectedSourceWordRef = useRef<Word | null>(null);
  const selectedSourceTranslationRef = useRef<Word | null>(null);
  const selectedTargetWordRef = useRef<Word | null>(null);
  const selectedTargetTranslationRef = useRef<Word | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState<Language>("fr");
  const [targetLanguage, setTargetLanguage] = useState<Language>("en");
  const [conversationData, setConversationData] = useState<{ _id: string; label: string }[]>([]);

  const {
    words,
    setWords,
    tags,
    setTags,
    saveSentence,
    saveWord,
    sentences,
    setSentences,
    multiLingualSentences,
    setMultiLingualSentences,
    setConversations,
    sourceLanguage: appSourceLanguage,
    targetLanguage: appTargetLanguage,
  } = useContext(ConfigContext) as Context;

  useEffect(() => {
    setSourceLanguage(appSourceLanguage);
    setTargetLanguage(appTargetLanguage);
  }, []);

  const availableWordsIds = (language: string, sentence: Sentence) =>
    words[language]
      .map(({ _id, text }) => ({ _id, label: text }))
      .filter(({ _id }) => !sentence.prerequisites.includes(_id));

  const selectSourceWordForTag = ({
    _id,
    label,
    setLocalDescription,
  }: {
    _id?: string;
    label?: string;
    setLocalDescription: Dispatch<React.SetStateAction<string>>;
  }) => {
    if (_id) {
      const word = words[sourceLanguage].find((word) => word._id === _id)!;
      setSourceWordForTag(word);
      setSourceTags(
        word.tags.map((tagId) => {
          return tags["wordTags"].find(({ _id }) => _id === tagId)!;
        })
      );
      setLocalDescription(word.text);
    } else if (label) {
      setLocalDescription("");
    }
  };

  const selectTargetWordForTag = ({
    _id,
    label,
    setLocalDescription,
  }: {
    _id?: string;
    label?: string;
    setLocalDescription: Dispatch<React.SetStateAction<string>>;
  }) => {
    if (_id) {
      const word = words[targetLanguage].find((word) => word._id === _id)!;
      setTargetWordForTag(word);
      setTargetTags(word.tags.map((tagId) => tags["wordTags"].find(({ _id }) => _id === tagId)!));
      setLocalDescription(word.text);
    } else if (label) {
      setLocalDescription("");
    }
  };

  const addSourceTag = ({
    _id,
    label,
    setLocalDescription,
  }: {
    _id?: string;
    label?: string;
    setLocalDescription: Dispatch<React.SetStateAction<string>>;
  }) => {
    if (_id) {
      setSourceTags((sourceTags) => [...(sourceTags || []), tags["wordTags"].find(({ _id: id }) => id === _id)!]);
      setLocalDescription("");
    }
  };

  const addTargetTag = ({
    _id,
    label,
    setLocalDescription,
  }: {
    _id?: string;
    label?: string;
    setLocalDescription: Dispatch<React.SetStateAction<string>>;
  }) => {
    if (_id) {
      setTargetTags((targetTags) => [...(targetTags || []), tags["wordTags"].find(({ _id: id }) => id === _id)!]);
      setLocalDescription("");
    }
  };

  const selectSourceSentence = ({
    _id,
    label,
    setLocalDescription,
  }: {
    _id?: string;
    label?: string;
    setLocalDescription: Dispatch<React.SetStateAction<string>>;
  }) => {
    if (_id) {
      getRemoteSentenceById(_id).then((sentence) => {
        setSourceSentence(sentence);
        setSourcePrerequisites(
          sentence.prerequisites.map((id) => words[sentence.language].find(({ _id }) => id === _id)!)
        );
        setLocalDescription(sentence.text);
      });
    } else if (label) {
      setLocalDescription("");
    }
  };

  const selectTargetSentence = ({
    _id,
    label,
    setLocalDescription,
  }: {
    _id?: string;
    label?: string;
    setLocalDescription: Dispatch<React.SetStateAction<string>>;
  }) => {
    if (_id) {
      getRemoteSentenceById(_id).then((sentence) => {
        setTargetSentence(sentence);
        setTargetPrerequisites(
          sentence.prerequisites.map((id) => words[sentence.language].find(({ _id }) => id === _id)!)
        );
        setLocalDescription(sentence.text);
      });
    } else if (label) {
      setLocalDescription("");
    }
  };

  const addSourcePrerequisite = ({
    _id,
    label,
    setLocalDescription,
  }: {
    _id?: string;
    label?: string;
    setLocalDescription: Dispatch<React.SetStateAction<string>>;
  }) => {
    if (_id) {
      setSourcePrerequisites((prerequisites) => [
        ...(prerequisites || []),
        words[sourceLanguage].find(({ _id: id }) => id === _id)!,
      ]);
      setLocalDescription("");
    }
  };

  const addTargetPrerequisite = ({
    _id,
    label,
    setLocalDescription,
  }: {
    _id?: string;
    label?: string;
    setLocalDescription: Dispatch<React.SetStateAction<string>>;
  }) => {
    if (_id) {
      setTargetPrerequisites((prerequisites) => [
        ...(prerequisites || []),
        words[targetLanguage].find(({ _id: id }) => id === _id)!,
      ]);
      setLocalDescription("");
    }
  };

  const saveSourcePrerequisites = () => {
    saveSentence({
      _id: sourceSentence?._id,
      prerequisites: sourcePrerequisites?.map(({ _id }) => _id),
    });
  };

  const saveTargetPrerequisites = () => {
    saveSentence({
      _id: targetSentence?._id,
      prerequisites: targetPrerequisites?.map(({ _id }) => _id),
    });
  };

  const saveSourceTags = () => {
    saveWord({
      _id: sourceWordForTag?._id,
      sourceLanguage: sourceWordForTag?.sourceLanguage,
      tags: (sourceTags || []).map((tag) => tag._id),
    });
  };

  const saveTargetTags = () => {
    saveWord({
      _id: targetWordForTag?._id,
      tags: (targetTags || []).map((tag) => tag._id),
    });
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

  const addSentenceToConversation = ({
    _id,
    label,
    setLocalDescription,
  }: {
    _id?: string;
    label?: string;
    setLocalDescription: Dispatch<React.SetStateAction<string>>;
  }) => {
    if (_id && label) {
      setConversationData((conversationData) => [...conversationData, { _id, label }]);
      setLocalDescription("");
    } else if (label) {
      setLocalDescription("");
    }
  };

  const saveNewTag =
    (
      typeInput: React.MutableRefObject<HTMLSelectElement | null>,
      source: React.MutableRefObject<HTMLInputElement | null>,
      target: React.MutableRefObject<HTMLInputElement | null>
    ) =>
    () => {
      const type = typeInput.current?.value;
      const sourceTag = source.current?.value;
      const targetTag = target.current?.value;
      if (sourceTag && targetTag && (type === "wordTag" || type === "conversationTag")) {
        const formattedArgs = {
          [sourceLanguage]: sourceTag,
          [targetLanguage]: targetTag,
          type,
        };
        const body = JSON.stringify(formattedArgs);
        customFetch(url + "tags", { method: "POST", headers: authHeaders(), body })
          .then(({ data: tag }) => {
            setTags((tags) => ({
              ...tags,
              [type]: [...tags[type === "wordTag" ? "wordTags" : "conversationTags"], tag[sourceLanguage]],
            }));
          })
          .catch((err: Error) => {
            console.log(err);
          });
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
              setMultiLingualSentences((multiLingualSentences) => [...multiLingualSentences, newMultiLingualSentence]);
            })
            .catch((err: Error) => {
              console.log(err);
            });
        });
      }
    };

  const saveConversation = () => {
    const formattedArgs = { sourceLanguage, targetLanguage, sentenceIds: conversationData.map(({ _id }) => _id) };
    const body = JSON.stringify(formattedArgs);
    customFetch(url + "conversations", { method: "POST", headers: authHeaders(), body })
      .then(({ newConversation, newMultiLingualSentences, newSentences }) => {
        setConversations((conversations) => updateCacheWithNewConversations(conversations, newConversation));
        setMultiLingualSentences((multiLingualSentences) =>
          updateCacheWithNewMultiLingualSentences(multiLingualSentences, newMultiLingualSentences)
        );
        setSentences((sentences) => updateCacheWithNewSentences(sentences, newSentences));
      })
      .catch((err: Error) => {
        console.log(err);
      });
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

  const fetchSentenceDropDownList =
    (language: Language) =>
    (searchString: string): Promise<{ _id: string; label: string }[]> => {
      const searchParams = new URLSearchParams({ language: language, searchString: searchString.trim() });
      return customFetch(url + `sentences?${searchParams}`, { method: "GET", headers: authHeaders() }).then(
        (sentences: Sentence[]) => {
          return sentences.map(({ _id, text }) => ({ _id, label: text }));
        }
      );
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
          {conversationData.map(({ _id, label }, index) => (
            <div key={index}>{label}</div>
          ))}
        </div>
        <div className="prerequisiteInput">
          <AutoCompleteFetch
            fetchCallback={fetchSentenceDropDownList(sourceLanguage)}
            callback={addSentenceToConversation}
            placeholder="Sentence"
            placement="bottom-start"
          />
        </div>
        <button onClick={saveConversation}>Save conversation</button>
        <div className="prerequisiteInput">
          <AutoCompleteFetch
            fetchCallback={fetchSentenceDropDownList(sourceLanguage)}
            callback={selectSourceSentence}
            placeholder="Source Sentence"
            placement="bottom-start"
          />
        </div>
        {sourcePrerequisites && sourcePrerequisites.length > 0 && (
          <div id="sourcePrerequisites">
            {sourcePrerequisites.map((word, index) => (
              <WordLine key={index} word={word} />
            ))}
          </div>
        )}
        <div className="prerequisiteInput">
          <AutoComplete
            dropdownList={words[sourceLanguage].map(({ _id, text }) => ({ _id, label: text }))}
            callback={addSourcePrerequisite}
            placeholder="Source prerequisites"
            placement="bottom-start"
          />
        </div>
        <button onClick={saveSourcePrerequisites}>Save source prerequisites</button>
        <div className="prerequisiteInput">
          <AutoCompleteFetch
            fetchCallback={fetchSentenceDropDownList(targetLanguage)}
            callback={selectTargetSentence}
            placeholder="Target Sentence"
            placement="bottom-start"
          />
        </div>
        {targetPrerequisites && targetPrerequisites.length > 0 && (
          <div id="sourcePrerequisites">
            {targetPrerequisites.map((word, index) => (
              <WordLine key={index} word={word} />
            ))}
          </div>
        )}
        <div className="prerequisiteInput">
          <AutoComplete
            dropdownList={words[targetLanguage].map(({ _id, text }) => ({ _id, label: text }))}
            callback={addTargetPrerequisite}
            placeholder="Target prerequisites"
            placement="bottom-start"
          />
        </div>
        <button onClick={saveTargetPrerequisites}>Save target prerequisites</button>
        <div id="sourceText">
          <input ref={selectedSourceSentenceRef} style={{ width: "100%" }} type="text" placeholder="Sentence" />
        </div>
        <div id="targetText">
          <input ref={selectedTargetSentenceRef} style={{ width: "100%" }} type="text" placeholder="Translation" />
        </div>
        <button onClick={saveNewMultilingualSentence(selectedSourceSentenceRef, selectedTargetSentenceRef)}>
          Save sentence
        </button>
        <div className="prerequisiteInput">
          <AutoComplete
            dropdownList={words[sourceLanguage].map(({ _id, text }) => ({ _id, label: text }))}
            callback={selectSourceWordForTag}
            placeholder="Source word"
            placement="bottom-start"
          />
        </div>
        {sourceTags && sourceTags.length > 0 && (
          <div id="sourcePrerequisites">
            {sourceTags.map((tag, index) => (
              <div>{tag.label}</div>
            ))}
          </div>
        )}
        <div className="prerequisiteInput">
          <AutoComplete
            dropdownList={tags["wordTags"]}
            callback={addSourceTag}
            placeholder="Source tag"
            placement="bottom-start"
          />
        </div>
        <button onClick={saveSourceTags}>Save source tags</button>
        <div className="prerequisiteInput">
          <AutoComplete
            dropdownList={words[targetLanguage].map(({ _id, text }) => ({ _id, label: text }))}
            callback={selectTargetWordForTag}
            placeholder="Target word"
            placement="bottom-start"
          />
        </div>
        {targetTags && targetTags.length > 0 && (
          <div id="sourcePrerequisites">
            {targetTags.map((tag, index) => (
              <div>{tag.label}</div>
            ))}
          </div>
        )}
        <div className="prerequisiteInput">
          <AutoComplete
            dropdownList={tags["wordTag"]}
            callback={addTargetTag}
            placeholder="Target tag"
            placement="bottom-start"
          />
        </div>
        <button onClick={saveTargetTags}>Save target tags</button>
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
        <div id="tagType">
          <select ref={selectedTagTypeRef} style={{ width: "100%" }}>
            <option value="wordTag">Word tag</option>
            <option value="conversationTag">Conversation tag</option>
          </select>
        </div>
        <div id="sourceTagText">
          <input ref={selectedSourceTagRef} style={{ width: "100%" }} type="text" placeholder="Tag" />
        </div>
        <div id="targetTagText">
          <input ref={selectedTargetTagRef} style={{ width: "100%" }} type="text" placeholder="Translation" />
        </div>
        <button onClick={saveNewTag(selectedTagTypeRef, selectedSourceTagRef, selectedTargetTagRef)}>Save tag</button>
      </div>
    </div>
  );
}
