import { body, param, query, validationResult } from "express-validator";
import mongoose from "mongoose";

// Middleware to handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const isProduction = process.env.NODE_ENV === "production";
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
        // Don't expose actual values in production (could contain sensitive data)
        ...(isProduction ? {} : { value: err.value }),
      })),
    });
  }
  next();
};

// Helper to validate MongoDB ObjectId
const isValidObjectId = (value) => {
  if (!value) return false;
  return mongoose.Types.ObjectId.isValid(value);
};

// User validation rules
export const validateRegister = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username can only contain letters, numbers, and underscores"),
  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  handleValidationErrors,
];

export const validateLogin = [
  body("username").trim().notEmpty().withMessage("Username is required"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

export const validateUpdateLanguages = [
  body("sourceLanguage")
    .notEmpty()
    .withMessage("Source language is required")
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error("Source language must be a valid ObjectId");
      }
      return true;
    }),
  body("targetLanguage")
    .notEmpty()
    .withMessage("Target language is required")
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error("Target language must be a valid ObjectId");
      }
      return true;
    }),
  handleValidationErrors,
];

export const validateUserSettings = [
  body("reviewMode").optional().isIn(["manual", "auto"]).withMessage("Review mode must be either 'manual' or 'auto'"),
  body("autoReviewDelay")
    .optional()
    .isInt({ min: 0, max: 10080 })
    .withMessage("Auto review delay must be a number between 0 and 10080 minutes"),
  handleValidationErrors,
];

export const validateOAuthCallback = [
  body("code").notEmpty().withMessage("Authorization code is required").isString().withMessage("Code must be a string"),
  handleValidationErrors,
];

// Feedback validation rules
export const validateFeedback = [
  body("comment")
    .trim()
    .notEmpty()
    .withMessage("Comment is required")
    .isLength({ max: 4000 })
    .withMessage("Comment must not exceed 4000 characters")
    .isString()
    .withMessage("Comment must be a string"),
  body("pageUrl")
    .trim()
    .notEmpty()
    .withMessage("Page URL is required")
    .isLength({ max: 4000 })
    .withMessage("Page URL must not exceed 4000 characters")
    .isURL({ require_protocol: true, require_tld: false })
    .withMessage("Page URL must be a valid URL"),
  handleValidationErrors,
];

export const validateFeedbackQuery = [
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer").toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100").toInt(),
  handleValidationErrors,
];

// User Course validation rules
export const validateUpdateLearningData = [
  body("conversationToSubscribe")
    .optional()
    .custom((value) => {
      if (value && !isValidObjectId(value)) {
        throw new Error("Conversation ID must be a valid ObjectId");
      }
      return true;
    }),
  body("conversationToUnsubscribe")
    .optional()
    .custom((value) => {
      if (value && !isValidObjectId(value)) {
        throw new Error("Conversation ID must be a valid ObjectId");
      }
      return true;
    }),
  body("reviewedConversationId")
    .optional()
    .custom((value) => {
      if (value && !isValidObjectId(value)) {
        throw new Error("Conversation ID must be a valid ObjectId");
      }
      return true;
    }),
  body("success").optional().isBoolean().withMessage("Success must be a boolean value"),
  body().custom((value) => {
    const hasConversationToSubscribe = !!value.conversationToSubscribe;
    const hasConversationToUnsubscribe = !!value.conversationToUnsubscribe;
    const hasReviewedConversationId = !!value.reviewedConversationId;

    if (!hasConversationToSubscribe && !hasConversationToUnsubscribe && !hasReviewedConversationId) {
      throw new Error(
        "At least one of conversationToSubscribe, conversationToUnsubscribe, or reviewedConversationId must be provided"
      );
    }

    // If reviewedConversationId is provided, success should also be provided
    if (hasReviewedConversationId && value.success === undefined) {
      throw new Error("Success field is required when reviewedConversationId is provided");
    }

    return true;
  }),
  handleValidationErrors,
];

// Conversation validation rules
export const validateConversationQuery = [
  query("tag").optional().isString().withMessage("Tag must be a string"),
  query("conversationId")
    .optional()
    .custom((value) => {
      if (value && !isValidObjectId(value)) {
        throw new Error("Conversation ID must be a valid ObjectId");
      }
      return true;
    }),
  query("wordId")
    .optional()
    .custom((value) => {
      if (value && !isValidObjectId(value)) {
        throw new Error("Word ID must be a valid ObjectId");
      }
      return true;
    }),
  handleValidationErrors,
];

