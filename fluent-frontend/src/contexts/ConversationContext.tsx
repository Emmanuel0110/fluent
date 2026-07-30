import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";
import {
  fetchConversationTags,
  fetchConversations,
  saveNewConversation,
  editRemoteConversation,
  deleteRemoteConversation,
  saveNewConversationTag,
  editRemoteConversationTag,
  subscribeToRemoteConversations,
  unsubscribeToRemoteConversation,
  dismissRemoteSuggestion,
  updateRemoteConversationReviewStatus,
  getRemoteConversationById,
  getRemoteConversationByWordId,
  getSuggestions,
} from "../APICalls";
import { Conversation, ConversationTag, ReviewItem, RowConversation } from "../types";
import {
  formatConversations,
  formatConversationTags,
  updateCacheWithNewConversations,
  updateCacheWithNewConversationTags,
} from "../utils/conversationUtils";
import { ApiError } from "../utils/http-helpers";

function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.userMessage;
  if (err instanceof Error) return err.message;
  return String(err);
}

interface ConversationContextType {
  conversations: Conversation[];
  conversationTags: ConversationTag[];
  isLoadingConversations: boolean;
  conversationLoadError: string | null;
  saveConversation: (infos: Conversation) => Promise<string | undefined>;
  deleteConversation: (id: string) => Promise<void>;
  saveConversationTag: (infos: ConversationTag) => Promise<void>;
  subscribeToConversations: (conversationIds: string[]) => Promise<void>;
  unsubscribeToConversation: (conversation: Conversation) => void;
  fetchMoreUsedInConversations: (wordId: string) => void;
  fetchSuggestions: () => Promise<string[]>;
  dismissSuggestion: (conversationId: string) => Promise<boolean>;
  getConversationById: (id: string) => Promise<Conversation | undefined>;
  updateConversationReviewStatus: (conversation: ReviewItem) => Promise<void>;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export const useConversations = () => {
  const context = useContext(ConversationContext);
  if (!context) throw new Error("useConversations must be used within a ConversationProvider");
  return context;
};

export const ConversationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { sourceLanguage, targetLanguage } = useLanguage();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationTags, setConversationTags] = useState<ConversationTag[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [conversationLoadError, setConversationLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    } else {
      setConversations([]);
      setConversationTags([]);
    }
  }, [isAuthenticated, targetLanguage]);

  const loadConversations = async () => {
    if (!isAuthenticated) return;
    setIsLoadingConversations(true);
    setConversationLoadError(null);
    try {
      const [conversationTagsData, conversationsData] = await Promise.all([
        fetchConversationTags(),
        fetchConversations(),
      ]);
      setConversationTags(formatConversationTags(conversationTagsData || [], sourceLanguage, targetLanguage));
      setConversations(formatConversations(conversationsData, targetLanguage) || []);
    } catch (error) {
      setConversationLoadError(getErrorMessage(error));
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const saveConversation = async (infos: Conversation): Promise<string | undefined> => {
    const res = await (infos._id
      ? editRemoteConversation(infos, sourceLanguage, targetLanguage)
      : saveNewConversation(infos, sourceLanguage, targetLanguage));
    if (res.success) {
      setConversations((conversations) => updateCacheWithNewConversations(conversations, [res.data], targetLanguage));
      return res.data._id;
    }
  };

  const deleteConversation = async (id: string) => {
    await deleteRemoteConversation(id);
    setConversations((conversations) => conversations.filter((conversation) => conversation._id !== id));
  };

  const saveConversationTag = async (infos: ConversationTag) => {
    const res = await (infos._id
      ? editRemoteConversationTag(infos, sourceLanguage, targetLanguage)
      : saveNewConversationTag(infos, sourceLanguage, targetLanguage));

    if (res.success) {
      const formatted = formatConversationTags([res.data], sourceLanguage, targetLanguage);
      setConversationTags((conversationTags) => updateCacheWithNewConversationTags(conversationTags, formatted));
    }
  };

  const fetchMoreUsedInConversations = async (wordId: string) => {
    getRemoteConversationByWordId(wordId).then((res) => {
      if (res.success) {
        setConversations((conversations) => updateCacheWithNewConversations(conversations, res.data, targetLanguage));
      }
    });
  };

  const fetchSuggestions = async () => {
    return getSuggestions().then((suggestions) => {
      setConversations((conversations) => updateCacheWithNewConversations(conversations, suggestions, targetLanguage));
      return suggestions.map(({ _id }) => _id);
    });
  };

  const dismissSuggestion = async (conversationId: string) => {
    const res = await dismissRemoteSuggestion(conversationId);
    return !!(res && (res as { success?: boolean }).success);
  };

  // Optimistic: the deck is updated locally right away so adding a whole batch never
  // blocks the UI. The promise is returned only for callers that must not run before
  // the server knows about the new conversations (starting a review right after).
  const subscribeToConversations = (conversationIds: string[]): Promise<void> => {
    if (!conversationIds.length) return Promise.resolve();
    setConversations((conversations) =>
      conversations.map((conversation) =>
        conversationIds.includes(conversation._id) ? { ...conversation, subscribed: true } : conversation
      )
    );
    return subscribeToRemoteConversations(conversationIds).then(() => undefined);
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
    const successArray = reviewItem.multiLingualSentences.map(({ success }) => success);
    await updateRemoteConversationReviewStatus(conversationId, successArray);
  };

  const getConversationById = (id: string): Promise<Conversation | undefined> => {
    const conversation = conversations.find(({ _id }) => _id === id);
    if (conversation) return Promise.resolve(conversation);
    return getRemoteConversationById(id).then((res) => {
      if (!res || !(res as { success?: boolean }).success) return undefined;
      const row = (res as { data?: RowConversation }).data;
      if (row) {
        setConversations((conversations) => updateCacheWithNewConversations(conversations, [row], targetLanguage));
        const formatted = formatConversations([row], targetLanguage);
        return formatted[0];
      }
      return undefined;
    });
  };

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        conversationTags,
        isLoadingConversations,
        conversationLoadError,
        saveConversation,
        deleteConversation,
        saveConversationTag,
        subscribeToConversations,
        unsubscribeToConversation,
        fetchMoreUsedInConversations,
        fetchSuggestions,
        dismissSuggestion,
        getConversationById,
        updateConversationReviewStatus,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};
