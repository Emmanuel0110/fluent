import React, { ReactNode } from "react";
import { WordProvider, useWords } from "./WordContext";
import { ConversationProvider, useConversations } from "./ConversationContext";

export { WordProvider, useWords } from "./WordContext";
export { ConversationProvider, useConversations } from "./ConversationContext";

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => (
  <WordProvider>
    <ConversationProvider>{children}</ConversationProvider>
  </WordProvider>
);

export const useData = () => {
  const words = useWords();
  const conversations = useConversations();
  return {
    ...words,
    ...conversations,
    isLoading: words.isLoadingWords || conversations.isLoadingConversations,
    loadError: words.wordLoadError ?? conversations.conversationLoadError,
  };
};
