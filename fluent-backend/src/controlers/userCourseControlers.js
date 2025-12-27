import auth from "../middleware/auth.js";
import cache, { refreshLearningDataCache } from "../middleware/cache.js";
import { validateUpdateLearningData } from "../middleware/validation.js";
import { redisClient } from "../../index.js";
import { UserCourseModel } from "../models.js";
import { MultiLingualConversationModel } from "../models.js";
import express from "express";
const router = express.Router();

router.patch("/", auth, cache, validateUpdateLearningData, updateLearningData);

router.get("/dashboard", auth, cache, getDashboardData);

async function updateLearningData(req, res) {
  try {
    const { userLearningData, user } = req;
    if (userLearningData) {
      const { conversationToSubscribe, conversationToUnsubscribe, reviewedConversationId, successArray } = req.body;
      if (conversationToSubscribe) {
        await subscribeToConversation(conversationToSubscribe, userLearningData);
        res.json({ success: true });
      } else if (conversationToUnsubscribe) {
        await unsubscribeToConversation(conversationToUnsubscribe, userLearningData);
        res.json({ success: true });
      } else if (reviewedConversationId) {
        await updateReviewData(reviewedConversationId, successArray, userLearningData);
        res.json({ success: true });
      }
      if (redisClient) {
        refreshLearningDataCache(userLearningData._id, user._id);
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Failed to update learning data",
    });
  }
}

async function getWordIdsForConversation(conversationId, language) {
  const convo = await MultiLingualConversationModel.findById(conversationId).lean();
  if (!convo) return [];
  const wordIdSet = new Set();
  for (const conv of convo.conversations) {
    if (conv.language.toString() == language.toString()) {
      for (const sentence of conv.sentences) {
        if (sentence.prerequisites) {
          sentence.prerequisites.forEach((id) => wordIdSet.add(id.toString()));
        }
      }
    }
  }
  return Array.from(wordIdSet);
}

async function getWordIdsForSentences(conversationId, language) {
  const convo = await MultiLingualConversationModel.findById(conversationId).lean();
  if (!convo) return [];
  for (const conv of convo.conversations) {
    if (conv.language.toString() == language.toString()) {
      const arr = [];
      for (const sentence of conv.sentences) {
        if (sentence.prerequisites) {
          arr.push(sentence.prerequisites.map((id) => id.toString()));
        }
      }
      return arr;
    }
  }
}

async function subscribeToConversation(conversationToSubscribe, userLearningData) {
  if (!userLearningData.conversations.find(({ _id }) => _id == conversationToSubscribe)) {
    await UserCourseModel.updateOne(
      { _id: userLearningData._id },
      { $push: { conversations: { _id: conversationToSubscribe, lastReviewDate: new Date() } } }
    );
    const wordIds = await getWordIdsForConversation(conversationToSubscribe, userLearningData.sourceLanguage);
    const uniqIds = [...new Set(wordIds)];
    const [wordUpdates, newWordIds] = uniqIds.reduce(
      ([wordUpdates, newWordIds], wordId) => {
        const word = userLearningData.words.find(({ _id }) => _id == wordId);
        if (word) {
          wordUpdates.push({ ...word, numberOfSentencesUsedIn: word.numberOfSentencesUsedIn + 1 });
        } else {
          newWordIds.push(wordId);
        }
        return [wordUpdates, newWordIds];
      },
      [[], []]
    );
    if (wordUpdates.length > 0) await updateWordsSubscription(userLearningData._id, wordUpdates);
    if (newWordIds.length > 0) await addNewWords(userLearningData._id, newWordIds);
  } else {
    console.log("Already subscribed to conversation " + conversationToSubscribe);
  }
}

