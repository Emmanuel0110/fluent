import { Dispatch, SetStateAction } from "react";

export interface User {
  _id: string;
  username: string;
}

export type Status = "Draft" | "To be validated" | "Published" | "Obsolete";

export interface Flashcard {
  _id: string;
  author: User;
  title: string;
  question: string;
  answer: string;
  tags: Tag[];
  status: Status;
  nextReviewDate: Date | undefined;
  hasBeenRead: boolean;
  creationDate: Date | undefined;
  submitDate: Date | undefined;
  publishDate: Date | undefined;
  publishAuthor: User;
  lastModificationDate: Date | undefined;
  learntDate: Date | undefined;
  prerequisites: string[];
  usedIn: string[];
}

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
  editWord: (id: string) => void;
  conversations: Conversation[];
  setConversations: Dispatch<SetStateAction<Conversation[]>>;
  saveConversation: (infos: Partial<Conversation>) => void;
  editConversation: (id: string) => void;
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
