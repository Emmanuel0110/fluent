/**
 * Central logger for dev and production.
 *
 * - Development: human-readable output (pino-pretty).
 * - Production: JSON one line per log (for aggregators).
 *   Auth headers and common secret keys are redacted in production.
 *
 * Env:
 *   LOG_LEVEL  optional  "debug" | "info" | "warn" | "error"  (default: debug in dev, info in prod)
 *
 * Usage (pino: object first, message second):
 *   import { logger } from "../logger.js";   // adjust path from your file
 *   logger.info({ port: 4001 }, "Server started");
 *   logger.error({ err }, "Request failed");
 *   logger.warn({ userId }, "Rate limit approaching");
 *   logger.debug({ key }, "Cache hit");        // only when LOG_LEVEL=debug (or in dev)
 *
 */

import pino from "pino";
import { createRequire } from "node:module";

const isDev = process.env.NODE_ENV !== "production";
const level = process.env.LOG_LEVEL || (isDev ? "debug" : "info");

const options = {
  level,
  base: isDev ? undefined : { pid: process.pid },
  // In production, redact potential secrets from serialized objects
  redact: isDev ? [] : ["req.headers.authorization", "req.headers['x-auth-token']", "password"],
};

if (isDev) {
  // pino-pretty is a devDependency and may be absent (e.g. a production install
  // running with NODE_ENV unset). Only enable the transport if it can be resolved,
  // otherwise fall back to plain JSON instead of crashing at startup.
  const require = createRequire(import.meta.url);
  try {
    require.resolve("pino-pretty");
    options.transport = {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:HH:MM:ss",
        ignore: "pid,hostname",
      },
    };
  } catch {
    // pino-pretty not installed — keep default JSON output
  }
}

export const logger = pino(options);
