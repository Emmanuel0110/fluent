# Score Update Script

This script updates user scores and daily score history for all user courses. It should be run once per day.

## Running the Script

### Manual Execution

```bash
npm run update-scores
```

### Automated Execution (Cron)

Set up a cron job to run this script once per day (e.g., at midnight):

#### Linux/Mac (Crontab)

```bash
# Edit crontab
crontab -e

# Add this line to run at midnight every day
0 0 * * * cd /path/to/fluent-backend && npm run update-scores >> logs/score-update.log 2>&1
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
   - Words that are not overdue for review (`nextReviewDate` is in the future)
   - Weighted by their `reviewDelayInMs` (longer delays = higher score)
   - Formula: Score = sum of (reviewDelayInMs / 1000) for all non-overdue words
3. **Updates or adds today's score** to the `dailyScores` array
4. **Keeps only the last 7 days** of history
5. **Updates the course** with the new score and daily scores

## Score to Rank Conversion

- **Beginner**: 0-100
- **Amateur**: 101-300
- **Advanced**: 301-800
- **Expert**: 801+

## Notes

- The script is idempotent - safe to run multiple times per day
- If run multiple times on the same day, it will update today's score
- Duplicate daily score entries for the same day are automatically handled
