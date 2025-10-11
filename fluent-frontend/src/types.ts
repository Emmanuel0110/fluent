import { Dispatch, SetStateAction } from "react";

export interface User {
  _id: string;
  username: string;
  sourceLanguage: string; //source language of the last course
  targetLanguage: string; //target language of the last course
  userSettings: {
    reviewMode: "auto" | "manual";
    autoReviewDelay: number;
  };
}

export type Status = "word" | "conversation";

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
  status: string;
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
  alreadyFailed: boolean;
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
  status: string;
  setStatus: Dispatch<SetStateAction<string>>;
  openWord: (id: string) => void;
  openConversation: (id: string, index?: number, sourceOrTarget?: "source" | "target") => void;
  tagFilter: WordTag | null;
  setTagFilter: Dispatch<SetStateAction<WordTag | null>>;
  searchInput: string;
  setSearchInput: Dispatch<SetStateAction<string>>;
  reviewList: ReviewItem[];
  setReviewList: Dispatch<SetStateAction<ReviewItem[]>>;
}
