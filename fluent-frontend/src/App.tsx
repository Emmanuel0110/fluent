import React, { createContext, useEffect, useMemo, useRef, useState } from "react";
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
  ConversationTag,
  Language,
  SearchFilter,
  User,
  View,
  Word,
  WordTag,
} from "./types";
import WordList from "./flashcards/components/WordList";
import { authHeaders, customFetch } from "./utils/http-helpers";
import WordListWithDetail from "./flashcards/components/WordListWithDetail";
import {
  deleteRemoteWord,
  deleteRemoteConversation,
  editRemoteWord,
  fetchWordTags,
  fetchConversationTags,
  fetchWords,
  getRemoteConversationById,
  saveNewConversation,
  subscribeToRemoteConversation,
  editRemoteConversation,
  editRemoteConversationTag,
  saveNewConversationTag,
  saveNewWord,
  saveNewWordTag,
  fetchLanguages,
  unsubscribeToRemoteConversation,
} from "./flashcards/flashcardActions";
import ConversationList from "./flashcards/components/ConversationList";
import ConversationListWithDetail from "./flashcards/components/ConversationListWithDetail";
import CreationForm from "./flashcards/components/CreationForm";
import ConversationForm from "./flashcards/components/ConversationForm";
import WordForm from "./flashcards/components/WordForm";

export const url = process.env.REACT_APP_API_URL;
export const ConfigContext = createContext<Context | null>(null);

const formatConversations = (conversations: any[], targetLanguage: string): Conversation[] => {
  return conversations.map((multiLingualConversation) => {
    const { _id, tags, subscribed } = multiLingualConversation;
    let [sourceConversation, targetConversation] = multiLingualConversation.conversations;
    if (sourceConversation.language === targetLanguage) {
      const tmp = sourceConversation;
      sourceConversation = targetConversation;
      targetConversation = tmp;
    }
    return {
      _id,
      tags,
      subscribed,
      multiLingualSentences: sourceConversation.sentences.map((sourceSentence: any, index: number) => {
        return { sourceLanguage: sourceSentence, targetLanguage: targetConversation.sentences[index] };
      }),
    };
  });
};

export const groupById = <T extends { _id: string }>(ObjectArr: T[]): { [key: string]: T } => {
  return ObjectArr.reduce((acc, value) => {
    return { ...acc, [value._id]: value };
  }, {});
};

export const formatWords = (words: any[]): Word[] => {
  return words.map(formatWord);
};

export const formatWord = (word: any): Word => {
  return { ...word, translations: word.translations[0]?.lexicalItems || [] };
};

export const updateCacheWithNewWords = (words: { [id: string]: Word }, newWords: Word[]): { [id: string]: Word } => {
  return { ...words, ...newWords.reduce((acc, value) => ({ ...acc, [value._id]: value }), {}) };
};

export const updateCacheWithNewConversationTags = (
  conversationTags: ConversationTag[],
  newConversationTags: ConversationTag[]
): ConversationTag[] => {
  return newConversationTags.reduce((acc: ConversationTag[], value: ConversationTag) => {
    var index: number = acc.findIndex((tag) => tag._id === value._id);
    if (index === -1) {
      return [...acc, value];
    } else {
      acc.splice(index, 1, value);
      return [...acc];
    }
  }, conversationTags);
};

