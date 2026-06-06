import auth from "../middleware/auth.js";
import {
  validateRegister,
  validateLogin,
  validateUpdateLanguages,
  validateUserSettings,
  validateOAuthCallback,
  validateForgotPassword,
  validateResetPassword,
  validateUpdateEmail,
} from "../middleware/validation.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sanitizeText } from "../utils/sanitize.js";
import { UserModel, UserCourseModel, LanguageModel, FeedbackModel } from "../models.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import express from "express";
import { redisClient } from "../redis.js";
import mongoose from "mongoose";
import fetch from "node-fetch";
import rateLimit from "express-rate-limit";
import { logger } from "../logger.js";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../services/emailService.js";

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 5 attempts allowed
  message: "Too many login attempts. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const router = express.Router();

//register
router.post(
  "/",
  loginLimiter,
  validateRegister,
  asyncHandler(async function (req, res) {
    const { username, password, email } = req.body;

    // Sanitize username
    const sanitizedUsername = sanitizeText(username);
    const user = await UserModel.findOne({ username: sanitizedUsername });
    if (user) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }

    const existingEmail = await UserModel.findOne({ email: email.trim().toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: "Email already in use" });
    }

    const newUser = new UserModel({
      username: sanitizedUsername,
      password,
      email: email.trim().toLowerCase(),
      userSettings: {
        reviewMode: "manual",
        autoReviewDelay: 10,
      },
    });

    // Create salt & hash
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newUser.password, salt);
    newUser.password = hash;

    const savedUser = await newUser.save();
    const userObj = savedUser.toObject();

    const token = jwt.sign({ _id: userObj._id }, process.env.JWT_SECRET, { expiresIn: 3600 * 8 });
    delete userObj.password;
    const { sourceLanguage, targetLanguage } = await cacheUserCourse(userObj, {
      sourceLanguageId: req.body.sourceLanguage,
      targetLanguageId: req.body.targetLanguage,
    });
    logger.info({ userId: userObj._id, username: sanitizedUsername }, "User registered");
    res.json({ token, user: userObj, sourceLanguage, targetLanguage });
  }),
);

//login
router.post(
  "/auth",
  loginLimiter,
  validateLogin,
  asyncHandler(async function (req, res) {
    const { username, password } = req.body;
    const user = await UserModel.findOne({ username: username.trim() }).select("+password").lean();

    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    await UserModel.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: 3600 * 8 });
    delete user.password;
    const { sourceLanguage, targetLanguage } = await cacheUserCourse(user);
    logger.info({ userId: user._id }, "User logged in");
    res.json({ token, user, sourceLanguage, targetLanguage });
  }),
);

router.get(
  "/auth",
  loginLimiter,
  auth,
  asyncHandler(async function (req, res) {
    const user = await UserModel.findById(req.user._id);
    const { sourceLanguage, targetLanguage } = await cacheUserCourse(user);
    res.json({ user, sourceLanguage, targetLanguage });
  }),
);

