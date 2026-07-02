// @ts-nocheck
import {
  computeStreakUpdate,
  countLearnedWords,
  milestoneCrossed,
  rankCrossed,
} from "../controllers/userCourseControllers.js";

describe("computeStreakUpdate", () => {
  // Streaks are compared by calendar day in the server's local time, so the test
  // builds dates with the local-time constructor to stay timezone-independent.
  const now = new Date(2026, 5, 29, 10, 0); // 29 Jun 2026, 10:00 local

  test("first ever activity starts the streak at 1", () => {
    expect(computeStreakUpdate(0, null, now)).toEqual({ streak: 1, changed: true });
  });

  test("same day does not change the streak", () => {
    const earlierToday = new Date(2026, 5, 29, 1, 0);
    expect(computeStreakUpdate(4, earlierToday, now)).toEqual({ streak: 4, changed: false });
  });

  test("consecutive day increments the streak", () => {
    const yesterday = new Date(2026, 5, 28, 22, 0);
    expect(computeStreakUpdate(4, yesterday, now)).toEqual({ streak: 5, changed: true });
  });

  test("a gap of more than one day resets the streak to 1", () => {
    const threeDaysAgo = new Date(2026, 5, 26, 10, 0);
    expect(computeStreakUpdate(9, threeDaysAgo, now)).toEqual({ streak: 1, changed: true });
  });
});

describe("countLearnedWords", () => {
  const now = new Date(2026, 5, 29, 10, 0);
  const future = new Date(2026, 5, 30, 10, 0);
  const past = new Date(2026, 5, 28, 10, 0);

  test("counts only words that are not overdue (nextReviewDate in the future)", () => {
    const words = [
      { nextReviewDate: future }, // learned
      { nextReviewDate: past }, // overdue → not learned
      { nextReviewDate: future }, // learned
      {}, // never scheduled → not learned
    ];
    expect(countLearnedWords(words, now)).toBe(2);
  });

  test("returns 0 for an empty list", () => {
    expect(countLearnedWords([])).toBe(0);
  });
});

describe("milestoneCrossed", () => {
  test("returns the new milestone when the count reaches a step above the previous one", () => {
    expect(milestoneCrossed(0, 100, 100)).toBe(100); // first time reaching 100
    expect(milestoneCrossed(100, 205, 100)).toBe(200); // already celebrated 100, now at 205
  });

  test("returns null when no new milestone is reached", () => {
    expect(milestoneCrossed(100, 150, 100)).toBeNull(); // 100 already celebrated
    expect(milestoneCrossed(200, 150, 100)).toBeNull(); // count dropped below a past milestone
    expect(milestoneCrossed(0, 0, 100)).toBeNull();
  });
});

describe("rankCrossed", () => {
  test("returns the new rank when the score reaches a rank above the previous one", () => {
    expect(rankCrossed("Beginner", 1000)).toBe("Amateur"); // Beginner → Amateur
    expect(rankCrossed("Amateur", 3200)).toBe("Advanced"); // Amateur → Advanced
    expect(rankCrossed("Advanced", 10500)).toBe("Expert"); // Advanced → Expert
  });

  test("returns null when the rank is not above the one already celebrated", () => {
    expect(rankCrossed("Amateur", 1500)).toBeNull(); // already Amateur
    expect(rankCrossed("Beginner", 999)).toBeNull(); // stays Beginner
  });

  test("returns null when the score drops below a rank already reached", () => {
    expect(rankCrossed("Advanced", 900)).toBeNull(); // score fell, no re-celebration
  });
});
