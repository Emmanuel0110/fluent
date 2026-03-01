// @ts-nocheck
import { jest } from "@jest/globals";
import request from "supertest";
import app from "../app.js";
import { UserModel, UserCourseModel, LanguageModel } from "../models.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const FAKE_USER_ID = "64a1b2c3d4e5f6a7b8c9d0e1";

function fakeSavedUser(overrides = {}) {
  return {
    _id: FAKE_USER_ID,
    username: "testuser",
    courses: [],
    lastCourseId: null,
    password: "hashed_password",
    userSettings: { reviewMode: "manual", autoReviewDelay: 10 },
    ...overrides,
  };
}

function fakeCourse() {
  return { _id: "courseId", sourceLanguage: "langFrId", targetLanguage: "langEnId" };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("POST /api/users (register)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
    jest.spyOn(jwt, "sign").mockReturnValue("test-token");
    jest.spyOn(bcrypt, "genSalt").mockResolvedValue("salt");
    jest.spyOn(bcrypt, "hash").mockResolvedValue("hashed_password");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 409 when username already exists", async () => {
    jest.spyOn(UserModel, "findOne").mockResolvedValue({ username: "testuser" });

    const res = await request(app)
      .post("/api/users")
      .send({ username: "testuser", password: "password123" });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already exists/i);
  });

  it("returns 200 with token and user on successful registration", async () => {
    jest.spyOn(UserModel, "findOne").mockResolvedValue(null);

    const saved = fakeSavedUser();
    jest.spyOn(UserModel.prototype, "save").mockResolvedValue({ ...saved, toObject: () => ({ ...saved }) });

    jest.spyOn(LanguageModel, "find").mockReturnValue({
      select: jest.fn().mockResolvedValue([
        { _id: "langFrId", label: "fr" },
        { _id: "langEnId", label: "en" },
      ]),
    });
    jest.spyOn(UserCourseModel.prototype, "save").mockResolvedValue(fakeCourse());
    jest.spyOn(UserModel, "findByIdAndUpdate").mockResolvedValue(saved);

    const res = await request(app)
      .post("/api/users")
      .send({ username: "newuser", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe("test-token");
    expect(res.body.user).toBeDefined();
    expect(res.body.user.password).toBeUndefined();
  });
});

describe("POST /api/users/auth (login)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = "test-secret";
    jest.spyOn(jwt, "sign").mockReturnValue("test-token");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns 401 when user not found", async () => {
    jest.spyOn(UserModel, "findOne").mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
    });

    const res = await request(app)
      .post("/api/users/auth")
      .send({ username: "nobody", password: "pass" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns 401 when password does not match", async () => {
    const existingUser = fakeSavedUser({ password: "hashed" });
    jest.spyOn(UserModel, "findOne").mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(existingUser) }),
    });
    jest.spyOn(bcrypt, "compare").mockResolvedValue(false);

    const res = await request(app)
      .post("/api/users/auth")
      .send({ username: "testuser", password: "wrongpass" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns 200 with token on successful login", async () => {
    const existingUser = fakeSavedUser();
    jest.spyOn(UserModel, "findOne").mockReturnValue({
      select: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(existingUser) }),
    });
    jest.spyOn(bcrypt, "compare").mockResolvedValue(true);

    jest.spyOn(LanguageModel, "find").mockReturnValue({
      select: jest.fn().mockResolvedValue([
        { _id: "langFrId", label: "fr" },
        { _id: "langEnId", label: "en" },
      ]),
    });
    jest.spyOn(UserCourseModel.prototype, "save").mockResolvedValue(fakeCourse());
    jest.spyOn(UserModel, "findByIdAndUpdate").mockResolvedValue(existingUser);

    const res = await request(app)
      .post("/api/users/auth")
      .send({ username: "testuser", password: "password123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe("test-token");
    expect(res.body.user).toBeDefined();
    expect(res.body.user.password).toBeUndefined();
  });
});
