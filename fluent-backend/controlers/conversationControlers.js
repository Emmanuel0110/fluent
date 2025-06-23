import auth from "../middleware/auth.js";
import cache from "../middleware/cache.js";
import { MultiLingualConversationModel } from "../models.js";
import express from "express";
import mongoose from "mongoose";
import { getConversationsForWords } from "./reviewControlers.js";
const router = express.Router();

router.get("/", auth, cache, async (req, res) => {
  const MAX_NUMBER_OF_CONVERSATIONS = 10;
  try {
    const { tag, conversationId, wordId } = req.query;
    const userConversations = req.userLearningData.conversations;
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
      const conversations = await MultiLingualConversationModel.find().lean();
      res.json({ success: true, data: completeConversations(conversations, userConversations) });
    }
  } catch (err) {
    console.log(err);
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const newConversation = new MultiLingualConversationModel(req.body);
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

router.put("/:id", auth, cache, async function (req, res) {
  const { id: _id } = req.params;
  const filter = { _id };
  const { tags, conversations } = req.body;
  await MultiLingualConversationModel.updateOne(filter, { tags });
  await MultiLingualConversationModel.updateOne(filter, {
    $pull: {
      conversations: { language: { $in: [req.userLearningData.sourceLanguage, req.userLearningData.sourceLanguage] } },
    },
  });
  const conversation = await MultiLingualConversationModel.findOneAndUpdate(
    filter,
    { $push: { conversations: { $each: conversations } } },
    { new: true }
  );
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
