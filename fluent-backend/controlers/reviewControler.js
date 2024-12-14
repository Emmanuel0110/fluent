import { UserModel, LexicalItemModel, MultiLingualConversationModel, StoryNodeModel } from "../models";

export async function getNextReviewItems(req, res) {
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

export async function updateLearningData(req, res) {
  try {
    if (req.userLearningData) {
      //your code here with req.reviewedItems
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

async function getReviewItems(userLearningData, targetLanguage) {
  const reviewStrategies = [
    { type: "lateReviewWords", handler: getLateReviewItems },
    { type: "wishList", handler: getWishListReviewItems },
    { type: "storyNode", handler: getStoryReviewItems },
  ];

  for (const strategy of reviewStrategies) {
    const reviewItems = await strategy.handler(userLearningData, targetLanguage);
    if (reviewItems.length > 0) return reviewItems;
  }
  return [];
}

async function getLateReviewItems(userLearningData, targetLanguage) {
  const lateReviewWords = await getLateReviewWords(userLearningData.words, targetLanguage);
  return lateReviewWords.length > 0 ? getReviewItemsForWords(lateReviewWords, userLearningData) : [];
}

async function getWishListReviewItems(userLearningData, targetLanguage) {
  if (userLearningData.wishlist.length > 0) {
    const item = userLearningData.wishlist[0];
    if (item.type === "word") {
      return LexicalItemModel.findById(item._id).then((word) => getReviewItemsForWords([word], userLearningData));
    } else if (item.type === "sentence") {
      return SentenceModel.findById(item._id).then((sentence) => getReviewItemsForSentence(sentence, userLearningData));
    } else if (item.type === "conversation") {
      return ConversationModel.findById(item._id)
        .populate("multiLingualSentences")
        .then((conversation) => getReviewItemsForConversation(conversation, userLearningData));
    }
  } else return [];
}

async function getStoryReviewItems(userLearningData, targetLanguage) {
  if (userLearningData.story) {
    return StoryNodeModel.findById(userLearningData.nextStoryNodeId)
      .populate([sourceLanguage].prerequisites, [targetLanguage].prerequisites)
      .then((storyNode) => getReviewItemsForStory(storyNode));
  } else return [];
}

async function getLateReviewWords(reviewWords, targetLanguage) {
  const n = 10;
  const nRecentLateWordIds = reviewWords
    .filter((word) => word.nextReviewDate < new Date())
    .sort((a, b) => new Date(b.nextReviewDate) - new Date(a.nextReviewDate)) // descending order
    .slice(0, n)
    .map(({ _id }) => _id);
  return LexicalItemModel.find({ _id: { $in: nRecentLateWordIds } }).select({
    _id: 1,
    sourceLanguage: 1,
    text: 1,
    [targetLanguage]: 1,
    tags: 1,
  });
}

async function getReviewItemsForWords(words, userLearningData) {
  return words.reduce((acc, word) => {
    completeWordWithSentenceAndConversation(acc, word, userLearningData);
  }, []);
}

async function completeWordWithSentenceAndConversation(reviewItems, word, userLearningData) {
  const sentenceItems = Promise.resolve(chooseSentence(word, userLearningData)).then((sentence) =>
    sentence ? [...getReviewItemsForSentence(sentence, userLearningData), sentence] : []
  );
  const conversationItems = Promise.resolve(chooseConversation(word, userLearningData)).then((conversation) =>
    conversation ? [...getReviewItemsForConversation(conversation._id, userLearningData), conversation] : []
  );
  return Promise.all([sentenceItems, conversationItems]).then(([sentenceItems, conversationItems]) =>
    removeDuplicateWords(reviewItems, word, sentenceItems, sentence, conversationItems, conversation)
  );
}

async function chooseSentence(word, userLearningData) {
  return (
    (userLearningData.credits > 0 && (await getNewButEasySentence(word, userLearningData))) ||
    (await getKnownButOldSentence(word, userLearningData))
  );
}

async function chooseConversation(word, userLearningData) {
  return (
    (userLearningData.credits > 0 && (await getNewButEasyConversation(word, userLearningData))) ||
    (await getKnownButOldConversation(word, userLearningData))
  );
}

async function getNewButEasySentence(word, userLearningData) {
  const sentences = await SentenceModel.find({ prerequisites: [word._id] }).populate("prerequisites");
  let chosenSentence, difficulty;
  sentences.forEach((sentence) => {
    const sentenceDifficulty = getDifficulty(sentence.prerequisites, userLearningData.words);
    if (
      !userLearningData.sentences.find((_id) => _id === sentence._id) &&
      (difficulty === undefined || sentenceDifficulty < difficulty)
    ) {
      difficulty = sentenceDifficulty;
      chosenSentence = sentence;
    }
  });
  return chosenSentence;
}

async function getNewButEasyConversation(word, userLearningData) {
  const conversations = await ConversationModel.find({ prerequisites: [word._id] }).populate("prerequisites");
  let chosenConversation, difficulty;
  conversations.forEach((conversation) => {
    const conversationDifficulty = getDifficulty(conversation.prerequisites, userLearningData.words);
    if (
      !userLearningData.conversations.find((_id) => _id === conversation._id) &&
      (difficulty === undefined || conversationDifficulty < difficulty)
    ) {
      difficulty = conversationDifficulty;
      chosenConversation = conversation;
    }
  });
  return chosenConversation;
}

async function getKnownButOldSentence(word, userLearningData) {
  const sentences = await SentenceModel.find({ prerequisites: [word._id] });
  let oldSentence, oldDate;
  sentences.forEach((sentence) => {
    const userSentence = userLearningData.sentences.find((userSentence) => userSentence._id === sentence._id);
    if (new Date(userSentence.lastReviewDate) < oldDate) {
      oldDate = new Date(userSentence.lastReviewDate);
      oldSentence = sentence;
    }
  });
  return oldSentence;
}

async function getKnownButOldConversation(word, userLearningData) {
  const conversations = await ConversationModel.find({ prerequisites: [word._id] });
  let oldConversation, oldDate;
  conversations.forEach((conversation) => {
    const userConversation = userLearningData.conversations.find(
      (userConversation) => userConversation._id === conversation._id
    );
    if (new Date(userConversation.lastReviewDate) < oldDate) {
      oldDate = new Date(userConversation.lastReviewDate);
      oldConversation = conversation;
    }
  });
  return oldConversation;
}

function getDifficulty(words, userLearningDataWords) {
  return words.reduce((acc, value) => {
    const wordDifficulty = userLearningDataWords.find((word) => word._id === value._id) ? 0 : value.difficulty || 1;
    return acc + wordDifficulty;
  }, 0);
}

function removeDuplicateWords(reviewItems, word, sentenceWords, sentence, conversationWords, conversation) {
  reviewItems.push({ type: "word", data: word });
  reviewItems = sentenceWords.reduce((acc, value) => addWithoutDuplicate(acc, value), reviewItems);
  if (sentence) reviewItems.push({ type: "sentence", data: sentence });
  reviewItems = conversationWords.reduce((acc, value) => addWithoutDuplicate(acc, value), reviewItems);
  if (conversation) reviewItems.push({ type: "conversation", data: conversation });
  return reviewItems;
}

function addWithoutDuplicate(reviewItems, word) {
  if (
    !reviewItems
      .filter(({ type }) => type === "word")
      .map(({ data: { _id } }) => _id)
      .includes(word._id)
  ) {
    reviewItems.push({ type: "word", data: word });
  }
}

async function getReviewItemsForSentence(sentence, userLearningData) {
  const targetLanguage = userLearningData.language.split("-")[1];
  return LexicalItemModel.find({ _id: { $in: sentence.prerequisites } })
    .select({
      _id: 1,
      sourceLanguage: 1,
      text: 1,
      [targetLanguage]: 1,
      tags: 1,
    })
    .lean()
    .then((words) =>
      words.filter((word) => !userLearningData.words.includes(word._id)).map((word) => ({ type: "word", data: word }))
    )
    .then((reviewItems) => [...reviewItems, { type: "sentence", data: sentence }]);
}

async function getReviewItemsForConversation(conversation, userLearningData) {
  const targetLanguage = userLearningData.language.split("-")[1];
  const sentenceIds = conversation.multiLingualSentences.map(
    (multiLingualSentence) => multiLingualSentence[targetLanguage]
  );
  const words = await SentenceModel.find({ _id: { $in: sentenceIds } })
    .populate("prerequisites")
    .select({ prerequisites: 1 })
    .lean()
    .then((wordArrays) =>
      wordArrays
        .flat()
        .filter((word) => !userLearningData.words.includes(word._id))
        .map(({ _id, sourceLanguage, text, [targetLanguage]: translation, tags }) => ({
          type: "word",
          data: { _id, sourceLanguage, text, [targetLanguage]: translation, tags },
        }))
    );
  const reviewItems = words.reduce((acc, value) => addWithoutDuplicate(acc, value), []);

  return [...reviewItems, { type: "conversation", data: conversation }];
}

async function getReviewItemsForStory(storyNode, userLearningData) {
  const targetLanguage = userLearningData.language.split("-")[1];
  return LexicalItemModel.find({ _id: { $in: storyNode[targetLanguage].prerequisites } })
    .select({
      _id: 1,
      sourceLanguage: 1,
      text: 1,
      [targetLanguage]: 1,
      tags: 1,
    })
    .lean()
    .then((words) =>
      words.filter((word) => !userLearningData.words.includes(word._id)).map((word) => ({ type: "word", data: word }))
    )
    .then((reviewItems) => [...reviewItems, { type: "storyNode", data: storyNode }]);
}
