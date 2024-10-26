import React, { Dispatch, SetStateAction, createContext, useEffect, useMemo, useRef, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import Register from "./auth/components/Register";
import Layout from "./Layout/Layout";
import ProtectedRoute from "./ProtectedRoute";
import Profile from "./Profile";
import Login from "./auth/components/Login";
import {
  Context,
  Conversation,
  conversationFilter,
  Flashcard,
  Language,
  MultiLingualSentence,
  OpenFlashcardData,
  OpenMultiLingualSentenceData,
  OpenWordData,
  SearchFilter,
  Sentence,
  Tag,
  User,
  View,
  Word,
} from "./types";
import WordList from "./flashcards/components/WordList";
import { authHeaders, customFetch } from "./utils/http-helpers";
import WordListWithDetail from "./flashcards/components/WordListWithDetail";
import {
  deleteRemoteFlashcard,
  editRemoteSentence,
  fetchTags,
  fetchWords,
  getRemoteMultiLingualSentenceById,
  saveNewFlashcard,
  subscribeToRemoteMultiLingualSentence,
  subscribeToRemoteWord,
} from "./flashcards/flashcardActions";
import ConversationList from "./flashcards/components/ConversationList";
import ConversationListWithDetail from "./flashcards/components/ConversationListWithDetail";
import CreationForm from "./flashcards/components/CreationForm";

export let url = "/api/";

if (process.env.NODE_ENV === "production") {
  url = process.env.PUBLIC_URL + url;
}

export const ConfigContext = createContext<Context | null>(null);

export const updateCacheWithNewWords = (
  words: { [key: string]: Word[] },
  newWords: Word[]
): { [key: string]: Word[] } => {
  return newWords.reduce((acc: { [key: string]: Word[] }, value: Word) => {
    value = {
      ...value,
      nextReviewDate: value.nextReviewDate ? new Date(value.nextReviewDate) : undefined,
    };
    var index: number = acc[value.sourceLanguage].findIndex((word) => word._id === value._id);
    if (index === -1) {
      return { ...acc, [value.sourceLanguage]: [...acc[value.sourceLanguage], value] };
    } else {
      acc[value.sourceLanguage].splice(index, 1, value);
      return { ...acc, [value.sourceLanguage]: [...acc[value.sourceLanguage]] };
    }
  }, words);
};

export const updateCacheWithNewSentences = (sentences: Sentence[], newSentences: Sentence[]): Sentence[] => {
  return newSentences.reduce((acc: Sentence[], value: Sentence) => {
    value = {
      ...value,
      nextReviewDate: value.nextReviewDate ? new Date(value.nextReviewDate) : undefined,
    };
    var index: number = acc.findIndex((sentence) => sentence._id === value._id);
    if (index === -1) {
      return [...acc, value];
    } else {
      acc.splice(index, 1, value);
      return [...acc];
    }
  }, sentences);
};

export const updateCacheWithNewMultiLingualSentences = (
  multiLingualSentences: MultiLingualSentence[],
  newMultiLingualSentences: MultiLingualSentence[]
): MultiLingualSentence[] => {
  return newMultiLingualSentences.reduce((acc: MultiLingualSentence[], value: MultiLingualSentence) => {
    value = {
      ...value,
      nextReviewDate: value.nextReviewDate ? new Date(value.nextReviewDate) : undefined,
    };
    var index: number = acc.findIndex((sentence) => sentence._id === value._id);
    if (index === -1) {
      return [...acc, value];
    } else {
      acc.splice(index, 1, value);
      return [...acc];
    }
  }, multiLingualSentences);
};

export const updateCacheWithNewConversations = (
  conversations: Conversation[],
  newConversations: Conversation[]
): Conversation[] => {
  return newConversations.reduce((acc: Conversation[], value: Conversation) => {
    value = {
      ...value,
      nextReviewDate: value.nextReviewDate ? new Date(value.nextReviewDate) : undefined,
    };
    var index: number = acc.findIndex((sentence) => sentence._id === value._id);
    if (index === -1) {
      return [...acc, value];
    } else {
      acc.splice(index, 1, value);
      return [...acc];
    }
  }, conversations);
};

export const someConversationFilter = (conversationFilter: conversationFilter) => {
  return conversationFilter.tag !== undefined;
};

export const isConversationFiltered = (conversation: Conversation, conversationFilter: conversationFilter) => {
  return conversationFilter.tag !== undefined && conversation.tags.includes(conversationFilter.tag);
};

export const someFilter = (searchFilter: SearchFilter, treeFilter: string[]): boolean =>
  searchFilter.filter(({ isActive }) => isActive).length !== 0 || treeFilter.length !== 0;

const wordHasTagOrIncludeString = (word: Word, filterString: string) => {
  if (filterString.toLowerCase().startsWith("not ")) {
    if (filterString.toLowerCase().slice(4).trim().startsWith("#")) {
      return !word.tags.find(({ label }) => label.toLowerCase() === filterString.toLowerCase().trim().slice(5));
    } else {
      return !word.text
        .toLowerCase()
        .includes(filterString.toLowerCase().trim().slice(4).replace(/^\"/, "").replace(/\"$/, ""));
    }
  } else {
    if (filterString.toLowerCase().trim().startsWith("#")) {
      return word.tags.find(({ label }) => label.toLowerCase() === filterString.toLowerCase().trim().slice(1));
    } else {
      return word.text.toLowerCase().includes(filterString.toLowerCase().replace(/^\"/, "").replace(/\"$/, ""));
    }
  }
};

const isFilteredBySearchFilter = (word: Word, searchFilter: SearchFilter) => {
  return searchFilter
    .filter(({ isActive }) => isActive)
    .every(({ data }) => data.some((filterString) => wordHasTagOrIncludeString(word, filterString)));
};

const isFiltered = (word: Word, searchFilter: SearchFilter, treeFilter: string[]) =>
  isFilteredBySearchFilter(word, searchFilter) && (treeFilter.length === 0 || treeFilter.includes(word._id));

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null as boolean | null);
  const [user, setUser] = useState(null as User | null);
  const [searchInput, setSearchInput] = useState("");
  const [treeFilter, setTreeFilter] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState<SearchFilter>([]);
  const [conversationFilter, setConversationFilter] = useState<conversationFilter>({});
  const [flashcards, setFlashcards] = useState([] as Flashcard[]);
  const [conversations, setConversations] = useState([] as Conversation[]);
  const [multiLingualSentences, setMultiLingualSentences] = useState([] as MultiLingualSentence[]);
  const [sentences, setSentences] = useState([] as Sentence[]);
  const [words, setWords] = useState({ en: [], fr: [], kr: [] } as { [key: string]: Word[] });
  const [sourceLanguage, setSourceLanguage] = useState("fr" as Language);
  const [targetLanguage, setTargetLanguage] = useState("en" as Language);
  const [openedFlashcards, setOpenedFlashcards] = useState([] as OpenFlashcardData[]);
  const [openedWords, setOpenedWords] = useState([] as OpenWordData[]);
  const [openedMultiLingualSentences, setOpenedMultiLingualSentences] = useState([] as OpenMultiLingualSentenceData[]);
  const [status, setStatus] = useState("words");
  const [tags, setTags] = useState({ wordTags: [], conversationTags: [] } as {
    wordTags: Tag[];
    conversationTags: Tag[];
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchTags(sourceLanguage).then((tags) => setTags(tags));
      fetchWords(sourceLanguage, targetLanguage).then((words) => setWords(words));
      fetchMoreConversations(sourceLanguage, targetLanguage);
    }
  }, [isAuthenticated]);

  // useEffect(() => {
  //   if (isAuthenticated && filteredMultiLingualSentences.length < 30) {
  //     fetchMoreConversations(0, 30).then(() => {
  //       if (status === "To be reviewed" && filteredMultiLingualSentences.length > 0) {
  //         setOpenedFlashcards([]);
  //         navigate("/flashcards/" + filteredMultiLingualSentences[0]._id);
  //       }
  //     });
  //   }
  // }, [status, searchFilter, isAuthenticated]);

  useEffect(() => {
    if (openedFlashcards.length !== 0) {
      setOpenedFlashcards((openFlashcards) =>
        openFlashcards.map((openFlashcard) => {
          const flashcard = flashcards.find(({ _id }) => _id === openFlashcard.id);
          return flashcard ? { ...openFlashcard, data: flashcard } : openFlashcard;
        })
      );
    }
  }, [flashcards]);

  const filteredWords = useMemo(() => {
    return words[sourceLanguage]
      ? words[sourceLanguage].filter((word) => {
          return !someFilter(searchFilter, treeFilter) || isFiltered(word, searchFilter, treeFilter);
        })
      : [];
  }, [words, status, searchFilter, treeFilter]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      return (
        status === "conversations" &&
        (!someConversationFilter(conversationFilter) || isConversationFiltered(conversation, conversationFilter))
      );
    });
  }, [conversations, status, conversationFilter]);

  const viewHistory = useRef<View[]>([]);
  const viewIndex = useRef(0);

  const location = useLocation();
  const preventHistorization = useRef(false);

  useEffect(() => {
    if (preventHistorization.current) {
      preventHistorization.current = false;
    } else {
      if (viewHistory.current.length > 0) {
        viewHistory.current = viewHistory.current.slice(0, viewIndex.current + 1);
      }
      viewIndex.current =
        viewHistory.current.push({
          openedFlashcards,
          status,
          searchFilter,
          treeFilter,
          location: location.pathname,
        }) - 1;
    }
  }, [location, status, searchFilter]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowLeft":
        if (e.altKey) {
          e.preventDefault();
          if (viewIndex.current > 0) {
            viewIndex.current--;
            refreshView(viewIndex.current);
          }
        }
        break;
      case "ArrowRight":
        if (e.altKey) {
          e.preventDefault();
          if (viewIndex.current < viewHistory.current.length - 1) {
            viewIndex.current++;
            refreshView(viewIndex.current);
          }
        }
        break;
      default:
    }
  };

  const refreshView = (index: number) => {
    preventHistorization.current = true;
    const { openedFlashcards, status, searchFilter, treeFilter, location } = viewHistory.current[index];
    setOpenedFlashcards(openedFlashcards);
    setStatus(status);
    setSearchFilter(searchFilter);
    setTreeFilter(treeFilter);
    navigate(location);
  };

  const fetchMoreUsedInMultiLingualSentences = (wordId: string) => {
    return customFetch(url + "multiLingualSentences?wordId=" + wordId, { headers: authHeaders() })
      .then(({ multiLingualSentences: newMultiLingualSentences, sentences: newSentences }) => {
        setMultiLingualSentences((multiLingualSentences) =>
          updateCacheWithNewMultiLingualSentences(multiLingualSentences, newMultiLingualSentences)
        );
        setSentences((sentences) => updateCacheWithNewSentences(sentences, newSentences));
      })
      .catch((err: Error) => {
        console.log(err);
      });
  };

  const fetchMoreUsedInConversations = (multiLingualSentenceId: string) => {
    return customFetch(url + "conversations?multilingualsentenceId=" + multiLingualSentenceId, {
      headers: authHeaders(),
    })
      .then(
        ({
          conversations: newConversations,
          multiLingualSentences: newMultiLingualSentences,
          sentences: newSentences,
        }) => {
          setConversations((conversations) => updateCacheWithNewConversations(conversations, newConversations));
          setMultiLingualSentences((multiLingualSentences) =>
            updateCacheWithNewMultiLingualSentences(multiLingualSentences, newMultiLingualSentences)
          );
          setSentences((sentences) => updateCacheWithNewSentences(sentences, newSentences));
        }
      )
      .catch((err: Error) => {
        console.log(err);
      });
  };

  const fetchMoreConversations = (sourceLanguage: Language, targetLanguage: Language) => {
    return customFetch(url + `conversations?sourceLanguage=${sourceLanguage}&targetLanguage=${targetLanguage}`, {
      headers: authHeaders(),
    })
      .then(
        ({
          conversations: newConversations,
          multiLingualSentences: newMultiLingualSentences,
          sentences: newSentences,
        }) => {
          setConversations((conversations) => updateCacheWithNewConversations(conversations, newConversations));
          setMultiLingualSentences((multiLingualSentences) =>
            updateCacheWithNewMultiLingualSentences(multiLingualSentences, newMultiLingualSentences)
          );
          setSentences((sentences) => updateCacheWithNewSentences(sentences, newSentences));
        }
      )
      .catch((err: Error) => {
        console.log(err);
      });
  };

  const deleteFlashcard = (flashcardId: string) => {
    deleteRemoteFlashcard(flashcardId).then((res) => {
      if (res.success) {
        setFlashcards((flashcards: Flashcard[]) => flashcards.filter((flashcard) => flashcard._id !== flashcardId));
      }
    });
  };

  const openMultiLingualSentence = (multiLingualSentenceId: string) => {
    // const multiLingualSentence = multiLingualSentences.find(({ _id }) => _id === multiLingualSentenceId);
    // if (multiLingualSentence) {
    //   setOpenedMultiLingualSentences((openedMultiLingualSentences) =>
    //     openedMultiLingualSentences.find(({ id }) => id === multiLingualSentenceId)
    //       ? openedMultiLingualSentences
    //       : [...openedMultiLingualSentences, { id: multiLingualSentenceId, data: multiLingualSentence }]
    //   );
    navigate("multilingualsentences/" + multiLingualSentenceId);
    // }
  };

  const openWord = (wordId: string, language: Language) => {
    const word = words[language].find(({ _id }) => _id === wordId);
    if (word) {
      setOpenedWords((openedWords) =>
        openedWords.find(({ id }) => id === wordId) ? openedWords : [...openedWords, { id: wordId, data: word }]
      );
      navigate("words/" + wordId);
    }
  };

  const editFlashcard = (flashcardId: string) => {
    const flashcard = flashcards.find(({ _id }) => _id === flashcardId);
    if (flashcard) {
      setOpenedFlashcards((openedFlashcards) => {
        const openedFlashcard = openedFlashcards.find(({ id }) => id === flashcardId);
        if (openedFlashcard) {
          return openedFlashcard.unsavedData
            ? openedFlashcards
            : openedFlashcards.map((el) => (el.id === flashcardId ? { ...el, unsavedData: flashcard } : el));
        } else {
          return [...openedFlashcards, { id: flashcardId, data: flashcard, unsavedData: flashcard }];
        }
      });
      navigate("ds/" + flashcardId);
    }
  };

  const editCurrentFlashcard = (flashcard: Flashcard) => {
    setOpenedFlashcards((openedFlashcards) =>
      openedFlashcards.map((openedFlashcard) =>
        openedFlashcard.id === flashcard._id ? { ...openedFlashcard, unsavedData: flashcard } : openedFlashcard
      )
    );
  };

  const subscribeToWord = (wordToSubscribe: Partial<Word>) => {
    subscribeToRemoteWord(wordToSubscribe).then((res) => {
      if (res.success) {
        setWords((words) => ({
          ...words,
          [sourceLanguage]: words[sourceLanguage].map((word) => {
            return word._id === wordToSubscribe._id
              ? { ...word, nextReviewDate: word.nextReviewDate instanceof Date ? undefined : new Date() }
              : word;
          }),
          [targetLanguage]: words[targetLanguage].map((word) => {
            return word._id === wordToSubscribe._id
              ? { ...word, nextReviewDate: word.nextReviewDate instanceof Date ? undefined : new Date() }
              : word;
          }),
        }));
      }
    });
  };

  const subscribeToMultiLingualSentence = (multiLingualSentenceToSubscribe: Partial<MultiLingualSentence>) => {
    const language = sourceLanguage + "-" + targetLanguage;
    subscribeToRemoteMultiLingualSentence(multiLingualSentenceToSubscribe, language).then((res) => {
      if (res.success) {
        setMultiLingualSentences((multiLingualSentences) =>
          multiLingualSentences.map((multiLingualSentence) => {
            return multiLingualSentence._id === multiLingualSentenceToSubscribe._id
              ? {
                  ...multiLingualSentence,
                  nextReviewDate: multiLingualSentence.nextReviewDate instanceof Date ? undefined : new Date(),
                }
              : multiLingualSentence;
          })
        );
      }
    });
  };

  const saveSentence = (infos: Partial<Sentence>) => {
    editRemoteSentence(infos).catch((err: Error) => console.log(err));
    setSentences((sentences: Sentence[]) =>
      sentences.map((sentence) => {
        return sentence._id === infos._id ? { ...sentence, ...infos } : sentence;
      })
    );
  };

  const saveAsNewFlashcard = (infos: Partial<Flashcard>): Promise<Flashcard> => {
    return saveNewFlashcard(infos)
      .then(({ data: newFlashcard }) => {
        setFlashcards((flashcards: Flashcard[]) => [...flashcards, newFlashcard]);
        setOpenedFlashcards((openedFlashcards) => [
          ...openedFlashcards,
          { id: newFlashcard._id, data: newFlashcard, unsavedData: newFlashcard },
        ]);
        navigate("/flashcards/" + newFlashcard._id);
        return newFlashcard;
      })
      .catch((err: Error) => {
        console.log(err);
      });
  };

  const getMultiLingualSentenceById = (id: string): Promise<MultiLingualSentence> => {
    const multiLingualSentence = multiLingualSentences.find(({ _id }) => _id === id);
    return multiLingualSentence
      ? Promise.resolve(multiLingualSentence)
      : getRemoteMultiLingualSentenceById(id, sourceLanguage, targetLanguage).then(
          ({ newMultiLingualSentence, newSentences }) => {
            if (newMultiLingualSentence) {
              setMultiLingualSentences((multiLingualSentences) =>
                updateCacheWithNewMultiLingualSentences(multiLingualSentences, [newMultiLingualSentence])
              );
            }
            if (newSentences) {
              setSentences((sentences) => updateCacheWithNewSentences(sentences, newSentences));
            }
            return newMultiLingualSentence;
          }
        );
  };

  return (
    <ConfigContext.Provider
      value={{
        flashcards,
        multiLingualSentences,
        setMultiLingualSentences,
        filteredWords,
        setFlashcards,
        words,
        setWords,
        sentences,
        setSentences,
        conversations,
        setConversations,
        sourceLanguage,
        targetLanguage,
        openedWords,
        setOpenedWords,
        openedMultiLingualSentences,
        setOpenedMultiLingualSentences,
        isAuthenticated,
        setIsAuthenticated,
        searchFilter,
        setSearchFilter,
        user,
        setUser,
        status,
        setStatus,
        tags,
        setTags,
        fetchMoreUsedInMultiLingualSentences,
        fetchMoreUsedInConversations,
        deleteFlashcard,
        openMultiLingualSentence,
        openWord,
        editFlashcard,
        editCurrentFlashcard,
        subscribeToWord,
        subscribeToMultiLingualSentence,
        saveSentence,
        saveAsNewFlashcard,
        getMultiLingualSentenceById,
        treeFilter,
        setTreeFilter,
        searchInput,
        setSearchInput,
      }}
    >
      <Routes>
        <Route
          path="register/*"
          element={
            <Register isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
          }
        />
        <Route
          path="login/*"
          element={
            <Login isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
          }
        />
        <Route
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              setIsAuthenticated={setIsAuthenticated}
              setUser={setUser}
              redirectPath={"login"}
            />
          }
        >
          <Route element={<Layout />}>
            <Route path="home" element={<ConversationList filteredConversations={filteredConversations} />} />
            <Route path="new" element={<CreationForm />} />
            <Route path="words" element={<WordList filteredWords={filteredWords} />} />
            <Route
              path="words/:wordId"
              element={<WordListWithDetail filteredWords={filteredWords} openedWords={openedWords} />}
            />
            <Route path="conversations" element={<ConversationList filteredConversations={filteredConversations} />} />
            <Route
              path="multilingualsentences/:multiLingualSentenceId"
              element={
                <ConversationListWithDetail
                  filteredConversations={filteredConversations}
                  openedMultiLingualSentences={openedMultiLingualSentences}
                />
              }
            />
            <Route path="profile" element={<Profile />} />
            <Route
              path="/"
              element={
                <Login isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
              }
            />
          </Route>
        </Route>
        <Route path="*" element={<p>There's nothing here: 404!</p>} />
      </Routes>
    </ConfigContext.Provider>
  );
}
