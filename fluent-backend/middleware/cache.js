import { cacheUserLearningData } from "../controlers/userControlers.js";
import { redisClient } from "../index.js";
import { UserModel, UserCourseModel } from "../models.js";

async function cache(req, res, next) {
  const userId = req.user._id;
  let cachedData = null;
  if (redisClient) {
    cachedData = await redisClient.get(`userLearningData:${userId}`);
  }
  req.userLearningData = cachedData
    ? JSON.parse(cachedData)
    : await UserModel.findById(userId).then((user) => cacheUserLearningData(user));
  next();
}

export async function refreshLearningDataCache(userCourseId, userId) {
  const course = await UserCourseModel.findById(userCourseId);
  await redisClient.set(`userLearningData:${userId}`, JSON.stringify(course), { EX: 3600 });
}

export default cache;