async function unsubscribeToConversation(conversationToUnsubscribe, userLearningData) {
  if (userLearningData.conversations.find(({ _id }) => _id == conversationToUnsubscribe)) {
    await UserCourseModel.updateOne(
      { _id: userLearningData._id },
      { $pull: { conversations: { _id: conversationToUnsubscribe } } }
    );
    const wordIds = await getWordIdsForConversation(conversationToUnsubscribe, userLearningData.sourceLanguage);
    const uniqIds = [...new Set(wordIds)];
    const [wordUpdates, wordIdsToUnsubcribe] = uniqIds.reduce(
      ([wordUpdates, wordIdsToRemove], wordId) => {
        const word = userLearningData.words.find(({ _id }) => _id == wordId);
        if (word) {
          if (word.numberOfSentencesUsedIn == 1) {
            wordIdsToRemove.push(wordId);
          } else if (word.numberOfSentencesUsedIn > 1) {
            wordUpdates.push({ ...word, numberOfSentencesUsedIn: word.numberOfSentencesUsedIn - 1 });
          } else {
            console.log("word.numberOfSentencesUsedIn should be > 0 and not equal to " + word.numberOfSentencesUsedIn);
          }
        } else {
          console.log("Not subscribed to word " + wordId);
        }
        return [wordUpdates, wordIdsToRemove];
      },
      [[], []]
    );
    if (wordUpdates.length > 0) await updateWordsSubscription(userLearningData._id, wordUpdates);
    if (wordIdsToUnsubcribe.length > 0) await removeWords(userLearningData._id, wordIdsToUnsubcribe);
    return wordIdsToUnsubcribe;
  } else {
    console.log("Not subscribed to conversation " + conversationToUnsubscribe);
  }
}

async function removeWords(userLearningDataId, wordIdsToRemove) {
  try {
    await UserCourseModel.updateOne(
      { _id: userLearningDataId },
      { $pull: { words: { _id: { $in: wordIdsToRemove } } } }
    );
  } catch (error) {
    console.error("Error removing multiple items:", error);
  }
}

async function updateWordsSubscription(userLearningDataId, updates) {
  try {
    const arrayFilters = updates.map((update, index) => ({
      [`element${index}._id`]: update._id,
    }));

    const setOperations = updates.reduce((acc, update, index) => {
      acc[`words.$[element${index}].numberOfSentencesUsedIn`] = update.numberOfSentencesUsedIn;
      return acc;
    }, {});

    await UserCourseModel.updateOne({ _id: userLearningDataId }, { $set: setOperations }, { arrayFilters });
  } catch (error) {
    console.error("Error updating multiple items:", error);
  }
}

async function updateReviewData(reviewedConversationId, successArray, userLearningData) {
  if (userLearningData.conversations.find(({ _id }) => _id == reviewedConversationId)) {
    await UserCourseModel.updateOne(
      { _id: userLearningData._id, "conversations._id": reviewedConversationId },
      { $set: { "conversations.$.lastReviewDate": new Date() } }
    );
  }
  const wordIdsBySentence = await getWordIdsForSentences(reviewedConversationId, userLearningData.sourceLanguage);
  if (successArray.length !== wordIdsBySentence.length) return [];
  const wordUpdates = [];
  const newWordIds = [];
  const alreadyProcessed = [];
  wordIdsBySentence.forEach((wordIds) =>
    wordIds.forEach((wordId, index) => {
      if (alreadyProcessed.includes(wordId)) return;
      alreadyProcessed.push(wordId);
      const word = userLearningData.words.find(({ _id }) => _id == wordId);
      if (word) {
        wordUpdates.push(getUpdate(word, successArray[index]));
      } else {
        newWordIds.push(wordId);
      }
    })
  );

  if (wordUpdates.length > 0) await updateWords(userLearningData._id, wordUpdates);
  if (newWordIds.length > 0) await addNewWords(userLearningData._id, newWordIds);
}

function getUpdate(word, success) {
  if (success && new Date(word.nextReviewDate).getTime() < new Date().getTime()) {
    const reviewDelayInMs = nextReviewDelay(word.reviewDelayInMs);
    const nextReviewDate = new Date(Date.now() + reviewDelayInMs);
    return { ...word, nextReviewDate, reviewDelayInMs };
  } else {
    return {
      ...word,
      nextReviewDate: new Date(Date.now() + word.reviewDelayInMs),
    };
  }
}

async function updateWords(userLearningDataId, updates) {
  try {
    const arrayFilters = updates.map((update, index) => ({
      [`element${index}._id`]: update._id,
    }));
    console.log("arrayFilters", arrayFilters);

    const setOperations = updates.reduce((acc, update, index) => {
      acc[`words.$[element${index}].nextReviewDate`] = update.nextReviewDate;
      if (update.reviewDelayInMs) {
        acc[`words.$[element${index}].reviewDelayInMs`] = update.reviewDelayInMs;
      }
      return acc;
    }, {});
    console.log("setOperations", setOperations);

    await UserCourseModel.updateOne({ _id: userLearningDataId }, { $set: setOperations }, { arrayFilters });
  } catch (error) {
    console.error("Error updating multiple items:", error);
  }
}

