/**
 * Fill the speech cache for the whole corpus, so learners never wait for a
 * synthesis round trip and the audio survives a cold cache.
 *
 * Already-cached sentences are skipped, which makes the script cheap to re-run
 * after adding content — only the new sentences cost quota.
 *
 *   npm run pregenerate-tts -- --dry-run          # count characters, call nothing
 *   npm run pregenerate-tts -- --language ko      # one language only
 *   npm run pregenerate-tts                       # everything
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { LanguageModel, MultiLingualConversationModel, LexicalItemModel } from "../models.js";
import { getSpeechFile, isConfigured, SUPPORTED_LANGUAGES } from "../services/googleTts.js";
import { logger } from "../logger.js";

/** Every distinct string to speak, per language label. */
async function collectTexts(languageFilter) {
  const languages = await LanguageModel.find().lean();
  const byLanguage = new Map();

  for (const language of languages) {
    const label = language.label;
    if (!SUPPORTED_LANGUAGES.includes(label)) continue;
    if (languageFilter && label !== languageFilter) continue;

    const texts = new Set();

    const conversations = await MultiLingualConversationModel.find({
      "conversations.language": language._id,
    }).lean();
    for (const conversation of conversations) {
      for (const block of conversation.conversations) {
        if (String(block.language) !== String(language._id)) continue;
        for (const sentence of block.sentences) {
          if (sentence.text?.trim()) texts.add(sentence.text.trim());
        }
      }
    }

    const lexicalItems = await LexicalItemModel.find({ language: language._id }, { text: 1 }).lean();
    for (const item of lexicalItems) {
      if (item.text?.trim()) texts.add(item.text.trim());
    }

    byLanguage.set(label, [...texts]);
  }

  return byLanguage;
}

const MAX_ATTEMPTS = 4;

/** Retries a synthesis a few times, pausing 1s, 2s then 4s — Google throttles bursts. */
async function withRetries(run) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await run();
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** (attempt - 1)));
    }
  }
}

export async function pregenerateTts({ dryRun = false, language = null } = {}) {
  const byLanguage = await collectTexts(language);

  for (const [label, texts] of byLanguage) {
    const characters = texts.reduce((total, text) => total + text.length, 0);

    if (dryRun) {
      logger.info({ language: label, texts: texts.length, characters }, "[DRY RUN] Would synthesize");
      continue;
    }

    logger.info({ language: label, texts: texts.length, characters }, "Pregenerating speech");
    let synthesized = 0;
    let failed = 0;

    // Sequential on purpose: the corpus is small and this keeps the request rate low.
    // Google still rejects a share of the calls under sustained load (~14% on a cold
    // cache), so each text gets a few attempts with a growing pause before giving up.
    for (const [index, text] of texts.entries()) {
      try {
        await withRetries(() => getSpeechFile(text, label));
        synthesized++;
      } catch (error) {
        failed++;
        logger.error({ err: error, language: label, text }, "Failed to synthesize");
      }
      if ((index + 1) % 50 === 0) {
        logger.info({ language: label, done: index + 1, total: texts.length }, "Progress");
      }
    }

    logger.info({ language: label, synthesized, failed }, "Language complete");
  }
}

// CLI entry point: only when executed directly, so importing it in a test or
// another script does not connect to the database.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  // Only when run as a command: an importing caller (the content-generation
  // macros) loads its own .env from its own location before importing this.
  dotenv.config();

  const dryRun = process.argv.includes("--dry-run");
  const languageIndex = process.argv.indexOf("--language");
  const language = languageIndex === -1 ? null : process.argv[languageIndex + 1];

  if (language && !SUPPORTED_LANGUAGES.includes(language)) {
    logger.error({ language, supported: SUPPORTED_LANGUAGES }, "Unsupported language");
    process.exit(1);
  }
  if (!dryRun && !isConfigured()) {
    logger.error("Google TTS is not configured (set GOOGLE_TTS_API_KEY)");
    process.exit(1);
  }

  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(
      `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}.mongodb.net/${process.env.MONGO_DBNAME}?retryWrites=true&w=majority`,
    );
    await pregenerateTts({ dryRun, language });
  } catch (err) {
    logger.error({ err }, "Pregeneration failed");
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
    } catch (e) {
      logger.error({ err: e }, "Error closing MongoDB connection");
    }
    process.exit();
  }
}
