import { createClient } from "redis";
import { logger } from "./logger.js";

const useRedis = process.env.NODE_ENV !== "test" && !process.argv.includes("--no-redis");

let redisClient = null;
if (useRedis) {
  redisClient = createClient();
  redisClient.on("error", (err) => logger.error({ err }, "Redis client error"));
  redisClient.connect().catch((err) => logger.error({ err }, "Redis connect failed"));
  logger.info("Redis enabled");
} else {
  logger.info("Redis disabled by --no-redis flag");
}

export { redisClient };
