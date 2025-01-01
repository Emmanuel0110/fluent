import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import mongoose from "mongoose";
import cors from "cors";
import conversationRoutes from "./controlers/conversationControlers.js";
import reviewItemsRoutes from "./controlers/reviewControlers.js";
import wordTagRoutes from "./controlers/conversationTagControlers.js";
import conversationTagRoutes from "./controlers/conversationTagControlers.js";
import userRoutes from "./controlers/userControlers.js";
import userCourseRoutes from "./controlers/userCourseControlers.js";
import wordRoutes from "./controlers/wordControlers.js";

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

const whitelist = ['https://www.fluent.study'];

if (process.env.NODE_ENV === 'development') {
  whitelist.push('http://localhost:3000');
}

const corsOptions = {
  origin: (origin, callback) => {
    if (whitelist.indexOf(origin) !== -1  || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  allowedHeaders: ['Content-Type', 'Origin', 'X-Requested-With', 'Cookie', 'Accept' , 'x-auth-token'], // Customize allowed headers here
};

app.use(cors(corsOptions));

app.use("/", express.static(path.join(__dirname, "./public")));
app.use("/api/conversations", conversationRoutes);
app.use("/api/reviewItem", reviewItemsRoutes);
app.use("/api/wordtags", wordTagRoutes);
app.use("/api/conversationtags", conversationTagRoutes);
app.use("/api/users", userRoutes);
app.use("/api/usercourses", userCourseRoutes);
app.use("/api/words", wordRoutes);
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

mongoose.set("debug", true);
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
