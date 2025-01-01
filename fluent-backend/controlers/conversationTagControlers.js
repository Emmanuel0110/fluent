import auth from "../middleware/auth.js";
import { ConversationTagModel } from "../models.js";
import express from "express";
const router = express.Router();

router.get("/", auth, (req, res) => {
  const { sourceLanguage, targetLanguage } = req.userLearningData.sourceLanguage;
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
            input: "$conversations", // The array to filter
            as: "label", // Alias for each element in the array
            cond: {
              $in: ["$$label.language", [sourceLanguage, targetLanguage]], // Keep only source and target languages
            },
          },
        },
      },
    },
  ])
    .lean()
    .then((tags) => {
      res.json({ success: true, data: tags });
    });
});

router.post("/", auth, (req, res) => {
  const newTag = new ConversationTagModel({
    _id: new mongoose.Types.ObjectId(),
    ...req.body,
  });
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
