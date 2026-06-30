# Score Update Script

This script updates user scores and daily score history for all user courses. It should be run once per day.

## Automated Execution (in-app scheduler)

The daily jobs run **in-process** via `node-cron`, started by `startScheduler()` in
[`src/scheduler.js`](../scheduler.js) when the server boots (after the MongoDB connection
opens):

- **00:05** — `update-scores`: records the previous day's end-of-day score for every user course.
- **00:10** — `cleanup-data`: deletes old feedback and inactive accounts (runs after the score update).

Because they run inside the backend process, they keep working as long as the server is up —
there is no reliance on an external OS cron that can silently stop. The timezone defaults to `Europe/Paris` and can be
overridden with the `TZ` environment variable. Each job is wrapped so a failure is logged but
never crashes the server.

> **Note:** the score is computed from each word's _current_ review state, so a day that is
> never recorded cannot be backfilled — its data is lost. Keep the server running across
> midnight, or run the manual command below to capture the most recent missing day.

## Running the Script Manually

```bash
npm run update-scores
```

This opens its own database connection, records yesterday's score, and exits. Safe to run
multiple times (idempotent for the same day). The cleanup job has an equivalent manual
command, `npm run cleanup-data` (add `-- --dry-run` to preview without deleting).

## Automated Execution (legacy external cron)

Only needed if you prefer an external scheduler instead of the in-app one above. If you use
this, **remove the matching in-app job** from `src/scheduler.js` so the work doesn't run
twice. Note that `>>` does **not** create the `logs/` directory — if it is missing the
redirection fails and the command never runs, so create it (or prefix the line with
`mkdir -p logs &&`).

```bash
# Edit crontab
crontab -e

# Run at midnight every day
0 0 * * * cd /path/to/fluent-backend && mkdir -p logs && npm run update-scores >> logs/score-update.log 2>&1
# Run 5 min later (after score update)
5 0 * * * cd /path/to/fluent-backend && mkdir -p logs && npm run cleanup-data >> logs/cleanup-data.log 2>&1
```

#### Windows (Task Scheduler)

1. Open Task Scheduler
2. Create a new task
3. Trigger: Daily at midnight
4. Action: Start a program
   - Program: `node`
   - Arguments: `src/scripts/updateUserScores.js`
   - Start in: Full path to fluent-backend directory

## What the Script Does

1. **Fetches all user courses** from the database
2. **Calculates the score** for each course based on:
   - Counts words that are not overdue for review (`nextReviewDate` is in the future)
   - Only includes words with `reviewDelayInMs >= 60000` (at least 1 minute)
3. **Updates or adds yesterday's score** to the `dailyScores` array
4. **Keeps only the last 7 days** of history
5. **Updates the course** with the new score and daily scores

**Note:** When run at midnight via cron, this captures the end-of-day score for the previous day.

## Score to Rank Conversion

- **Beginner**: 0-100
- **Amateur**: 101-300
- **Advanced**: 301-800
- **Expert**: 801+

## Notes

- The script calculates and records the score for **yesterday** (previous day)
- When run at midnight via cron, it captures the end-of-day state from the previous day
- The script is idempotent - safe to run multiple times
- If run multiple times, it will update yesterday's score entry
- Duplicate daily score entries for the same day are automatically handled
