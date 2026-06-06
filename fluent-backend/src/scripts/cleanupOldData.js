import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { UserModel, UserCourseModel, FeedbackModel } from "../models.js";
import { logger } from "../logger.js";

dotenv.config("./.env");

const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;
const cutoffDate = new Date(Date.now() - TWO_YEARS_MS);
const DRY_RUN = process.argv.includes("--dry-run");
const MAX_DELETIONS = 10; // Safety threshold to prevent mass deletions in case of a bug

// ObjectId whose embedded timestamp equals cutoffDate — used to filter accounts
// created before that date when lastLoginAt is not set.
export function dateToObjectId(date) {
  const hex = Math.floor(date.getTime() / 1000)
    .toString(16)
    .padStart(8, "0");
  return new mongoose.Types.ObjectId(hex + "0000000000000000");
}

async function cleanup() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(
    `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}.mongodb.net/${process.env.MONGO_DBNAME}?retryWrites=true&w=majority`,
  );
  if (DRY_RUN) logger.info("Starting data cleanup (DRY RUN, no data will be deleted)");
  else logger.info("Starting data cleanup");

  // 1. Delete feedback older than 2 years
  if (DRY_RUN) {
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

  if (!DRY_RUN && inactiveUsers.length > MAX_DELETIONS) {
    logger.error(
      { count: inactiveUsers.length, max: MAX_DELETIONS },
      "Aborting: deletion count exceeds safety threshold",
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  for (const user of inactiveUsers) {
    if (DRY_RUN) {
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
    DRY_RUN ? "[DRY RUN] Would delete inactive user accounts" : "Deleted inactive user accounts",
  );

  await mongoose.disconnect();
  logger.info("Cleanup complete");
}

// It should execute when run directly, not when imported for testing
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  cleanup().catch((err) => {
    logger.error(err, "Cleanup failed");
    process.exit(1);
  });
}
