import { vi } from "vitest";
import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { DataProvider, useData } from "./DataContext";
import type { Conversation, ConversationTag, RowConversation, RowWord, Word, WordTag } from "../types";
import * as APICalls from "../APICalls";
import { useAuth } from "./AuthContext";
import { useLanguage } from "./LanguageContext";

// --- Mocks ---

// vi.hoisted ensures mockNavigate is available inside the vi.mock factory below
const mockNavigate = vi.hoisted(() => vi.fn());

// Partial mock: keep all real react-router-dom exports, only override useNavigate
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("./AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("./LanguageContext", () => ({ useLanguage: vi.fn() }));

vi.mock("../APICalls", () => ({
  fetchWordTags: vi.fn(),
  fetchConversationTags: vi.fn(),
  fetchWords: vi.fn(),
  fetchConversations: vi.fn(),
  saveNewWord: vi.fn(),
  editRemoteWord: vi.fn(),
  deleteRemoteWord: vi.fn(),
  saveNewWordTag: vi.fn(),
  saveNewConversation: vi.fn(),
  editRemoteConversation: vi.fn(),
  deleteRemoteConversation: vi.fn(),
  saveNewConversationTag: vi.fn(),
  editRemoteConversationTag: vi.fn(),
  subscribeToRemoteConversation: vi.fn(),
  unsubscribeToRemoteConversation: vi.fn(),
  updateRemoteConversationReviewStatus: vi.fn(),
  getRemoteConversationById: vi.fn(),
  getRemoteConversationByWordId: vi.fn(),
  getSuggestions: vi.fn(),
}));

vi.mock("../services/localStorageService", () => ({
  // Use a regular function (not arrow) to avoid Vitest constructor mock warning
  LocalStorageService: vi.fn(function () {
    return {
      localStorageWords: null,
      lastUpdateDate: undefined,
      updateLocalStorageWords: vi.fn(),
    };
  }),
}));

// --- Fixtures ---

const SOURCE = "en";
const TARGET = "fr";

const wordTag: WordTag = { _id: "wtag1", language: SOURCE, label: "greetings" };
const convTag: ConversationTag = { _id: "ctag1", sourceLabel: "greetings", targetLabel: "salutations" };

// RowWord as the API returns it (save/edit endpoints)
const rowWord: RowWord = {
  _id: "word1",
  language: SOURCE,
  text: "hello",
  translations: [{ language: TARGET, lexicalItems: ["bonjour"] }],
  tags: [],
};

// Formatted Word as DataContext exposes it
const formattedWord: Word = { _id: "word1", language: SOURCE, text: "hello", translations: ["bonjour"], tags: [] };

// RowConversation as the API returns it
const rowConv: RowConversation = {
  _id: "conv1",
  tags: ["ctag1"],
  subscribed: false,
  conversations: [
    { language: SOURCE, sentences: [{ text: "Hello", prerequisites: [] }] },
    { language: TARGET, sentences: [{ text: "Bonjour", prerequisites: [] }] },
  ],
};

// Formatted Conversation as DataContext exposes it
const formattedConv: Conversation = {
  _id: "conv1",
  tags: ["ctag1"],
  subscribed: false,
  multiLingualSentences: [
    {
      sourceLanguage: { text: "Hello", prerequisites: [] },
      targetLanguage: { text: "Bonjour", prerequisites: [] },
    },
  ],
};

// --- Test helpers ---

function setupAuthAndLanguage({
  isAuthenticated = true as boolean | null,
  sourceLanguage = SOURCE,
  targetLanguage = TARGET,
} = {}) {
  vi.mocked(useAuth).mockReturnValue({ isAuthenticated } as ReturnType<typeof useAuth>);
  vi.mocked(useLanguage).mockReturnValue({ sourceLanguage, targetLanguage } as ReturnType<typeof useLanguage>);
}

function setupDefaultApiMocks() {
  vi.mocked(APICalls.fetchWordTags).mockResolvedValue([]);
  vi.mocked(APICalls.fetchConversationTags).mockResolvedValue([]);
  vi.mocked(APICalls.fetchWords).mockResolvedValue({});
  vi.mocked(APICalls.fetchConversations).mockResolvedValue([]);
}

const wrapper = ({ children }: { children: React.ReactNode }) => <DataProvider>{children}</DataProvider>;

/**
 * Renders the DataProvider hook and waits for the initial loadAllData() to finish.
 *
 * isLoading starts as false, so we can't just waitFor(isLoading === false).
 * Instead we wait until fetchWordTags was called (proof that loadAllData ran)
 * AND isLoading is false (proof that it completed).
 */
async function renderDataHook() {
  const { result } = renderHook(() => useData(), { wrapper });
  await waitFor(() => {
    expect(APICalls.fetchWordTags).toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });
  return result;
}

beforeEach(() => {
  setupAuthAndLanguage();
  setupDefaultApiMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ------------------------------------------------------------------ loadAllData

describe("loadAllData", () => {
  it("fetches wordTags, conversationTags, words, and conversations on mount", async () => {
    vi.mocked(APICalls.fetchWordTags).mockResolvedValue([wordTag]);
    vi.mocked(APICalls.fetchConversationTags).mockResolvedValue([convTag]);
    vi.mocked(APICalls.fetchWords).mockResolvedValue({ [formattedWord._id]: formattedWord });
    vi.mocked(APICalls.fetchConversations).mockResolvedValue([rowConv]);

    const { result } = renderHook(() => useData(), { wrapper });

    // Wait for the load to start (fetchWordTags called) AND finish (isLoading=false)
    await waitFor(() => {
      expect(APICalls.fetchWordTags).toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.wordTags).toEqual([wordTag]);
    expect(result.current.conversationTags).toEqual([convTag]);
    expect(result.current.words).toEqual({ [formattedWord._id]: formattedWord });
    expect(result.current.conversations).toEqual([formattedConv]);
  });

  it("clears all data when authentication is lost", async () => {
    vi.mocked(APICalls.fetchWordTags).mockResolvedValue([wordTag]);
    vi.mocked(APICalls.fetchConversations).mockResolvedValue([rowConv]);

    const { result, rerender } = renderHook(() => useData(), { wrapper });
    await waitFor(() => {
      expect(APICalls.fetchWordTags).toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.wordTags).toEqual([wordTag]);

    // Switch to not authenticated
    vi.mocked(useAuth).mockReturnValue({ isAuthenticated: false } as ReturnType<typeof useAuth>);
    rerender();

    await waitFor(() => {
      expect(result.current.words).toEqual({});
      expect(result.current.conversations).toEqual([]);
      expect(result.current.wordTags).toEqual([]);
      expect(result.current.conversationTags).toEqual([]);
    });
  });

  it("sets loadError when the fetch fails", async () => {
    vi.mocked(APICalls.fetchConversationTags).mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useData(), { wrapper });
    await waitFor(() => expect(result.current.loadError).toBe("network error"));
  });

  it("clears loadError on a successful reload triggered by language change", async () => {
    vi.mocked(APICalls.fetchConversationTags).mockRejectedValueOnce(new Error("fail"));

    const { result, rerender } = renderHook(() => useData(), { wrapper });
    await waitFor(() => expect(result.current.loadError).toBe("fail"));

    // Fix the mock, then trigger reload by simulating a language change
    setupAuthAndLanguage({ targetLanguage: "de" });
    rerender();

    await waitFor(() => expect(result.current.loadError).toBeNull());
  });
});

// ------------------------------------------------------------------ saveWord

describe("saveWord", () => {
  it("calls saveNewWord when word has no _id", async () => {
    vi.mocked(APICalls.saveNewWord).mockResolvedValue({ success: true, data: rowWord });

    const result = await renderDataHook();
    const newWord: Word = { _id: "", language: SOURCE, text: "hello", translations: ["bonjour"], tags: [] };

    await act(async () => {
      await result.current.saveWord(newWord);
    });

    expect(APICalls.saveNewWord).toHaveBeenCalledWith(newWord, SOURCE, TARGET);
  });

  it("calls editRemoteWord when word has an _id", async () => {
    vi.mocked(APICalls.editRemoteWord).mockResolvedValue({ success: true, data: rowWord });

    const result = await renderDataHook();

    await act(async () => {
      await result.current.saveWord(formattedWord);
    });

    expect(APICalls.editRemoteWord).toHaveBeenCalledWith(formattedWord, SOURCE, TARGET);
  });

  it("adds the formatted word to state and returns it on success", async () => {
    vi.mocked(APICalls.saveNewWord).mockResolvedValue({ success: true, data: rowWord });

    const result = await renderDataHook();
    const newWord: Word = { _id: "", language: SOURCE, text: "hello", translations: ["bonjour"], tags: [] };

    let returned: Word | undefined;
    await act(async () => {
      returned = await result.current.saveWord(newWord);
    });

    expect(result.current.words[formattedWord._id]).toEqual(formattedWord);
    expect(returned).toEqual(formattedWord);
  });

  it("returns undefined when the API fails", async () => {
    vi.mocked(APICalls.saveNewWord).mockResolvedValue({ success: false, message: "error" });

    const result = await renderDataHook();
    const newWord: Word = { _id: "", language: SOURCE, text: "hello", translations: [], tags: [] };

    let returned: Word | undefined;
    await act(async () => {
      returned = await result.current.saveWord(newWord);
    });

    expect(returned).toBeUndefined();
  });
});

// ------------------------------------------------------------------ deleteWord

describe("deleteWord", () => {
  it("calls deleteRemoteWord and removes the word from state", async () => {
    vi.mocked(APICalls.fetchWords).mockResolvedValue({ [formattedWord._id]: formattedWord });
    vi.mocked(APICalls.deleteRemoteWord).mockResolvedValue({ success: true });

    const result = await renderDataHook();
    expect(result.current.words[formattedWord._id]).toBeDefined();

    await act(async () => {
      await result.current.deleteWord(formattedWord._id);
    });

    expect(APICalls.deleteRemoteWord).toHaveBeenCalledWith(formattedWord._id);
    expect(result.current.words[formattedWord._id]).toBeUndefined();
  });
});

// ------------------------------------------------------------------ saveWordTag

describe("saveWordTag", () => {
  it("calls saveNewWordTag, adds the tag to state, and returns it", async () => {
    vi.mocked(APICalls.saveNewWordTag).mockResolvedValue({ success: true, data: wordTag });

    const result = await renderDataHook();

    let returned: WordTag | undefined;
    await act(async () => {
      returned = await result.current.saveWordTag({ language: SOURCE, label: "greetings" });
    });

    expect(APICalls.saveNewWordTag).toHaveBeenCalledWith({ language: SOURCE, label: "greetings" });
    expect(result.current.wordTags).toContainEqual(wordTag);
    expect(returned).toEqual(wordTag);
  });

  it("returns undefined when the API fails", async () => {
    vi.mocked(APICalls.saveNewWordTag).mockResolvedValue({ success: false, message: "error" });

    const result = await renderDataHook();

    let returned: WordTag | undefined;
    await act(async () => {
      returned = await result.current.saveWordTag({ language: SOURCE, label: "x" });
    });

    expect(returned).toBeUndefined();
  });
});

// ------------------------------------------------------------------ saveConversation

describe("saveConversation", () => {
  it("calls saveNewConversation for a new conversation (no _id)", async () => {
    vi.mocked(APICalls.saveNewConversation).mockResolvedValue({ success: true, data: rowConv });

    const result = await renderDataHook();
    const newConv: Conversation = { _id: "", tags: [], subscribed: false, multiLingualSentences: [] };

    await act(async () => {
      await result.current.saveConversation(newConv);
    });

    expect(APICalls.saveNewConversation).toHaveBeenCalledWith(newConv, SOURCE, TARGET);
  });

  it("calls editRemoteConversation for an existing conversation (with _id)", async () => {
    vi.mocked(APICalls.editRemoteConversation).mockResolvedValue({ success: true, data: rowConv });

    const result = await renderDataHook();

    await act(async () => {
      await result.current.saveConversation(formattedConv);
    });

    expect(APICalls.editRemoteConversation).toHaveBeenCalledWith(formattedConv, SOURCE, TARGET);
  });

  it("adds the formatted conversation to state and returns the id", async () => {
    vi.mocked(APICalls.saveNewConversation).mockResolvedValue({ success: true, data: rowConv });

    const result = await renderDataHook();
    const newConv: Conversation = { _id: "", tags: [], subscribed: false, multiLingualSentences: [] };

    let savedId: string | undefined;
    await act(async () => {
      savedId = await result.current.saveConversation(newConv);
    });

    expect(result.current.conversations).toContainEqual(formattedConv);
    expect(savedId).toBe("conv1");
  });
});

// ------------------------------------------------------------------ deleteConversation

describe("deleteConversation", () => {
  it("calls deleteRemoteConversation and removes the conversation from state", async () => {
    vi.mocked(APICalls.fetchConversations).mockResolvedValue([rowConv]);
    vi.mocked(APICalls.deleteRemoteConversation).mockResolvedValue({ success: true });

    const result = await renderDataHook();
    expect(result.current.conversations).toContainEqual(formattedConv);

    await act(async () => {
      await result.current.deleteConversation("conv1");
    });

    expect(APICalls.deleteRemoteConversation).toHaveBeenCalledWith("conv1");
    expect(result.current.conversations.find((c) => c._id === "conv1")).toBeUndefined();
  });
});

// ------------------------------------------------------------------ saveConversationTag

describe("saveConversationTag", () => {
  it("calls saveNewConversationTag for a new tag and adds it to state", async () => {
    const newTag: ConversationTag = { _id: "", sourceLabel: "a", targetLabel: "b" };
    vi.mocked(APICalls.saveNewConversationTag).mockResolvedValue({ success: true, data: convTag });

    const result = await renderDataHook();
    await act(async () => {
      await result.current.saveConversationTag(newTag);
    });

    expect(APICalls.saveNewConversationTag).toHaveBeenCalledWith(newTag, SOURCE, TARGET);
    expect(result.current.conversationTags).toContainEqual(convTag);
  });

  it("calls editRemoteConversationTag for an existing tag", async () => {
    vi.mocked(APICalls.editRemoteConversationTag).mockResolvedValue({ success: true, data: convTag });

    const result = await renderDataHook();
    await act(async () => {
      await result.current.saveConversationTag(convTag);
    });

    expect(APICalls.editRemoteConversationTag).toHaveBeenCalledWith(convTag, SOURCE, TARGET);
  });
});

// ------------------------------------------------------------------ subscribeToConversation

describe("subscribeToConversation", () => {
  it("sets subscribed=true for the conversation on success", async () => {
    vi.mocked(APICalls.fetchConversations).mockResolvedValue([rowConv]);
    vi.mocked(APICalls.subscribeToRemoteConversation).mockResolvedValue({ success: true });

    const result = await renderDataHook();

    act(() => {
      result.current.subscribeToConversation(formattedConv);
    });

    await waitFor(() => {
      const conv = result.current.conversations.find((c) => c._id === "conv1");
      expect(conv?.subscribed).toBe(true);
    });
    expect(APICalls.subscribeToRemoteConversation).toHaveBeenCalledWith("conv1");
  });

  it("does not update subscribed state when the API fails", async () => {
    vi.mocked(APICalls.fetchConversations).mockResolvedValue([rowConv]);
    vi.mocked(APICalls.subscribeToRemoteConversation).mockResolvedValue({ success: false });

    const result = await renderDataHook();
    act(() => {
      result.current.subscribeToConversation(formattedConv);
    });

    // Let the promise settle
    await act(async () => {});

    const conv = result.current.conversations.find((c) => c._id === "conv1");
    expect(conv?.subscribed).toBe(false);
  });
});

// ------------------------------------------------------------------ unsubscribeToConversation

describe("unsubscribeToConversation", () => {
  it("sets subscribed=false for the conversation on success", async () => {
    const subscribedRow: RowConversation = { ...rowConv, subscribed: true };
    vi.mocked(APICalls.fetchConversations).mockResolvedValue([subscribedRow]);
    vi.mocked(APICalls.unsubscribeToRemoteConversation).mockResolvedValue({ success: true });

    const result = await renderDataHook();
    const subscribedConv: Conversation = { ...formattedConv, subscribed: true };

    act(() => {
      result.current.unsubscribeToConversation(subscribedConv);
    });

    await waitFor(() => {
      const conv = result.current.conversations.find((c) => c._id === "conv1");
      expect(conv?.subscribed).toBe(false);
    });
    expect(APICalls.unsubscribeToRemoteConversation).toHaveBeenCalledWith("conv1");
  });
});

// ------------------------------------------------------------------ updateConversationReviewStatus

describe("updateConversationReviewStatus", () => {
  it("calls updateRemoteConversationReviewStatus with the conversation id and success array", async () => {
    vi.mocked(APICalls.updateRemoteConversationReviewStatus).mockResolvedValue({ success: true });

    const result = await renderDataHook();
    const reviewItem = {
      ...formattedConv,
      multiLingualSentences: [
        {
          sourceLanguage: { text: "Hello", prerequisites: [] },
          targetLanguage: { text: "Bonjour", prerequisites: [] },
          success: true,
        },
        {
          sourceLanguage: { text: "Hi", prerequisites: [] },
          targetLanguage: { text: "Salut", prerequisites: [] },
          success: false,
        },
      ],
    };

    await act(async () => {
      await result.current.updateConversationReviewStatus(reviewItem);
    });

    expect(APICalls.updateRemoteConversationReviewStatus).toHaveBeenCalledWith("conv1", [true, false]);
  });
});

// ------------------------------------------------------------------ getConversationById

describe("getConversationById", () => {
  it("returns conversation from cache without calling the API", async () => {
    vi.mocked(APICalls.fetchConversations).mockResolvedValue([rowConv]);

    const result = await renderDataHook();

    let found: Conversation | undefined;
    await act(async () => {
      found = await result.current.getConversationById("conv1");
    });

    expect(found).toEqual(formattedConv);
    expect(APICalls.getRemoteConversationById).not.toHaveBeenCalled();
  });

  it("fetches from the API if not in cache and adds it to state", async () => {
    vi.mocked(APICalls.getRemoteConversationById).mockResolvedValue({ success: true, data: rowConv });

    const result = await renderDataHook();

    let found: Conversation | undefined;
    await act(async () => {
      found = await result.current.getConversationById("conv1");
    });

    expect(APICalls.getRemoteConversationById).toHaveBeenCalledWith("conv1");
    expect(found).toEqual(formattedConv);
    expect(result.current.conversations).toContainEqual(formattedConv);
  });

  it("returns undefined when the API fails", async () => {
    vi.mocked(APICalls.getRemoteConversationById).mockResolvedValue({ success: false });

    const result = await renderDataHook();

    let found: Conversation | undefined;
    await act(async () => {
      found = await result.current.getConversationById("unknown");
    });

    expect(found).toBeUndefined();
  });
});

// ------------------------------------------------------------------ fetchSuggestions

describe("fetchSuggestions", () => {
  it("adds suggestions to conversations state and returns their ids", async () => {
    vi.mocked(APICalls.getSuggestions).mockResolvedValue([rowConv]);

    const result = await renderDataHook();

    let ids: string[] = [];
    await act(async () => {
      ids = await result.current.fetchSuggestions();
    });

    expect(result.current.conversations).toContainEqual(formattedConv);
    expect(ids).toEqual(["conv1"]);
  });
});

// ------------------------------------------------------------------ fetchMoreUsedInConversations

describe("fetchMoreUsedInConversations", () => {
  it("fetches conversations by word id and merges them into state", async () => {
    vi.mocked(APICalls.getRemoteConversationByWordId).mockResolvedValue({ success: true, data: [rowConv] });

    const result = await renderDataHook();

    act(() => {
      result.current.fetchMoreUsedInConversations("word1");
    });

    await waitFor(() => expect(result.current.conversations).toContainEqual(formattedConv));
    expect(APICalls.getRemoteConversationByWordId).toHaveBeenCalledWith("word1");
  });
});
