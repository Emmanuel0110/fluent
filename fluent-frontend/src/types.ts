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

export interface DashboardData {
  progress: number;
  rank: string;
  chartData: {
    date: string;
    wordsLearned: number;
  }[];
}

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
  suggestions: Conversation[];
  setSuggestions: Dispatch<SetStateAction<Conversation[]>>;
}
