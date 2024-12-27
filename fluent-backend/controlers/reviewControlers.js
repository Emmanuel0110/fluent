import auth from '../middleware/auth.js';
import { MultiLingualConversationModel, StoryNodeModel } from "../models.js";
import express from "express";
const router = express.Router();

router.get("/", auth, getNextReviewItems)

async function getNextReviewItems(req, res) {
  try {
    const nextReviewItems = req.userLearningData ? await getReviewItems(req.userLearningData) : []; //TODO, set userLearningData when user first choose a language
    res.json({ status: "success", data: nextReviewItems });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Failed to get next review items",
    });
  }
}

async function getReviewItems(userLearningData) {
  const reviewStrategies = [
    { type: "lateReviewWords", handler: getLateReviewItems },
    { type: "wishList", handler: getWishListReviewItems },
    { type: "storyNode", handler: getStoryReviewItems },
  ];

  for (const strategy of reviewStrategies) {
    const reviewItems = await strategy.handler(userLearningData);
    if (reviewItems.length > 0) return reviewItems;
  }
  return [];
}

async function getLateReviewItems(userLearningData) {
  const lateReviewWordIds = getLateReviewWordIds(userLearningData.words);
  return lateReviewWordIds.length > 0 ? getKnownConversationsForWords(lateReviewWordIds, userLearningData) : [];
}

async function getWishListReviewItems(userLearningData) {
  const { wishListConversations, sourceLanguage, targetLanguage } = userLearningData;
  const n = 10;
  if (wishListConversations.length > 0) {
    return (await MultiLingualConversationModel.find({ _id: { $in: wishListConversations.slice(0, n) } }).lean()).map(
      (multiLingualConversation) => {
        const filteredConversations = multiLingualConversation.conversations.filter((conversation) =>
          [sourceLanguage, targetLanguage].includes(conversation.language)
        );
        return { ...multiLingualConversation, conversations: filteredConversations };
      }
    );
  } else return [];
}

async function getStoryReviewItems(userLearningData) {
  if (userLearningData.nextStoryNodeId) {
    const storyNode = await StoryNodeModel.findById(userLearningData.nextStoryNodeId);
    const missingPrerequisites = storyNode.prerequisites.filter(
      (prerequisite) => !userLearningData.words.find(({ _id }) => prerequisite == _id)
    );
    if (missingPrerequisites.length > 0) {
      return getEasyConversationsForWords(missingPrerequisites, userLearningData);
    }
  }
  return [];
}

function getLateReviewWordIds(reviewWords) {
  const n = 10;
  return reviewWords
    .filter((word) => word.nextReviewDate < new Date())
    .sort((a, b) => new Date(b.nextReviewDate) - new Date(a.nextReviewDate)) // descending order
    .slice(0, n)
    .map(({ _id }) => _id);
}

async function getKnownConversationsForWords(wordIds, userLearningData) {
  const conversations = await getConversationsForWords(wordIds, userLearningData);
  const userConversations = userLearningData.conversations;
  const knownConversations = conversations.reduce((acc, conversation) => {
    const lastReviewDate = userConversations.find(({ _id }) => (_id = conversation._id))?.lastReviewDate;
    if (lastReviewDate) {
      acc.push({ ...conversation, lastReviewDate });
    }
    return acc;
  }, []);
  return knownConversations;
}

async function getEasyConversationsForWords(wordIds, userLearningData) {
  const conversations = await getConversationsForWords(wordIds, userLearningData);
  const userWords = userLearningData.words;
  const easyConversations = conversations.reduce((acc, conversation) => {
    const maxDifficulty = 100;
    let difficulty = 0,
      key;
    conversation.sentences.forEach((sentence) => {
      sentence.prerequisites.forEach((prerequisite) => {
        if (wordIds.includes(prerequisite)) {
          key = prerequisite;
        } else if (!userWords.find(({ _id }) => _id == prerequisite)) {
          difficulty++;
        }
      });
    });
    if (acc[key]?.difficulty || maxDifficulty > difficulty) {
      acc[key] = { conversation, difficulty };
    }
    return acc;
  }, {});
  return Object.values(easyConversations);
}

async function getConversationsForWords(wordIds, userLearningData) {
  return MultiLingualConversationModel.aggregate([
    // Step 1: Match conversations containing sentences with wordIds in prerequisites
    {
      $match: {
        "conversations.sentences.prerequisites": { $in: wordIds },
        "conversations.language": userLearningData.sourceLanguage,
      },
    },

    // Step 2: Project and filter the conversations array to include only "fr" and "en"
    {
      $project: {
        _id: 1,
        tags: 1,
        conversations: {
          $filter: {
            input: "$conversations", // The array to filter
            as: "conversation", // Alias for each element in the array
            cond: {
              $in: ["$$conversation.language", [userLearningData.sourceLanguage, userLearningData.targetLanguage]], // Keep only source and target languages
            },
          },
        },
      },
    },
  ]).lean();
}

export default router;