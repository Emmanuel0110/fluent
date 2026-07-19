import mongoose from "mongoose";
import app from "./src/app.js";
import { logger } from "./src/logger.js";
import { startScheduler } from "./src/scheduler.js";

// Redis is initialized as a side effect of importing redis.js.
// Controllers import it directly from src/redis.js.
import "./src/redis.js";

const port = 4001;

mongoose.set("debug", process.env.NODE_ENV === "development");
mongoose.set("strictQuery", true);
mongoose.connect(
  `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}.mongodb.net/${process.env.MONGO_DBNAME}?retryWrites=true&w=majority`,
);
mongoose.Promise = Promise;

const db = mongoose.connection;
db.on("error", (e) => logger.error({ err: e }, "MongoDB connection error"));
db.once("open", () => {
  app.listen(process.env.PORT || port, () => {
    logger.info({ port: process.env.PORT || port }, "Server listening");
  });
  // Start the in-process daily jobs only in production.
  if (process.env.NODE_ENV === "production") {
    startScheduler();
  }
});
