import auth from "../middleware/auth.js";
import cache from "../middleware/cache.js";
import { FeedbackModel } from "../models.js";
import sanitizeHtml from "sanitize-html";
import express from "express";
const router = express.Router();

router.post("/", auth, cache, async (req, res) => {
  try {
    const { comment, pageUrl } = req.body;

    if (typeof comment !== "string" || typeof pageUrl !== "string") {
      return res.status(400).json({ error: "Invalid input type" });
    }

    if (comment.length > 4000 || pageUrl.length > 4000) {
      return res.status(400).json({ error: "Message too long" });
    }

    //Sanitize to avoid XSS
    const cleanComment = sanitizeHtml(comment);
    const cleanPageUrl = sanitizeHtml(pageUrl);

    //Prevent NoSQL injection by NEVER allowing objects in user input:
    if ((cleanComment && typeof cleanComment === "object") || (cleanPageUrl && typeof cleanPageUrl === "object")) {
      return res.status(400).json({ error: "Invalid input" });
    }

    if (!cleanComment || !cleanPageUrl) return res.status(400).json({ message: "Comment and pageUrl are required" });

    const feedback = new FeedbackModel({ comment: cleanComment, pageUrl: cleanPageUrl, userId: req.user._id });
    await feedback.save();
    res.status(201).json({ message: "Feedback saved" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

export default router;
