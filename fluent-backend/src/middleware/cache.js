import { cacheUserLearningData } from "../controlers/userControlers.js";
import { redisClient } from "../../index.js";
import { UserModel, UserCourseModel } from "../models.js";
import mongoose from "mongoose";

async function cache(req, res, next) {
  const userId = req.user._id;
  let cachedData = null;
  if (redisClient) {
    cachedData = await redisClient.get(`userLearningData:${userId}`);
  }

  let userLearningData;

  if (cachedData) {
    userLearningData = JSON.parse(cachedData);

    // ✅ Recast all _id fields that you’ll use in Mongo queries
    if (Array.isArray(userLearningData.conversations)) {
      userLearningData.conversations = userLearningData.conversations.map((conv) => ({
        ...conv,
        _id: new mongoose.Types.ObjectId(conv._id),
      }));
    }

    // Also cast sourceLanguage/targetLanguage:
    userLearningData.sourceLanguage = new mongoose.Types.ObjectId(userLearningData.sourceLanguage);
    userLearningData.targetLanguage = new mongoose.Types.ObjectId(userLearningData.targetLanguage);
  } else {
    userLearningData = await UserModel.findById(userId).then((user) => cacheUserLearningData(user));
  }

  req.userLearningData = userLearningData;
  next();
}

export async function refreshLearningDataCache(userCourseId, userId) {
  const course = await UserCourseModel.findById(userCourseId);
  await redisClient.set(`userLearningData:${userId}`, JSON.stringify(course), { EX: 3600 });
}

export default cache;
