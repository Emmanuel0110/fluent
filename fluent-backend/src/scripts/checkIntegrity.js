/**
 * Referential integrity audit. MongoDB does not enforce refs, so a deleted
 * LexicalItem or conversation leaves dangling ObjectIds behind — invisible until
 * something renders them. This job only *detects and logs*; it never writes.
 *
 * Assumes an active mongoose connection (safe to call from the in-app scheduler).
 * Run manually with `npm run check-integrity`.
 */
import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import { MultiLingualConversationModel, LexicalItemModel, UserCourseModel } from "../models.js";
import { logger } from "../logger.js";

dotenv.config();

export async function checkReferentialIntegrity() {
  const [conversations, courses] = await Promise.all([
    MultiLingualConversationModel.find().select("conversations").lean(),
    UserCourseModel.find().select("words conversations wishListConversations dismissedSuggestions").lean(),
  ]);

  const conversationIds = new Set(conversations.map((c) => String(c._id)));

  // every lexical item id referenced anywhere
  const referenced = new Set();
  conversations.forEach((c) =>
    c.conversations.forEach((s) =>
      s.sentences.forEach((sent) => (sent.prerequisites || []).forEach((p) => referenced.add(String(p)))),
    ),
  );
  courses.forEach((u) => (u.words || []).forEach((w) => referenced.add(String(w._id))));

  const existing = await LexicalItemModel.find({ _id: { $in: [...referenced] } })
    .select("_id")
    .lean();
  const existingIds = new Set(existing.map((i) => String(i._id)));

  const danglingPrerequisites = [];
  conversations.forEach((c) =>
    c.conversations.forEach((s) =>
      s.sentences.forEach((sent, idx) =>
        (sent.prerequisites || []).forEach((p) => {
          if (!existingIds.has(String(p)))
            danglingPrerequisites.push({ conversation: String(c._id), sentenceIndex: idx, text: sent.text, lexicalItem: String(p) });
        }),
      ),
    ),
  );

  const danglingReviewWords = [];
  const danglingCourseConversations = [];
  courses.forEach((u) => {
    (u.words || []).forEach((w) => {
      if (!existingIds.has(String(w._id))) danglingReviewWords.push({ course: String(u._id), lexicalItem: String(w._id) });
    });
    for (const field of ["conversations", "wishListConversations", "dismissedSuggestions"]) {
      (u[field] || []).forEach((ref) => {
        const id = String(ref && ref._id ? ref._id : ref);
        if (!conversationIds.has(id)) danglingCourseConversations.push({ course: String(u._id), field, conversation: id });
      });
    }
  });

  const total = danglingPrerequisites.length + danglingReviewWords.length + danglingCourseConversations.length;

  if (total === 0) {
    logger.info("Referential integrity check passed: no dangling references");
  } else {
    logger.warn(
      {
        danglingPrerequisites: danglingPrerequisites.length,
        danglingReviewWords: danglingReviewWords.length,
        danglingCourseConversations: danglingCourseConversations.length,
      },
      "Referential integrity check found dangling references",
    );
    danglingPrerequisites.forEach((d) => logger.warn(d, "Dangling prerequisite -> LexicalItem"));
    danglingReviewWords.forEach((d) => logger.warn(d, "Dangling UserCourse.words -> LexicalItem"));
    danglingCourseConversations.forEach((d) => logger.warn(d, "Dangling UserCourse -> MultiLingualConversation"));
  }

  return { danglingPrerequisites, danglingReviewWords, danglingCourseConversations, total };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(
      `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}.mongodb.net/${process.env.MONGO_DBNAME}?retryWrites=true&w=majority`,
    );
    const { total } = await checkReferentialIntegrity();
    process.exitCode = total === 0 ? 0 : 1;
  } catch (err) {
    logger.error(err, "Integrity check failed");
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
