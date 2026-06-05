// @ts-nocheck
import { jest } from "@jest/globals";
import request from "supertest";
import app from "../app.js";
import { LexicalItemModel, UserModel, UserCourseModel, MultiLingualConversationModel, StoryNodeModel } from "../models.js";
import jwt from "jsonwebtoken";

const FAKE_TOKEN = "fake-token";
const FAKE_WORD_ID = "64a1b2c3d4e5f6a7b8c9d0e1";
const SOURCE_LANG_ID = "64a1b2c3d4e5f6a7b8c9d0a1";
const TARGET_LANG_ID = "64a1b2c3d4e5f6a7b8c9d0a2";

function fakeCourseData(overrides = {}) {
  return {
    sourceLanguage: SOURCE_LANG_ID,
    targetLanguage: TARGET_LANG_ID,
    words: [],
    conversations: [],
    ...overrides,
  };
}

function mockCacheMiddleware(courseData = fakeCourseData()) {
  jest.spyOn(UserModel, "findById").mockResolvedValue({
    _id: "userId123",
    lastCourseId: "courseId123",
    courses: [],
  });
  jest.spyOn(UserCourseModel, "findById").mockReturnValue({
    lean: jest.fn().mockResolvedValue(courseData),
  });
}

// ─── GET /api/words ───────────────────────────────────────────────────────────

describe("GET /api/words", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
    jest.spyOn(jwt, "verify").mockReturnValue({ _id: "userId123" });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 401 when no auth token is provided", async () => {
    const res = await request(app).get("/api/words");

    expect(res.status).toBe(401);
  });

  it("returns 400 when lastUpdateDate is not a valid ISO 8601 date", async () => {
    mockCacheMiddleware();

    const res = await request(app)
      .get("/api/words?lastUpdateDate=not-a-date")
      .set("x-auth-token", FAKE_TOKEN);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns the word list with correct subscribed flags", async () => {
    const SUBSCRIBED_WORD_ID = "64a1b2c3d4e5f6a7b8c9d0e1";
    const UNSUBSCRIBED_WORD_ID = "64a1b2c3d4e5f6a7b8c9d0e2";

    mockCacheMiddleware(fakeCourseData({ words: [{ _id: SUBSCRIBED_WORD_ID }] }));

    const subscribedWord = { _id: SUBSCRIBED_WORD_ID, text: "bonjour", language: SOURCE_LANG_ID, translations: [], tags: [] };
    const unsubscribedWord = { _id: UNSUBSCRIBED_WORD_ID, text: "hello", language: TARGET_LANG_ID, translations: [], tags: [] };

    jest.spyOn(LexicalItemModel, "aggregate")
      .mockResolvedValueOnce([subscribedWord])
      .mockResolvedValueOnce([unsubscribedWord]);

    const res = await request(app).get("/api/words").set("x-auth-token", FAKE_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);

    const sub = res.body.data.find((w) => w._id === SUBSCRIBED_WORD_ID);
    const unsub = res.body.data.find((w) => w._id === UNSUBSCRIBED_WORD_ID);
    expect(sub.subscribed).toBe(true);
    expect(unsub.subscribed).toBe(false);
  });
});

// ─── POST /api/words ──────────────────────────────────────────────────────────

describe("POST /api/words", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
    jest.spyOn(jwt, "verify").mockReturnValue({ _id: "userId123" });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 401 when no auth token is provided", async () => {
    const res = await request(app)
      .post("/api/words")
      .send({ text: "bonjour", language: SOURCE_LANG_ID });

    expect(res.status).toBe(401);
  });

  it("returns 400 when required fields are missing", async () => {
    const res = await request(app)
      .post("/api/words")
      .set("x-auth-token", FAKE_TOKEN)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 when language is not a valid ObjectId", async () => {
    const res = await request(app)
      .post("/api/words")
      .set("x-auth-token", FAKE_TOKEN)
      .send({ text: "bonjour", language: "not-an-id" });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("creates and returns the new word", async () => {
    const savedWord = { _id: FAKE_WORD_ID, text: "bonjour", language: SOURCE_LANG_ID, translations: [], tags: [] };
    jest.spyOn(LexicalItemModel.prototype, "save").mockResolvedValue(savedWord);

    const res = await request(app)
      .post("/api/words")
      .set("x-auth-token", FAKE_TOKEN)
      .send({ text: "bonjour", language: SOURCE_LANG_ID });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({ text: "bonjour", language: SOURCE_LANG_ID });
  });
});

