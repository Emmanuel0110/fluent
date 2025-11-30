import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import mongoose from "mongoose";
import cors from "cors";
import conversationRoutes from "./src/controlers/conversationControlers.js";
import reviewItemsRoutes from "./src/controlers/reviewControlers.js";
import wordTagRoutes from "./src/controlers/wordTagControlers.js";
import conversationTagRoutes from "./src/controlers/conversationTagControlers.js";
import userRoutes from "./src/controlers/userControlers.js";
import userCourseRoutes from "./src/controlers/userCourseControlers.js";
import wordRoutes from "./src/controlers/wordControlers.js";
import languageRoutes from "./src/controlers/languageControlers.js";
import feedbackRoutes from "./src/controlers/feedbackControlers.js";
import { createClient } from "redis";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./src/middleware/errorHandler.js";

const useRedis = !process.argv.includes("--no-redis");

let redisClient = null;
if (useRedis) {
  const { createClient } = await import("redis");
  redisClient = createClient();
  redisClient.on("error", (err) => console.log("Redis Client Error", err));
  redisClient.connect().catch(console.error);
  console.log("Redis enabled");
} else {
  console.log("Redis disabled by --no-redis flag");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = 4001;

dotenv.config();

// app.use(logger);
app.use(
  express.urlencoded({
    extended: false,
  })
);
app.use(express.json());

const whitelist = ["https://www.fluent.study", "https://emmanuelpaatz.com"];

if (process.env.NODE_ENV === "development") {
  whitelist.push("http://localhost:3000");
}

const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  allowedHeaders: ["Content-Type", "Origin", "X-Requested-With", "Cookie", "Accept", "x-auth-token"], // Customize allowed headers here
};

app.use(cors(corsOptions));
app.use(helmet());
app.use("/api", rateLimit({ windowMs: 60 * 1000, max: 100 }));
app.use("/", express.static(path.join(__dirname, "./public")));
app.use("/api/conversations", conversationRoutes);
app.use("/api/reviewItems", reviewItemsRoutes);
app.use("/api/wordtags", wordTagRoutes);
app.use("/api/conversationtags", conversationTagRoutes);
app.use("/api/users", userRoutes);
app.use("/api/usercourses", userCourseRoutes);
app.use("/api/words", wordRoutes);
app.use("/api/languages", languageRoutes);
app.use("/api/feedback", feedbackRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler (must be last)
app.use(errorHandler);

// Only enable mongoose debug in development
mongoose.set("debug", process.env.NODE_ENV === "development");
mongoose.set("strictQuery", true);
mongoose.connect(
  `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}.mongodb.net/${process.env.MONGO_DBNAME}?retryWrites=true&w=majority`
);
mongoose.Promise = Promise;

const db = mongoose.connection;
db.on("error", function (e) {
  console.error("connection error:", e);
});
db.once("open", function (callback) {
  // the connection to the DB is okay, let's start the application
  const httpServer = app.listen(process.env.PORT || port, () => {
    console.log(`Example app listening on port ${process.env.PORT || port}!`);
  });
});

export { redisClient };
