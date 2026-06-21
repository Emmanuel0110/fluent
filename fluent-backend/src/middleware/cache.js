import { cacheUserCourse } from "../controllers/userControllers.js";
import { redisClient } from "../redis.js";
import { UserModel, UserCourseModel } from "../models.js";
import {
  USER_COURSE_CACHE_TTL_SECONDS,
  serializeUserCourse,
  deserializeUserCourse,
} from "../services/userCourseCache.js";

async function cache(req, res, next) {
  const userId = req.user._id;
  let cachedData = null;
  if (redisClient) {
    cachedData = await redisClient.get(`userCourse:${userId}`);
  }

  // deserializeUserCourse rebuilds the full schema shape (ObjectIds, Dates), so
  // req.userCourse is identical whether it came from cache or from Mongo.
  const userCourse = cachedData
    ? deserializeUserCourse(cachedData)
    : await UserModel.findById(userId).then((user) => cacheUserCourse(user));

  req.userCourse = userCourse;
  next();
}

export async function refreshUserCourseCache(userCourseId, userId) {
  const userCourse = await UserCourseModel.findById(userCourseId);
  await redisClient.set(`userCourse:${userId}`, serializeUserCourse(userCourse), {
    EX: USER_COURSE_CACHE_TTL_SECONDS,
  });
}

export default cache;