router.post(
  "/forgot-password",
  loginLimiter,
  validateForgotPassword,
  asyncHandler(async function (req, res) {
    const GENERIC_MSG = "If an account with that email exists, a reset link has been sent.";
    const user = await UserModel.findOne({ email: req.body.email.trim().toLowerCase() });
    if (!user) return res.json({ success: true, message: GENERIC_MSG });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    await UserModel.findByIdAndUpdate(user._id, {
      passwordResetToken: hashedToken,
      passwordResetExpires: Date.now() + 3_600_000,
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(user.email, resetUrl);
    logger.info({ userId: user._id }, "Password reset email sent");
    res.json({ success: true, message: GENERIC_MSG });
  }),
);

router.post(
  "/reset-password",
  validateResetPassword,
  asyncHandler(async function (req, res) {
    const { token, newPassword } = req.body;
    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await UserModel.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) return res.status(400).json({ success: false, message: "Invalid or expired reset link." });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    logger.info({ userId: user._id }, "Password reset successfully");
    res.json({ success: true, message: "Password updated successfully." });
  }),
);

export async function cacheUserCourse(user, { sourceLanguageId, targetLanguageId } = {}) {
  let userCourse;
  if (user.lastCourseId) {
    userCourse = await UserCourseModel.findById(user.lastCourseId).lean();
  } else if (user.courses.length > 0) {
    await UserModel.findByIdAndUpdate(user._id, { lastCourseId: user.courses[0] });
    userCourse = await UserCourseModel.findById(user.courses[0]).lean();
  } else {
    const availableLanguages = await LanguageModel.find().select("-flag");
    const resolvedSource = sourceLanguageId
      ? availableLanguages.find((l) => l._id.toString() === sourceLanguageId)?._id
      : availableLanguages.find((l) => l.label === "fr")?._id;
    const resolvedTarget = targetLanguageId
      ? availableLanguages.find((l) => l._id.toString() === targetLanguageId)?._id
      : availableLanguages.find((l) => l.label === "en")?._id;
    userCourse = new UserCourseModel({
      sourceLanguage: resolvedSource,
      targetLanguage: resolvedTarget,
      wishListConversations: [],
      words: [],
      conversations: [],
    });
    await userCourse.save();
    await UserModel.findByIdAndUpdate(user._id, {
      lastCourseId: userCourse._id,
      $addToSet: { courses: userCourse._id },
    });
  }
  if (redisClient) {
    await redisClient.set(`userCourse:${user._id}`, JSON.stringify(userCourse), { EX: 3600 });
  }
  return userCourse;
}

router.patch(
  "/email",
  auth,
  validateUpdateEmail,
  asyncHandler(async function (req, res) {
    const normalized = req.body.email.trim().toLowerCase();
    const existing = await UserModel.findOne({ email: normalized, _id: { $ne: req.user._id } });
    if (existing) return res.status(409).json({ success: false, message: "Email already in use" });
    await UserModel.findByIdAndUpdate(req.user._id, { email: normalized });
    res.json({ success: true, email: normalized });
  }),
);

router.patch(
  "/",
  auth,
  validateUpdateLanguages,
  asyncHandler(async function (req, res) {
    const { sourceLanguage, targetLanguage } = req.body;
    const user = await UserModel.findById(req.user._id);
    await updateLanguages(user, sourceLanguage, targetLanguage);
    res.json({ success: true, data: { sourceLanguage, targetLanguage } });
  }),
);

router.patch(
  "/settings",
  auth,
  validateUserSettings,
  asyncHandler(async function (req, res) {
    const { reviewMode, autoReviewDelay, theme } = req.body;
    const updateData = {};

    if (reviewMode !== undefined) {
      updateData["userSettings.reviewMode"] = reviewMode;
    }
    if (autoReviewDelay !== undefined) {
      updateData["userSettings.autoReviewDelay"] = autoReviewDelay;
    }
    if (theme !== undefined) {
      updateData["userSettings.theme"] = theme;
    }

    const updatedUser = await UserModel.findByIdAndUpdate(req.user._id, { $set: updateData }, { new: true });

    res.json({
      success: true,
      data: {
        reviewMode: updatedUser.userSettings.reviewMode,
        autoReviewDelay: updatedUser.userSettings.autoReviewDelay,
        theme: updatedUser.userSettings.theme,
      },
    });
  }),
);

export async function updateLanguages(user, sourceLanguage, targetLanguage) {
  let userCourse = await UserCourseModel.findOne({ _id: { $in: user.courses }, sourceLanguage, targetLanguage });
  if (!userCourse) {
    userCourse = await new UserCourseModel({
      sourceLanguage,
      targetLanguage,
      wishListConversations: [],
      words: [],
      conversations: [],
    }).save();
  }
  await UserModel.findByIdAndUpdate(user._id, {
    lastCourseId: userCourse._id,
    $addToSet: { courses: userCourse._id },
  });
  if (redisClient) {
    await redisClient.set(`userCourse:${user._id}`, JSON.stringify(userCourse), { EX: 3600 });
  }
}

// OAuth Authentication Routes

// Helper function to get OAuth configuration
function getOAuthConfig(provider) {
  const configs = {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri:
        process.env.GOOGLE_REDIRECT_URI ||
        `${process.env.FRONTEND_URL || "http://localhost:3000"}/login?provider=google`,
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
      scope: "openid email profile",
    },
  };
  return configs[provider];
}

// OAuth initiation endpoints - redirect to provider
router.get("/auth/google", (req, res) => {
  const config = getOAuthConfig("google");
  if (!config.clientId) {
    return res.status(500).json({ msg: "Google OAuth not configured" });
  }
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scope,
    access_type: "offline",
    prompt: "consent",
  });
  res.redirect(`${config.authUrl}?${params.toString()}`);
});

