import { Conversation, RowConversation, ConversationTag, conversationFilter } from "../types";

type RawConversationTag = {
  _id: string;
  labels: { language: string; label: string }[];
};

export const formatConversationTags = (
  rawTags: RawConversationTag[],
  sourceLanguage: string,
  targetLanguage: string
): ConversationTag[] =>
  rawTags.map(({ _id, labels }) => ({
    _id,
    sourceLabel: labels.find((l) => l.language === sourceLanguage)?.label ?? "",
    targetLabel: labels.find((l) => l.language === targetLanguage)?.label ?? "",
  }));

export const formatConversations = (conversations: RowConversation[], targetLanguage: string): Conversation[] => {
  return conversations.map((multiLingualConversation) => {
    const { _id, tags, subscribed } = multiLingualConversation;
    let [sourceConversation, targetConversation] = multiLingualConversation.conversations;
    if (sourceConversation.language === targetLanguage) {
      const tmp = sourceConversation;
      sourceConversation = targetConversation;
      targetConversation = tmp;
    }
    return {
      _id,
      tags,
      subscribed,
      multiLingualSentences: sourceConversation.sentences.map((sourceSentence: any, index: number) => {
        return { sourceLanguage: sourceSentence, targetLanguage: targetConversation.sentences[index] };
      }),
    };
  });
};

export const updateCacheWithNewConversations = (
  conversations: Conversation[],
  newConversations: RowConversation[],
  targetLanguage: string
): Conversation[] => {
  return formatConversations(newConversations, targetLanguage).reduce((acc: Conversation[], value: Conversation) => {
    const index: number = acc.findIndex((conversation) => conversation._id === value._id);
    if (index === -1) {
      return [...acc, value];
    } else {
      acc.splice(index, 1, value);
      return [...acc];
    }
  }, conversations);
};

export const updateCacheWithNewConversationTags = (
  conversationTags: ConversationTag[],
  newConversationTags: ConversationTag[]
): ConversationTag[] => {
  return newConversationTags.reduce((acc: ConversationTag[], value: ConversationTag) => {
    const index: number = acc.findIndex((tag) => tag._id === value._id);
    if (index === -1) {
      return [...acc, value];
    } else {
      acc.splice(index, 1, value);
      return [...acc];
    }
  }, conversationTags);
};

export const someConversationFilter = (conversationFilter: conversationFilter): boolean => {
  return conversationFilter.tag !== undefined;
};

export const isConversationFiltered = (conversation: Conversation, conversationFilter: conversationFilter): boolean => {
  return conversationFilter.tag !== undefined && conversation.tags.includes(conversationFilter.tag);
};
