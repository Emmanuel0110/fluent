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

export interface OpenFlashcardData {
  id: string;
  data: Flashcard;
  unsavedData?: Flashcard;
}

export interface OpenWordData {
  id: string;
  data: Word;
  unsavedData?: Word;
}

export interface OpenMultiLingualSentenceData {
  id: string;
  data: CompletedMultiLingualSentence;
  unsavedData?: CompletedMultiLingualSentence;
}

export interface View {
  openedFlashcards: OpenFlashcardData[];
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
  conversations: Conversation[];
  setConversations: Dispatch<SetStateAction<Conversation[]>>;
  sourceLanguage: Language;
  targetLanguage: Language;
  openedWords: OpenWordData[];
  setOpenedWords: Dispatch<SetStateAction<OpenWordData[]>>;
  setOpenedConversations: Dispatch<SetStateAction<OpenMultiLingualSentenceData[]>>;
  getConversationById: (id: string) => Promise<Conversation>;
  openedConversations: OpenMultiLingualSentenceData[];
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
  openMultiLingualSentence: (id: string) => void;
  openWord: (id: string) => void;
  editFlashcard: (id: string) => void;
  editCurrentFlashcard: (flashcard: Flashcard) => void;
  deleteConversation: (_id: string) => void;
  deleteWord: (_id: string) => void;
  subscribeToConversation: (_id: string) => void;
  saveSentence: (infos: Partial<Sentence>) => void;
  saveWord: (infos: Partial<Word>) => void;
  saveAsNewFlashcard: (infos: Partial<Flashcard>) => Promise<Flashcard>;
  treeFilter: string[];
  setTreeFilter: Dispatch<SetStateAction<string[]>>;
  searchInput: string;
  setSearchInput: Dispatch<SetStateAction<string>>;
}
