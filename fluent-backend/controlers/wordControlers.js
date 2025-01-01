import auth from "../middleware/auth.js";
import cache from "../middleware/cache.js";
import express from "express";
import mongoose from "mongoose";
import { LexicalItemModel } from "../models.js";
const router = express.Router();

router.get("/", auth, cache, (req, res) => {
  const { sourceLanguage, targetLanguage } = req.userLearningData;

  // Define the two aggregation pipelines
  const sourceWordsPipeline = generateAggregationPipeline(sourceLanguage, targetLanguage);
  const targetWordsPipeline = generateAggregationPipeline(targetLanguage, sourceLanguage);

  // Run both queries using Promise.all
  Promise.all([LexicalItemModel.aggregate(sourceWordsPipeline), LexicalItemModel.aggregate(targetWordsPipeline)])
    .then(([sourceWords, targetWords]) => {
      res.json({ success: true, data: sourceWords.concat(targetWords) });
    })
    .catch((err) => {
      res.status(500).json({ success: false, message: err.message });
    });
});

router.post("/", auth, (req, res) => {
  const newWord = new LexicalItemModel({
    _id: new mongoose.Types.ObjectId(),
    ...req.body,
  });
  newWord
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

router.patch("/:id", auth, function (req, res) {
  const { id: _id } = req.params;
  const filter = { _id };
  LexicalItemModel.updateOne(filter, req.body).then((data) => res.json({ success: true, data }));
});

// Create a reusable function to generate the aggregation pipeline
function generateAggregationPipeline(language, translationLanguage) {
  return [
    { $match: { language: language, "translations.language": translationLanguage } },
    {
      $project: {
        _id: 1,
        sourceLanguage: 1,
        tags: 1,
        text: 1,
        translations: {
          $filter: {
            input: "$translations", // The array to filter
            as: "translation", // Alias for each element in the array
            cond: {
              "$$translation.language": translationLanguage, // Keep only the specific language
            },
          },
        },
      },
    },
  ];
}

export default router;
