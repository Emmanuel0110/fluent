import { url } from "../App";
import { authHeaders, customFetch } from "../utils/http-helpers";
import { Conversation, Tag, Word } from "../types";

export const getRemoteConversationById = async (id: string): Promise<{ newConversation: Conversation }> => {
  return customFetch(url + "multilingualsentences/" + id, {
    method: "GET",
    headers: authHeaders(),
  }).catch((err: Error) => {
    console.log(err);
  });
};

export const saveNewWord = async (args: Partial<Word>) => {
  const body = JSON.stringify(args);
  return customFetch(url + "words", { method: "POST", headers: authHeaders(), body }).catch((err: Error) => {
    console.log(err);
  });
};

export const saveNewConversation = async (args: Partial<Conversation>) => {
  const body = JSON.stringify(args);
  return customFetch(url + "conversations", { method: "POST", headers: authHeaders(), body }).catch((err: Error) => {
    console.log(err);
  });
};

export const editRemoteWord = async ({ _id, ...args }: Partial<Word>) => {
  const body = JSON.stringify(args);
  return customFetch(url + "words/" + _id, { method: "PATCH", headers: authHeaders(), body }).catch((err: Error) => {
    console.log(err);
  });
};

export const editRemoteConversation = async ({ _id, ...args }: Partial<Word>) => {
  const body = JSON.stringify(args);
  return customFetch(url + "conversations/" + _id, { method: "PATCH", headers: authHeaders(), body }).catch(
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

// export const saveNewTag = async ({ label }: { label: string }) => {
//   const body = JSON.stringify({ label });
//   return customFetch(url + "tags", { method: "POST", headers: authHeaders(), body });
// };

export const getRemotePrerequisiteAndUsedIn = async (ids: string[]): Promise<Word[]> => {
  return customFetch(url + "search", {
    method: "POST", // we want to GET flashcards but sometimes with a complex filter (string[][])
    headers: authHeaders(),
    body: JSON.stringify({ prerequisitesAndUsedIn: ids }),
  }).catch((err: Error) => {
    console.log(err);
  });
};

export const fetchTags = async (sourceLanguage: string): Promise<{ wordTags: Tag[]; conversationTags: Tag[] }> => {
  return customFetch(url + `tags?sourceLanguage=${sourceLanguage}`, { headers: authHeaders() }).catch((err: Error) => {
    console.log(err);
  });
};

export const fetchWords = async (sourceLanguage: string, targetLanguage: string) => {
  return customFetch(url + `words?sourceLanguage=${sourceLanguage}&targetLanguage=${targetLanguage}`, {
    headers: authHeaders(),
  }).catch((err: Error) => {
    console.log(err);
  });
};
