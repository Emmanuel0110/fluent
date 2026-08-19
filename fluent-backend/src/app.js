import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import cors from "cors";
import conversationRoutes from "./controllers/conversationControllers.js";
import reviewItemsRoutes from "./controllers/reviewControllers.js";
import wordTagRoutes from "./controllers/wordTagControllers.js";
import conversationTagRoutes from "./controllers/conversationTagControllers.js";
import userRoutes from "./controllers/userControllers.js";
import userCourseRoutes from "./controllers/userCourseControllers.js";
import wordRoutes from "./controllers/wordControllers.js";
import languageRoutes from "./controllers/languageControllers.js";
import feedbackRoutes from "./controllers/feedbackControllers.js";
import groupRoutes from "./controllers/groupControllers.js";
import ttsRoutes from "./controllers/ttsControllers.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./middleware/errorHandler.js";
import { cacheDir } from "./services/googleTts.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const whitelist = ["https://fluent.study", "https://www.fluent.study", "https://emmanuelpaatz.com"];

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
  allowedHeaders: ["Content-Type", "Origin", "X-Requested-With", "Cookie", "Accept", "x-auth-token"],
};

app.use(cors(corsOptions));
app.use(helmet());
app.use("/api", rateLimit({ windowMs: 60 * 1000, max: 100 }));
app.use("/", express.static(path.join(__dirname, "../public")));
// Synthesized speech. Content is addressed by a hash of the sentence, so a file
// never changes and can be cached forever. Helmet's default same-origin resource
// policy would block a whitelisted front-end served from another origin.
app.use(
  "/tts",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(cacheDir(), { immutable: true, maxAge: "1y" }),
);
app.use("/api/conversations", conversationRoutes);
app.use("/api/reviewItems", reviewItemsRoutes);
app.use("/api/wordtags", wordTagRoutes);
app.use("/api/conversationtags", conversationTagRoutes);
app.use("/api/users", userRoutes);
app.use("/api/usercourses", userCourseRoutes);
app.use("/api/words", wordRoutes);
app.use("/api/languages", languageRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/tts", ttsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;
