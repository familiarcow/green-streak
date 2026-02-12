/**
 * Migration to add goal milestones support to the database
 *
 * This migration:
 * 1. Creates the goal_milestones table for recording meaningful moments
 * 2. Creates necessary indexes for efficient queries
 */

import * as SQLite from 'expo-sqlite';
import logger from '../../utils/logger';

/** Maximum length for milestone title */
export const MILESTONE_TITLE_MAX_LENGTH = 50;

/** Maximum length for milestone description */
export const MILESTONE_DESCRIPTION_MAX_LENGTH = 500;

export const addMilestonesSupport = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    logger.info('DATA', 'Running milestones migration');

    // Check if goal_milestones table already exists
    const tableCheck = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='goal_milestones'"
    );

    if (tableCheck) {
      logger.info('DATA', 'Milestone tables already exist, skipping migration');
      return;
    }

    // Create goal_milestones table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS goal_milestones (
        id TEXT PRIMARY KEY,
        user_goal_id TEXT NOT NULL,
        date TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT,
        FOREIGN KEY (user_goal_id) REFERENCES user_goals(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_milestones_user_goal
        ON goal_milestones(user_goal_id);

      CREATE INDEX IF NOT EXISTS idx_milestones_active
        ON goal_milestones(user_goal_id, date)
        WHERE deleted_at IS NULL;
    `);

    logger.info('DATA', 'Goal milestones table created');
    logger.info('DATA', 'Milestones migration completed successfully');
  } catch (error) {
    logger.error('DATA', 'Failed to run milestones migration', { error });
    // Don't throw - allow app to continue even if migration fails
  }
};
