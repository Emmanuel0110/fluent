import auth from "../middleware/auth.js";
import cache, { refreshLearningDataCache } from "../middleware/cache.js";
import { redisClient } from "../../index.js";
import { UserCourseModel } from "../models.js";
import { MultiLingualConversationModel } from "../models.js";
import express from "express";
const router = express.Router();

router.patch("/", auth, cache, updateLearningData);

async function updateLearningData(req, res) {
  try {
    const { userLearningData, user } = req;
    if (userLearningData) {
      const { conversationToSubscribe, conversationToUnsubscribe, reviewedConversationId, success } = req.body;
      if (conversationToSubscribe) {
        await subscribeToConversation(conversationToSubscribe, userLearningData);
        res.json({ success: true });
      } else if (conversationToUnsubscribe) {
        const wordsToUnsubscribe = await unsubscribeToConversation(conversationToUnsubscribe, userLearningData);
        res.json({ success: true, wordsToUnsubscribe });
      } else if (reviewedConversationId) {
        await updateReviewData(reviewedConversationId, success, userLearningData);
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

async function updateReviewData(reviewedConversationId, success, userLearningData) {
  if (userLearningData.conversations.find(({ _id }) => _id == reviewedConversationId)) {
    await UserCourseModel.updateOne(
      { _id: userLearningData._id, "conversations._id": reviewedConversationId },
      { $set: { "conversations.$.lastReviewDate": new Date() } }
    );
  }
  const wordIds = await getWordIdsForConversation(reviewedConversationId, userLearningData.sourceLanguage);
  const uniqIds = [...new Set(wordIds)];
  const [wordUpdates, newWordIds] = uniqIds.reduce(
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
  console.log("wordUpdates", wordUpdates);

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
    nextReviewDate: new Date(Date.now() + 60000),
    reviewDelayInMs: 60000,
    numberOfSentencesUsedIn: 1,
  }));
  await UserCourseModel.updateOne({ _id: userLearningDataId }, { $push: { words: { $each: newWords } } });
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
  const index = delays.indexOf(delay);
  return index >= 0 && index < delays.length - 1 ? delays[index + 1] : delay;
};

export default router;
