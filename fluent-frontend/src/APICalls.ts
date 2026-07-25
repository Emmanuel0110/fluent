import { url } from "./App";
import { authHeaders, customFetch, ApiError } from "./utils/http-helpers";
import {
  CelebrationEvent,
  Conversation,
  ConversationTag,
  DashboardData,
  GroupDetail,
  GroupSummary,
  RowConversation,
  Word,
  WordTag,
} from "./types";
import { groupById } from "./utils/generalUtils";
import { formatWords } from "./utils/wordUtils";

function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.userMessage;
  if (err instanceof Error) return err.message;
  return String(err);
}

/** On failure return { success: false, message }. On success return backend response as-is. */
function catchApiError<T>(promise: Promise<T>): Promise<T | { success: false; message: string }> {
  return promise.catch((err) => ({ success: false as const, message: getErrorMessage(err) }));
}

export const getRemoteConversationById = async (id: string) => {
  return catchApiError(
    customFetch(url + "conversations?conversationId=" + id, { method: "GET", headers: authHeaders() })
  );
};

export const getRemoteConversationByWordId = async (id: string) => {
  return catchApiError(
    customFetch(url + "conversations?wordId=" + id, { method: "GET", headers: authHeaders() })
  );
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
  return catchApiError(customFetch(url + "words", { method: "POST", headers: authHeaders(), body }));
};

export const saveNewWordTag = async (args: Partial<WordTag>) => {
  const body = JSON.stringify(args);
  return catchApiError(customFetch(url + "wordTags", { method: "POST", headers: authHeaders(), body }));
};

export const editRemoteWord = async ({ _id, ...args }: Word, appSourceLanguage: string, appTargetLanguage: string) => {
  const formattedWord = formatWord(args, appSourceLanguage, appTargetLanguage);
  const body = JSON.stringify(formattedWord);
  return catchApiError(customFetch(url + "words/" + _id, { method: "PUT", headers: authHeaders(), body }));
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
  return catchApiError(customFetch(url + "conversations", { method: "POST", headers: authHeaders(), body }));
};

export const editRemoteConversation = async (
  conversation: Conversation,
  appSourceLanguage: string,
  appTargetLanguage: string
) => {
  const formattedConversation = formatConversation(conversation, appSourceLanguage, appTargetLanguage);
  const body = JSON.stringify(formattedConversation);
  return catchApiError(
    customFetch(url + "conversations/" + conversation._id, { method: "PUT", headers: authHeaders(), body })
  );
};

const formatConversationTag = (tag: Partial<ConversationTag>, appSourceLanguage: string, appTargetLanguage: string) => {
  const { sourceLabel, targetLabel } = tag;
  return {
    labels: [
      { language: appSourceLanguage, label: sourceLabel || "" },
      { language: appTargetLanguage, label: targetLabel || "" },
    ],
  };
};

export const saveNewConversationTag = async (
  tag: ConversationTag,
  appSourceLanguage: string,
  appTargetLanguage: string
) => {
  const { _id, ...infos } = tag;
  const formattedTag = formatConversationTag(infos, appSourceLanguage, appTargetLanguage);
  const body = JSON.stringify(formattedTag);
  return catchApiError(customFetch(url + "conversationTags", { method: "POST", headers: authHeaders(), body }));
};

export const editRemoteConversationTag = async (
  tag: ConversationTag,
  appSourceLanguage: string,
  appTargetLanguage: string
) => {
  const { _id, ...infos } = tag;
  const formattedTag = formatConversationTag(infos, appSourceLanguage, appTargetLanguage);
  const body = JSON.stringify(formattedTag);
  return catchApiError(
    customFetch(url + "conversationTags/" + _id, { method: "PUT", headers: authHeaders(), body })
  );
};

export const deleteRemoteWord = async (wordId: string) => {
  return catchApiError(customFetch(url + "words/" + wordId, { method: "DELETE", headers: authHeaders() }));
};

export const deleteRemoteConversation = async (conversationId: string) => {
  return catchApiError(
    customFetch(url + "conversations/" + conversationId, { method: "DELETE", headers: authHeaders() })
  );
};

export const subscribeToRemoteConversation = async (id: string) => {
  const body = JSON.stringify({ conversationToSubscribe: id });
  return catchApiError(
    customFetch(url + "usercourses", { method: "PATCH", headers: authHeaders(), body })
  );
};

export const unsubscribeToRemoteConversation = async (id: string) => {
  const body = JSON.stringify({ conversationToUnsubscribe: id });
  return catchApiError(
    customFetch(url + "usercourses", { method: "PATCH", headers: authHeaders(), body })
  );
};

export const dismissRemoteSuggestion = async (id: string) => {
  const body = JSON.stringify({ conversationToDismiss: id });
  return catchApiError(
    customFetch(url + "usercourses", { method: "PATCH", headers: authHeaders(), body })
  );
};

export interface ReviewUpdateResponse {
  success: boolean;
  celebrations?: CelebrationEvent[];
  message?: string;
}

