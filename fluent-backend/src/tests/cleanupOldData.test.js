// @ts-nocheck
import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { dateToObjectId } from "../scripts/cleanupOldData.js";

describe("dateToObjectId", () => {
  test("round-trips: timestamp extracted from ObjectId matches input date (seconds precision)", () => {
    const date = new Date("2023-01-15T00:00:00.000Z");
    const oid = dateToObjectId(date);
    // ObjectId embeds time at second precision, so truncate ms before comparing
    const expected = Math.floor(date.getTime() / 1000) * 1000;
    expect(oid.getTimestamp().getTime()).toBe(expected);
  });

  test("returns a valid ObjectId", () => {
    const oid = dateToObjectId(new Date());
    expect(oid).toBeInstanceOf(mongoose.Types.ObjectId);
  });

  test("produced ObjectId is strictly in the past relative to now", () => {
    const cutoff = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000);
    expect(dateToObjectId(cutoff).getTimestamp().getTime()).toBeLessThan(Date.now());
  });

  test("ObjectId from cutoff is less than ObjectId from a more recent date", () => {
    const older = new Date("2022-01-01T00:00:00.000Z");
    const newer = new Date("2024-01-01T00:00:00.000Z");
    // String comparison on hex ObjectIds preserves temporal order
    expect(dateToObjectId(older).toString() < dateToObjectId(newer).toString()).toBe(true);
  });
});
