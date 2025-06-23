import React, { createContext, useEffect, useMemo, useRef, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import Register from "./auth/components/Register";
import Layout from "./layout/Layout";
import ProtectedRoute from "./ProtectedRoute";
import Profile from "./Profile";
import Login from "./auth/components/Login";
import {
  Context,
  Conversation,
  conversationFilter,
  ConversationTag,
  ReviewItem,
  RowConversation,
  RowWord,
  SearchFilter,
  View,
  Word,
  WordTag,
} from "./types";
import WordList from "./conversations/components/WordList";
import WordListWithDetail from "./conversations/components/WordListWithDetail";
import ConversationList from "./conversations/components/ConversationList";
import ConversationListWithDetail from "./conversations/components/ConversationListWithDetail";
import CreationForm from "./conversations/components/CreationForm";
import ConversationForm from "./conversations/components/ConversationForm";
import WordForm from "./conversations/components/WordForm";
import Review from "./conversations/components/Review";
import { useData } from "./contexts/DataContext";

export const url = process.env.REACT_APP_API_URL;
export const ConfigContext = createContext<Context | null>(null);

export const getWordsFromConversation = (conversation: Conversation) => {
  return conversation.multiLingualSentences.reduce((acc, value) => {
    return [...acc, ...value.sourceLanguage.prerequisites, ...value.targetLanguage.prerequisites];
  }, [] as string[]);
};

export const updateCacheWithNewConversations = (
  conversations: Conversation[],
  newConversations: RowConversation[],
  targetLanguage: string
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

export const formatConversations = (conversations: RowConversation[], targetLanguage: string): Conversation[] => {
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

export const formatWords = (words: RowWord[]): Word[] => {
  return words.map(formatWord);
};

export const formatWord = (word: RowWord): Word => {
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
  const [searchInput, setSearchInput] = useState("");
  const [treeFilter, setTreeFilter] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState<SearchFilter>([]);
  const [conversationFilter, setConversationFilter] = useState<conversationFilter>({});
  const [openedWords, setOpenedWords] = useState([] as Word[]);
  const [openedConversations, setOpenedConversations] = useState([] as Conversation[]);
  const [status, setStatus] = useState("words");
  const [reviewList, setReviewList] = useState<ReviewItem[]>([]);
  const navigate = useNavigate();
  const { words, conversations, wordTags } = useData();

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

  const editWord = (id: string) => {
    navigate(`/words/${id}/edit`);
  };

  const editConversation = (id: string) => {
    navigate(`/conversations/${id}/edit`);
  };

  return (
    <ConfigContext.Provider
      value={{
        filteredWords,
        editConversation,
        editWord,
        openedWords,
        setOpenedWords,
        openedConversations,
        setOpenedConversations,
        searchFilter,
        setSearchFilter,
        status,
        setStatus,
        openWord,
        openConversation,
        treeFilter,
        setTreeFilter,
        searchInput,
        setSearchInput,
        reviewList,
        setReviewList,
      }}
    >
      <Routes>
        <Route path="register/*" element={<Register />} />
        <Route path="login/*" element={<Login />} />
        <Route element={<ProtectedRoute redirectPath="login" />}>
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
            <Route path="review" element={<Review />} />
            <Route path="profile" element={<Profile />} />
            <Route path="/" element={<Login />} />
          </Route>
        </Route>
        <Route path="*" element={<p>There's nothing here: 404!</p>} />
      </Routes>
    </ConfigContext.Provider>
  );
}
