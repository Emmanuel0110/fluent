import auth from "../middleware/auth.js";
import cache from "../middleware/cache.js";
import { MultiLingualConversationModel, StoryNodeModel } from "../models.js";
import express from "express";
import mongoose from "mongoose";
const router = express.Router();

router.get("/", auth, cache, getNextReviewItems);

async function getNextReviewItems(req, res) {
  try {
    console.log("🔍 Debug - userLearningData:", req.userLearningData); // Add this
    const nextReviewItems = req.userLearningData ? await getReviewItems(req.userLearningData) : []; //TODO, set userLearningData when user first chooses a language
    console.log("🔍 Debug - nextReviewItems:", nextReviewItems); // Add this
    res.json({ success: true, data: nextReviewItems });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to get next review items",
    });
  }
}

async function getReviewItems(userLearningData) {
  const MAX_REVIEW_ITEMS = 10;
  const reviewStrategies = [
    { type: "lateReviewWords", handler: getLateReviewItems },
    { type: "wishList", handler: getWishListReviewItems },
    { type: "storyNode", handler: getStoryReviewItems },
  ];

  for (const strategy of reviewStrategies) {
    console.log(`🔍 Debug - Trying strategy: ${strategy.type}`); // Add this
    const reviewItems = await strategy.handler(userLearningData);
    console.log(`🔍 Debug - ${strategy.type} returned:`, reviewItems.length, "items"); // Add this
    if (reviewItems.length > 0) return reviewItems.slice(0, MAX_REVIEW_ITEMS);
  }
  return [];
}

async function getLateReviewItems(userLearningData) {
  const lateReviewWordIds = getLateReviewWordIds(userLearningData.words);
  console.log(`🔍 Debug - lateReviewWordIds: ${lateReviewWordIds}`);
  if (lateReviewWordIds.length === 0) return [];

  const knownConversations = await getKnownConversationsForWords(lateReviewWordIds, userLearningData);
  return knownConversations.map((conversation) => ({ ...conversation, subscribed: true }));
}

async function getWishListReviewItems(userLearningData) {
  const { wishListConversations, sourceLanguage, targetLanguage } = userLearningData;
  const MAX_ITEM = 10;
  if (wishListConversations.length > 0) {
    return (
      await MultiLingualConversationModel.find({ _id: { $in: wishListConversations.slice(0, MAX_ITEM) } }).lean()
    ).map((multiLingualConversation) => {
      const filteredConversations = multiLingualConversation.conversations.filter((conversation) =>
        [sourceLanguage, targetLanguage].includes(conversation.language)
      );
      return { ...multiLingualConversation, conversations: filteredConversations, subscribed: true };
    });
  } else return [];
}

async function getStoryReviewItems(userLearningData) {
  if (userLearningData.nextStoryNodeId) {
    const storyNode = await StoryNodeModel.findById(userLearningData.nextStoryNodeId);
    const missingPrerequisites = storyNode.prerequisites.filter(
      (prerequisite) => !userLearningData.words.find(({ _id }) => prerequisite == _id)
    );
    if (missingPrerequisites.length > 0) {
      const easyConversations = await getEasyConversationsForWords(missingPrerequisites, userLearningData);
      return easyConversations.map((conversation) => ({ ...conversation, subscribed: false }));
    }
  }
  return [];
}

function getLateReviewWordIds(reviewWords) {
  const MAX_SIZE_OF_REVIEW_BATCH = 20;
  return reviewWords
    .filter((word) => new Date(word.nextReviewDate).getTime() < new Date().getTime())
    .sort((a, b) => new Date(b.nextReviewDate).getTime() - new Date(a.nextReviewDate).getTime()) // descending order (review the most recent ones among late, to keep motivation high)
    .slice(0, MAX_SIZE_OF_REVIEW_BATCH)
    .map(({ _id }) => _id);
}

