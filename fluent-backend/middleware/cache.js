
function cache(req, res, next) {
  const userId = req.user;

  redisClient.get(`userLearningData:${userId}`, (err, data) => {
    if (err) {
      console.error("Error accessing Redis:", err);
      return res.status(500).json({msg: "Redis error"});
    }

    if (data) {
      // Data found in Redis, attach to request
      req.userLearningData = JSON.parse(data);
      return next();
    }

    // If not in cache, proceed to fetch from the database
    next();
  });
}

export default cache;
