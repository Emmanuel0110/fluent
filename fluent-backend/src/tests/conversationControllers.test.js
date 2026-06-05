// @ts-nocheck
import { jest } from "@jest/globals";
import request from "supertest";
import app from "../app.js";
import { MultiLingualConversationModel, UserCourseModel } from "../models.js";
import jwt from "jsonwebtoken";

const FAKE_CONVERSATION_ID = "64a1b2c3d4e5f6a7b8c9d0e1";
const FAKE_TOKEN = "fake-token";

describe("DELETE /api/conversations/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
    jest.spyOn(jwt, "verify").mockReturnValue({ _id: "userId123" });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 401 when no auth token is provided", async () => {
    const res = await request(app).delete(`/api/conversations/${FAKE_CONVERSATION_ID}`);

    expect(res.status).toBe(401);
  });

  it("returns 400 when conversation ID is not a valid ObjectId", async () => {
    const res = await request(app)
      .delete("/api/conversations/not-a-valid-id")
      .set("x-auth-token", FAKE_TOKEN);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("deletes the conversation document from the database", async () => {
    jest.spyOn(MultiLingualConversationModel, "deleteOne").mockResolvedValue({ deletedCount: 1 });
    jest.spyOn(UserCourseModel, "updateMany").mockResolvedValue({ modifiedCount: 0 });

    const res = await request(app)
      .delete(`/api/conversations/${FAKE_CONVERSATION_ID}`)
      .set("x-auth-token", FAKE_TOKEN);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const [deleteFilter] = MultiLingualConversationModel.deleteOne.mock.calls[0];
    expect(deleteFilter._id).toBe(FAKE_CONVERSATION_ID);
  });

  it("removes the conversation from all UserCourse wishLists and subscribed conversations", async () => {
    jest.spyOn(MultiLingualConversationModel, "deleteOne").mockResolvedValue({ deletedCount: 1 });
    const updateManySpy = jest.spyOn(UserCourseModel, "updateMany").mockResolvedValue({ modifiedCount: 2 });

    await request(app)
      .delete(`/api/conversations/${FAKE_CONVERSATION_ID}`)
      .set("x-auth-token", FAKE_TOKEN);

    expect(updateManySpy).toHaveBeenCalledTimes(1);

    const [filter, update] = updateManySpy.mock.calls[0];
    expect(filter).toEqual({});
    expect(update.$pull.wishListConversations.toString()).toBe(FAKE_CONVERSATION_ID);
    expect(update.$pull.conversations._id.toString()).toBe(FAKE_CONVERSATION_ID);
  });
});
