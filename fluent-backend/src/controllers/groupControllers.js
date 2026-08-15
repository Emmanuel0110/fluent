import auth from "../middleware/auth.js";
import cache from "../middleware/cache.js";
import { validateCreateGroup, validateJoinGroup } from "../middleware/validation.js";
import { GroupModel, UserCourseModel } from "../models.js";
import { buildDashboardData, scoreFromWords, getRank } from "./userCourseControllers.js";
import { logger } from "../logger.js";
import { resolveDisplayName } from "../utils/displayName.js";
import sanitizeHtml from "sanitize-html";
import crypto from "crypto";
import express from "express";
const router = express.Router();

// Unambiguous alphabet (no 0/O/1/I) for a short, human-shareable invite code.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

// Generates a random invite code, retrying on the (rare) collision so the value is
// guaranteed unique — callers never have to handle a "code already taken" error.
async function generateInviteCode() {
  // A short code has a tiny but non-zero collision chance; cap retries to avoid an
  // unbounded loop if something goes wrong.
  for (let attempt = 0; attempt < 10; attempt++) {
    let code = "";
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
    }
    if (!(await GroupModel.exists({ inviteCode: code }))) return code;
  }
  throw new Error("Failed to generate a unique invite code");
}

// GET / — groups the authenticated user belongs to.
router.get("/", auth, async (req, res, next) => {
  try {
    const groups = await GroupModel.find({ "members.user": req.user._id })
      .populate("targetLanguage", "label")
      .lean();

    const data = groups.map((group) => ({
      _id: group._id,
      name: group.name,
      targetLanguage: group.targetLanguage?.label,
      memberCount: group.members.length,
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// POST / — create a group for the creator's active course target language.
router.post("/", auth, cache, validateCreateGroup, async (req, res, next) => {
  try {
    const { userCourse } = req;
    if (!userCourse) {
      return res.status(404).json({ success: false, message: "User course not found" });
    }

    const name = sanitizeHtml(req.body.name);
    if (!name || typeof name === "object") {
      return res.status(400).json({ success: false, message: "Invalid group name" });
    }

    const inviteCode = await generateInviteCode();
    const group = await GroupModel.create({
      name,
      inviteCode,
      targetLanguage: userCourse.targetLanguage,
      members: [{ user: req.user._id, userCourse: userCourse._id }],
    });

    logger.info({ userId: req.user._id, groupId: group._id }, "Group created");
    res.status(201).json({
      success: true,
      data: { _id: group._id, name: group.name, inviteCode: group.inviteCode },
    });
  } catch (error) {
    next(error);
  }
});

// POST /join — join a group by invite code (only if learning its target language).
router.post("/join", auth, cache, validateJoinGroup, async (req, res, next) => {
  try {
    const { userCourse } = req;
    if (!userCourse) {
      return res.status(404).json({ success: false, message: "User course not found" });
    }

    const inviteCode = String(req.body.inviteCode).trim().toUpperCase();
    const group = await GroupModel.findOne({ inviteCode });
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    // The group is pinned to one target language; the requester must be learning it
    // via their active course. This also enforces "can't join a language you don't learn".
    if (!group.targetLanguage.equals(userCourse.targetLanguage)) {
      return res.status(403).json({ success: false, message: "You are not learning this group's target language" });
    }

    const alreadyMember = group.members.some((m) => m.user.equals(req.user._id));
    if (!alreadyMember) {
      group.members.push({ user: req.user._id, userCourse: userCourse._id });
      await group.save();
      logger.info({ userId: req.user._id, groupId: group._id }, "Joined group");
    }

    res.json({ success: true, data: { _id: group._id, name: group.name } });
  } catch (error) {
    next(error);
  }
});

// POST /:groupId/leave — remove the authenticated user from the group.
router.post("/:groupId/leave", auth, async (req, res, next) => {
  try {
    await GroupModel.updateOne(
      { _id: req.params.groupId },
      { $pull: { members: { user: req.user._id } } }
    );
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// GET /:groupId — members ranked by live experience score (descending).
router.get("/:groupId", auth, async (req, res, next) => {
  try {
    const group = await GroupModel.findById(req.params.groupId)
      .populate("targetLanguage", "label")
      .populate("members.user", "username displayName")
      .populate("members.userCourse", "words")
      .lean();

    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const isMember = group.members.some((m) => m.user && m.user._id.equals(req.user._id));
    if (!isMember) {
      return res.status(403).json({ success: false, message: "You are not a member of this group" });
    }

    const members = group.members
      .filter((m) => m.user && m.userCourse)
      .map((m) => {
        const score = scoreFromWords(m.userCourse.words);
        return {
          userCourseId: m.userCourse._id,
          displayName: resolveDisplayName(m.user),
          score,
          rank: getRank(score),
        };
      })
      .sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      data: {
        _id: group._id,
        name: group.name,
        inviteCode: group.inviteCode,
        targetLanguage: group.targetLanguage?.label,
        members,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /:groupId/members/:userCourseId/dashboard — a member's dashboard, viewable
// only by co-members of the group.
router.get("/:groupId/members/:userCourseId/dashboard", auth, async (req, res, next) => {
  try {
    const { groupId, userCourseId } = req.params;
    const group = await GroupModel.findById(groupId).populate("members.user", "username displayName").lean();
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    const isMember = group.members.some((m) => m.user && m.user._id.equals(req.user._id));
    const target = group.members.find((m) => m.userCourse && m.userCourse.equals(userCourseId));
    if (!isMember || !target) {
      return res.status(403).json({ success: false, message: "Not authorized to view this dashboard" });
    }

    const userCourse = await UserCourseModel.findById(userCourseId);
    if (!userCourse) {
      return res.status(404).json({ success: false, message: "User course not found" });
    }

    res.json({
      success: true,
      data: { ...buildDashboardData(userCourse), displayName: resolveDisplayName(target.user) },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
