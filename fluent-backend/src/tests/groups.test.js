// @ts-nocheck
import { jest } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import app from "../app.js";
import { GroupModel, UserModel, UserCourseModel } from "../models.js";
import jwt from "jsonwebtoken";

const USER_ID = "64a1b2c3d4e5f6a7b8c9d0e1";
const COURSE_ID = "64a1b2c3d4e5f6a7b8c9d0e2";
const LANG_ID = "64a1b2c3d4e5f6a7b8c9d0e3";
const OTHER_LANG_ID = "64a1b2c3d4e5f6a7b8c9d0e4";
const GROUP_ID = "64a1b2c3d4e5f6a7b8c9d0e5";
const FAKE_TOKEN = "fake-token";

// Makes the `cache` middleware resolve req.userCourse to a course with the given
// target language, by stubbing the User -> UserCourse lookup it performs.
function stubActiveCourse(targetLanguageId) {
  jest
    .spyOn(UserModel, "findById")
    .mockResolvedValue({ _id: USER_ID, lastCourseId: COURSE_ID, courses: [COURSE_ID] });
  jest.spyOn(UserCourseModel, "findById").mockImplementation((id) => {
    // cacheUserCourse calls `.lean()`; the member-dashboard route calls the doc directly.
    if (String(id) === COURSE_ID) {
      return { lean: () => Promise.resolve({ _id: COURSE_ID, targetLanguage: new mongoose.Types.ObjectId(targetLanguageId) }) };
    }
    return { lean: () => Promise.resolve(null) };
  });
}

describe("Groups API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
    jest.spyOn(jwt, "verify").mockReturnValue({ _id: USER_ID });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 401 without an auth token", async () => {
    const res = await request(app).get("/api/groups");
    expect(res.status).toBe(401);
  });

  describe("POST /api/groups (create)", () => {
    it("creates a group with the creator as first member and returns an invite code", async () => {
      stubActiveCourse(LANG_ID);
      jest.spyOn(GroupModel, "exists").mockResolvedValue(null);
      const createSpy = jest
        .spyOn(GroupModel, "create")
        .mockResolvedValue({ _id: GROUP_ID, name: "Team", inviteCode: "ABC123" });

      const res = await request(app)
        .post("/api/groups")
        .set("x-auth-token", FAKE_TOKEN)
        .send({ name: "Team" });

      expect(res.status).toBe(201);
      expect(res.body.data.inviteCode).toBe("ABC123");

      const [doc] = createSpy.mock.calls[0];
      expect(doc.targetLanguage.toString()).toBe(LANG_ID);
      expect(doc.members).toHaveLength(1);
      expect(doc.members[0].user).toBe(USER_ID);
      expect(doc.members[0].userCourse).toBe(COURSE_ID);
      expect(doc.inviteCode).toEqual(expect.any(String));
    });

    it("returns 400 when the name is missing", async () => {
      stubActiveCourse(LANG_ID);
      const res = await request(app).post("/api/groups").set("x-auth-token", FAKE_TOKEN).send({});
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/groups/join", () => {
    it("refuses to join a group whose target language the user does not learn", async () => {
      stubActiveCourse(LANG_ID);
      jest.spyOn(GroupModel, "findOne").mockResolvedValue({
        _id: GROUP_ID,
        name: "Team",
        targetLanguage: new mongoose.Types.ObjectId(OTHER_LANG_ID),
        members: [],
        save: jest.fn(),
      });

      const res = await request(app)
        .post("/api/groups/join")
        .set("x-auth-token", FAKE_TOKEN)
        .send({ inviteCode: "ABC123" });

      expect(res.status).toBe(403);
    });

    it("adds the member when the target language matches", async () => {
      stubActiveCourse(LANG_ID);
      const save = jest.fn().mockResolvedValue();
      const members = [];
      jest.spyOn(GroupModel, "findOne").mockResolvedValue({
        _id: GROUP_ID,
        name: "Team",
        targetLanguage: new mongoose.Types.ObjectId(LANG_ID),
        members,
        save,
      });

      const res = await request(app)
        .post("/api/groups/join")
        .set("x-auth-token", FAKE_TOKEN)
        .send({ inviteCode: "ABC123" });

      expect(res.status).toBe(200);
      expect(save).toHaveBeenCalledTimes(1);
      expect(members).toHaveLength(1);
      expect(members[0].user).toBe(USER_ID);
    });

    it("returns 404 when the invite code matches no group", async () => {
      stubActiveCourse(LANG_ID);
      jest.spyOn(GroupModel, "findOne").mockResolvedValue(null);

      const res = await request(app)
        .post("/api/groups/join")
        .set("x-auth-token", FAKE_TOKEN)
        .send({ inviteCode: "NOPE99" });

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/groups/:groupId", () => {
    // reviewDelayInMs values map to weights via the DELAYS ladder (60000 -> 1, 86400000 -> 3).
    const learnedWord = (reviewDelayInMs) => ({
      nextReviewDate: new Date(Date.now() + 3600 * 1000),
      reviewDelayInMs,
    });

    function stubGroup(group) {
      const chain = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(group),
      };
      jest.spyOn(GroupModel, "findById").mockReturnValue(chain);
    }

    it("returns members ranked by experience score descending", async () => {
      stubGroup({
        _id: GROUP_ID,
        name: "Team",
        inviteCode: "ABC123",
        targetLanguage: { label: "en" },
        members: [
          { user: { _id: new mongoose.Types.ObjectId(USER_ID), username: "me" }, userCourse: { _id: new mongoose.Types.ObjectId(COURSE_ID), words: [learnedWord(60000)] } },
          { user: { _id: new mongoose.Types.ObjectId(OTHER_LANG_ID), username: "ace" }, userCourse: { _id: new mongoose.Types.ObjectId(GROUP_ID), words: [learnedWord(86400000)] } },
        ],
      });

      const res = await request(app).get(`/api/groups/${GROUP_ID}`).set("x-auth-token", FAKE_TOKEN);

      expect(res.status).toBe(200);
      expect(res.body.data.members.map((m) => m.username)).toEqual(["ace", "me"]);
      expect(res.body.data.members[0].score).toBeGreaterThan(res.body.data.members[1].score);
    });

    it("returns 403 when the requester is not a member", async () => {
      stubGroup({
        _id: GROUP_ID,
        name: "Team",
        inviteCode: "ABC123",
        targetLanguage: { label: "en" },
        members: [
          { user: { _id: new mongoose.Types.ObjectId(OTHER_LANG_ID), username: "ace" }, userCourse: { _id: new mongoose.Types.ObjectId(COURSE_ID), words: [] } },
        ],
      });

      const res = await request(app).get(`/api/groups/${GROUP_ID}`).set("x-auth-token", FAKE_TOKEN);
      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/groups/:groupId/members/:userCourseId/dashboard", () => {
    it("returns 403 when the requester is not a co-member", async () => {
      const chain = {
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          _id: GROUP_ID,
          members: [
            { user: { _id: new mongoose.Types.ObjectId(OTHER_LANG_ID), username: "ace" }, userCourse: new mongoose.Types.ObjectId(COURSE_ID) },
          ],
        }),
      };
      jest.spyOn(GroupModel, "findById").mockReturnValue(chain);

      const res = await request(app)
        .get(`/api/groups/${GROUP_ID}/members/${COURSE_ID}/dashboard`)
        .set("x-auth-token", FAKE_TOKEN);

      expect(res.status).toBe(403);
    });
  });
});
