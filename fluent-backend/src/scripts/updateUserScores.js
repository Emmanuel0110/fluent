import dotenv from "dotenv";
import mongoose from "mongoose";
import { UserCourseModel } from "../models.js";

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

function computeNumberOfKnownWords(userCourse) {
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
    console.error("Error calculating user score:", error);
    return 0;
  }
}

// Connect to MongoDB
mongoose.set("strictQuery", true);
await mongoose.connect(
  `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}.mongodb.net/${process.env.MONGO_DBNAME}?retryWrites=true&w=majority`
);

/**
 * Update scores for all user courses
 * This function should be run once daily (via cron or scheduler)
 */
async function updateAllUserScores() {
  try {
    console.log("Starting score update process...");

    // Get all user courses
    const userCourses = await UserCourseModel.find().lean();
    console.log(`Found ${userCourses.length} user courses to process`);

    const today = new Date();
    let updatedCount = 0;

    for (const userCourse of userCourses) {
      try {
        // Calculate current score
        const newScore = await computeNumberOfKnownWords(userCourse);

        // Get existing dailyScores
        const dailyScores = userCourse.dailyScores || [];

        // Find today's entry
        const todayEntryIndex = dailyScores.findIndex((entry) => {
          const entryDate = new Date(entry.date);
          return (
            entryDate.getFullYear() === today.getFullYear() &&
            entryDate.getMonth() === today.getMonth() &&
            entryDate.getDate() === today.getDate()
          );
        });

        // Update or add today's score
        if (todayEntryIndex >= 0) {
          dailyScores[todayEntryIndex].score = newScore;
        } else {
          dailyScores.push({
            date: today,
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
        console.error(`Error updating course ${userCourse._id}:`, error);
      }
    }

    console.log(`Score update completed. Updated ${updatedCount} user courses.`);
  } catch (error) {
    console.error("Error in updateAllUserScores:", error);
  }
}

// Run the update
try {
  await updateAllUserScores();
  console.log("Script completed successfully");
} catch (error) {
  console.error("Script failed:", error);
  process.exitCode = 1;
} finally {
  try {
    await mongoose.disconnect();
    // eslint-disable-next-line no-console
    console.log("MongoDB connection closed");
  } catch (e) {
    console.error("Error closing MongoDB connection:", e);
  }
  process.exit();
}
