import React, { createContext, useState, useEffect, ReactNode, useMemo } from "react";
import { Context, Conversation, ConversationTag, ReviewItem, Word, WordTag } from "../types";
import { useData } from "./DataContext";
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
  const [conversationTagFilter, setConversationTagFilter] = useState<ConversationTag | null>(null);
  const [openedWords, setOpenedWords] = useState([] as Word[]);
  const [openedConversations, setOpenedConversations] = useState([] as Conversation[]);
  const [reviewList, setReviewList] = useState<ReviewItem[]>([]);
  const [suggestions, setSuggestions] = useState<Conversation[]>([]);
  const navigate = useNavigate();
  const { words, conversations, wordTags } = useData();

  // Use the navigation hook
  useNavigation(
    openedWords,
    openedConversations,
    searchFilter,
    tagFilter,
    setOpenedWords,
    setOpenedConversations,
    setSearchFilter,
  );

  const filteredWords = useMemo(() => {
    return Object.values(words).filter((word) => {
      return (
        (!searchFilter || word.text.toLowerCase().includes(searchFilter.toLowerCase())) &&
        (!tagFilter || word.tags.includes(tagFilter._id))
      );
    });
  }, [words, searchFilter, tagFilter, wordTags]);

  const filteredConversations = useMemo(() => {
    if (!conversationTagFilter) return conversations;
    return conversations.filter((conversation) => conversation.tags.includes(conversationTagFilter._id));
  }, [conversations, conversationTagFilter]);

  useEffect(() => {
    if (openedConversations.length !== 0) {
      setOpenedConversations((openedConversations) =>
        openedConversations.map((openedConversation) => {
          const conversation = conversations.find(({ _id }) => _id === openedConversation._id);
          return conversation || openedConversation;
        }),
      );
    }
  }, [conversations]);

  const openWord = (wordId: string) => {
    const word = words[wordId];
    if (word) {
      setOpenedWords((openedWords) =>
        openedWords.find(({ _id }) => _id === wordId) ? openedWords : [...openedWords, word],
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
          : [...openedConversations, conversation],
      );
      navigate(
        "conversations/" +
          conversationId +
          (index != undefined && sourceOrTarget ? "?index=" + index + "&language=" + sourceOrTarget : ""),
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
        openWord,
        openConversation,
        tagFilter,
        setTagFilter,
        conversationTagFilter,
        setConversationTagFilter,
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
