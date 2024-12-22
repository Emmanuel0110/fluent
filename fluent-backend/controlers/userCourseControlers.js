import { UserCourseModel } from "../models";
import express from "express";
const router = express.Router();

router.patch("/", auth, updateLearningData);

export async function updateLearningData(req, res) {
  try {
    const { userLearningData, reviewedConversationId, wordIds, success } = req;
    if (userLearningData && reviewedConversationId) {
      if (userLearningData.conversations.find(({ _id }) => _id == reviewedConversationId)) {
        UserCourseModel.updateOne(
          { _id: userLearningData._id, "conversations._id": reviewedConversationId },
          { $set: { "conversations.$.lastReviewDate": new Date() } },
          { upsert: true }
        );
      }
      const [wordUpdates, newWordIds] = wordIds.reduce(
        ([wordUpdates, newWordIds], wordId) => {
          const word = userLearningData.words.find(({ _id }) => _id == wordId);
          if (word) {
            wordUpdates.push(getUpdate(word, success));
          } else {
            newWordIds.push(wordId);
          }
          return [wordUpdates, newWordIds];
        },
        [[], []]
      );
      if (wordUpdates.length > 0) updateWords(userLearningData._id, wordUpdates);
      if (newWordIds.length > 0) addNewWords(userLearningData._id, newWordIds);
    }
    res.json({ status: "success" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Failed to update learning data",
    });
  }
}

function getUpdate(word, success) {
  if (success && new Date(word.nextReviewDate) < new Date()) {
    const reviewDelayInMs = nextReviewDelay(word.reviewDelayInMs);
    const nextReviewDate = new Date(Date.now() + reviewDelayInMs);
    return { _id: word._id, nextReviewDate, reviewDelayInMs };
  } else {
    return {
      _id: word._id,
      nextReviewDate: new Date(Date.now() + word.reviewDelayInMs),
    };
  }
}

async function updateWords(userLearningDataId, updates) {
  try {
    const arrayFilters = updates.map((update, index) => ({
      [`element${index}._id`]: update._id,
    }));

    const setOperations = updates.reduce((acc, update, index) => {
      acc[`words.$[element${index}].nextReviewDate`] = update.nextReviewDate;
      if (update.reviewDelayInMs) {
        acc[`words.$[element${index}].reviewDelayInMs`] = update.reviewDelayInMs;
      }
      return acc;
    }, {});

    UserCourseModel.updateOne({ _id: userLearningDataId }, { $set: setOperations }, { arrayFilters });
  } catch (error) {
    console.error("Error updating multiple items:", error);
  }
}

async function addNewWords(userLearningDataId, newWordIds) {
  const newWords = newWordIds.map((wordId) => ({
    _id: wordId,
    nextReviewDate: new Date(Date.now() + 60000),
    reviewDelayInMs: 60000,
  }));
  UserCourseModel.updateOne({ _id: userLearningDataId }, { $push: { words: { $each: newWords } } });
}

const nextReviewDelay = (delay) => {
  const delays = [
    60000, //1000*60 (1 min)
    3600000, //1000*60*60 (1 hour)
    86400000, //1000*60*60*24 (1 day)
    604800000, //1000*60*60*24*7 (1 week)
    2592000000, //1000*60*60*24*30 (1 month)
    31536000000, //1000*60*60*24*365 (1 year)
  ];
  const index = delays.indexof(delay);
  return index >= 0 && index < delays.length - 1 ? delays[index + 1] : delay;
};
