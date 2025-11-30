import auth from "../middleware/auth.js";
import cache from "../middleware/cache.js";
import { validateFeedback, validateFeedbackQuery } from "../middleware/validation.js";
import { FeedbackModel, UserModel } from "../models.js";
import sanitizeHtml from "sanitize-html";
import express from "express";
const router = express.Router();

router.post("/", auth, cache, validateFeedback, async (req, res) => {
  try {
    const { comment, pageUrl } = req.body;

    //Sanitize to avoid XSS
    const cleanComment = sanitizeHtml(comment);
    const cleanPageUrl = sanitizeHtml(pageUrl);

    //Prevent NoSQL injection by NEVER allowing objects in user input:
    if ((cleanComment && typeof cleanComment === "object") || (cleanPageUrl && typeof cleanPageUrl === "object")) {
      return res.status(400).json({ error: "Invalid input" });
    }

    const feedback = new FeedbackModel({ comment: cleanComment, pageUrl: cleanPageUrl, userId: req.user._id });
    await feedback.save();
    res.status(201).json({ message: "Feedback saved" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// GET all feedbacks (admin only) with pagination
router.get("/", auth, validateFeedbackQuery, async (req, res) => {
  try {
    // Check if user is admin
    const user = await UserModel.findById(req.user._id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Access denied. Admin privileges required." });
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Get total count and paginated feedbacks
    const [feedbacks, totalCount] = await Promise.all([
      FeedbackModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      FeedbackModel.countDocuments(),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.status(200).json({
      success: true,
      data: feedbacks,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

export default router;