async function addNewWords(userLearningDataId, newWordIds) {
  const newWords = newWordIds.map((wordId) => ({
    _id: wordId,
    nextReviewDate: new Date(Date.now()),
    reviewDelayInMs: 0,
    numberOfSentencesUsedIn: 1,
  }));
  await UserCourseModel.updateOne({ _id: userLearningDataId }, { $push: { words: { $each: newWords } } });
}

const DELAYS = [
  0,
  60000, //1000*60 (1 min)
  3600000, //1000*60*60 (1 hour)
  86400000, //1000*60*60*24 (1 day)
  604800000, //1000*60*60*24*7 (1 week)
  2592000000, //1000*60*60*24*30 (1 month)
  31536000000, //1000*60*60*24*365 (1 year)
];

const nextReviewDelay = (delay) => {
  const index = DELAYS.indexOf(delay);
  return index >= 0 && index < DELAYS.length - 1 ? DELAYS[index + 1] : delay;
};

async function getDashboardData(req, res) {
  try {
    const { userLearningData } = req;
    if (!userLearningData) {
      return res.status(404).json({
        success: false,
        message: "Learning data not found",
      });
    }

    const score = (await calculateUserScore(userLearningData)) || 0;
    const currentRank = getRank(score);
    const nextRankScore = getNextRankScore(score);
    const previousRankScore = getPreviousRankScore(score);

    // Calculate progress percentage
    const progress = calculateProgress(score, previousRankScore, nextRankScore);

    // Get last 7 days of scores
    const last7DaysScores = getLast7DaysScores(userLearningData.dailyScores || []);

    res.json({
      success: true,
      data: {
        progress: progress,
        rank: currentRank,
        chartData: last7DaysScores,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get dashboard data",
    });
  }
}

/**
 * Calculate the user's score based on learned words
 * Score = sum of all words multiplied by their review progress (how many time they have been reviewed with success)
 */

export async function calculateUserScore(userCourse) {
  try {
    if (!userCourse || !userCourse.words) {
      return 0;
    }

    const now = new Date();
    let score = 0;

    for (const word of userCourse.words) {
      // A word is considered "learned" if it's not overdue (nextReviewDate is in the future)
      if (word.nextReviewDate && new Date(word.nextReviewDate) > now) {
        // Score is weighted by reviewDelayInMs
        const weight = DELAYS.indexOf(word.reviewDelayInMs);
        score += weight;
      }
    }

    return score;
  } catch (error) {
    console.error("Error calculating user score:", error);
    return 0;
  }
}

function getRank(score) {
  if (score >= 10000) return "Expert";
  if (score >= 3000) return "Advanced";
  if (score >= 1000) return "Amateur";
  return "Beginner";
}

function getNextRankScore(currentScore) {
  if (currentScore < 1000) return 1000;
  if (currentScore < 3000) return 3000;
  if (currentScore < 10000) return 10000;
  return 100000; // Beyond expert
}

function getPreviousRankScore(currentScore) {
  if (currentScore >= 800) return 300;
  if (currentScore >= 300) return 100;
  if (currentScore >= 100) return 0;
  return 0;
}

function calculateProgress(currentScore, previousScore, nextScore) {
  console.log("currentScore, previousScore, nextScore", currentScore, previousScore, nextScore);
  const range = nextScore - previousScore;
  const position = currentScore - previousScore;
  const percentage = Math.round((position / range) * 100);
  return Math.max(0, Math.min(100, percentage));
}

function getLast7DaysScores(dailyScores) {
  // Sort by date descending
  const sorted = dailyScores.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Get last 7 days
  const last7Days = sorted.slice(0, 7);

  // Fill in missing days with 0 score
  const result = [];

  // Get yesterday's date (set to beginning of day for consistency)
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const date = new Date(yesterday);
    date.setDate(date.getDate() - (6 - i));

    // Format date as MM/DD
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const formattedDate = `${month}/${day}`;

    // Find score for this date
    const scoreEntry = last7Days.find((entry) => {
      const entryDate = new Date(entry.date);
      return entryDate.toDateString() === date.toDateString();
    });

    result.push({
      date: formattedDate,
      wordsLearned: scoreEntry ? scoreEntry.score : 0,
    });
  }

  return result;
}

export default router;
