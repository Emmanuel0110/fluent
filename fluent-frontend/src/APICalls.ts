import { url } from "./App";
import { authHeaders, customFetch } from "./utils/http-helpers";
import { Conversation, ConversationTag, RowConversation, Word, WordTag } from "./types";
import { groupById } from "./utils/generalUtils";
import { formatWords } from "./utils/wordUtils";

export const getRemoteConversationById = async (id: string) => {
  return customFetch(url + "conversations?conversationId=" + id, {
    method: "GET",
    headers: authHeaders(),
  }).catch((err: Error) => {
    console.log(err);
  });
};

export const getRemoteConversationByWordId = async (id: string) => {
  return customFetch(url + "conversations?wordId=" + id, {
    method: "GET",
    headers: authHeaders(),
  }).catch((err: Error) => {
    console.log(err);
    return { success: false, message: err.message };
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
    return { success: false, message: err.message };
  });
};

export const saveNewWordTag = async (args: Partial<WordTag>) => {
  const body = JSON.stringify(args);
  return customFetch(url + "wordTags", { method: "POST", headers: authHeaders(), body }).catch((err: Error) => {
    console.log(err);
    return { success: false, message: err.message };
  });
};

export const editRemoteWord = async ({ _id, ...args }: Word, appSourceLanguage: string, appTargetLanguage: string) => {
  const formattedWord = formatWord(args, appSourceLanguage, appTargetLanguage);
  const body = JSON.stringify(formattedWord);
  return customFetch(url + "words/" + _id, { method: "PUT", headers: authHeaders(), body }).catch((err: Error) => {
    console.log(err);
    return { success: false, message: err.message };
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
    return { success: false, message: err.message };
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
      return { success: false, message: err.message };
    }
  );
};

export const saveNewConversationTag = async ({ _id, ...infos }: ConversationTag) => {
  const body = JSON.stringify(infos);
  return customFetch(url + "conversationTags", { method: "POST", headers: authHeaders(), body }).catch((err: Error) => {
    console.log(err);
    return { success: false, message: err.message };
  });
};

export const editRemoteConversationTag = async ({ _id, ...infos }: ConversationTag) => {
  const body = JSON.stringify(infos);
  return customFetch(url + "conversationTags/" + _id, { method: "PUT", headers: authHeaders(), body }).catch(
    (err: Error) => {
      console.log(err);
      return { success: false, message: err.message };
    }
  );
};

export const deleteRemoteWord = async (wordId: string) => {
  return customFetch(url + "words/" + wordId, { method: "DELETE", headers: authHeaders() }).catch((err: Error) => {
    console.log(err);
    return { success: false, message: err.message };
  });
};

export const deleteRemoteConversation = async (conversationId: string) => {
  return customFetch(url + "conversations/" + conversationId, { method: "DELETE", headers: authHeaders() }).catch(
    (err: Error) => {
      console.log(err);
      return { success: false, message: err.message };
    }
  );
};

export const subscribeToRemoteConversation = async (id: string) => {
  const body = JSON.stringify({
    conversationToSubscribe: id,
  });
  return customFetch(url + "usercourses", { method: "PATCH", headers: authHeaders(), body }).catch((err: Error) => {
    console.log(err);
    return { success: false, message: err.message };
  });
};

export const unsubscribeToRemoteConversation = async (id: string) => {
  const body = JSON.stringify({
    conversationToUnsubscribe: id,
  });
  return customFetch(url + "usercourses", { method: "PATCH", headers: authHeaders(), body }).catch((err: Error) => {
    console.log(err);
    return { success: false, message: err.message };
  });
};

export const updateRemoteConversationReviewStatus = async (id: string, success: boolean) => {
  const body = JSON.stringify({
    reviewedConversationId: id,
    success,
  });
  return customFetch(url + "usercourses", { method: "PATCH", headers: authHeaders(), body }).catch((err: Error) => {
    console.log(err);
    return { success: false, message: err.message };
  });
};

export const fetchLanguages = async () => {
  return customFetch(url + "languages", { headers: authHeaders() })
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

export const fetchWords = async (lastUpdateDate: string | undefined) => {
  return customFetch(url + "words" + (lastUpdateDate ? "?lastUpdateDate=" + lastUpdateDate : ""), {
    headers: authHeaders(),
  })
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

export const fetchConversations = async () => {
  return customFetch(url + "conversations", { headers: authHeaders() })
    .then((res) => {
      if (res.success) {
        return res.data as RowConversation[];
      } else {
        console.log(res?.message);
        return [] as RowConversation[];
      }
    })
    .catch((err: Error) => {
      console.log(err);
      return [] as RowConversation[];
    });
};

export const updateLanguages = async (args: { sourceLanguage: string; targetLanguage: string }) => {
  const body = JSON.stringify(args);
  return customFetch(url + "users", { method: "PATCH", headers: authHeaders(), body })
    .then((res) => {
      if (res.success) {
        return res.data;
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

export const updateRemoteUserSettings = async (args: { reviewMode?: "auto" | "manual"; autoReviewDelay?: number }) => {
  const body = JSON.stringify(args);
  return customFetch(url + "users/settings", { method: "PATCH", headers: authHeaders(), body }).catch((err: Error) => {
    console.log(err);
    return { success: false, message: err.message };
  });
};

export const getReviewList = async () => {
  return customFetch(url + "reviewItems", { headers: authHeaders() })
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
      return [];
    });
};

export const getSuggestions = async (): Promise<RowConversation[]> => {
  return customFetch(url + "reviewItems/suggestions", { headers: authHeaders() })
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
      return [];
    });
};

export const getDashboardData = async () => {
  return customFetch(url + "usercourses/dashboard", { headers: authHeaders() })
    .then((res) => {
      if (res.success) {
        return res.data;
      } else {
        console.log(res?.message);
        return null;
      }
    })
    .catch((err: Error) => {
      console.log(err);
      return null;
    });
};

export const saveFeedback = async (comment: string, pageUrl: string) => {
  const body = JSON.stringify({ comment, pageUrl });
  return customFetch(url + "feedback", { method: "POST", headers: authHeaders(), body })
    .then((res) => {
      return { success: true };
    })
    .catch((err: Error) => {
      console.log(err);
      return { success: false, message: err.message };
    });
};

export const fetchFeedbacks = async (page: number = 1, limit: number = 50) => {
  return customFetch(url + `feedback?page=${page}&limit=${limit}`, { headers: authHeaders() })
    .then((res) => {
      if (res.success) {
        return {
          feedbacks: res.data,
          pagination: res.pagination,
        };
      } else {
        console.log(res?.message);
        return { feedbacks: [], pagination: null };
      }
    })
    .catch((err: Error) => {
      console.log(err);
      return { feedbacks: [], pagination: null };
    });
};