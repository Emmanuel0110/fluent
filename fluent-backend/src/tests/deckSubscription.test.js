// @ts-nocheck
import { computeSubscriptionUpdates } from "../controllers/userCourseControllers.js";

// Word ids are strings in the tally and are compared with Mongoose's
// `_id.equals(id)`, so the fake word exposes an `equals` matcher.
const makeWord = (id, numberOfSentencesUsedIn) => ({
  _id: { equals: (x) => x === id },
  numberOfSentencesUsedIn,
});

const updateFor = (updates, id) => updates.find((u) => u._id.equals(id));

describe("computeSubscriptionUpdates", () => {
  test("adds one to a known word used by a single conversation of the batch", () => {
    const { wordUpdates, newWordIds } = computeSubscriptionUpdates(new Map([["w0", 1]]), [makeWord("w0", 2)]);

    expect(newWordIds).toEqual([]);
    expect(updateFor(wordUpdates, "w0").numberOfSentencesUsedIn).toBe(3);
  });

  test("a word shared by several conversations of the batch is counted once per conversation", () => {
    // The bug this guards: subscribing conversation by conversation, each write
    // computed +1 from the same starting snapshot, so the last one won and the
    // ref-count ended at 3 instead of 5 — later unsubscribes would then drop the
    // word while other conversations still used it.
    const { wordUpdates } = computeSubscriptionUpdates(new Map([["w0", 3]]), [makeWord("w0", 2)]);

    expect(wordUpdates).toHaveLength(1);
    expect(updateFor(wordUpdates, "w0").numberOfSentencesUsedIn).toBe(5);
  });

  test("collects words the user does not have yet as newWordIds", () => {
    const countByWordId = new Map([
      ["known", 1],
      ["unknown", 2],
    ]);

    const { wordUpdates, newWordIds } = computeSubscriptionUpdates(countByWordId, [makeWord("known", 1)]);

    expect(newWordIds).toEqual(["unknown"]);
    expect(wordUpdates).toHaveLength(1);
    expect(updateFor(wordUpdates, "known").numberOfSentencesUsedIn).toBe(2);
  });

  test("returns nothing to write when the batch introduces no word", () => {
    const { wordUpdates, newWordIds } = computeSubscriptionUpdates(new Map(), [makeWord("w0", 1)]);

    expect(wordUpdates).toEqual([]);
    expect(newWordIds).toEqual([]);
  });
});
