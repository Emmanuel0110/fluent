import { url } from "../App";
import { authHeaders, customFetch } from "../utils/http-helpers";
import { Conversation, ConversationTag, Word, WordTag } from "../types";

export const getRemoteConversationById = async (id: string) => {
  return customFetch(url + "conversations?conversationId=" + id, {
    method: "GET",
    headers: authHeaders(),
  }).catch((err: Error) => {
    console.log(err);
  });
};

const formatWord = (word: Partial<Word>, appSourceLanguage: string, appTargetLanguage: string) => {
  const { text, language, translations, tags } = word;
  return {
    tags,
    language,
    text,
    translations: [
      { language: language === appSourceLanguage ? appTargetLanguage : appSourceLanguage, lexicalItems: translations },
    ],
  };
};

export const saveNewWord = async (word: Word, appSourceLanguage: string, appTargetLanguage: string) => {
  const formattedWord = formatWord(word, appSourceLanguage, appTargetLanguage);
  const body = JSON.stringify(formattedWord);
  return customFetch(url + "words", { method: "POST", headers: authHeaders(), body }).catch((err: Error) => {
    console.log(err);
  });
};

export const saveNewWordTag = async (args: Partial<WordTag>) => {
  const body = JSON.stringify(args);
  return customFetch(url + "wordTags", { method: "POST", headers: authHeaders(), body }).catch((err: Error) => {
    console.log(err);
  });
};

export const editRemoteWord = async ({ _id, ...args }: Word, appSourceLanguage: string, appTargetLanguage: string) => {
  const formattedWord = formatWord(args, appSourceLanguage, appTargetLanguage);
  const body = JSON.stringify(formattedWord);
  return customFetch(url + "words/" + _id, { method: "PUT", headers: authHeaders(), body }).catch((err: Error) => {
    console.log(err);
  });
};

const formatConversation = (conversation: Conversation, appSourceLanguage: string, appTargetLanguage: string) => {
  const { _id, multiLingualSentences, tags } = conversation;
  return {
    _id,
    tags,
    conversations: [
      { language: appSourceLanguage, sentences: multiLingualSentences.map((sentence) => sentence.sourceLanguage) },
      { language: appTargetLanguage, sentences: multiLingualSentences.map((sentence) => sentence.targetLanguage) },
    ],
  };
};

export const saveNewConversation = async (
  conversation: Conversation,
  appSourceLanguage: string,
  appTargetLanguage: string
) => {
  const formattedConversation = formatConversation(conversation, appSourceLanguage, appTargetLanguage);
  const body = JSON.stringify(formattedConversation);
  return customFetch(url + "conversations", { method: "POST", headers: authHeaders(), body }).catch((err: Error) => {
    console.log(err);
  });
};

export const editRemoteConversation = async (
  conversation: Conversation,
  appSourceLanguage: string,
  appTargetLanguage: string
) => {
  const formattedConversation = formatConversation(conversation, appSourceLanguage, appTargetLanguage);
  const body = JSON.stringify(formattedConversation);
  return customFetch(url + "conversations/" + conversation._id, { method: "PUT", headers: authHeaders(), body }).catch(
    (err: Error) => {
      console.log(err);
    }
  );
};

export const saveNewConversationTag = async ({ _id, ...infos }: ConversationTag) => {
  const body = JSON.stringify(infos);
  return customFetch(url + "conversationTags", { method: "POST", headers: authHeaders(), body }).catch((err: Error) => {
    console.log(err);
  });
};

export const editRemoteConversationTag = async ({ _id, ...infos }: ConversationTag) => {
  const body = JSON.stringify(infos);
  return customFetch(url + "conversationTags/" + _id, { method: "PUT", headers: authHeaders(), body }).catch(
    (err: Error) => {
      console.log(err);
    }
  );
};

export const deleteRemoteWord = async (wordId: string) => {
  return customFetch(url + "words/" + wordId, { method: "DELETE", headers: authHeaders() }).catch((err: Error) => {
    console.log(err);
  });
};

export const deleteRemoteConversation = async (conversationId: string) => {
  return customFetch(url + "conversations/" + conversationId, { method: "DELETE", headers: authHeaders() }).catch(
    (err: Error) => {
      console.log(err);
    }
  );
};

export const subscribeToRemoteConversation = async (id: string) => {
  const body = JSON.stringify({
    conversationId: id,
  });
  return customFetch(url + "usercourse", { method: "PATCH", headers: authHeaders(), body }).catch((err: Error) => {
    console.log(err);
  });
};

export const editUserFlashcardInfo = async ({ _id, ...body }: any) => {
  return customFetch(url + "userflashcardinfo/" + _id, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(body),
  }).catch((err: Error) => {
    console.log(err);
  });
};

export const getRemotePrerequisiteAndUsedIn = async (ids: string[]): Promise<Word[]> => {
  return customFetch(url + "search", {
    method: "POST", // we want to GET flashcards but sometimes with a complex filter (string[][])
    headers: authHeaders(),
    body: JSON.stringify({ prerequisitesAndUsedIn: ids }),
  }).catch((err: Error) => {
    console.log(err);
  });
};

export const fetchWordTags = async () => {
  return customFetch(url + "wordtags", { headers: authHeaders() })
    .then((res) => {
      if (res.success) {
        return res.data;
      } else {
        console.log(res?.message);
        return [];
      }
    })
    .catch((err: Error) => {
      console.log(err);
    });
};

export const fetchConversationTags = async () => {
  return customFetch(url + "conversationtags", { headers: authHeaders() })
    .then((res) => {
      if (res.success) {
        return res.data;
      } else {
        console.log(res?.message);
        return [];
      }
    })
    .catch((err: Error) => {
      console.log(err);
    });
};

export const fetchWords = async () => {
  return customFetch(url + "words", { headers: authHeaders() })
    .then((res) => {
      if (res.success) {
        return groupById(formatWords(res.data));
      } else {
        console.log(res?.message);
        return {};
      }
    })
    .catch((err: Error) => {
      console.log(err);
      return {};
    });
};

const groupById = <T extends { _id: string }>(ObjectArr: T[]): { [key: string]: T } => {
  return ObjectArr.reduce((acc, value) => {
    return { ...acc, [value._id]: value };
  }, {});
};

const formatWords = (words: any[]): Word[] => {
  return words.map((word) => ({ ...word, translations: word.translations[0].lexicalItems }));
};
