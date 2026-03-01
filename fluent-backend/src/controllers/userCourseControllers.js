import auth from "../middleware/auth.js";
import cache, { refreshUserCourseCache } from "../middleware/cache.js";
import { validateUpdateLearningData } from "../middleware/validation.js";
import { redisClient } from "../redis.js";
import { UserCourseModel } from "../models.js";
import { MultiLingualConversationModel } from "../models.js";
import { logger } from "../logger.js";
import express from "express";
const router = express.Router();

router.patch("/", auth, cache, validateUpdateLearningData, updateLearningData);

router.get("/dashboard", auth, cache, getDashboardData);

async function updateLearningData(req, res) {
  try {
    const { userCourse, user } = req;
    if (userCourse) {
      const { conversationToSubscribe, conversationToUnsubscribe, reviewedConversationId, successArray } = req.body;
      if (conversationToSubscribe) {
        await subscribeToConversation(conversationToSubscribe, userCourse);
        logger.info({ userId: user._id, userCourseId: userCourse._id, conversationId: conversationToSubscribe }, "Subscribed to conversation");
        res.json({ success: true });
      } else if (conversationToUnsubscribe) {
        await unsubscribeToConversation(conversationToUnsubscribe, userCourse);
        logger.info({ userId: user._id, userCourseId: userCourse._id, conversationId: conversationToUnsubscribe }, "Unsubscribed from conversation");
        res.json({ success: true });
      } else if (reviewedConversationId) {
        await updateReviewData(reviewedConversationId, successArray, userCourse);
        logger.info({ userId: user._id, userCourseId: userCourse._id, conversationId: reviewedConversationId }, "Review completed");
        res.json({ success: true });
      }
      if (redisClient) {
        refreshUserCourseCache(userCourse._id, user._id);
      }
    }
  } catch (error) {
    logger.error({ err: error }, "Failed to update user course");
    res.status(500).json({
      status: "error",
      message: "Failed to update user course",
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

async function subscribeToConversation(conversationToSubscribe, userCourse) {
  if (!userCourse.conversations.find(({ _id }) => _id == conversationToSubscribe)) {
    await UserCourseModel.updateOne(
      { _id: userCourse._id },
      { $push: { conversations: { _id: conversationToSubscribe, lastReviewDate: new Date() } } }
    );
    const wordIds = await getWordIdsForConversation(conversationToSubscribe, userCourse.sourceLanguage);
    const uniqIds = [...new Set(wordIds)];
    const [wordUpdates, newWordIds] = uniqIds.reduce(
      ([wordUpdates, newWordIds], wordId) => {
        const word = userCourse.words.find(({ _id }) => _id == wordId);
        if (word) {
          wordUpdates.push({ ...word, numberOfSentencesUsedIn: word.numberOfSentencesUsedIn + 1 });
        } else {
          newWordIds.push(wordId);
        }
        return [wordUpdates, newWordIds];
      },
      [[], []]
    );
    if (wordUpdates.length > 0) await updateWordsSubscription(userCourse._id, wordUpdates);
    if (newWordIds.length > 0) await addNewWords(userCourse._id, newWordIds);
  } else {
    logger.debug({ conversationToSubscribe }, "Already subscribed to conversation");
  }
}

async function unsubscribeToConversation(conversationToUnsubscribe, userCourse) {
  if (userCourse.conversations.find(({ _id }) => _id == conversationToUnsubscribe)) {
    await UserCourseModel.updateOne(
      { _id: userCourse._id },
      { $pull: { conversations: { _id: conversationToUnsubscribe } } }
    );
    const wordIds = await getWordIdsForConversation(conversationToUnsubscribe, userCourse.sourceLanguage);
    const uniqIds = [...new Set(wordIds)];
    const [wordUpdates, wordIdsToUnsubcribe] = uniqIds.reduce(
      ([wordUpdates, wordIdsToRemove], wordId) => {
        const word = userCourse.words.find(({ _id }) => _id == wordId);
        if (word) {
          if (word.numberOfSentencesUsedIn == 1) {
            wordIdsToRemove.push(wordId);
          } else if (word.numberOfSentencesUsedIn > 1) {
            wordUpdates.push({ ...word, numberOfSentencesUsedIn: word.numberOfSentencesUsedIn - 1 });
          } else {
            logger.warn(
              { wordId, numberOfSentencesUsedIn: word.numberOfSentencesUsedIn },
              "word.numberOfSentencesUsedIn should be > 0"
            );
          }
        } else {
          logger.debug({ wordId }, "Not subscribed to word");
        }
        return [wordUpdates, wordIdsToRemove];
      },
      [[], []]
    );
    if (wordUpdates.length > 0) await updateWordsSubscription(userCourse._id, wordUpdates);
    if (wordIdsToUnsubcribe.length > 0) await removeWords(userCourse._id, wordIdsToUnsubcribe);
    return wordIdsToUnsubcribe;
  } else {
    logger.debug({ conversationToUnsubscribe }, "Not subscribed to conversation");
  }
}

async function removeWords(userCourseId, wordIdsToRemove) {
  try {
    await UserCourseModel.updateOne(
      { _id: userCourseId },
      { $pull: { words: { _id: { $in: wordIdsToRemove } } } }
    );
  } catch (error) {
    logger.error({ err: error, userCourseId, wordIdsToRemove }, "Error removing words from user course");
  }
}

async function updateWordsSubscription(userCourseId, updates) {
  try {
    const arrayFilters = updates.map((update, index) => ({
      [`element${index}._id`]: update._id,
    }));

    const setOperations = updates.reduce((acc, update, index) => {
      acc[`words.$[element${index}].numberOfSentencesUsedIn`] = update.numberOfSentencesUsedIn;
      return acc;
    }, {});

    await UserCourseModel.updateOne({ _id: userCourseId }, { $set: setOperations }, { arrayFilters });
  } catch (error) {
    logger.error({ err: error, userCourseId }, "Error updating words subscription");
  }
}

async function updateReviewData(reviewedConversationId, successArray, userCourse) {
  if (userCourse.conversations.find(({ _id }) => _id == reviewedConversationId)) {
    await UserCourseModel.updateOne(
      { _id: userCourse._id, "conversations._id": reviewedConversationId },
      { $set: { "conversations.$.lastReviewDate": new Date() } }
    );
  }
  const wordIdsBySentence = await getWordIdsForSentences(reviewedConversationId, userCourse.sourceLanguage);
  if (successArray.length !== wordIdsBySentence.length) return [];
  const wordUpdates = [];
  const newWordIds = [];
  const alreadyProcessed = [];
  wordIdsBySentence.forEach((wordIds) =>
    wordIds.forEach((wordId, index) => {
      if (alreadyProcessed.includes(wordId)) return;
      alreadyProcessed.push(wordId);
      const word = userCourse.words.find(({ _id }) => _id == wordId);
      if (word) {
        wordUpdates.push(getUpdate(word, successArray[index]));
      } else {
        newWordIds.push(wordId);
      }
    })
  );

  if (wordUpdates.length > 0) await updateWords(userCourse._id, wordUpdates);
  if (newWordIds.length > 0) await addNewWords(userCourse._id, newWordIds);
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

async function updateWords(userCourseId, updates) {
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

    await UserCourseModel.updateOne({ _id: userCourseId }, { $set: setOperations }, { arrayFilters });
  } catch (error) {
    logger.error({ err: error, userCourseId }, "Error updating words in user course");
  }
}

async function addNewWords(userCourseId, newWordIds) {
  const newWords = newWordIds.map((wordId) => ({
    _id: wordId,
    nextReviewDate: new Date(Date.now()),
    reviewDelayInMs: 0,
    numberOfSentencesUsedIn: 1,
  }));
  await UserCourseModel.updateOne({ _id: userCourseId }, { $push: { words: { $each: newWords } } });
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
    const { userCourse } = req;
    if (!userCourse) {
      return res.status(404).json({
        success: false,
        message: "User course not found",
      });
    }

    const score = (await calculateUserScore(userCourse)) || 0;
    const currentRank = getRank(score);
    const nextRankScore = getNextRankScore(score);
    const previousRankScore = getPreviousRankScore(score);

    // Calculate progress percentage
    const progress = calculateProgress(score, previousRankScore, nextRankScore);

    // Get last 7 days of scores
    const last7DaysScores = getLast7DaysScores(userCourse.dailyScores || []);

    res.json({
      success: true,
      data: {
        progress: progress,
        rank: currentRank,
        chartData: last7DaysScores,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Dashboard error");
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
    logger.error({ err: error }, "Error calculating user score");
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
