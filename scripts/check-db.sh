#!/bin/bash

# Find the database file
DB_PATH=$(find ~/Library -name "green_streak.db" 2>/dev/null | head -1)

if [ -z "$DB_PATH" ]; then
    echo "Database not found. Trying alternative locations..."
    DB_PATH=$(find . -name "green_streak.db" 2>/dev/null | head -1)
fi

if [ -z "$DB_PATH" ]; then
    echo "Could not find green_streak.db"
    exit 1
fi

echo "Found database at: $DB_PATH"
echo ""
echo "=== Tasks Table Streak Columns ==="
sqlite3 "$DB_PATH" "PRAGMA table_info(tasks);" | grep streak

echo ""
echo "=== Sample Tasks with Streak Settings ==="
sqlite3 "$DB_PATH" "SELECT id, name, streak_enabled, streak_skip_weekends, streak_minimum_count FROM tasks WHERE archived_at IS NULL LIMIT 3;"

echo ""
echo "=== Streaks Table Count ==="
sqlite3 "$DB_PATH" "SELECT COUNT(*) as count FROM streaks;" 2>/dev/null || echo "Streaks table may not exist"

echo ""
echo "=== Sample Streak Records ==="
sqlite3 "$DB_PATH" "SELECT s.task_id, t.name, s.current_streak, s.best_streak, s.last_completion_date FROM streaks s JOIN tasks t ON s.task_id = t.id LIMIT 3;" 2>/dev/null || echo "No streak records found"