export const updateCacheWithNewWordTags = (wordTags: WordTag[], newWordTags: WordTag[]): WordTag[] => {
  return newWordTags.reduce((acc: WordTag[], value: WordTag) => {
    var index: number = acc.findIndex((tag) => tag._id === value._id);
    if (index === -1) {
      return [...acc, value];
    } else {
      acc.splice(index, 1, value);
      return [...acc];
    }
  }, wordTags);
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
      return !word.tags.includes(filterString.toLowerCase().trim().slice(5));
    } else {
      return !word.text
        .toLowerCase()
        .includes(filterString.toLowerCase().trim().slice(4).replace(/^\"/, "").replace(/\"$/, ""));
    }
  } else {
    if (filterString.toLowerCase().trim().startsWith("#")) {
      return word.tags.includes(filterString.toLowerCase().trim().slice(1));
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
  const [conversations, setConversations] = useState([] as Conversation[]);
  const [languages, setLanguages] = useState([] as Language[]);
  const [words, setWords] = useState<{ [id: string]: Word }>({});
  const [sourceLanguage, setSourceLanguage] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");
  const [openedWords, setOpenedWords] = useState([] as Word[]);
  const [openedConversations, setOpenedConversations] = useState([] as Conversation[]);
  const [status, setStatus] = useState("words");
  const [wordTags, setWordTags] = useState<WordTag[]>([]);
  const [conversationTags, setConversationTags] = useState<ConversationTag[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchLanguages().then((languages) => setLanguages(languages));
      fetchWordTags().then((wordTags) => setWordTags(wordTags));
      fetchConversationTags().then((conversationTags) => setConversationTags(conversationTags));
      fetchWords().then((words) => setWords(words));
      setConversations([]);
    }
  }, [isAuthenticated, sourceLanguage, targetLanguage]);

  const filteredWords = useMemo(() => {
    const searchFilterWithTagIds = searchFilter.map((filterItem) => {
      return {
        ...filterItem,
        data: filterItem.data.map((dataItem) => {
          const split = dataItem.split("#");
          if (split.length === 2) {
            const tagId = wordTags.find((tag) => tag.label === split[1])?._id;
            if (tagId) {
              return split[0] + "#" + tagId;
            }
          }
          return dataItem;
        }),
      };
    });
    return Object.values(words).filter((word) => {
      return !someFilter(searchFilter, treeFilter) || isFiltered(word, searchFilterWithTagIds, treeFilter);
    });
  }, [words, status, searchFilter, treeFilter]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((conversation) => {
      return (
        status === "conversations" &&
        (!someConversationFilter(conversationFilter) || isConversationFiltered(conversation, conversationFilter))
      );
    });
  }, [conversations, status, conversationFilter]);

  useEffect(() => {
    if (openedConversations.length !== 0) {
      setOpenedConversations((openedConversations) =>
        openedConversations.map((openedConversation) => {
          const conversation = conversations.find(({ _id }) => _id === openedConversation._id);
          return conversation || openedConversation;
        })
      );
    }
  }, [conversations]);

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
          openedWords,
          openedConversations,
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

  const updateCacheWithNewConversations = (
    conversations: Conversation[],
    newConversations: Conversation[]
  ): Conversation[] => {
    return formatConversations(newConversations, targetLanguage).reduce((acc: Conversation[], value: Conversation) => {
      var index: number = acc.findIndex((conversation) => conversation._id === value._id);
      if (index === -1) {
        return [...acc, value];
      } else {
        acc.splice(index, 1, value);
        return [...acc];
      }
    }, conversations);
  };

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
    const { openedWords, openedConversations, status, searchFilter, treeFilter, location } = viewHistory.current[index];
    setOpenedWords(openedWords);
    setOpenedConversations(openedConversations);
    setStatus(status);
    setSearchFilter(searchFilter);
    setTreeFilter(treeFilter);
    navigate(location);
  };

  const fetchMoreUsedInConversations = async (wordId: string) => {
    return customFetch(url + "conversations?wordId=" + wordId, {
      headers: authHeaders(),
    })
      .then((res) => {
        if (res.success) {
          setConversations((conversations) => updateCacheWithNewConversations(conversations, res.data));
        }
      })
      .catch((err: Error) => {
        console.log(err);
      });
  };

  const openWord = (wordId: string) => {
    const word = words[wordId];
    if (word) {
      setOpenedWords((openedWords) =>
        openedWords.find(({ _id }) => _id === wordId) ? openedWords : [...openedWords, word]
      );
      navigate("words/" + wordId);
    }
  };

  const openConversation = (conversationId: string) => {
    const conversation = conversations.find(({ _id }) => (_id = conversationId));
    if (conversation) {
      setOpenedConversations((openedConversations) =>
        openedConversations.find(({ _id }) => _id === conversationId)
          ? openedConversations
          : [...openedConversations, conversation]
      );
      navigate("conversations/" + conversationId);
    }
  };

  const subscribeToConversation = (id: string, wordIds: string[]) => {
    subscribeToRemoteConversation(id, wordIds).then((res) => {
      if (res.success) {
        setConversations((conversations) =>
          conversations.map((conversation) =>
            conversation._id === id ? { ...conversation, subscribed: true } : conversation
          )
        );
        setWords((words) => ({
          ...words,
          ...wordIds.reduce((acc, value) => {
            return words[value] ? { ...acc, [value]: { ...words[value], subscribed: true } } : acc;
          }, {}),
        }));
      }
    });
  };

  const unsubscribeToConversation = (id: string, wordIds: string[]) => {
    unsubscribeToRemoteConversation(id, wordIds).then((res: { success: boolean; wordsToUnsubscribe: string[] }) => {
      if (res.success) {
        setConversations((conversations) =>
          conversations.map((conversation) =>
            conversation._id === id ? { ...conversation, subscribed: false } : conversation
          )
        );
        setWords((words) => ({
          ...words,
          ...res.wordsToUnsubscribe.reduce((acc, value) => {
            return { ...acc, [value]: { ...words[value], subscribed: false } };
          }, {}),
        }));
      }
    });
  };

  const saveWord = async (infos: Word) => {
    const res = await (infos._id
      ? editRemoteWord(infos, sourceLanguage, targetLanguage)
      : saveNewWord(infos, sourceLanguage, targetLanguage));
    if (res.success) {
      const { _id } = res.data;
      if (_id) {
        setWords((words) => ({ ...words, [_id]: formatWord(res.data) }));
        return formatWord(res.data);
      }
    }
  };

  const saveWordTag = async (args: { language: string; label: string }) => {
    const res = await saveNewWordTag(args);
    if (res.success) {
      setWordTags((wordTags) => updateCacheWithNewWordTags(wordTags, [res.data]));
      return res.data;
    }
  };

  const saveConversationTag = async (infos: ConversationTag) => {
    const res = await (infos._id ? editRemoteConversationTag(infos) : saveNewConversationTag(infos));
    if (res.success) {
      setConversationTags((conversationTags) => updateCacheWithNewConversationTags(conversationTags, [res.data]));
    }
  };

  const saveConversation = async (infos: Conversation) => {
    const res = await (infos._id
      ? editRemoteConversation(infos, sourceLanguage, targetLanguage)
      : saveNewConversation(infos, sourceLanguage, targetLanguage));
    if (res.success) {
      setConversations((conversations) => updateCacheWithNewConversations(conversations, [res.data]));
      navigate("/conversations" + res.data._id);
    }
  };

  const getConversationById = (id: string): Promise<Conversation> => {
    const conversation = conversations.find(({ _id }) => _id === id);
    return conversation
      ? Promise.resolve(conversation)
      : getRemoteConversationById(id).then(({ newConversation }) => {
          if (newConversation) {
            setConversations((conversations) => updateCacheWithNewConversations(conversations, [newConversation]));
          }
          return newConversation;
        });
  };

  const deleteConversation = async (_id: string) => {
    await deleteRemoteConversation(_id);
    setConversations((conversations) => conversations.filter((conversation) => conversation._id === _id));
  };

  const deleteWord = async (_id: string) => {
    await deleteRemoteWord(_id);
    setWords((words) => {
      const newState = { ...words };
      delete newState[_id];
      return newState;
    });
  };

  const editWord = (id: string) => {
    navigate(`/words/${id}/edit`);
  };

  const editConversation = (id: string) => {
    navigate(`/conversations/${id}/edit`);
  };

  return (
    <ConfigContext.Provider
      value={{
        languages,
        filteredWords,
        words,
        setWords,
        editConversation,
        editWord,
        conversations,
        setConversations,
        saveConversation,
        sourceLanguage,
        setSourceLanguage,
        targetLanguage,
        setTargetLanguage,
        openedWords,
        setOpenedWords,
        openedConversations,
        setOpenedConversations,
        isAuthenticated,
        setIsAuthenticated,
        searchFilter,
        setSearchFilter,
        user,
        setUser,
        status,
        setStatus,
        wordTags,
        setWordTags,
        conversationTags,
        setConversationTags,
        fetchMoreUsedInConversations,
        openWord,
        deleteConversation,
        deleteWord,
        openConversation,
        subscribeToConversation,
        unsubscribeToConversation,
        saveWord,
        saveWordTag,
        saveConversationTag,
        getConversationById,
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
            <Register
              isAuthenticated={isAuthenticated}
              setIsAuthenticated={setIsAuthenticated}
              setUser={setUser}
              setSourceLanguage={setSourceLanguage}
              setTargetLanguage={setTargetLanguage}
            />
          }
        />
        <Route
          path="login/*"
          element={
            <Login
              isAuthenticated={isAuthenticated}
              setIsAuthenticated={setIsAuthenticated}
              setUser={setUser}
              setSourceLanguage={setSourceLanguage}
              setTargetLanguage={setTargetLanguage}
            />
          }
        />
        <Route
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              setIsAuthenticated={setIsAuthenticated}
              setUser={setUser}
              setSourceLanguage={setSourceLanguage}
              setTargetLanguage={setTargetLanguage}
              redirectPath={"login"}
            />
          }
        >
          <Route element={<Layout />}>
            <Route path="home" element={<ConversationList filteredConversations={filteredConversations} />} />{" "}
            {/*TODO: remove if unused ? */}
            <Route path="new" element={<CreationForm />} />
            <Route path="words" element={<WordList filteredWords={filteredWords} />} />
            <Route
              path="words/:wordId"
              element={<WordListWithDetail filteredWords={filteredWords} openedWords={openedWords} />}
            />
            <Route path="words/:wordId/edit" element={<WordForm />} />
            <Route path="conversations" element={<ConversationList filteredConversations={filteredConversations} />} />
            <Route
              path="conversations/:conversationId"
              element={
                <ConversationListWithDetail
                  filteredConversations={filteredConversations}
                  openedConversations={openedConversations}
                />
              }
            />
            <Route path="conversations/:conversationId/edit" element={<ConversationForm />} />
            <Route path="profile" element={<Profile />} />
            <Route
              path="/"
              element={
                <Login
                  isAuthenticated={isAuthenticated}
                  setIsAuthenticated={setIsAuthenticated}
                  setUser={setUser}
                  setSourceLanguage={setSourceLanguage}
                  setTargetLanguage={setTargetLanguage}
                />
              }
            />
          </Route>
        </Route>
        <Route path="*" element={<p>There's nothing here: 404!</p>} />
      </Routes>
    </ConfigContext.Provider>
  );
}
