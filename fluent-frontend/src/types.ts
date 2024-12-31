import { Dispatch, SetStateAction } from "react";

export interface User {
  _id: string;
  username: string;
}

export type Status = "word" | "conversation";

export type TagType = "wordTag" | "conversationTag";

export interface Tag {
  _id: string;
  label: string;
}

export type SearchFilter = { isActive: boolean; data: string[] }[];

export type conversationFilter = { tag?: string };

export interface View {
  openedConversations: Conversation[];
  openedWords: Word[];
  status: string;
  searchFilter: SearchFilter;
  treeFilter: string[];
  location: string;
}

export interface Word {
  _id: string;
  language: string;
  sourceLanguage: string;
  targetLanguage: { id: string; label: string }[];
  tags: string[];
  subscribed: boolean;
}

export interface Sentence {
  text: string;
  prerequisites: string[];
}

export interface Conversation {
  _id: string;
  tags: string[];
  multiLingualSentences: { sourceLanguage: Sentence; targetLanguage: Sentence }[];
  subscribed: boolean;
}

export interface Context {
  filteredWords: Word[];
  words: { [id: string]: Word };
  setWords: Dispatch<SetStateAction<{ [id: string]: Word }>>;
  conversations: Conversation[];
  setConversations: Dispatch<SetStateAction<Conversation[]>>;
  saveConversation: (infos: Conversation) => Promise<void>;
  editConversation: (id: string) => void;
  editWord: (id: string) => void;
  sourceLanguage: string;
  targetLanguage: string;
  openedWords: Word[];
  setOpenedWords: Dispatch<SetStateAction<Word[]>>;
  setOpenedConversations: Dispatch<SetStateAction<Conversation[]>>;
  getConversationById: (id: string) => Promise<Conversation>;
  openedConversations: Conversation[];
  isAuthenticated: boolean | null;
  setIsAuthenticated: Dispatch<SetStateAction<boolean | null>>;
  searchFilter: SearchFilter;
  setSearchFilter: Dispatch<SetStateAction<SearchFilter>>;
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  status: string;
  setStatus: Dispatch<SetStateAction<string>>;
  tags: { [key: string]: Tag[] };
  setTags: Dispatch<SetStateAction<{ wordTags: Tag[]; conversationTags: Tag[] }>>;
  fetchMoreUsedInConversations: (multiLingualSentenceId: string) => void;
  openWord: (id: string) => void;
  openConversation: (id: string) => void;
  deleteConversation: (_id: string) => void;
  deleteWord: (_id: string) => void;
  subscribeToConversation: (_id: string) => void;
  saveWord: (infos: Partial<Word>) => void;
  treeFilter: string[];
  setTreeFilter: Dispatch<SetStateAction<string[]>>;
  searchInput: string;
  setSearchInput: Dispatch<SetStateAction<string>>;
}
