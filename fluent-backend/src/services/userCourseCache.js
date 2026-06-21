import { UserCourseModel } from "../models.js";

export const USER_COURSE_CACHE_TTL_SECONDS = 3600;

// A userCourse is cached as JSON, which flattens every ObjectId and Date down to
// a string. These two functions are the single boundary for that conversion, so
// a userCourse read from cache is shape-identical to one read from Mongo: every
// id is an ObjectId, every date a Date. Consumers can therefore rely on ObjectId
// semantics everywhere (e.g. `a.equals(b)`) instead of defending against values
// that might be either a string or an ObjectId.
export function serializeUserCourse(userCourse) {
  return JSON.stringify(userCourse);
}

export function deserializeUserCourse(json) {
  // The model constructor casts the plain JSON back to the schema's types.
  return new UserCourseModel(JSON.parse(json)).toObject();
}
