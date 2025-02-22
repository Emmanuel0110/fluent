import auth from "../middleware/auth.js";
import { UserModel, UserCourseModel, LanguageModel } from "../models.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import express from "express";
import { redisClient } from "../index.js";
import mongoose from "mongoose";
const router = express.Router();

//register
router.post("/", async function (req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }
  const user = await UserModel.findOne({ username });
  if (user) return res.status(400).json({ msg: "User already exists" });

  const newUser = new UserModel({ username, password });
  // Create salt & hash
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newUser.password, salt, (err, hash) => {
      if (err) throw err;
      newUser.password = hash;
      newUser.save().then((newUser) => {
        let user = newUser.toObject();
        if (err) {
          console.log("save error ", err);
          if (err.name === "MongoError" && err.code === 11000) {
            // Duplicate error happened. You can handle it separately.
            res.json({ success: false, message: "already exists" });
            return;
          }
          // Some other error happened, you might also want to handle it.
          res.json({ success: false, message: "some error happened" });
          return;
        }

        jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: 3600 * 8 }, async (err, token) => {
          if (err) throw err;
          delete user.password;
          const { sourceLanguage, targetLanguage } = await cacheUserLearningData(user);
          res.json({ token, user, sourceLanguage, targetLanguage });
        });
      });
    });
  });
});

//login
router.post("/auth", function (req, res) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }
  UserModel.findOne({ username: username.trim() })
    .select("+password")
    .lean()
    .then((user) => {
      if (!user) return res.status(400).json({ msg: "User does not exist" });

      //Validate password
      bcrypt.compare(password, user.password).then((isMatch) => {
        if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

        jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: 3600 * 8 }, async (err, token) => {
          if (err) throw err;
          delete user.password;
          const { sourceLanguage, targetLanguage } = await cacheUserLearningData(user);
          res.json({ token, user, sourceLanguage, targetLanguage });
        });
      });
    });
});

router.get("/auth", auth, async function (req, res) {
  UserModel.findById(req.user._id).then(async (user) => {
    const { sourceLanguage, targetLanguage } = await cacheUserLearningData(user);
    res.json({ user, sourceLanguage, targetLanguage });
  });
});

export async function cacheUserLearningData(user) {
  let course;
  if (user.lastCourseId) {
    course = await UserCourseModel.findById(user.lastCourseId);
  } else if (user.courses.length > 0) {
    await UserModel.findByIdAndUpdate(user._id, { lastCourseId: user.courses[0] });
    course = await UserCourseModel.findById(user.courses[0]);
  } else {
    const availableLanguages = await LanguageModel.find().select("-flag");
    course = new UserCourseModel({
      sourceLanguage: availableLanguages.find((language) => language.label === "fr")?._id,
      targetLanguage: availableLanguages.find((language) => language.label === "en")?._id,
      wishListConversations: [],
      words: [],
      conversations: [],
    });
    await course.save();
    await UserModel.findByIdAndUpdate(user._id, { lastCourseId: course._id, $addToSet: { courses: course._id } });
  }
  await redisClient.set(`userLearningData:${user._id}`, JSON.stringify(course), { EX: 3600 });
  return course;
}

router.patch("/", auth, async function (req, res) {
  try {
    const { sourceLanguage, targetLanguage } = req.body;
    const user = await UserModel.findById(req.user._id);
    await updateLanguages(user, sourceLanguage, targetLanguage);
    res.json({ success: true, data: { sourceLanguage, targetLanguage } });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: "Couldn't update language choice" });
  }
});

export async function updateLanguages(user, sourceLanguage, targetLanguage) {
  let course = await UserCourseModel.findOne({ _id: { $in: user.courses }, sourceLanguage, targetLanguage });
  if (!course) {
    course = await new UserCourseModel({
      sourceLanguage,
      targetLanguage,
      wishListConversations: [],
      words: [],
      conversations: [],
    }).save();
  }
  await UserModel.findByIdAndUpdate(user._id, { lastCourseId: course._id, $addToSet: { courses: course._id } });
  await redisClient.set(`userLearningData:${user._id}`, JSON.stringify(course), { EX: 3600 });
}

export default router;
