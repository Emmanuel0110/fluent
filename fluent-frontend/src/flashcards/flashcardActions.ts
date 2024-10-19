import { url } from "../App";
import { authHeaders, customFetch } from "../utils/http-helpers";
import { Flashcard, Language, MultiLingualSentence, Sentence, Tag, Word } from "../types";

export const getRemoteMultiLingualSentenceById = async (id: string, sourceLanguage: string, targetLanguage: string): Promise<{newMultiLingualSentence: MultiLingualSentence, newSentences: Sentence[]}> => {
  return customFetch(url + "multilingualsentences/" + id + "?languages=" + sourceLanguage + "-" + targetLanguage, { method: "GET", headers: authHeaders() });
};

export const saveNewFlashcard = async (args: Partial<Flashcard>) => {
  const formattedArgs = { ...args, tags: args.tags?.map((tag) => tag._id) || [] };
  const body = JSON.stringify(formattedArgs);
  return customFetch(url + "flashcards", { method: "POST", headers: authHeaders(), body });
};

export const editRemoteSentence = async ({ _id, ...args }: Partial<Sentence>) => {
  const body = JSON.stringify(args);
  return customFetch(url + "sentences/" + _id, { method: "PATCH", headers: authHeaders(), body });
};

export const deleteRemoteFlashcard = async (flashcardId: string) => {
  return customFetch(url + "flashcards/" + flashcardId, { method: "DELETE", headers: authHeaders() });
};

export const subscribeToRemoteWord = async ({ _id, nextReviewDate }: Partial<Word>) => {
  const body = JSON.stringify({
    nextReviewDate: nextReviewDate ? null : new Date(),
    subscriptionDate: nextReviewDate ? null : new Date(),
  });
  return customFetch(url + "userwordinfo/" + _id, { method: "PUT", headers: authHeaders(), body });
};

export const subscribeToRemoteMultiLingualSentence = async ({ _id, nextReviewDate }: Partial<MultiLingualSentence>, language: string) => {
  const body = JSON.stringify({
    language,
    nextReviewDate: nextReviewDate ? null : new Date(),
    subscriptionDate: nextReviewDate ? null : new Date(),
  });
  return customFetch(url + "usermultilingualsentenceinfo/" + _id, { method: "PUT", headers: authHeaders(), body });
};

export const subscribeToRemoteConversation = async ({ _id, nextReviewDate }: Partial<MultiLingualSentence>, language: string) => {
  const body = JSON.stringify({
    language,
    nextReviewDate: nextReviewDate ? null : new Date(),
    subscriptionDate: nextReviewDate ? null : new Date(),
  });
  return customFetch(url + "userconversationinfo/" + _id, { method: "PUT", headers: authHeaders(), body });
};

export const editUserFlashcardInfo = async ({ _id, ...body }: any) => {
  return customFetch(url + "userflashcardinfo/" + _id, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
};

export const readRemoteFlashcard = async (flashcard: Flashcard) => {
  const body = JSON.stringify({ hasBeenRead: true, nextReviewDate: flashcard.nextReviewDate });
  return customFetch(url + "userflashcardinfo/" + flashcard._id, { method: "PUT", headers: authHeaders(), body });
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
  });
};

export const fetchTags = (sourceLanguage: Language): Promise<{ wordTags: Tag[]; conversationTags: Tag[] }> => {
  return customFetch(url + `tags?sourceLanguage=${sourceLanguage}`, { headers: authHeaders() }).catch((err: Error) => {
    console.log(err);
  });
};

export const fetchWords = (sourceLanguage: string, targetLanguage: string) => {
  return customFetch(url + `words?sourceLanguage=${sourceLanguage}&targetLanguage=${targetLanguage}`, {
    headers: authHeaders(),
  }).catch((err: Error) => {
    console.log(err);
  });
};
