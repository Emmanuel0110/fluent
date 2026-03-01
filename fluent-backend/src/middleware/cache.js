import { cacheUserCourse } from "../controllers/userControllers.js";
import { redisClient } from "../redis.js";
import { UserModel, UserCourseModel } from "../models.js";
import mongoose from "mongoose";

async function cache(req, res, next) {
  const userId = req.user._id;
  let cachedData = null;
  if (redisClient) {
    cachedData = await redisClient.get(`userCourse:${userId}`);
  }

  let userCourse;

  if (cachedData) {
    userCourse = JSON.parse(cachedData);

    // ✅ Recast all _id fields that you’ll use in Mongo queries
    if (Array.isArray(userCourse.conversations)) {
      userCourse.conversations = userCourse.conversations.map((conv) => ({
        ...conv,
        _id: new mongoose.Types.ObjectId(conv._id),
      }));
    }

    // Also cast sourceLanguage/targetLanguage:
    userCourse.sourceLanguage = new mongoose.Types.ObjectId(userCourse.sourceLanguage);
    userCourse.targetLanguage = new mongoose.Types.ObjectId(userCourse.targetLanguage);
  } else {
    userCourse = await UserModel.findById(userId).then((user) => cacheUserCourse(user));
  }

  req.userCourse = userCourse;
  next();
}

export async function refreshUserCourseCache(userCourseId, userId) {
  const userCourse = await UserCourseModel.findById(userCourseId);
  await redisClient.set(`userCourse:${userId}`, JSON.stringify(userCourse), { EX: 3600 });
}

export default cache;
