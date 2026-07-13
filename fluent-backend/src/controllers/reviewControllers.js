import auth from "../middleware/auth.js";
import cache from "../middleware/cache.js";
import { MultiLingualConversationModel, StoryNodeModel } from "../models.js";
import { logger } from "../logger.js";
import express from "express";
import mongoose from "mongoose";
const router = express.Router();

router.get("/", auth, cache, getNextReviewItems);
router.get("/suggestions", auth, cache, getSuggestionsEasyConversations);

async function getSuggestionsEasyConversations(req, res) {
  try {
    const suggestedConversations = req.userCourse
      ? (await getUnsubscribedConversations(req.userCourse)).slice(0, 10)
      : [];
    res.json({
      success: true,
      data: suggestedConversations.map((conversation) => ({ ...conversation, subscribed: false })),
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to get suggestions");
    res.status(500).json({
      success: false,
      message: "Failed to get suggestions",
    });
  }
}

async function getNextReviewItems(req, res) {
  try {
    const nextReviewItems = req.userCourse ? await getReviewItems(req.userCourse) : [];
    res.json({ success: true, data: nextReviewItems });
  } catch (error) {
    logger.error({ err: error }, "Failed to get next review items");
    res.status(500).json({
      success: false,
      message: "Failed to get next review items",
    });
  }
}

async function getReviewItems(userCourse) {
  const MAX_REVIEW_ITEMS = 10;
  const reviewStrategies = [
    { type: "lateReviewWords", handler: getLateReviewItems },
    { type: "wishList", handler: getWishListReviewItems },
    { type: "storyNode", handler: getStoryReviewItems },
  ];

  for (const strategy of reviewStrategies) {
    const reviewItems = await strategy.handler(userCourse);
    logger.debug({ strategy: strategy.type, count: reviewItems.length }, "Review strategy result");
    if (reviewItems.length > 0) return reviewItems.slice(0, MAX_REVIEW_ITEMS);
  }
  return [];
}

async function getLateReviewItems(userCourse) {
  const lateReviewWordIds = getLateReviewWordIds(userCourse.words);
  if (lateReviewWordIds.length === 0) return [];

  const knownConversations = await getKnownConversationsForWords(lateReviewWordIds, userCourse);
  return knownConversations.map((conversation) => ({ ...conversation, subscribed: true }));
}

async function getWishListReviewItems(userCourse) {
  const { wishListConversations, sourceLanguage, targetLanguage } = userCourse;
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

async function getStoryReviewItems(userCourse) {
  if (userCourse.nextStoryNodeId) {
    const storyNode = await StoryNodeModel.findById(userCourse.nextStoryNodeId);
    const missingPrerequisites = storyNode.prerequisites.filter(
      (prerequisite) => !userCourse.words.find(({ _id }) => _id.equals(prerequisite))
    );
    if (missingPrerequisites.length > 0) {
      const easyConversations = await getEasyConversationsForWords(missingPrerequisites, userCourse);
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

async function getKnownConversationsForWords(wordIds, userCourse) {
  const conversations = await getConversationsForWords(wordIds, userCourse);
  const userConversations = userCourse.conversations;
  const knownConversations = conversations.reduce((acc, conversation) => {
    const lastReviewDate = userConversations.find(({ _id }) => _id.equals(conversation._id))?.lastReviewDate;
    if (lastReviewDate) {
      acc.push({ ...conversation, lastReviewDate });
    }
    return acc;
  }, []);
  const sortedConversations = knownConversations.sort(
    (a, b) => new Date(a.lastReviewDate).getTime() - new Date(b.lastReviewDate).getTime() // ascending order (review the oldest ones to avoid reviewing always the same conversations)
  );
  const selectedConversations = selectUsefulConversations(sortedConversations, [...wordIds]);
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

async function getEasyConversationsForWords(wordIds, userCourse) {
  const multiLingualConversations = await getConversationsForWords(wordIds, userCourse);
  const userWords = userCourse.words;
  const easyConversations = multiLingualConversations.reduce((acc, multiLingualConversation) => {
    const maxDifficulty = 100;
    let difficulty = 0,
      key;
    multiLingualConversation.conversations.forEach((conversation) =>
      conversation.sentences.forEach((sentence) => {
        sentence.prerequisites.forEach((prerequisite) => {
          if (wordIds.some((id) => id.equals(prerequisite))) {
            key = prerequisite;
          } else if (!userWords.find(({ _id }) => _id.equals(prerequisite))) {
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

async function getUnsubscribedConversations(userCourse) {
  return MultiLingualConversationModel.aggregate([
    // Step 1: Match conversations containing sentences with wordIds in prerequisites
    {
      $match: {
        _id: {
          $nin: [
            ...userCourse.conversations.map(({ _id }) => _id),
            ...(userCourse.dismissedSuggestions || []),
          ],
        },
        "conversations.language": {
          $all: [
            new mongoose.Types.ObjectId(userCourse.sourceLanguage),
            new mongoose.Types.ObjectId(userCourse.targetLanguage),
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
            input: "$conversations",
            as: "conversation",
            cond: {
              $in: [
                "$$conversation.language",
                [
                  new mongoose.Types.ObjectId(userCourse.sourceLanguage),
                  new mongoose.Types.ObjectId(userCourse.targetLanguage),
                ],
              ],
            },
          },
        },
      },
    },
  ]);
}

export async function getConversationsForWords(wordIds, userCourse) {
  return MultiLingualConversationModel.aggregate([
    // Step 1: Match conversations containing sentences with wordIds in prerequisites
    {
      $match: {
        "conversations.sentences.prerequisites": { $in: wordIds.map((id) => new mongoose.Types.ObjectId(id)) },
        "conversations.language": {
          $all: [
            new mongoose.Types.ObjectId(userCourse.sourceLanguage),
            new mongoose.Types.ObjectId(userCourse.targetLanguage),
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
                  new mongoose.Types.ObjectId(userCourse.sourceLanguage),
                  new mongoose.Types.ObjectId(userCourse.targetLanguage),
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