export const updateRemoteConversationReviewStatus = async (
  reviewedConversationId: string,
  successArray: boolean[]
): Promise<ReviewUpdateResponse> => {
  const body = JSON.stringify({ reviewedConversationId, successArray });
  return catchApiError(
    customFetch(url + "usercourses", { method: "PATCH", headers: authHeaders(), body })
  ) as Promise<ReviewUpdateResponse>;
};

export const fetchLanguages = async () => {
  try {
    const res = await customFetch(url + "languages", { headers: authHeaders() });
    return res?.success ? res.data : [];
  } catch {
    return [];
  }
};

export const fetchWordTags = async () => {
  try {
    const res = await customFetch(url + "wordtags", { headers: authHeaders() });
    return res?.success ? res.data : [];
  } catch {
    return [];
  }
};

export const fetchConversationTags = async () => {
  try {
    const res = await customFetch(url + "conversationtags", { headers: authHeaders() });
    return res?.success ? res.data : [];
  } catch {
    return [];
  }
};

export const fetchWords = async (lastUpdateDate: string | undefined) => {
  try {
    const res = await customFetch(
      url + "words" + (lastUpdateDate ? "?lastUpdateDate=" + lastUpdateDate : ""),
      { headers: authHeaders() }
    );
    return res?.success ? groupById(formatWords(res.data)) : {};
  } catch {
    return {};
  }
};

export const fetchConversations = async () => {
  try {
    const res = await customFetch(url + "conversations", { headers: authHeaders() });
    return (res?.success ? res.data : []) as RowConversation[];
  } catch {
    return [] as RowConversation[];
  }
};

export const updateLanguages = async (args: { sourceLanguage: string; targetLanguage: string }) => {
  try {
    const res = await customFetch(url + "users", {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(args),
    });
    return res?.success ? res.data : {};
  } catch {
    return {};
  }
};

export const updateRemoteUserSettings = async (args: {
  reviewMode?: "auto" | "manual";
  autoReviewDelay?: number;
  theme?: "light" | "dark";
}) => {
  return catchApiError(
    customFetch(url + "users/settings", {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(args),
    })
  );
};

export const getReviewList = async () => {
  try {
    const res = await customFetch(url + "reviewItems", { headers: authHeaders() });
    return res?.success ? res.data : [];
  } catch {
    return [];
  }
};

export const getSuggestions = async (): Promise<RowConversation[]> => {
  try {
    const res = await customFetch(url + "reviewItems/suggestions", { headers: authHeaders() });
    return (res?.success ? res.data : []) as RowConversation[];
  } catch {
    return [] as RowConversation[];
  }
};

export const getDashboardData = async () => {
  try {
    const res = await customFetch(url + "usercourses/dashboard", { headers: authHeaders() });
    return res?.success ? res.data : null;
  } catch {
    return null;
  }
};

export const fetchMyGroups = async (): Promise<GroupSummary[]> => {
  try {
    const res = await customFetch(url + "groups", { headers: authHeaders() });
    return res?.success ? res.data : [];
  } catch {
    return [];
  }
};

export const fetchGroup = async (groupId: string): Promise<GroupDetail | null> => {
  try {
    const res = await customFetch(url + "groups/" + groupId, { headers: authHeaders() });
    return res?.success ? res.data : null;
  } catch {
    return null;
  }
};

/** On success returns { success: true, data: { _id, name, inviteCode } }; on failure { success: false, message }. */
export const createGroup = async (name: string) => {
  return catchApiError(
    customFetch(url + "groups", { method: "POST", headers: authHeaders(), body: JSON.stringify({ name }) })
  );
};

/** On success returns { success: true, data: { _id, name } }; on failure { success: false, message }. */
export const joinGroup = async (inviteCode: string) => {
  return catchApiError(
    customFetch(url + "groups/join", { method: "POST", headers: authHeaders(), body: JSON.stringify({ inviteCode }) })
  );
};

export const leaveGroup = async (groupId: string) => {
  return catchApiError(
    customFetch(url + "groups/" + groupId + "/leave", { method: "POST", headers: authHeaders() })
  );
};

export const getMemberDashboard = async (
  groupId: string,
  userCourseId: string
): Promise<(DashboardData & { username?: string }) | null> => {
  try {
    const res = await customFetch(url + `groups/${groupId}/members/${userCourseId}/dashboard`, {
      headers: authHeaders(),
    });
    return res?.success ? res.data : null;
  } catch {
    return null;
  }
};

export const saveFeedback = async (comment: string, pageUrl: string) => {
  try {
    await customFetch(url + "feedback", {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ comment, pageUrl }),
    });
    return { success: true as const };
  } catch (err) {
    return { success: false as const, message: getErrorMessage(err) };
  }
};

export const fetchFeedbacks = async (page: number = 1, limit: number = 50) => {
  try {
    const res = await customFetch(url + `feedback?page=${page}&limit=${limit}`, { headers: authHeaders() });
    if (res?.success) return { feedbacks: res.data, pagination: res.pagination };
    return { feedbacks: [], pagination: null };
  } catch {
    return { feedbacks: [], pagination: null };
  }
};
