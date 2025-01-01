import { Schema, model } from "mongoose";

const languageSchema = new Schema({
  _id: Schema.Types.ObjectId,
  label: { type: String, required: true },
  flag: {
    data: Buffer,
    contentType: String, //Todo Make compatible with svg
  },
});
export const LanguageModel = model("Language", languageSchema);

const wordTagSchema = new Schema({
  _id: Schema.Types.ObjectId,
  language: { type: Schema.Types.ObjectId, ref: "Language", required: true, index: true },
  label: { type: String, required: true },
});
export const WordTagModel = model("WordTag", wordTagSchema);

const ConversationTagSchema = new Schema({
  _id: Schema.Types.ObjectId,
  labels: [
    {
      language: { type: Schema.Types.ObjectId, ref: "Language", required: true, index: true },
      label: { type: String, required: true },
    },
  ],
});
export const ConversationTagModel = model("ConversationTag", ConversationTagSchema);

const userSchema = new Schema({
  _id: Schema.Types.ObjectId,
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, select: false },
  lastCourseId: { type: String },
  courses: [{ type: Schema.Types.ObjectId, ref: "UserCourse" }],
});
export const UserModel = model("User", userSchema);

const UserCourseSchema = new Schema({
  _id: Schema.Types.ObjectId,
  sourceLanguage: { type: Schema.Types.ObjectId, ref: "Language", required: true },
  targetLanguage: { type: Schema.Types.ObjectId, ref: "Language", required: true },
  wishListConversations: [{ type: Schema.Types.ObjectId, ref: "MultiLingualConversation" }],
  story: { type: Schema.Types.ObjectId, ref: "Story" },
  nextStoryNode: { type: Schema.Types.ObjectId, ref: "StoryNode" },
  words: [
    {
      _id: { type: Schema.Types.ObjectId, ref: "LexicalItem", required: true },
      nextReviewDate: { type: Date, index: true },
      reviewDelayInMs: Number,
    },
  ],
  conversations: [
    {
      _id: { type: Schema.Types.ObjectId, ref: "MultiLingualConversation", required: true },
      lastReviewDate: { type: Date, index: true },
    },
  ],
});

export const UserCourseModel = model("UserCourse", UserCourseSchema);

const StorySchema = new Schema({
  _id: Schema.Types.ObjectId,
  title: { type: String },
  language: { type: Schema.Types.ObjectId, ref: "Language", required: true },
  nodes: [{ type: Schema.Types.ObjectId, ref: "StoryNode" }],
});
export const StoryModel = model("Story", StorySchema);

const StoryNodeSchema = new Schema({
  _id: Schema.Types.ObjectId,
  title: { type: String },
  text: { type: String },
  prerequisites: [{ type: Schema.Types.ObjectId, ref: "LexicalItem" }],
  nextIds: [{ type: Schema.Types.ObjectId, ref: "StoryNode" }],
});
export const StoryNodeModel = model("StoryNode", StoryNodeSchema);

const LexicalItemSchema = new Schema({
  _id: Schema.Types.ObjectId,
  sourceLanguage: {
    required: true,
    type: Schema.Types.ObjectId,
    ref: "Language",
    index: true,
  },
  tags: [{ type: Schema.Types.ObjectId, ref: "Tag" }],
  text: String,
  translations: [
    {
      language: { type: Schema.Types.ObjectId, ref: "Language", required: true },
      lexicalItems: [{ type: Schema.Types.ObjectId, ref: "LexicalItem" }],
    },
  ],
});
export const LexicalItemModel = model("LexicalItem", LexicalItemSchema);

const MultiLingualConversationSchema = new Schema({
  _id: Schema.Types.ObjectId,
  conversations: [
    {
      language: { type: Schema.Types.ObjectId, ref: "Language", required: true, index: true },
      tags: [{ type: Schema.Types.ObjectId, ref: "Tag", index: true }],
      sentences: [
        {
          _id: Schema.Types.ObjectId,
          text: String,
          prerequisites: [{ type: Schema.Types.ObjectId, ref: "LexicalItem", index: true }],
        },
      ],
    },
  ],
});
export const MultiLingualConversationModel = model("MultiLingualConversation", MultiLingualConversationSchema);
