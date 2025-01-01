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
      const completedConversations = conversations.map((conversation) => ({
        ...conversation,
        subscribed: !!userConversations.find(({ _id }) => _id === conversation._id),
      }));
      res.json({ success: true, data: completedConversations });
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
    newConversation.save().then((newConversation) => res.json({ success: true, data: newConversation }));
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

router.patch("/:id", auth, function (req, res) {
  const { id: _id } = req.params;
  const filter = { _id };
  MultiLingualConversationModel.updateOne(filter, req.body).then((data) => res.json({ success: true, data }));
});

export default router;
