import React, { createContext, useEffect, useMemo, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";
import Register from "./auth/components/Register";
import Layout from "./layout/Layout";
import ProtectedRoute from "./ProtectedRoute";
import Profile from "./Profile";
import Login from "./auth/components/Login";
import { Context, Conversation, conversationFilter, ReviewItem, SearchFilter, Word } from "./types";
import WordList from "./components/WordList";
import WordListWithDetail from "./components/WordListWithDetail";
import ConversationList from "./components/ConversationList";
import ConversationListWithDetail from "./components/ConversationListWithDetail";
import CreationForm from "./components/CreationForm";
import ConversationForm from "./components/ConversationForm";
import WordForm from "./components/WordForm";
import Review from "./components/Review";
import { useData } from "./contexts/DataContext";
import { someFilter, isFiltered } from "./utils/filterUtils";
import { someConversationFilter, isConversationFiltered } from "./utils/conversationUtils";
import { useNavigation } from "./hooks/useNavigation";

export const url = process.env.REACT_APP_API_URL;
export const ConfigContext = createContext<Context | null>(null);

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

  // Use the navigation hook
  useNavigation(
    openedWords,
    openedConversations,
    status,
    searchFilter,
    treeFilter,
    setOpenedWords,
    setOpenedConversations,
    setStatus,
    setSearchFilter,
    setTreeFilter
  );

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
  }, [words, status, searchFilter, treeFilter, wordTags]);

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
    const conversation = conversations.find(({ _id }) => _id === conversationId);
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
            <Route path="home" element={<ConversationList filteredConversations={filteredConversations} />} />
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