export const validateConversationCreate = [
  body("conversations").isArray({ min: 1 }).withMessage("Conversations must be a non-empty array"),
  body("conversations.*.language")
    .notEmpty()
    .withMessage("Language is required for each conversation")
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error("Language must be a valid ObjectId");
      }
      return true;
    }),
  body("conversations.*.sentences")
    .isArray({ min: 1 })
    .withMessage("Each conversation must have at least one sentence"),
  body("conversations.*.sentences.*.text")
    .notEmpty()
    .withMessage("Sentence text is required")
    .isString()
    .withMessage("Sentence text must be a string"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("tags.*").optional().isString().withMessage("Each tag must be a string"),
  handleValidationErrors,
];

export const validateConversationUpdate = [
  param("id")
    .notEmpty()
    .withMessage("Conversation ID is required")
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error("Conversation ID must be a valid ObjectId");
      }
      return true;
    }),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("tags.*").optional().isString().withMessage("Each tag must be a string"),
  body("conversations").optional().isArray({ min: 1 }).withMessage("Conversations must be a non-empty array"),
  body("conversations.*.language")
    .optional()
    .custom((value) => {
      if (value && !isValidObjectId(value)) {
        throw new Error("Language must be a valid ObjectId");
      }
      return true;
    }),
  handleValidationErrors,
];

// Word validation rules
export const validateWordQuery = [
  query("lastUpdateDate").optional().isISO8601().withMessage("Last update date must be a valid ISO 8601 date").toDate(),
  handleValidationErrors,
];

export const validateWordCreate = [
  body("text").trim().notEmpty().withMessage("Text is required").isString().withMessage("Text must be a string"),
  body("language")
    .notEmpty()
    .withMessage("Language is required")
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error("Language must be a valid ObjectId");
      }
      return true;
    }),
  body("translations").optional().isArray().withMessage("Translations must be an array"),
  body("translations.*.language")
    .optional()
    .custom((value) => {
      if (value && !isValidObjectId(value)) {
        throw new Error("Translation language must be a valid ObjectId");
      }
      return true;
    }),
  body("translations.*.text").optional().isString().withMessage("Translation text must be a string"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("tags.*").optional().isString().withMessage("Each tag must be a string"),
  handleValidationErrors,
];

export const validateWordUpdate = [
  param("id")
    .notEmpty()
    .withMessage("Word ID is required")
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error("Word ID must be a valid ObjectId");
      }
      return true;
    }),
  body("text").optional().trim().isString().withMessage("Text must be a string"),
  body("language")
    .optional()
    .custom((value) => {
      if (value && !isValidObjectId(value)) {
        throw new Error("Language must be a valid ObjectId");
      }
      return true;
    }),
  body("translations").optional().isArray().withMessage("Translations must be an array"),
  body("translations.*.language")
    .optional()
    .custom((value) => {
      if (value && !isValidObjectId(value)) {
        throw new Error("Translation language must be a valid ObjectId");
      }
      return true;
    }),
  body("translations.*.text").optional().isString().withMessage("Translation text must be a string"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("tags.*").optional().isString().withMessage("Each tag must be a string"),
  handleValidationErrors,
];

// Tag validation rules
export const validateConversationTagCreate = [
  body("labels").isArray({ min: 1 }).withMessage("Labels must be a non-empty array"),
  body("labels.*.language")
    .notEmpty()
    .withMessage("Language is required for each label")
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error("Language must be a valid ObjectId");
      }
      return true;
    }),
  body("labels.*.text")
    .trim()
    .notEmpty()
    .withMessage("Label text is required")
    .isString()
    .withMessage("Label text must be a string"),
  handleValidationErrors,
];

export const validateWordTagCreate = [
  body("text").trim().notEmpty().withMessage("Text is required").isString().withMessage("Text must be a string"),
  body("language")
    .notEmpty()
    .withMessage("Language is required")
    .custom((value) => {
      if (!isValidObjectId(value)) {
        throw new Error("Language must be a valid ObjectId");
      }
      return true;
    }),
  handleValidationErrors,
];
