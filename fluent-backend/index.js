import dotenv from "dotenv";
import express from "express";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";
import { dirname } from "path";
import mongoose from "mongoose";
import auth from "./middleware/auth.js";
import cors from "cors";
import {
  TagModel,
  UserModel,
  UserFlashcardInfoModel,
  LexicalItemModel,
  SentenceModel,
  MultiLingualSentenceModel,
  ConversationModel,
} from "./models old.js";
// import logger from "./middleware/logger.js"
// import errorHandler from "./middleware/errorHandler.js"
import { escapeRegExp, completeMultiLingualSentence, completeSentence, getFilterSearch } from "./utils.js";
import redis from "redis";
const redisClient = redis.createClient();

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
app.use("/", express.static(path.join(__dirname, "./public")));

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
