/**
 * Migration to add achievements support to the database
 *
 * This migration:
 * 1. Creates the unlocked_achievements table
 * 2. Creates the achievement_progress table
 * 3. Creates necessary indexes
 */

import * as SQLite from 'expo-sqlite';
import logger from '../../utils/logger';

export const addAchievementsSupport = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    logger.info('DATA', 'Running achievements migration');

    // Check if unlocked_achievements table already exists
    const tableCheck = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='unlocked_achievements'"
    );

    if (tableCheck) {
      logger.info('DATA', 'Achievement tables already exist, skipping migration');
      return;
    }

    // Create unlocked_achievements table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS unlocked_achievements (
        id TEXT PRIMARY KEY,
        achievement_id TEXT NOT NULL UNIQUE,
        unlocked_at TEXT NOT NULL,
        task_id TEXT,
        metadata TEXT,
        viewed INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_unlocked_achievement_id
        ON unlocked_achievements(achievement_id);

      CREATE INDEX IF NOT EXISTS idx_unlocked_viewed
        ON unlocked_achievements(viewed)
        WHERE viewed = 0;

      CREATE INDEX IF NOT EXISTS idx_unlocked_at
        ON unlocked_achievements(unlocked_at);
    `);

    logger.info('DATA', 'Unlocked achievements table created');

    // Create achievement_progress table
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS achievement_progress (
        id TEXT PRIMARY KEY,
        achievement_id TEXT NOT NULL UNIQUE,
        current_value INTEGER NOT NULL DEFAULT 0,
        target_value INTEGER NOT NULL DEFAULT 1,
        percentage INTEGER NOT NULL DEFAULT 0,
        last_updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_progress_achievement_id
        ON achievement_progress(achievement_id);
    `);

    logger.info('DATA', 'Achievement progress table created');
    logger.info('DATA', 'Achievements migration completed successfully');
  } catch (error) {
    logger.error('DATA', 'Failed to run achievements migration', { error });
    // Don't throw - allow app to continue even if migration fails
  }
};
