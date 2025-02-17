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

  // Run both queries
  Promise.all([LexicalItemModel.aggregate(sourceWordsPipeline), LexicalItemModel.aggregate(targetWordsPipeline)])
    .then(([sourceWords, targetWords]) => {
      const completedWords = completeWords(sourceWords.concat(targetWords), req.userLearningData.words);
      res.json({ success: true, data: completedWords });
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

router.put("/:id", auth, cache, async function (req, res) {
  const { id: _id } = req.params;
  const filter = { _id };
  const { tags, text, language, translations } = req.body;
  await LexicalItemModel.updateOne(filter, { text, language, tags });
  await LexicalItemModel.updateOne(filter, {
    $pull: {
      translations: { language: translations[0].language },
    },
  });
  const word = await LexicalItemModel.findOneAndUpdate(
    filter,
    { $push: { translations: { $each: translations } } },
    { new: true }
  ).lean();
  const completedWord = {
    ...word,
    subscribed: !!req.userLearningData.words.find(({ _id }) => _id === word._id),
  };
  res.json({ success: true, data: completedWord });
});

// Create a reusable function to generate the aggregation pipeline
function generateAggregationPipeline(language, translationLanguage) {
  return [
    {
      $match: {
        language: new mongoose.Types.ObjectId(language),
        "translations.language": new mongoose.Types.ObjectId(translationLanguage),
      },
    },
    {
      $project: {
        _id: 1,
        language: 1,
        tags: 1,
        text: 1,
        translations: {
          $filter: {
            input: "$translations", // The array to filter
            as: "translation", // Alias for each element in the array
            cond: {
              $eq: [
                "$$translation.language", // correct usage of $$translation in filter
                new mongoose.Types.ObjectId(translationLanguage),
              ],
            },
          },
        },
      },
    },
  ];
}

function completeWords(words, userWords) {
  return words.map((word) => {
    return {
      ...word,
      subscribed: !!userWords.find((userWord) => {
        return new mongoose.Types.ObjectId(userWord._id).equals(word._id);
      }),
    };
  });
}

export default router;
