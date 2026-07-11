// @ts-nocheck
import { computeWordUpdates } from "../controllers/userCourseControllers.js";

// A word id is stored as a string in wordIdsBySentence and compared with
// Mongoose's `_id.equals(id)`, so the fake word exposes an `equals` matcher.
const makeWord = (id, reviewDelayInMs, { overdue = true } = {}) => ({
  _id: { equals: (x) => x === id },
  reviewDelayInMs,
  // In the past → overdue (eligible for promotion); in the future → reviewed early.
  nextReviewDate: new Date(Date.now() + (overdue ? -1000 : 60 * 60 * 1000)),
});

const ONE_DAY = 86400000;
const ONE_WEEK = 604800000;

const updateFor = (updates, id) => updates.find((u) => u._id.equals(id));

describe("computeWordUpdates", () => {
  test("promotes every word of a validated sentence, whatever its position in the sentence", () => {
    // Regression test for the sentence-index bug: successArray is indexed per
    // SENTENCE, but the buggy code indexed it by the word's position within the
    // sentence. So the 3rd word of sentence 0 (w2) read successArray[2] ===
    // undefined and was wrongly treated as a failure, never getting promoted.
    const wordIdsBySentence = [
      ["w0", "w1", "w2"], // sentence 0 — more words than there are sentences
      ["w3"], // sentence 1
    ];
    const successArray = [true, true]; // both sentences validated first try
    const words = [
      makeWord("w0", ONE_DAY),
      makeWord("w1", ONE_DAY),
      makeWord("w2", ONE_DAY),
      makeWord("w3", ONE_DAY),
    ];

    const { wordUpdates, newWordIds } = computeWordUpdates(wordIdsBySentence, successArray, words);

    expect(newWordIds).toEqual([]);
    // All four overdue words were validated → all promoted one rung up the ladder.
    ["w0", "w1", "w2", "w3"].forEach((id) => {
      expect(updateFor(wordUpdates, id).reviewDelayInMs).toBe(ONE_WEEK);
    });
  });

  test("keeps a word at its current delay when its sentence failed", () => {
    const wordIdsBySentence = [["w0"], ["w1"]];
    const successArray = [true, false];
    const words = [makeWord("w0", ONE_DAY), makeWord("w1", ONE_DAY)];

    const { wordUpdates } = computeWordUpdates(wordIdsBySentence, successArray, words);

    expect(updateFor(wordUpdates, "w0").reviewDelayInMs).toBe(ONE_WEEK); // validated → promoted
    // Failed: getUpdate's else branch leaves reviewDelayInMs untouched (no promotion).
    expect(updateFor(wordUpdates, "w1").reviewDelayInMs).toBe(ONE_DAY);
  });

  test("a word appearing in several sentences is processed once, with its first sentence's result", () => {
    const wordIdsBySentence = [["w0"], ["w0"]]; // same word in both sentences
    const successArray = [true, false];
    const words = [makeWord("w0", ONE_DAY)];

    const { wordUpdates } = computeWordUpdates(wordIdsBySentence, successArray, words);

    expect(wordUpdates).toHaveLength(1);
    expect(updateFor(wordUpdates, "w0").reviewDelayInMs).toBe(ONE_WEEK); // first sentence was success
  });

  test("collects words not yet known as newWordIds", () => {
    const wordIdsBySentence = [["known", "unknown"]];
    const successArray = [true];
    const words = [makeWord("known", ONE_DAY)];

    const { wordUpdates, newWordIds } = computeWordUpdates(wordIdsBySentence, successArray, words);

    expect(newWordIds).toEqual(["unknown"]);
    expect(wordUpdates).toHaveLength(1);
    expect(updateFor(wordUpdates, "known").reviewDelayInMs).toBe(ONE_WEEK);
  });
});
