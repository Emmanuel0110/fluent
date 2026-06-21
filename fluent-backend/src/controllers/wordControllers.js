import auth from "../middleware/auth.js";
import cache from "../middleware/cache.js";
import {
  validateWordQuery,
  validateWordCreate,
  validateWordUpdate,
  validateWordDelete,
} from "../middleware/validation.js";
import { sanitizeText } from "../utils/sanitize.js";
import express from "express";
import mongoose from "mongoose";
import { LexicalItemModel, UserCourseModel, MultiLingualConversationModel, StoryNodeModel } from "../models.js";
import { validateAndParseDate } from "../utils.js";
import { logger } from "../logger.js";
const router = express.Router();

router.get("/", auth, cache, validateWordQuery, (req, res) => {
  const { sourceLanguage, targetLanguage } = req.userCourse;
  const lastUpdateDate = validateAndParseDate(req.query.lastUpdateDate);

  // Define the two aggregation pipelines
  const sourceWordsPipeline = generateAggregationPipeline(sourceLanguage, targetLanguage, lastUpdateDate);
  const targetWordsPipeline = generateAggregationPipeline(targetLanguage, sourceLanguage, lastUpdateDate);

  // Run both queries
  Promise.all([LexicalItemModel.aggregate(sourceWordsPipeline), LexicalItemModel.aggregate(targetWordsPipeline)])
    .then(([sourceWords, targetWords]) => {
      const completedWords = completeWords(sourceWords.concat(targetWords), req.userCourse.words);
      res.json({ success: true, data: completedWords });
    })
    .catch((err) => {
      logger.error({ err }, "Words list error");
      res.status(500).json({ success: false, message: err.message });
    });
});

router.post("/", auth, validateWordCreate, (req, res) => {
  // Sanitize word text
  const sanitizedBody = {
    ...req.body,
    text: sanitizeText(req.body.text),
  };
  const newWord = new LexicalItemModel(sanitizedBody);
  newWord
    .save()
    .then((newElement) => {
      res.send({ success: true, data: newElement });
    })
    .catch(function (err) {
      logger.error({ err }, "Word save error");
      if (err.name === "MongoError" && err.code === 11000) {
        res.json({ success: false, message: "already exists" });
        return;
      }
      res.json({ success: false, message: "some error happened" });
      return;
    });
});

router.put("/:id", auth, cache, validateWordUpdate, async function (req, res) {
  const { id: _id } = req.params;
  const filter = { _id };
  const { tags, text, language, translations } = req.body;

  // Sanitize word text
  const sanitizedText = text ? sanitizeText(text) : text;
  const languagesToUpdate = translations.map((t) => t.language);
  await LexicalItemModel.updateOne(filter, { text: sanitizedText, language, tags });
  await LexicalItemModel.updateOne(filter, {
    $pull: { translations: { language: { $in: languagesToUpdate } } },
  });
  const word = await LexicalItemModel.findOneAndUpdate(
    filter,
    { $push: { translations: { $each: translations } } },
    { new: true },
  ).lean();
  const completedWord = {
    ...onlyKeepLanguages(req.userCourse.sourceLanguage, req.userCourse.targetLanguage)(word),
    subscribed: !!req.userCourse.words.find(({ _id }) => _id.equals(word._id)),
  };
  res.json({ success: true, data: completedWord });
});

router.delete("/:id", auth, validateWordDelete, async function (req, res) {
  try {
    const { id: _id } = req.params;
    const wordId = new mongoose.Types.ObjectId(_id);
    await LexicalItemModel.deleteOne({ _id });
    await UserCourseModel.updateMany({}, { $pull: { words: { _id: wordId } } });
    await LexicalItemModel.updateMany({}, { $pull: { "translations.$[].lexicalItems": wordId } });
    await MultiLingualConversationModel.updateMany(
      {},
      { $pull: { "conversations.$[].sentences.$[].prerequisites": wordId } },
    );
    await StoryNodeModel.updateMany({}, { $pull: { prerequisites: wordId } });
    res.json({ success: true });
  } catch (err) {
    logger.error({ err }, "Word delete error");
    res.status(500).json({ success: false, message: err.message });
  }
});

function generateAggregationPipeline(language, translationLanguage, lastUpdateDate) {
  const matchStage = {
    language: new mongoose.Types.ObjectId(language),
  };
  if (lastUpdateDate) {
    matchStage.updatedAt = { $gte: lastUpdateDate };
  }

  return [
    {
      $match: matchStage,
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

function onlyKeepLanguages(sourceLanguage, targetLanguage) {
  return function (word) {
    return {
      ...word,
      translations: word.translations.filter(({ language }) =>
        [sourceLanguage, targetLanguage].some((l) => l.equals(language)),
      ),
    };
  };
}

function completeWords(words, userWords) {
  return words.map((word) => {
    return {
      ...word,
      subscribed: !!userWords.find((userWord) => {
        return userWord._id.equals(word._id);
      }),
    };
  });
}

export default router;
