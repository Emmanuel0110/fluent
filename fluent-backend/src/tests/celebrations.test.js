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
  test("counts only words reviewed at least once (reviewDelayInMs > 0)", () => {
    const words = [{ reviewDelayInMs: 0 }, { reviewDelayInMs: 60000 }, { reviewDelayInMs: 0 }, { reviewDelayInMs: 1 }];
    expect(countLearnedWords(words)).toBe(2);
  });

  test("returns 0 for an empty list", () => {
    expect(countLearnedWords([])).toBe(0);
  });
});

describe("milestoneCrossed", () => {
  test("returns the milestone value when a multiple of the step is crossed", () => {
    expect(milestoneCrossed(99, 100, 100)).toBe(100);
    expect(milestoneCrossed(195, 205, 100)).toBe(200);
  });

  test("returns null when no milestone is crossed", () => {
    expect(milestoneCrossed(100, 105, 100)).toBeNull();
    expect(milestoneCrossed(0, 0, 100)).toBeNull();
  });
});

describe("rankCrossed", () => {
  test("returns the new rank when a rank boundary is crossed upward", () => {
    expect(rankCrossed(999, 1000)).toBe("Amateur"); // Beginner → Amateur
    expect(rankCrossed(2900, 3200)).toBe("Advanced"); // Amateur → Advanced
    expect(rankCrossed(9500, 10500)).toBe("Expert"); // Advanced → Expert
  });

  test("returns null when the rank does not change", () => {
    expect(rankCrossed(1000, 1500)).toBeNull(); // stays Amateur
    expect(rankCrossed(0, 999)).toBeNull(); // stays Beginner
  });

  test("returns null when the score drops to a lower rank", () => {
    expect(rankCrossed(3200, 900)).toBeNull(); // Advanced → Beginner, no celebration
  });
});
