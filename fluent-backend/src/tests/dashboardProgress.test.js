// @ts-nocheck
import { buildDashboardData } from "../controllers/userCourseControllers.js";

// Builds a course whose score equals `score`: each word at the top of the DELAYS
// ladder (1 year) is worth 6 points, and a remainder word carries the rest.
const WEIGHTS = [0, 60000, 3600000, 86400000, 604800000, 2592000000, 31536000000];

function courseWithScore(score) {
  const future = new Date(Date.now() + 86400000);
  const words = [];
  for (let remaining = score; remaining > 0; remaining -= 6) {
    const weight = Math.min(remaining, 6);
    words.push({ nextReviewDate: future, reviewDelayInMs: WEIGHTS[weight] });
  }
  return { words, dailyScores: [] };
}

describe("dashboard progress", () => {
  test("resets to 0% at the start of each rank", () => {
    expect(buildDashboardData(courseWithScore(0))).toMatchObject({ rank: "Beginner", progress: 0 });
    expect(buildDashboardData(courseWithScore(1002))).toMatchObject({ rank: "Amateur", progress: 0 });
    expect(buildDashboardData(courseWithScore(3000))).toMatchObject({ rank: "Advanced", progress: 0 });
    expect(buildDashboardData(courseWithScore(10002))).toMatchObject({ rank: "Expert", progress: 0 });
  });

  test("measures the position inside the current rank band", () => {
    // Halfway from Amateur (1000) to Advanced (3000)
    expect(buildDashboardData(courseWithScore(2000)).progress).toBe(50);
    // Halfway from Beginner (0) to Amateur (1000)
    expect(buildDashboardData(courseWithScore(500)).progress).toBe(50);
  });

  test("stays within 0-100 just below the next rank", () => {
    const { rank, progress } = buildDashboardData(courseWithScore(2994));
    expect(rank).toBe("Amateur");
    expect(progress).toBeGreaterThan(95);
    expect(progress).toBeLessThanOrEqual(100);
  });
});
