/**
 * Migration to add custom goals support to the database
 *
 * This migration:
 * 1. Creates the custom_goal_definitions table for user-created goals
 * 2. Creates a partial index for efficient querying of active (non-deleted) goals
 */

import * as SQLite from 'expo-sqlite';
import logger from '../../utils/logger';

export const addCustomGoals = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    logger.info('DATA', 'Running custom goals migration');

    // Check if custom_goal_definitions table already exists
    const tableCheck = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='custom_goal_definitions'"
    );

    if (tableCheck) {
      logger.info('DATA', 'Custom goals table already exists, skipping migration');
      return;
    }

    // Create custom_goal_definitions table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS custom_goal_definitions (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        emoji TEXT NOT NULL,
        color TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        icon TEXT NOT NULL DEFAULT 'target',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        deleted_at TEXT
      );
    `);

    logger.info('DATA', 'Custom goal definitions table created');

    // Create partial index for efficient querying of active goals
    // This optimizes the common query: WHERE deleted_at IS NULL
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_custom_goal_active
        ON custom_goal_definitions(created_at)
        WHERE deleted_at IS NULL;
    `);

    logger.info('DATA', 'Custom goals partial index created');
    logger.info('DATA', 'Custom goals migration completed successfully');
  } catch (error) {
    logger.error('DATA', 'Failed to run custom goals migration', { error });
    // Don't throw - allow app to continue even if migration fails
  }
};
