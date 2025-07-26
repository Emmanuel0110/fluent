import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";
import {
  fetchWordTags,
  fetchConversationTags,
  fetchWords,
  fetchConversations,
  saveNewWord,
  editRemoteWord,
  deleteRemoteWord,
  saveNewWordTag,
  saveNewConversationTag,
  editRemoteConversationTag,
  saveNewConversation,
  editRemoteConversation,
  deleteRemoteConversation,
  unsubscribeToRemoteConversation,
  subscribeToRemoteConversation,
  updateRemoteConversationReviewStatus,
  getRemoteConversationById,
  getRemoteConversationByWordId,
} from "../APICalls";
import { Conversation, ConversationTag, ReviewItem, Word, WordTag } from "../types";
import { useNavigate } from "react-router-dom";
import {
  formatConversations,
  updateCacheWithNewConversations,
  updateCacheWithNewConversationTags,
} from "../utils/conversationUtils";
import { formatWord, updateCacheWithNewWordTags } from "../utils/wordUtils";

interface DataContextType {
  // Remote data state
  words: { [id: string]: Word };
  conversations: Conversation[];
  wordTags: WordTag[];
  conversationTags: ConversationTag[];

  // Data manipulation functions
  fetchMoreUsedInConversations: (multiLingualSentenceId: string) => void;
  subscribeToConversation: (conversation: Conversation) => void;
  unsubscribeToConversation: (conversation: Conversation) => void;
  getConversationById: (id: string) => Promise<Conversation>;
  updateConversationReviewStatus: (conversation: ReviewItem) => Promise<void>;
  saveWord: (infos: Word) => Promise<Word | undefined>;
  deleteWord: (id: string) => Promise<void>;
  saveWordTag: (args: { language: string; label: string }) => Promise<WordTag | undefined>;
  saveConversation: (infos: Conversation) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  saveConversationTag: (infos: ConversationTag) => Promise<void>;

  // Data loading
  loadAllData: () => Promise<void>;
  isLoading: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { sourceLanguage, targetLanguage } = useLanguage();

  // Remote data state
  const [words, setWords] = useState<{ [id: string]: Word }>({});
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [wordTags, setWordTags] = useState<WordTag[]>([]);
  const [conversationTags, setConversationTags] = useState<ConversationTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Load data when authenticated or languages change
  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    } else {
      // Clear data when not authenticated
      setWords({});
      setConversations([]);
      setWordTags([]);
      setConversationTags([]);
    }
  }, [isAuthenticated, sourceLanguage, targetLanguage]);

  const loadAllData = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const [wordTagsData, conversationTagsData, wordsData, conversationsData] = await Promise.all([
        fetchWordTags(),
        fetchConversationTags(),
        fetchWords(),
        fetchConversations(), // TODO : only for testing. Remove later
      ]);

      setWordTags(wordTagsData || []);
      setConversationTags(conversationTagsData || []);
      setWords(wordsData || {});
      setConversations(formatConversations(conversationsData, targetLanguage) || []);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Data manipulation functions
  const saveWord = async (infos: Word): Promise<Word | undefined> => {
    const res = await (infos._id
      ? editRemoteWord(infos, sourceLanguage, targetLanguage)
      : saveNewWord(infos, sourceLanguage, targetLanguage));

    if (res.success) {
      const { _id } = res.data;
      if (_id) {
        const formattedWord = formatWord(res.data);
        setWords((words) => ({ ...words, [_id]: formattedWord }));
        return formattedWord;
      }
    }
  };

  const deleteWord = async (id: string) => {
    await deleteRemoteWord(id);
    setWords((words) => {
      const newState = { ...words };
      delete newState[id];
      return newState;
    });
  };

  const saveWordTag = async (args: { language: string; label: string }) => {
    const res = await saveNewWordTag(args);
    if (res.success) {
      setWordTags((wordTags) => updateCacheWithNewWordTags(wordTags, [res.data]));
      return res.data;
    }
  };

  const saveConversation = async (infos: Conversation) => {
    const res = await (infos._id
      ? editRemoteConversation(infos, sourceLanguage, targetLanguage)
      : saveNewConversation(infos, sourceLanguage, targetLanguage));

    if (res.success) {
      setConversations((conversations) => updateCacheWithNewConversations(conversations, [res.data], targetLanguage));
      navigate("/conversations" + res.data._id); //TODO: separate concerns
    }
  };

  const deleteConversation = async (id: string) => {
    await deleteRemoteConversation(id);
    setConversations((conversations) => conversations.filter((conversation) => conversation._id !== id));
  };

  const saveConversationTag = async (infos: ConversationTag) => {
    const res = await (infos._id ? editRemoteConversationTag(infos) : saveNewConversationTag(infos));

    if (res.success) {
      setConversationTags((conversationTags) => updateCacheWithNewConversationTags(conversationTags, [res.data]));
    }
  };

  const fetchMoreUsedInConversations = async (wordId: string) => {
    getRemoteConversationByWordId(wordId).then((res) => {
      if (res.success) {
        setConversations((conversations) => updateCacheWithNewConversations(conversations, res.data, targetLanguage));
      }
    });
  };

  const subscribeToConversation = (conversation: Conversation) => {
    const conversationId = conversation._id;
    subscribeToRemoteConversation(conversationId).then((res) => {
      if (res.success) {
        setConversations((conversations) =>
          conversations.map((conversation) =>
            conversation._id === conversationId ? { ...conversation, subscribed: true } : conversation
          )
        );
      }
    });
  };

  const unsubscribeToConversation = (conversation: Conversation) => {
    const conversationId = conversation._id;
    unsubscribeToRemoteConversation(conversationId).then((res: { success: boolean }) => {
      if (res.success) {
        setConversations((conversations) =>
          conversations.map((conversation) =>
            conversation._id === conversationId ? { ...conversation, subscribed: false } : conversation
          )
        );
      }
    });
  };

  const updateConversationReviewStatus = async (reviewItem: ReviewItem) => {
    const conversationId = reviewItem._id;
    const successOnFirstTry = !reviewItem.alreadyFailed;
    await updateRemoteConversationReviewStatus(conversationId, successOnFirstTry);
  };

  const getConversationById = (id: string): Promise<Conversation> => {
    const conversation = conversations.find(({ _id }) => _id === id);
    return conversation
      ? Promise.resolve(conversation)
      : getRemoteConversationById(id).then(({ newConversation }) => {
          if (newConversation) {
            setConversations((conversations) =>
              updateCacheWithNewConversations(conversations, [newConversation], targetLanguage)
            );
          }
          return newConversation;
        });
  };

  return (
    <DataContext.Provider
      value={{
        words,
        conversations,
        wordTags,
        conversationTags,
        isLoading,
        fetchMoreUsedInConversations,
        subscribeToConversation,
        unsubscribeToConversation,
        getConversationById,
        updateConversationReviewStatus,
        saveWord,
        deleteWord,
        saveWordTag,
        saveConversation,
        deleteConversation,
        saveConversationTag,
        loadAllData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
