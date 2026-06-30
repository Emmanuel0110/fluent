import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { UserModel, UserCourseModel, FeedbackModel } from "../models.js";
import { logger } from "../logger.js";

dotenv.config("./.env");

const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;
const MAX_DELETIONS = 10; // Safety threshold to prevent mass deletions in case of a bug

// ObjectId whose embedded timestamp equals cutoffDate — used to filter accounts
// created before that date when lastLoginAt is not set.
export function dateToObjectId(date) {
  const hex = Math.floor(date.getTime() / 1000)
    .toString(16)
    .padStart(8, "0");
  return new mongoose.Types.ObjectId(hex + "0000000000000000");
}

/**
 * Delete old data (feedback + inactive accounts older than 2 years).
 * Assumes an active mongoose connection already exists — does NOT connect or
 * disconnect, so it is safe to call from the in-app scheduler alongside the
 * running server. Throws (rather than calling process.exit) when the deletion
 * count exceeds the safety threshold, so the caller decides how to react.
 */
export async function cleanupOldData({ dryRun = false } = {}) {
  const cutoffDate = new Date(Date.now() - TWO_YEARS_MS);

  if (dryRun) logger.info("Starting data cleanup (DRY RUN, no data will be deleted)");
  else logger.info("Starting data cleanup");

  // 1. Delete feedback older than 2 years
  if (dryRun) {
    const count = await FeedbackModel.countDocuments({ createdAt: { $lt: cutoffDate } });
    logger.info({ count }, "[DRY RUN] Would delete old feedback entries");
  } else {
    const { deletedCount: feedbackDeleted } = await FeedbackModel.deleteMany({
      createdAt: { $lt: cutoffDate },
    });
    logger.info({ count: feedbackDeleted }, "Deleted old feedback entries");
  }

  // 2. Delete accounts inactive for more than 2 years.
  //    For accounts that predate the lastLoginAt field, fall back to the
  //    creation date embedded in the ObjectId.
  const inactiveUsers = await UserModel.find({
    $or: [{ lastLoginAt: { $lt: cutoffDate } }, { lastLoginAt: null, _id: { $lt: dateToObjectId(cutoffDate) } }],
  }).lean();

  if (!dryRun && inactiveUsers.length > MAX_DELETIONS) {
    logger.error(
      { count: inactiveUsers.length, max: MAX_DELETIONS },
      "Aborting: deletion count exceeds safety threshold",
    );
    throw new Error(
      `Aborting cleanup: deletion count ${inactiveUsers.length} exceeds safety threshold ${MAX_DELETIONS}`,
    );
  }

  for (const user of inactiveUsers) {
    if (dryRun) {
      logger.info(
        { userId: user._id, email: user.email, lastLoginAt: user.lastLoginAt },
        "[DRY RUN] Would delete user",
      );
    } else {
      await FeedbackModel.deleteMany({ userId: user._id.toString() });
      await UserCourseModel.deleteMany({ _id: { $in: user.courses } });
      await UserModel.findByIdAndDelete(user._id);
    }
  }
  logger.info(
    { count: inactiveUsers.length },
    dryRun ? "[DRY RUN] Would delete inactive user accounts" : "Deleted inactive user accounts",
  );

  logger.info("Cleanup complete");
}

// CLI entry point: only runs when executed directly (`npm run cleanup-data`),
// not when imported by the scheduler or tests. Opens and closes its own connection.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dryRun = process.argv.includes("--dry-run");
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(
      `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}.mongodb.net/${process.env.MONGO_DBNAME}?retryWrites=true&w=majority`,
    );
    await cleanupOldData({ dryRun });
  } catch (err) {
    logger.error(err, "Cleanup failed");
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
    } catch (e) {
      logger.error({ err: e }, "Error closing MongoDB connection");
    }
    process.exit();
  }
}