async function getKnownConversationsForWords(wordIds, userLearningData) {
  const conversations = await getConversationsForWords(wordIds, userLearningData);
  console.log(`🔍 Debug - conversations: ${conversations}`);
  const userConversations = userLearningData.conversations;
  const knownConversations = conversations.reduce((acc, conversation) => {
    const lastReviewDate = userConversations.find(({ _id }) => (_id = conversation._id))?.lastReviewDate;
    if (lastReviewDate) {
      acc.push({ ...conversation, lastReviewDate });
    }
    return acc;
  }, []);
  console.log(`🔍 Debug - knownConversations: ${knownConversations}`);
  const sortedConversations = knownConversations.sort(
    (a, b) => new Date(a.lastReviewDate).getTime() - new Date(b.lastReviewDate).getTime() // ascending order (review the oldest ones to avoid reviewing always the same conversations)
  );
  const selectedConversations = selectUsefulConversations(sortedConversations, [...wordIds]);
  console.log(`🔍 Debug - selectedConversations: ${selectedConversations}`);
  return selectedConversations;
}

function selectUsefulConversations(conversations, wordIdsLeftToFind) {
  //select enough conversations to cover wordIds
  const selectedConversations = [];
  let i = 0;

  // Convert wordIdsLeftToFind to strings for comparison
  const wordIdsLeftToFindStrings = wordIdsLeftToFind.map((id) => id.toString());

  while (wordIdsLeftToFindStrings.length && i < conversations.length) {
    const conversation = conversations[i];
    const wordsFromConversation = getWordsFromConversation(conversation);

    // Convert conversation word IDs to strings and filter
    const wordIdsFound = wordsFromConversation
      .map((id) => id.toString())
      .filter((value) => wordIdsLeftToFindStrings.includes(value)); //TODO: use set intersection and difference

    if (wordIdsFound.length > 0) {
      selectedConversations.push(conversation);
      wordIdsFound.forEach((id) => {
        const index = wordIdsLeftToFindStrings.indexOf(id);
        if (index > -1) {
          wordIdsLeftToFindStrings.splice(index, 1);
        }
      });
    }
    i++;
  }
  return selectedConversations;
}

function getWordsFromConversation(conversation) {
  return conversation.conversations.reduce((acc, value) => {
    return [
      ...acc,
      ...value.sentences.reduce((acc2, value2) => {
        return [...acc2, ...value2.prerequisites];
      }, []),
    ];
  }, []);
}

async function getEasyConversationsForWords(wordIds, userLearningData) {
  const multiLingualConversations = await getConversationsForWords(wordIds, userLearningData);
  const userWords = userLearningData.words;
  const easyConversations = multiLingualConversations.reduce((acc, multiLingualConversation) => {
    const maxDifficulty = 100;
    let difficulty = 0,
      key;
    multiLingualConversation.conversations.forEach((conversation) =>
      conversation.sentences.forEach((sentence) => {
        sentence.prerequisites.forEach((prerequisite) => {
          if (wordIds.includes(prerequisite)) {
            key = prerequisite;
          } else if (!userWords.find(({ _id }) => _id == prerequisite)) {
            difficulty++;
          }
        });
      })
    );
    if ((acc[key]?.difficulty || maxDifficulty) > difficulty) {
      acc[key] = { conversation, difficulty };
    }
    return acc;
  }, {});
  return Object.values(easyConversations);
}

export async function getConversationsForWords(wordIds, userLearningData) {
  return MultiLingualConversationModel.aggregate([
    // Step 1: Match conversations containing sentences with wordIds in prerequisites
    {
      $match: {
        "conversations.sentences.prerequisites": { $in: wordIds.map((id) => new mongoose.Types.ObjectId(id)) },
        "conversations.language": {
          $all: [
            new mongoose.Types.ObjectId(userLearningData.sourceLanguage),
            new mongoose.Types.ObjectId(userLearningData.targetLanguage),
          ],
        },
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
              $in: [
                "$$conversation.language",
                [
                  new mongoose.Types.ObjectId(userLearningData.sourceLanguage),
                  new mongoose.Types.ObjectId(userLearningData.targetLanguage),
                ],
              ], // Keep only source and target languages
            },
          },
        },
      },
    },
  ]);
}

export default router;
