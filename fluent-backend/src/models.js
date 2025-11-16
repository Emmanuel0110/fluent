import { Schema, model } from "mongoose";

const languageSchema = new Schema({
  label: { type: String, required: true },
  flag: {
    data: Buffer,
    contentType: String, //Todo Make compatible with svg
  },
});
export const LanguageModel = model("Language", languageSchema);

const wordTagSchema = new Schema({
  language: { type: Schema.Types.ObjectId, ref: "Language", required: true, index: true },
  label: { type: String, required: true },
});
export const WordTagModel = model("WordTag", wordTagSchema);

const ConversationTagSchema = new Schema({
  labels: [
    {
      language: { type: Schema.Types.ObjectId, ref: "Language", required: true, index: true },
      label: { type: String, required: true },
    },
  ],
});
export const ConversationTagModel = model("ConversationTag", ConversationTagSchema);

const userSchema = new Schema({
  isAdmin: { type: Boolean, default: false },
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, select: false }, // Made optional for OAuth users
  email: { type: String, trim: true }, // For OAuth users
  oauthProvider: { type: String, enum: ["google", "linkedin", "facebook"] }, // Track OAuth provider
  oauthId: { type: String }, // OAuth provider user ID
  lastCourseId: { type: Schema.Types.ObjectId, ref: "UserCourse" },
  courses: [{ type: Schema.Types.ObjectId, ref: "UserCourse" }],
  userSettings: {
    reviewMode: { type: String, enum: ["auto", "manual"], default: "manual" },
    autoReviewDelay: { type: Number, default: 10 },
  },
});
// Compound index for OAuth lookup
userSchema.index({ oauthProvider: 1, oauthId: 1 }, { unique: true, sparse: true });

// Validate password is required for non-OAuth users
userSchema.pre("validate", function (next) {
  if (!this.oauthProvider && !this.password) {
    this.invalidate("password", "Password is required for non-OAuth users");
  }
  next();
});
export const UserModel = model("User", userSchema);

const UserCourseSchema = new Schema({
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
      numberOfSentencesUsedIn: Number,
    },
  ],
  conversations: [
    {
      _id: { type: Schema.Types.ObjectId, ref: "MultiLingualConversation", required: true },
      lastReviewDate: { type: Date, index: true },
    },
  ],
  score: { type: Number, default: 0 },
  dailyScores: [
    {
      _id: false,
      date: { type: Date, default: Date.now },
      score: Number,
    },
  ],
});

export const UserCourseModel = model("UserCourse", UserCourseSchema);

const StorySchema = new Schema({
  title: { type: String },
  language: { type: Schema.Types.ObjectId, ref: "Language", required: true },
  nodes: [{ type: Schema.Types.ObjectId, ref: "StoryNode" }],
});
export const StoryModel = model("Story", StorySchema);

const StoryNodeSchema = new Schema({
  title: { type: String },
  text: { type: String },
  prerequisites: [{ type: Schema.Types.ObjectId, ref: "LexicalItem" }],
  nextIds: [{ type: Schema.Types.ObjectId, ref: "StoryNode" }],
});
export const StoryNodeModel = model("StoryNode", StoryNodeSchema);

const LexicalItemSchema = new Schema(
  {
    language: {
      required: true,
      type: Schema.Types.ObjectId,
      ref: "Language",
      index: true,
    },
    tags: [{ type: Schema.Types.ObjectId, ref: "WordTag" }],
    text: { type: String, required: true },
    translations: [
      {
        _id: false,
        language: { type: Schema.Types.ObjectId, ref: "Language", required: true },
        lexicalItems: [{ type: Schema.Types.ObjectId, ref: "LexicalItem" }],
      },
    ],
    level: Number,
  },
  { timestamps: true }
);
export const LexicalItemModel = model("LexicalItem", LexicalItemSchema);

const MultiLingualConversationSchema = new Schema({
  tags: [{ type: Schema.Types.ObjectId, ref: "ConversationTag", index: true }],
  conversations: [
    {
      _id: false,
      language: { type: Schema.Types.ObjectId, ref: "Language", required: true, index: true },
      sentences: [
        {
          _id: false,
          text: String,
          prerequisites: [{ type: Schema.Types.ObjectId, ref: "LexicalItem", index: true }],
        },
      ],
    },
  ],
});
export const MultiLingualConversationModel = model("MultiLingualConversation", MultiLingualConversationSchema);

const FeedbackSchema = new Schema({
  comment: { type: String, required: true, maxlength: 4000, trim: true },
  pageUrl: { type: String, required: true, maxlength: 4000, trim: true },
  userId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const FeedbackModel = model("Feedback", FeedbackSchema);