// ─── PUT /api/words/:id ───────────────────────────────────────────────────────

describe("PUT /api/words/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
    jest.spyOn(jwt, "verify").mockReturnValue({ _id: "userId123" });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 401 when no auth token is provided", async () => {
    const res = await request(app)
      .put(`/api/words/${FAKE_WORD_ID}`)
      .send({ text: "updated", language: SOURCE_LANG_ID, translations: [], tags: [] });

    expect(res.status).toBe(401);
  });

  it("returns 400 when word ID is not a valid ObjectId", async () => {
    mockCacheMiddleware();

    const res = await request(app)
      .put("/api/words/not-a-valid-id")
      .set("x-auth-token", FAKE_TOKEN)
      .send({ text: "updated", language: SOURCE_LANG_ID, translations: [], tags: [] });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("updates and returns the word with filtered translations", async () => {
    mockCacheMiddleware();
    jest.spyOn(LexicalItemModel, "updateOne").mockResolvedValue({ modifiedCount: 1 });

    const updatedWord = {
      _id: FAKE_WORD_ID,
      text: "updated",
      language: SOURCE_LANG_ID,
      translations: [{ language: TARGET_LANG_ID, lexicalItems: [] }],
      tags: [],
    };
    jest.spyOn(LexicalItemModel, "findOneAndUpdate").mockReturnValue({
      lean: jest.fn().mockResolvedValue(updatedWord),
    });

    const res = await request(app)
      .put(`/api/words/${FAKE_WORD_ID}`)
      .set("x-auth-token", FAKE_TOKEN)
      .send({
        text: "updated",
        language: SOURCE_LANG_ID,
        translations: [{ language: TARGET_LANG_ID, text: "hello" }],
        tags: [],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.text).toBe("updated");
    expect(res.body.data.translations).toHaveLength(1);
  });
});

// ─── DELETE /api/words/:id ────────────────────────────────────────────────────

describe("DELETE /api/words/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
    jest.spyOn(jwt, "verify").mockReturnValue({ _id: "userId123" });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 401 when no auth token is provided", async () => {
    const res = await request(app).delete(`/api/words/${FAKE_WORD_ID}`);

    expect(res.status).toBe(401);
  });

  it("returns 400 when word ID is not a valid ObjectId", async () => {
    const res = await request(app)
      .delete("/api/words/not-a-valid-id")
      .set("x-auth-token", FAKE_TOKEN);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("deletes the word document from the database", async () => {
    const deleteOneSpy = jest.spyOn(LexicalItemModel, "deleteOne").mockResolvedValue({ deletedCount: 1 });
    jest.spyOn(UserCourseModel, "updateMany").mockResolvedValue({ modifiedCount: 0 });
    jest.spyOn(LexicalItemModel, "updateMany").mockResolvedValue({ modifiedCount: 0 });
    jest.spyOn(MultiLingualConversationModel, "updateMany").mockResolvedValue({ modifiedCount: 0 });
    jest.spyOn(StoryNodeModel, "updateMany").mockResolvedValue({ modifiedCount: 0 });

    const res = await request(app)
      .delete(`/api/words/${FAKE_WORD_ID}`)
      .set("x-auth-token", FAKE_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const [filter] = deleteOneSpy.mock.calls[0];
    expect(filter._id).toBe(FAKE_WORD_ID);
  });

  it("removes the word from all UserCourse subscribed words lists", async () => {
    jest.spyOn(LexicalItemModel, "deleteOne").mockResolvedValue({ deletedCount: 1 });
    const userCourseUpdateSpy = jest.spyOn(UserCourseModel, "updateMany").mockResolvedValue({ modifiedCount: 1 });
    jest.spyOn(LexicalItemModel, "updateMany").mockResolvedValue({ modifiedCount: 0 });
    jest.spyOn(MultiLingualConversationModel, "updateMany").mockResolvedValue({ modifiedCount: 0 });
    jest.spyOn(StoryNodeModel, "updateMany").mockResolvedValue({ modifiedCount: 0 });

    await request(app)
      .delete(`/api/words/${FAKE_WORD_ID}`)
      .set("x-auth-token", FAKE_TOKEN);

    expect(userCourseUpdateSpy).toHaveBeenCalledTimes(1);
    const [, update] = userCourseUpdateSpy.mock.calls[0];
    expect(update.$pull.words._id.toString()).toBe(FAKE_WORD_ID);
  });

  it("removes the word from all LexicalItem translation cross-references", async () => {
    jest.spyOn(LexicalItemModel, "deleteOne").mockResolvedValue({ deletedCount: 1 });
    jest.spyOn(UserCourseModel, "updateMany").mockResolvedValue({ modifiedCount: 0 });
    const lexicalUpdateSpy = jest.spyOn(LexicalItemModel, "updateMany").mockResolvedValue({ modifiedCount: 1 });
    jest.spyOn(MultiLingualConversationModel, "updateMany").mockResolvedValue({ modifiedCount: 0 });
    jest.spyOn(StoryNodeModel, "updateMany").mockResolvedValue({ modifiedCount: 0 });

    await request(app)
      .delete(`/api/words/${FAKE_WORD_ID}`)
      .set("x-auth-token", FAKE_TOKEN);

    expect(lexicalUpdateSpy).toHaveBeenCalledTimes(1);
    const [, update] = lexicalUpdateSpy.mock.calls[0];
    expect(update.$pull["translations.$[].lexicalItems"].toString()).toBe(FAKE_WORD_ID);
  });

  it("removes the word from all conversation sentence prerequisites", async () => {
    jest.spyOn(LexicalItemModel, "deleteOne").mockResolvedValue({ deletedCount: 1 });
    jest.spyOn(UserCourseModel, "updateMany").mockResolvedValue({ modifiedCount: 0 });
    jest.spyOn(LexicalItemModel, "updateMany").mockResolvedValue({ modifiedCount: 0 });
    const conversationUpdateSpy = jest.spyOn(MultiLingualConversationModel, "updateMany").mockResolvedValue({ modifiedCount: 1 });
    jest.spyOn(StoryNodeModel, "updateMany").mockResolvedValue({ modifiedCount: 0 });

    await request(app)
      .delete(`/api/words/${FAKE_WORD_ID}`)
      .set("x-auth-token", FAKE_TOKEN);

    expect(conversationUpdateSpy).toHaveBeenCalledTimes(1);
    const [, update] = conversationUpdateSpy.mock.calls[0];
    expect(update.$pull["conversations.$[].sentences.$[].prerequisites"].toString()).toBe(FAKE_WORD_ID);
  });

  it("removes the word from all story node prerequisites", async () => {
    jest.spyOn(LexicalItemModel, "deleteOne").mockResolvedValue({ deletedCount: 1 });
    jest.spyOn(UserCourseModel, "updateMany").mockResolvedValue({ modifiedCount: 0 });
    jest.spyOn(LexicalItemModel, "updateMany").mockResolvedValue({ modifiedCount: 0 });
    jest.spyOn(MultiLingualConversationModel, "updateMany").mockResolvedValue({ modifiedCount: 0 });
    const storyNodeUpdateSpy = jest.spyOn(StoryNodeModel, "updateMany").mockResolvedValue({ modifiedCount: 1 });

    await request(app)
      .delete(`/api/words/${FAKE_WORD_ID}`)
      .set("x-auth-token", FAKE_TOKEN);

    expect(storyNodeUpdateSpy).toHaveBeenCalledTimes(1);
    const [, update] = storyNodeUpdateSpy.mock.calls[0];
    expect(update.$pull.prerequisites.toString()).toBe(FAKE_WORD_ID);
  });
});
