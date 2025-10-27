import React, { createContext, useState, useEffect, ReactNode, useMemo } from "react";
import { Context, Conversation, conversationFilter, ReviewItem, Word, WordTag } from "../types";
import { useData } from "./DataContext";
import { someConversationFilter, isConversationFiltered } from "../utils/conversationUtils";
import { useNavigation } from "../hooks/useNavigation";
import { useNavigate } from "react-router-dom";

export const ConfigContext = createContext<Context | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const ConfigProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [searchInput, setSearchInput] = useState("");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [tagFilter, setTagFilter] = useState<WordTag | null>(null);
  const [conversationFilter, setConversationFilter] = useState<conversationFilter>({});
  const [openedWords, setOpenedWords] = useState([] as Word[]);
  const [openedConversations, setOpenedConversations] = useState([] as Conversation[]);
  const [status, setStatus] = useState("words");
  const [reviewList, setReviewList] = useState<ReviewItem[]>([]);
  const [suggestions, setSuggestions] = useState<Conversation[]>([]);
  const navigate = useNavigate();
  const { words, conversations, wordTags } = useData();

  // Use the navigation hook
  useNavigation(
    openedWords,
    openedConversations,
    status,
    searchFilter,
    tagFilter,
    setOpenedWords,
    setOpenedConversations,
    setStatus,
    setSearchFilter
  );

  const filteredWords = useMemo(() => {
    return Object.values(words).filter((word) => {
      return (!searchFilter || word.text.includes(searchFilter)) && (!tagFilter || word.tags.includes(tagFilter._id));
    });
  }, [words, status, searchFilter, tagFilter, wordTags]);

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

  const openConversation = (conversationId: string, index?: number, sourceOrTarget?: "source" | "target") => {
    const conversation = conversations.find(({ _id }) => _id === conversationId);
    if (conversation) {
      setOpenedConversations((openedConversations) =>
        openedConversations.find(({ _id }) => _id === conversationId)
          ? openedConversations
          : [...openedConversations, conversation]
      );
      navigate(
        "conversations/" +
          conversationId +
          (index != undefined && sourceOrTarget ? "?index=" + index + "&language=" + sourceOrTarget : "")
      );
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
        filteredConversations,
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
        tagFilter,
        setTagFilter,
        searchInput,
        setSearchInput,
        reviewList,
        setReviewList,
        suggestions,
        setSuggestions,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};
