import auth from "../middleware/auth.js";
import {
  validateRegister,
  validateLogin,
  validateUpdateLanguages,
  validateUserSettings,
  validateOAuthCallback,
} from "../middleware/validation.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { sanitizeText } from "../utils/sanitize.js";
import { UserModel, UserCourseModel, LanguageModel } from "../models.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import express from "express";
import { redisClient } from "../../index.js";
import mongoose from "mongoose";
import fetch from "node-fetch";
import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 attempts allowed
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
    const { username, password } = req.body;

    // Sanitize username
    const sanitizedUsername = sanitizeText(username);
    const user = await UserModel.findOne({ username: sanitizedUsername });
    if (user) {
      return res.status(409).json({ success: false, message: "User already exists" });
    }

    const newUser = new UserModel({
      username: sanitizedUsername,
      password,
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
    const { sourceLanguage, targetLanguage } = await cacheUserLearningData(userObj);
    res.json({ token, user: userObj, sourceLanguage, targetLanguage });
  })
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

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: 3600 * 8 });
    delete user.password;
    const { sourceLanguage, targetLanguage } = await cacheUserLearningData(user);
    res.json({ token, user, sourceLanguage, targetLanguage });
  })
);

router.get(
  "/auth",
  loginLimiter,
  auth,
  asyncHandler(async function (req, res) {
    const user = await UserModel.findById(req.user._id);
    const { sourceLanguage, targetLanguage } = await cacheUserLearningData(user);
    res.json({ user, sourceLanguage, targetLanguage });
  })
);

export async function cacheUserLearningData(user) {
  let course;
  if (user.lastCourseId) {
    course = await UserCourseModel.findById(user.lastCourseId).lean();
  } else if (user.courses.length > 0) {
    await UserModel.findByIdAndUpdate(user._id, { lastCourseId: user.courses[0] });
    course = await UserCourseModel.findById(user.courses[0]).lean();
  } else {
    const availableLanguages = await LanguageModel.find().select("-flag");
    course = new UserCourseModel({
      sourceLanguage: availableLanguages.find((language) => language.label === "fr")?._id,
      targetLanguage: availableLanguages.find((language) => language.label === "en")?._id,
      wishListConversations: [],
      words: [],
      conversations: [],
    });
    await course.save();
    await UserModel.findByIdAndUpdate(user._id, { lastCourseId: course._id, $addToSet: { courses: course._id } });
  }
  if (redisClient) {
    await redisClient.set(`userLearningData:${user._id}`, JSON.stringify(course), { EX: 3600 });
  }
  return course;
}

router.patch(
  "/",
  auth,
  validateUpdateLanguages,
  asyncHandler(async function (req, res) {
    const { sourceLanguage, targetLanguage } = req.body;
    const user = await UserModel.findById(req.user._id);
    await updateLanguages(user, sourceLanguage, targetLanguage);
    res.json({ success: true, data: { sourceLanguage, targetLanguage } });
  })
);

router.patch(
  "/settings",
  auth,
  validateUserSettings,
  asyncHandler(async function (req, res) {
    const { reviewMode, autoReviewDelay } = req.body;
    const updateData = {};

    if (reviewMode !== undefined) {
      updateData["userSettings.reviewMode"] = reviewMode;
    }
    if (autoReviewDelay !== undefined) {
      updateData["userSettings.autoReviewDelay"] = autoReviewDelay;
    }

    const updatedUser = await UserModel.findByIdAndUpdate(req.user._id, { $set: updateData }, { new: true });

    res.json({
      success: true,
      data: {
        reviewMode: updatedUser.userSettings.reviewMode,
        autoReviewDelay: updatedUser.userSettings.autoReviewDelay,
      },
    });
  })
);

