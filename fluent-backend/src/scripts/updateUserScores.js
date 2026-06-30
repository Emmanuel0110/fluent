import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { UserCourseModel } from "../models.js";
import { logger } from "../logger.js";

dotenv.config("./.env");

/**
 * Calculate the user's score based on learned words
 * Score = sum of all words multiplied by their review progress (how many times they have been reviewed with success)
 */
const DELAYS = [
  0,
  60000, //1000*60 (1 min)
  3600000, //1000*60*60 (1 hour)
  86400000, //1000*60*60*24 (1 day)
  604800000, //1000*60*60*24*7 (1 week)
  2592000000, //1000*60*60*24*30 (1 month)
  31536000000, //1000*60*60*24*365 (1 year)
];

export function computeNumberOfKnownWords(userCourse) {
  try {
    if (!userCourse || !userCourse.words) {
      return 0;
    }

    const now = new Date();
    let score = 0;

    for (const word of userCourse.words) {
      // A word is considered "learned" if it's not overdue (nextReviewDate is in the future)
      if (word.nextReviewDate && new Date(word.nextReviewDate) > now && word.reviewDelayInMs >= 60000) {
        score++;
      }
    }

    return score;
  } catch (error) {
    logger.error({ err: error }, "Error calculating user score");
    return 0;
  }
}

/**
 * Update scores for all user courses.
 * Should be run once daily. Assumes an active mongoose connection already exists
 * (the in-app scheduler relies on the server's connection; the CLI wrapper below
 * opens its own connection before calling this).
 */
export async function updateAllUserScores() {
  try {
    logger.info("Starting score update process");

    // Get all user courses
    const userCourses = await UserCourseModel.find().lean();
    logger.info({ count: userCourses.length }, "User courses to process");

    // Get yesterday's date (set to beginning of day for consistency)
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    let updatedCount = 0;

    for (const userCourse of userCourses) {
      try {
        // Calculate score as it was at the end of yesterday
        const newScore = await computeNumberOfKnownWords(userCourse);

        // Get existing dailyScores
        const dailyScores = userCourse.dailyScores || [];

        // Find yesterday's entry
        const yesterdayEntryIndex = dailyScores.findIndex((entry) => {
          const entryDate = new Date(entry.date);
          return (
            entryDate.getFullYear() === yesterday.getFullYear() &&
            entryDate.getMonth() === yesterday.getMonth() &&
            entryDate.getDate() === yesterday.getDate()
          );
        });

        // Update or add yesterday's score
        if (yesterdayEntryIndex >= 0) {
          dailyScores[yesterdayEntryIndex].score = newScore;
        } else {
          dailyScores.push({
            date: yesterday,
            score: newScore,
          });
        }

        // Keep only the latest 7 days
        const sortedScores = dailyScores.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 7);

        // Update the user course
        await UserCourseModel.findByIdAndUpdate(userCourse._id, {
          $set: {
            dailyScores: sortedScores,
          },
        });

        updatedCount++;
      } catch (error) {
        logger.error({ err: error, userCourseId: userCourse._id }, "Error updating course scores");
      }
    }

    logger.info({ updatedCount, total: userCourses.length }, "Score update completed");
    return updatedCount;
  } catch (error) {
    logger.error({ err: error }, "Error in updateAllUserScores");
    throw error;
  }
}

// CLI entry point: only runs when executed directly (`npm run update-scores`),
// not when imported by the scheduler or tests. Opens and closes its own connection.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(
      `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}.mongodb.net/${process.env.MONGO_DBNAME}?retryWrites=true&w=majority`
    );
    await updateAllUserScores();
    logger.info("Script completed successfully");
  } catch (error) {
    logger.error({ err: error }, "Script failed");
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
      logger.info("MongoDB connection closed");
    } catch (e) {
      logger.error({ err: e }, "Error closing MongoDB connection");
    }
    process.exit();
  }
}
