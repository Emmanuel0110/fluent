import auth from "../middleware/auth.js";
import cache from "../middleware/cache.js";
import { MultiLingualConversationModel } from "../models.js";
import express from "express";
import mongoose from "mongoose";
const router = express.Router();

router.get("/", auth, cache, async (req, res) => {
  try {
    const { tag, wordId } = req.query;
    const userConversations = req.userLearningData.conversations;
    if (tag) {
      const conversations = await MultiLingualConversationModel.find({ tags: { $in: [tag] } }).lean();
      res.json({ success: true, data: completeConversations(conversations, userConversations) });
    } else if (wordId) {
      const conversation = await MultiLingualConversationModel.findById(wordId);
      const completedConversation = {
        ...conversation,
        subscribed: !!userConversations.find(({ _id }) => _id === conversation._id),
      };
      res.json({ success: true, data: completedConversation });
    }
  } catch (err) {
    console.log(err);
  }
});

router.post("/", auth, async (req, res) => {
  try {
    const newConversation = new MultiLingualConversationModel({ ...req.body, _id: new mongoose.Types.ObjectId() });
    newConversation.save().then((newConversation) => res.json({ success: true, data: {...newConversation, subscribed: false} }));
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
    { $push: { ids: { $each: conversations } } },
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
    subscribed: !!userConversations.find((userConversation) => userConversation._id === conversation._id),
  }));
}

export default router;
