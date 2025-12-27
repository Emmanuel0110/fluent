import auth from "../middleware/auth.js";
import cache from "../middleware/cache.js";
import {
  validateConversationQuery,
  validateConversationCreate,
  validateConversationUpdate,
} from "../middleware/validation.js";
import { sanitizeObject } from "../utils/sanitize.js";
import { MultiLingualConversationModel } from "../models.js";
import express from "express";
import mongoose from "mongoose";
import { getConversationsForWords } from "./reviewControlers.js";
const router = express.Router();

router.get("/", auth, cache, validateConversationQuery, async (req, res) => {
  const MAX_NUMBER_OF_CONVERSATIONS = 10;
  try {
    const { tag, conversationId, wordId } = req.query;
    const { conversations: userConversations, sourceLanguage, targetLanguage } = req.userLearningData;
    if (tag) {
      const conversations = await MultiLingualConversationModel.find({ tags: { $in: [tag] } }).lean();
      res.json({ success: true, data: completeConversations(conversations, userConversations) });
    } else if (conversationId) {
      const conversation = await MultiLingualConversationModel.findById(conversationId);
      if (!conversation) {
        res.json({ success: false, message: "Conversation not found" });
        return;
      }
      const completedConversation = {
        ...conversation,
        subscribed: !!userConversations.find(({ _id }) => _id === conversation._id),
      };
      res.json({ success: true, data: completedConversation });
    } else if (wordId) {
      const conversations = await getConversationsForWords([wordId], req.userLearningData);
      res.json({
        success: true,
        data: completeConversations(conversations.slice(0, MAX_NUMBER_OF_CONVERSATIONS), userConversations),
      });
    } else {
      const allConversations = await MultiLingualConversationModel.find().lean();
      const conversations = allConversations
        .map(onlyKeepLanguages(sourceLanguage, targetLanguage))
        .filter((doc) => doc.conversations.length > 0);

      res.json({ success: true, data: completeConversations(conversations, userConversations) });
    }
  } catch (err) {
    console.log(err);
  }
});

function onlyKeepLanguages(sourceLanguage, targetLanguage) {
  return function (conversation) {
    return {
      ...conversation,
      conversations: conversation.conversations.filter(({ language }) =>
        [sourceLanguage.toString(), targetLanguage.toString()].includes(language.toString())
      ),
    };
  };
}

router.post("/", auth, validateConversationCreate, async (req, res) => {
  try {
    // Sanitize all text fields in conversations (sentences text)
    const sanitizedBody = sanitizeObject(req.body);
    const newConversation = new MultiLingualConversationModel(sanitizedBody);
    newConversation
      .save()
      .then((newConversation) => res.json({ success: true, data: { ...newConversation, subscribed: false } }));
  } catch (err) {
    console.log("save error ", err);
    if (err.name === "MongoError" && err.code === 11000) {
      res.json({ success: false, message: "already exists" });
      return;
    }
    res.json({ success: false, message: "some error happened" });
    return;
  }
});

router.put("/:id", auth, cache, validateConversationUpdate, async function (req, res) {
  const { id: _id } = req.params;
  const filter = { _id };
  const { tags, conversations } = req.body;

  // Sanitize conversation sentences text
  const sanitizedConversations = conversations ? sanitizeObject(conversations) : conversations;
  await MultiLingualConversationModel.updateOne(filter, { tags });
  await MultiLingualConversationModel.updateOne(filter, {
    $pull: {
      conversations: { language: { $in: [req.userLearningData.sourceLanguage, req.userLearningData.targetLanguage] } },
    },
  });
  const conversation = await MultiLingualConversationModel.findOneAndUpdate(
    filter,
    { $push: { conversations: { $each: sanitizedConversations } } },
    { new: true }
  ).lean();
  const completedConversation = {
    ...conversation,
    subscribed: !!req.userLearningData.conversations.find(({ _id }) => _id === conversation._id),
  };
  res.json({ success: true, data: completedConversation });
});

function completeConversations(conversations, userConversations) {
  return conversations.map((conversation) => ({
    ...conversation,
    subscribed: !!userConversations.find((userConversation) =>
      new mongoose.Types.ObjectId(userConversation._id).equals(conversation._id)
    ),
  }));
}

export default router;
