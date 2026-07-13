import auth from "../middleware/auth.js";
import cache from "../middleware/cache.js";
import { LexicalItemModel, MultiLingualConversationModel, StoryNodeModel } from "../models.js";
import { logger } from "../logger.js";
import express from "express";
import mongoose from "mongoose";
const router = express.Router();

router.get("/", auth, cache, getNextReviewItems);
router.get("/suggestions", auth, cache, getSuggestionsEasyConversations);

async function getSuggestionsEasyConversations(req, res) {
  try {
    const suggestedConversations = req.userCourse
      ? (await getEasiestUnsubscribedConversations(req.userCourse)).slice(0, 10)
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
        [sourceLanguage, targetLanguage].includes(conversation.language),
      );
      return { ...multiLingualConversation, conversations: filteredConversations, subscribed: true };
    });
  } else return [];
}

async function getStoryReviewItems(userCourse) {
  if (userCourse.nextStoryNodeId) {
    const storyNode = await StoryNodeModel.findById(userCourse.nextStoryNodeId);
    const missingPrerequisites = storyNode.prerequisites.filter(
      (prerequisite) => !userCourse.words.find(({ _id }) => _id.equals(prerequisite)),
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
    (a, b) => new Date(a.lastReviewDate).getTime() - new Date(b.lastReviewDate).getTime(), // ascending order (review the oldest ones to avoid reviewing always the same conversations)
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

  // Same level-weighted ranking as getEasiestUnsubscribedConversations. The words we set out to
  // teach (wordIds) are treated as "known" so only the incidental new target-language
  // vocabulary adds difficulty.
  const targetLanguage = userCourse.targetLanguage.toString();
  const targetWordIds = new Set(wordIds.map((id) => id.toString()));
  const knownWordIds = new Set([
    ...userCourse.words.map(({ _id }) => _id.toString()),
    ...targetWordIds,
  ]);

  const unknownWordsByConversation = multiLingualConversations.map((conversation) =>
    getUnknownTargetWordIds(conversation, knownWordIds, targetLanguage),
  );
  const levelByWordId = await getWordLevels([...new Set(unknownWordsByConversation.flatMap((ids) => [...ids]))]);

  // Keep the single easiest conversation that teaches each requested target word.
  const easiestByTargetWord = new Map();
  multiLingualConversations.forEach((conversation, i) => {
    const difficulty = getConversationDifficulty(unknownWordsByConversation[i], levelByWordId);
    for (const targetWordId of getTargetWordIds(conversation, targetWordIds, targetLanguage)) {
      const current = easiestByTargetWord.get(targetWordId);
      if (!current || difficulty < current.difficulty) {
        easiestByTargetWord.set(targetWordId, { conversation, difficulty });
      }
    }
  });

  // Easiest first, de-duplicated (one conversation may cover several target words).
  const seen = new Set();
  return [...easiestByTargetWord.values()]
    .sort((a, b) => a.difficulty - b.difficulty)
    .map(({ conversation }) => conversation)
    .filter((conversation) => {
      const id = conversation._id.toString();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
}

async function getEasiestUnsubscribedConversations(userCourse) {
  const multiLingualConversations = await MultiLingualConversationModel.aggregate([
    // Step 1: Exclude conversations already in the course or previously dismissed,
    // and keep only those available in both the learner's source and target languages.
    {
      $match: {
        _id: {
          $nin: [...userCourse.conversations.map(({ _id }) => _id), ...(userCourse.dismissedSuggestions || [])],
        },
        "conversations.language": {
          $all: [
            new mongoose.Types.ObjectId(userCourse.sourceLanguage),
            new mongoose.Types.ObjectId(userCourse.targetLanguage),
          ],
        },
      },
    },

    // Step 2: Keep only the source- and target-language versions of each conversation.
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

  // Rank easiest first, so the caller's slice suggests the conversations that
  // introduce the least demanding unknown target-language vocabulary to the learner.
  const knownWordIds = new Set(userCourse.words.map(({ _id }) => _id.toString()));
  const targetLanguage = userCourse.targetLanguage.toString();
  const unknownWordsByConversation = multiLingualConversations.map((conversation) =>
    getUnknownTargetWordIds(conversation, knownWordIds, targetLanguage),
  );

  // Fetch every unknown word's level once, so difficulty reflects how advanced the new
  // vocabulary is, not just how much of it there is.
  const levelByWordId = await getWordLevels([...new Set(unknownWordsByConversation.flatMap((ids) => [...ids]))]);

  return multiLingualConversations
    .map((conversation, i) => ({
      conversation,
      difficulty: getConversationDifficulty(unknownWordsByConversation[i], levelByWordId),
    }))
    .sort((a, b) => a.difficulty - b.difficulty)
    .map(({ conversation }) => conversation);
}

// Level-weighted difficulty: each distinct unknown target-language word costs its level (1-3).
// Real vocabulary always has level >= 1, so more new words means a harder conversation; the
// || 1 floor keeps a not-yet-graded placeholder (level 0) counting as 1 rather than free.
function getConversationDifficulty(unknownWordIds, levelByWordId) {
  return [...unknownWordIds].reduce((sum, wordId) => sum + (levelByWordId.get(wordId) || 1), 0);
}

// Distinct target-language prerequisite word ids (as strings) matching `predicate`.
function collectTargetWordIds(multiLingualConversation, targetLanguage, predicate) {
  const wordIds = new Set();
  multiLingualConversation.conversations
    .filter((conversation) => conversation.language.toString() === targetLanguage)
    .forEach((conversation) =>
      conversation.sentences.forEach((sentence) =>
        sentence.prerequisites.forEach((prerequisite) => {
          const wordId = prerequisite.toString();
          if (predicate(wordId)) wordIds.add(wordId);
        }),
      ),
    );
  return wordIds;
}

// Distinct target-language prerequisite words the learner does not yet know.
function getUnknownTargetWordIds(multiLingualConversation, knownWordIds, targetLanguage) {
  return collectTargetWordIds(multiLingualConversation, targetLanguage, (wordId) => !knownWordIds.has(wordId));
}

// Distinct target-language prerequisite words that belong to the requested `targetWordIds`.
function getTargetWordIds(multiLingualConversation, targetWordIds, targetLanguage) {
  return collectTargetWordIds(multiLingualConversation, targetLanguage, (wordId) => targetWordIds.has(wordId));
}

// Map of LexicalItem id (string) -> level, for the given ids.
async function getWordLevels(wordIds) {
  const lexicalItems = await LexicalItemModel.find({ _id: { $in: wordIds } }, { level: 1 }).lean();
  return new Map(lexicalItems.map(({ _id, level }) => [_id.toString(), level || 0]));
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
