/**
 * Migration to add goals support to the database
 *
 * This migration:
 * 1. Creates the user_goals table for selected goals
 * 2. Creates the goal_habits junction table for goal-habit links
 * 3. Creates necessary indexes
 */

import * as SQLite from 'expo-sqlite';
import logger from '../../utils/logger';

export const addGoalsSupport = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    logger.info('DATA', 'Running goals migration');

    // Check if user_goals table already exists
    const tableCheck = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='user_goals'"
    );

    if (tableCheck) {
      logger.info('DATA', 'Goal tables already exist, skipping migration');
      return;
    }

    // Create user_goals table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_goals (
        id TEXT PRIMARY KEY,
        goal_id TEXT NOT NULL,
        is_primary INTEGER DEFAULT 0,
        selected_at TEXT NOT NULL,
        archived_at TEXT,
        sort_order INTEGER DEFAULT 0,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_user_goals_goal_id
        ON user_goals(goal_id);

      CREATE INDEX IF NOT EXISTS idx_user_goals_selected
        ON user_goals(selected_at);

      CREATE INDEX IF NOT EXISTS idx_user_goals_primary
        ON user_goals(is_primary)
        WHERE is_primary = 1;
    `);

    logger.info('DATA', 'User goals table created');

    // Create goal_habits junction table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS goal_habits (
        goal_id TEXT NOT NULL,
        task_id TEXT NOT NULL,
        linked_at TEXT NOT NULL,
        PRIMARY KEY (goal_id, task_id),
        FOREIGN KEY (goal_id) REFERENCES user_goals(id) ON DELETE CASCADE,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_goal_habits_goal_id
        ON goal_habits(goal_id);

      CREATE INDEX IF NOT EXISTS idx_goal_habits_task_id
        ON goal_habits(task_id);
    `);

    logger.info('DATA', 'Goal habits table created');
    logger.info('DATA', 'Goals migration completed successfully');
  } catch (error) {
    logger.error('DATA', 'Failed to run goals migration', { error });
    // Don't throw - allow app to continue even if migration fails
  }
};