// Helper function to exchange code for token
async function exchangeCodeForUser(provider, code) {
  const config = getOAuthConfig(provider);

  // Exchange authorization code for access token
  const tokenParams = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    code: code,
    grant_type: "authorization_code",
  });

  const tokenResponse = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: tokenParams.toString(),
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token || tokenData.accessToken;

  // Get user info from provider
  const userInfoResponse = await fetch(config.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userInfoResponse.ok) {
    const errorText = await userInfoResponse.text();
    throw new Error(`Failed to fetch user info: ${errorText}`);
  }

  const userInfo = await userInfoResponse.json();

  // Normalize user info across providers
  let normalizedUser = {
    oauthId: userInfo.id || userInfo.sub,
    email: userInfo.email,
    name: userInfo.name || `${userInfo.given_name || ""} ${userInfo.family_name || ""}`.trim(),
    provider: provider,
  };

  return normalizedUser;
}

// OAuth callback endpoints
router.post(
  "/auth/google/callback",
  validateOAuthCallback,
  asyncHandler(async (req, res) => {
    const { code } = req.body;

    const oauthUser = await exchangeCodeForUser("google", code);

    // Find or create user
    let user = await UserModel.findOne({
      oauthProvider: "google",
      oauthId: oauthUser.oauthId,
    });

    if (!user) {
      // Check if user with this email exists
      if (oauthUser.email) {
        user = await UserModel.findOne({ email: oauthUser.email });
      }

      // Create new user if doesn't exist
      if (!user) {
        // Generate username from email or name
        const baseUsername =
          oauthUser.email?.split("@")[0] ||
          oauthUser.name?.toLowerCase().replace(/\s+/g, "") ||
          `user_${oauthUser.oauthId}`;
        let username = sanitizeText(baseUsername);
        let counter = 1;

        // Ensure unique username
        while (await UserModel.findOne({ username })) {
          username = sanitizeText(`${baseUsername}${counter}`);
          counter++;
        }

        user = new UserModel({
          username,
          email: oauthUser.email ? sanitizeText(oauthUser.email) : oauthUser.email,
          oauthProvider: "google",
          oauthId: oauthUser.oauthId,
          userSettings: {
            reviewMode: "manual",
            autoReviewDelay: 10,
          },
        });
        await user.save();
      } else {
        // Link OAuth to existing account
        user.oauthProvider = "google";
        user.oauthId = oauthUser.oauthId;
        if (!user.email && oauthUser.email) {
          user.email = sanitizeText(oauthUser.email);
        }
        await user.save();
      }
    }

    await UserModel.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: 3600 * 8 });
    const userObj = user.toObject();
    delete userObj.password;
    const { sourceLanguage, targetLanguage } = await cacheUserCourse(userObj);

    res.json({ token, user: userObj, sourceLanguage, targetLanguage });
  }),
);

router.get(
  "/export",
  auth,
  asyncHandler(async function (req, res) {
    const userId = req.user._id;
    const user = await UserModel.findById(userId).lean();
    const courses = await UserCourseModel.find({ _id: { $in: user.courses } }).lean();
    const feedback = await FeedbackModel.find({ userId: userId.toString() }).lean();

    const exportData = {
      exportedAt: new Date().toISOString(),
      profile: {
        username: user.username,
        email: user.email,
        oauthProvider: user.oauthProvider,
        lastLoginAt: user.lastLoginAt,
        userSettings: user.userSettings,
      },
      courses,
      feedback,
    };

    res.setHeader("Content-Disposition", `attachment; filename="fluent-data-${userId}.json"`);
    res.json(exportData);
  }),
);

router.delete(
  "/",
  auth,
  asyncHandler(async function (req, res) {
    const userId = req.user._id;
    const user = await UserModel.findById(userId).select("+password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.oauthProvider) {
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ success: false, message: "Password is required to delete your account" });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid password" });
      }
    }

    await FeedbackModel.deleteMany({ userId: userId.toString() });
    await UserCourseModel.deleteMany({ _id: { $in: user.courses } });
    await UserModel.findByIdAndDelete(userId);

    if (redisClient) {
      await redisClient.del(`userCourse:${userId}`);
    }

    logger.info({ userId }, "User account deleted");
    res.json({ success: true });
  }),
);

export default router;
