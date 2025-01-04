import { cacheUserLearningData } from "../controlers/userControlers.js";
import { redisClient } from "../index.js";
import { UserModel } from "../models.js";

async function cache(req, res, next) {
  const userId = req.user._id;
  const cachedData = await redisClient.get(`userLearningData:${userId}`);
  req.userLearningData = cachedData
    ? JSON.parse(cachedData)
    : await UserModel.findById(userId).then((user) => cacheUserLearningData(user));
  next();
}

export default cache;
