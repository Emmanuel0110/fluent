import auth from "../middleware/auth.js";
import cache from "../middleware/cache.js";
import { FeedbackModel } from "../models.js";
import express from "express";
const router = express.Router();

router.post("/", auth, cache, async (req, res) => {
  try {
    const { comment, pageUrl } = req.body;

    if (!comment || !pageUrl) return res.status(400).json({ message: "Comment and pageUrl are required" });

    const feedback = new FeedbackModel({ comment, pageUrl, userId: req.user._id });
    await feedback.save();

    res.status(201).json({ message: "Feedback saved" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

export default router;
