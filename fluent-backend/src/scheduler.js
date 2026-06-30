import cron from "node-cron";
import { updateAllUserScores } from "./scripts/updateUserScores.js";
import { logger } from "./logger.js";

// Run daily at 00:05 server time. Records the previous day's end-of-day score
// for every user course. Runs in-process so it fires as long as the backend is
// up — no reliance on an external OS cron that can silently stop.
const DAILY_SCORE_UPDATE = "5 0 * * *";

let scheduledTask = null;

export function startScheduler() {
  if (scheduledTask) {
    logger.warn("Scheduler already started; skipping");
    return scheduledTask;
  }

  scheduledTask = cron.schedule(
    DAILY_SCORE_UPDATE,
    async () => {
      logger.info("Running scheduled daily score update");
      try {
        await updateAllUserScores();
      } catch (error) {
        // updateAllUserScores already logs per-course errors; this guards the
        // cron callback so a failure never crashes the process.
        logger.error({ err: error }, "Scheduled daily score update failed");
      }
    },
    { timezone: process.env.TZ || "Europe/Paris" }
  );

  logger.info({ schedule: DAILY_SCORE_UPDATE }, "Daily score update scheduled");
  return scheduledTask;
}
