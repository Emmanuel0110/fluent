import { Dispatch, SetStateAction } from "react";

export interface User {
  isAdmin: boolean;
  _id: string;
  username: string;
  email?: string;
  oauthProvider?: "google";
  sourceLanguage: string; //source language of the last course
  targetLanguage: string; //target language of the last course
  userSettings: {
    reviewMode: "auto" | "manual";
    autoReviewDelay: number;
    theme: "light" | "dark";
  };
}


export interface WordTag {
  _id: string;
  language: string;
  label: string;
}

export interface Language {
  _id: string;
  label: string;
}

export interface ConversationTag {
  _id: string;
  sourceLabel: string;
  targetLabel: string;
}

export type conversationFilter = { tag?: string };

export interface View {
  openedConversations: Conversation[];
  openedWords: Word[];
  searchFilter: string;
  tagFilter: WordTag | null;
  location: string;
}

export interface RowWord {
  _id: string;
  language: string;
  text: string;
  translations: {
    language: string;
    lexicalItems: string[];
  }[];
  tags: string[];
}
export interface Word {
  _id: string;
  language: string;
  text: string;
  translations: string[];
  tags: string[];
}

export interface Sentence {
  text: string;
  prerequisites: string[];
}

export interface RowConversation {
  _id: string;
  tags: string[];
  conversations: {
    language: string;
    sentences: [
      {
        text: string;
        prerequisites: string[];
      }
    ];
  }[];
  subscribed: boolean;
}

export interface Conversation {
  _id: string;
  tags: string[];
  multiLingualSentences: { sourceLanguage: Sentence; targetLanguage: Sentence }[];
  subscribed: boolean;
}

export interface ReviewItem extends Conversation {
  multiLingualSentences: { sourceLanguage: Sentence; targetLanguage: Sentence; success: boolean }[];
}

// Progress within the conversation currently being reviewed. Lives in ConfigContext
// so it survives navigating away from (and back to) the review page.
export interface ReviewProgress {
  conversationId: string | null;
  currentSentenceNumber: number;
  answersRevealed: boolean[];
}

export interface DashboardData {
  progress: number;
  rank: string;
  chartData: {
    date: string;
    // null = the daily job never recorded this day (rendered as a "no data" gap),
    // distinct from a real 0.
    wordsLearned: number | null;
  }[];
  currentStreak: number;
  longestStreak: number;
}

// A UI event worth celebrating, computed by the backend on review completion.
// "streak" → consecutive active days; "milestone" → total words learned (multiples of 100).
export type CelebrationEvent =
  | { type: "streak"; value: number }
  | { type: "milestone"; value: number };

export interface Context {
  filteredWords: Word[];
  filteredConversations: Conversation[];
  editConversation: (id: string) => void;
  editWord: (id: string) => void;
  openedWords: Word[];
  setOpenedWords: Dispatch<SetStateAction<Word[]>>;
  setOpenedConversations: Dispatch<SetStateAction<Conversation[]>>;
  openedConversations: Conversation[];
  searchFilter: string;
  setSearchFilter: Dispatch<SetStateAction<string>>;
  openWord: (id: string) => void;
  openConversation: (id: string, index?: number, sourceOrTarget?: "source" | "target") => void;
  tagFilter: WordTag | null;
  setTagFilter: Dispatch<SetStateAction<WordTag | null>>;
  conversationTagFilter: ConversationTag | null;
  setConversationTagFilter: Dispatch<SetStateAction<ConversationTag | null>>;
  searchInput: string;
  setSearchInput: Dispatch<SetStateAction<string>>;
  reviewList: ReviewItem[];
  setReviewList: Dispatch<SetStateAction<ReviewItem[]>>;
  reviewProgress: ReviewProgress;
  setReviewProgress: Dispatch<SetStateAction<ReviewProgress>>;
  suggestions: Conversation[];
  setSuggestions: Dispatch<SetStateAction<Conversation[]>>;
}
