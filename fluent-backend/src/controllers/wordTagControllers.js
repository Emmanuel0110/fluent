import auth from "../middleware/auth.js";
import cache from "../middleware/cache.js";
import { validateWordTagCreate } from "../middleware/validation.js";
import { sanitizeText } from "../utils/sanitize.js";
import mongoose from "mongoose";
import { WordTagModel } from "../models.js";
import express from "express";
const router = express.Router();

router.get("/", auth, cache, (req, res) => {
  const { sourceLanguage } = req.userLearningData;
  WordTagModel.find({ language: sourceLanguage })
    .limit(10000)
    .then((tags) => {
      res.json({ success: true, data: tags });
    });
});

router.post("/", auth, validateWordTagCreate, (req, res) => {
  // Sanitize tag label/text
  const sanitizedBody = {
    ...req.body,
    label: sanitizeText(req.body.label),
  };
  const newTag = new WordTagModel(sanitizedBody);
  newTag
    .save()
    .then((newElement) => {
      res.send({ success: true, data: newElement });
    })
    .catch(function (err) {
      console.log("save error ", err);
      if (err.name === "MongoError" && err.code === 11000) {
        res.json({ success: false, message: "already exists" });
        return;
      }
      res.json({ success: false, message: "some error happened" });
      return;
    });
});

export default router;
