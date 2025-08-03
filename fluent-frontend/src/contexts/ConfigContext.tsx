import React, { createContext, useState, useEffect, ReactNode, useMemo } from "react";
import { Context, Conversation, conversationFilter, ReviewItem, SearchFilter, Word } from "../types";
import { useData } from "./DataContext";
import { someFilter, isFiltered } from "../utils/filterUtils";
import { someConversationFilter, isConversationFiltered } from "../utils/conversationUtils";
import { useNavigation } from "../hooks/useNavigation";
import { useNavigate } from "react-router-dom";

export const ConfigContext = createContext<Context | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export const ConfigProvider: React.FC<AuthProviderProps> = ({ children }) => {
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
        treeFilter,
        setTreeFilter,
        searchInput,
        setSearchInput,
        reviewList,
        setReviewList,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};
