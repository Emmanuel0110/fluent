import express from "express";
import auth from "../middleware/auth.js";
import { validateTtsRequest } from "../middleware/validation.js";
import { getCachedFile, getSpeechFile, isConfigured } from "../services/googleTts.js";
import { logger } from "../logger.js";

const router = express.Router();

/**
 * Returns the path of the mp3 for a sentence, synthesizing it on first use.
 * The audio itself is served statically from /tts, so replaying a sentence hits
 * the browser cache and never comes back here.
 */
router.post("/", auth, validateTtsRequest, async (req, res, next) => {
  try {
    const { language } = req.body;
    const text = req.body.text.trim();

    // Cache first, credentials second: production runs on a pregenerated cache and
    // deliberately holds no API key, so only an unknown sentence needs one.
    let fileName = await getCachedFile(text, language);
    if (!fileName) {
      if (!isConfigured()) {
        return res.status(503).json({ success: false, message: "Text-to-speech is not configured" });
      }
      fileName = await getSpeechFile(text, language);
    }

    res.json({ success: true, data: { url: `/tts/${fileName}` } });
  } catch (error) {
    logger.error({ err: error, language: req.body?.language }, "Text-to-speech failed");
    next(error);
  }
});

export default router;
