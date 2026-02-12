import auth from "../middleware/auth.js";
import cache from "../middleware/cache.js";
import { validateConversationTagCreate } from "../middleware/validation.js";
import { sanitizeObject } from "../utils/sanitize.js";
import { ConversationTagModel } from "../models.js";
import express from "express";
import mongoose from "mongoose";
const router = express.Router();

router.get("/", auth, cache, (req, res) => {
  const { sourceLanguage, targetLanguage } = req.userCourse;
  ConversationTagModel.aggregate([
    {
      $match: {
        "labels.language": { $all: [sourceLanguage, targetLanguage] },
      },
    },
    {
      $project: {
        _id: 1,
        labels: {
          $filter: {
            input: "$labels", // The array to filter
            as: "label", // Alias for each element in the array
            cond: {
              $in: ["$$label.language", [sourceLanguage, targetLanguage]], // Keep only source and target languages
            },
          },
        },
      },
    },
  ]).then((tags) => {
    res.json({ success: true, data: tags });
  });
});

router.post("/", auth, validateConversationTagCreate, (req, res) => {
  // Sanitize tag labels text
  const sanitizedBody = sanitizeObject(req.body);
  const newTag = new ConversationTagModel(sanitizedBody);
  newTag
    .save()
    .then((newElement) => {
      res.send({ data: newElement });
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