export async function updateLanguages(user, sourceLanguage, targetLanguage) {
  let course = await UserCourseModel.findOne({ _id: { $in: user.courses }, sourceLanguage, targetLanguage });
  if (!course) {
    course = await new UserCourseModel({
      sourceLanguage,
      targetLanguage,
      wishListConversations: [],
      words: [],
      conversations: [],
    }).save();
  }
  await UserModel.findByIdAndUpdate(user._id, { lastCourseId: course._id, $addToSet: { courses: course._id } });
  if (redisClient) {
    await redisClient.set(`userLearningData:${user._id}`, JSON.stringify(course), { EX: 3600 });
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
    linkedin: {
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
      redirectUri:
        process.env.LINKEDIN_REDIRECT_URI ||
        `${process.env.FRONTEND_URL || "http://localhost:3000"}/login?provider=linkedin`,
      authUrl: "https://www.linkedin.com/oauth/v2/authorization",
      tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
      userInfoUrl: "https://api.linkedin.com/v2/userinfo",
      scope: "openid profile email",
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      redirectUri:
        process.env.FACEBOOK_REDIRECT_URI ||
        `${process.env.FRONTEND_URL || "http://localhost:3000"}/login?provider=facebook`,
      authUrl: "https://www.facebook.com/v18.0/dialog/oauth",
      tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
      userInfoUrl: "https://graph.facebook.com/v18.0/me?fields=id,name,email",
      scope: "email",
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

router.get("/auth/linkedin", (req, res) => {
  const config = getOAuthConfig("linkedin");
  if (!config.clientId) {
    return res.status(500).json({ msg: "LinkedIn OAuth not configured" });
  }
  const state = Buffer.from(Date.now().toString()).toString("base64"); // Simple state for CSRF protection
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state: state,
    scope: config.scope,
  });
  res.redirect(`${config.authUrl}?${params.toString()}`);
});

router.get("/auth/facebook", (req, res) => {
  const config = getOAuthConfig("facebook");
  if (!config.clientId) {
    return res.status(500).json({ msg: "Facebook OAuth not configured" });
  }
  const state = Buffer.from(Date.now().toString()).toString("base64");
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    state: state,
    scope: config.scope,
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
  let userInfoResponse;
  if (provider === "linkedin") {
    // LinkedIn requires the access token in the Authorization header
    userInfoResponse = await fetch(config.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
  } else {
    userInfoResponse = await fetch(config.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

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

    // Generate JWT token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: 3600 * 8 });
    const userObj = user.toObject();
    delete userObj.password;
    const { sourceLanguage, targetLanguage } = await cacheUserLearningData(userObj);

    res.json({ token, user: userObj, sourceLanguage, targetLanguage });
  })
);

router.post(
  "/auth/linkedin/callback",
  validateOAuthCallback,
  asyncHandler(async (req, res) => {
    const { code } = req.body;

    const oauthUser = await exchangeCodeForUser("linkedin", code);

    // Find or create user
    let user = await UserModel.findOne({
      oauthProvider: "linkedin",
      oauthId: oauthUser.oauthId,
    });

    if (!user) {
      // Check if user with this email exists
      if (oauthUser.email) {
        user = await UserModel.findOne({ email: oauthUser.email });
      }

      // Create new user if doesn't exist
      if (!user) {
        const baseUsername =
          oauthUser.email?.split("@")[0] ||
          oauthUser.name?.toLowerCase().replace(/\s+/g, "") ||
          `user_${oauthUser.oauthId}`;
        let username = sanitizeText(baseUsername);
        let counter = 1;

        while (await UserModel.findOne({ username })) {
          username = sanitizeText(`${baseUsername}${counter}`);
          counter++;
        }

        user = new UserModel({
          username,
          email: oauthUser.email ? sanitizeText(oauthUser.email) : oauthUser.email,
          oauthProvider: "linkedin",
          oauthId: oauthUser.oauthId,
          userSettings: {
            reviewMode: "manual",
            autoReviewDelay: 10,
          },
        });
        await user.save();
      } else {
        user.oauthProvider = "linkedin";
        user.oauthId = oauthUser.oauthId;
        if (!user.email && oauthUser.email) {
          user.email = sanitizeText(oauthUser.email);
        }
        await user.save();
      }
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: 3600 * 8 });
    const userObj = user.toObject();
    delete userObj.password;
    const { sourceLanguage, targetLanguage } = await cacheUserLearningData(userObj);

    res.json({ token, user: userObj, sourceLanguage, targetLanguage });
  })
);

router.post(
  "/auth/facebook/callback",
  validateOAuthCallback,
  asyncHandler(async (req, res) => {
    const { code } = req.body;

    const oauthUser = await exchangeCodeForUser("facebook", code);

    // Find or create user
    let user = await UserModel.findOne({
      oauthProvider: "facebook",
      oauthId: oauthUser.oauthId,
    });

    if (!user) {
      // Check if user with this email exists
      if (oauthUser.email) {
        user = await UserModel.findOne({ email: oauthUser.email });
      }

      // Create new user if doesn't exist
      if (!user) {
        const baseUsername =
          oauthUser.email?.split("@")[0] ||
          oauthUser.name?.toLowerCase().replace(/\s+/g, "") ||
          `user_${oauthUser.oauthId}`;
        let username = sanitizeText(baseUsername);
        let counter = 1;

        while (await UserModel.findOne({ username })) {
          username = sanitizeText(`${baseUsername}${counter}`);
          counter++;
        }

        user = new UserModel({
          username,
          email: oauthUser.email ? sanitizeText(oauthUser.email) : oauthUser.email,
          oauthProvider: "facebook",
          oauthId: oauthUser.oauthId,
          userSettings: {
            reviewMode: "manual",
            autoReviewDelay: 10,
          },
        });
        await user.save();
      } else {
        user.oauthProvider = "facebook";
        user.oauthId = oauthUser.oauthId;
        if (!user.email && oauthUser.email) {
          user.email = sanitizeText(oauthUser.email);
        }
        await user.save();
      }
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: 3600 * 8 });
    const userObj = user.toObject();
    delete userObj.password;
    const { sourceLanguage, targetLanguage } = await cacheUserLearningData(userObj);

    res.json({ token, user: userObj, sourceLanguage, targetLanguage });
  })
);

export default router;
