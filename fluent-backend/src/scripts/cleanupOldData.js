import dotenv from "dotenv";
import mongoose from "mongoose";
import { UserModel, UserCourseModel, FeedbackModel } from "../models.js";
import { logger } from "../logger.js";

dotenv.config("./.env");

const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;
const cutoffDate = new Date(Date.now() - TWO_YEARS_MS);

// ObjectId whose embedded timestamp equals cutoffDate — used to filter accounts
// created before that date when lastLoginAt is not set.
function dateToObjectId(date) {
  const hex = Math.floor(date.getTime() / 1000).toString(16).padStart(8, "0");
  return new mongoose.Types.ObjectId(hex + "0000000000000000");
}

async function cleanup() {
  await mongoose.connect(process.env.MONGO_URI);
  logger.info("Starting data cleanup");

  // 1. Delete feedback older than 2 years
  const { deletedCount: feedbackDeleted } = await FeedbackModel.deleteMany({
    createdAt: { $lt: cutoffDate },
  });
  logger.info({ count: feedbackDeleted }, "Deleted old feedback entries");

  // 2. Delete accounts inactive for more than 2 years.
  //    For accounts that predate the lastLoginAt field, fall back to the
  //    creation date embedded in the ObjectId.
  const inactiveUsers = await UserModel.find({
    $or: [
      { lastLoginAt: { $lt: cutoffDate } },
      { lastLoginAt: null, _id: { $lt: dateToObjectId(cutoffDate) } },
    ],
  }).lean();

  for (const user of inactiveUsers) {
    await FeedbackModel.deleteMany({ userId: user._id.toString() });
    await UserCourseModel.deleteMany({ _id: { $in: user.courses } });
    await UserModel.findByIdAndDelete(user._id);
  }
  logger.info({ count: inactiveUsers.length }, "Deleted inactive user accounts");

  await mongoose.disconnect();
  logger.info("Cleanup complete");
}

cleanup().catch((err) => {
  logger.error(err, "Cleanup failed");
  process.exit(1);
});
