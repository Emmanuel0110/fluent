import cron from "node-cron";
import { updateAllUserScores } from "./scripts/updateUserScores.js";
import { cleanupOldData } from "./scripts/cleanupOldData.js";
import { logger } from "./logger.js";

// Daily jobs, run in-process so they fire as long as the backend is up — no
// reliance on an external OS cron that can silently stop.
//   00:05 — record the previous day's end-of-day score for every user course.
//   00:10 — delete old feedback and inactive accounts (runs after the score
//           update, preserving the original cron ordering).
const DAILY_SCORE_UPDATE = "5 0 * * *";
const DAILY_CLEANUP = "10 0 * * *";

const tasks = [];

// Wrap a job so a failure is logged but never crashes the cron callback / process.
function runSafely(name, job) {
  return async () => {
    logger.info({ job: name }, "Running scheduled job");
    try {
      await job();
    } catch (error) {
      logger.error({ err: error, job: name }, "Scheduled job failed");
    }
  };
}

export function startScheduler() {
  if (tasks.length) {
    logger.warn("Scheduler already started; skipping");
    return tasks;
  }

  const timezone = process.env.TZ || "Europe/Paris";

  tasks.push(
    cron.schedule(DAILY_SCORE_UPDATE, runSafely("update-scores", updateAllUserScores), { timezone }),
    cron.schedule(DAILY_CLEANUP, runSafely("cleanup-data", () => cleanupOldData({ dryRun: false })), { timezone }),
  );

  logger.info(
    { scoreUpdate: DAILY_SCORE_UPDATE, cleanup: DAILY_CLEANUP, timezone },
    "Daily jobs scheduled",
  );
  return tasks;
}
