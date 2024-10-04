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
  data: MultiLingualSentence;
  unsavedData?: MultiLingualSentence;
}

export interface View {
  openedFlashcards: OpenFlashcardData[];
  status: string;
  searchFilter: SearchFilter;
  treeFilter: string[];
  location: string;
}

export type Language = "en" | "fr" | "kr";

export interface Word {
  _id: string;
  sourceLanguage: Language;
  targetLanguages: Language[];
  tags: Tag[];
  text: string;
  en?: string[];
  fr?: string[];
  kr?: string[];
  nextReviewDate: Date | undefined;
  learntDate: Date | undefined;
}

export interface Sentence {
  _id: string;
  text: string;
  prerequisites: string[];
  nextReviewDate: Date | undefined; //TODO: necessary or enough at multiLingualSentence level ?
}

export interface MultiLingualSentence {
  _id: string;
  en?: string;
  fr?: string;
  kr?: string;
  nextReviewDate: Date | undefined;
}

export interface Conversation {
  _id: string;
  tags: string[];
  multiLingualSentences: string[];
  nextReviewDate: Date | undefined;
}

export interface Context {
  flashcards: Flashcard[];
  multiLingualSentences: MultiLingualSentence[];
  setMultiLingualSentences: Dispatch<SetStateAction<MultiLingualSentence[]>>;
  filteredWords: Word[];
  setFlashcards: Dispatch<SetStateAction<Flashcard[]>>;
  words: { [key: string]: Word[] };
  setWords: Dispatch<SetStateAction<{ [key: string]: Word[] }>>;
  sentences: Sentence[];
  setSentences: Dispatch<SetStateAction<Sentence[]>>;
  conversations: Conversation[];
  setConversations: Dispatch<SetStateAction<Conversation[]>>;
  sourceLanguage: Language;
  targetLanguage: Language;
  openedWords: OpenWordData[];
  setOpenedWords: Dispatch<SetStateAction<OpenWordData[]>>;
  openedMultiLingualSentences: OpenMultiLingualSentenceData[];
  setOpenedMultiLingualSentences: Dispatch<SetStateAction<OpenMultiLingualSentenceData[]>>;
  isAuthenticated: boolean | null;
  setIsAuthenticated: Dispatch<SetStateAction<boolean | null>>;
  searchFilter: SearchFilter;
  setSearchFilter: Dispatch<SetStateAction<SearchFilter>>;
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  status: string;
  setStatus: Dispatch<SetStateAction<string>>;
  tags: Tag[];
  setTags: Dispatch<SetStateAction<Tag[]>>;
  fetchMoreUsedInMultiLingualSentences: (wordId: string) => void;
  fetchMoreUsedInConversations: (multiLingualSentenceId: string) => void;
  deleteFlashcard: (id: string) => void;
  openMultiLingualSentence: (id: string) => void;
  openWord: (id: string, language: Language) => void;
  editFlashcard: (id: string) => void;
  editCurrentFlashcard: (flashcard: Flashcard) => void;
  subscribeToWord: ({ _id, nextReviewDate }: Partial<Flashcard>) => void;
  subscribeToMultiLingualSentence: ({ _id, nextReviewDate }: Partial<Flashcard>) => void;
  saveSentence: (infos: Partial<Sentence>) => void;
  saveAsNewFlashcard: (infos: Partial<Flashcard>) => Promise<Flashcard>;
  getMultiLingualSentenceById: (id: string) => Promise<MultiLingualSentence>;
  treeFilter: string[];
  setTreeFilter: Dispatch<SetStateAction<string[]>>;
  searchInput: string;
  setSearchInput: Dispatch<SetStateAction<string>>;
}
