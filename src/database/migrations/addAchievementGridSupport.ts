/**
 * Migration to add achievement grid support to the database
 *
 * This migration creates the achievement_grid table for storing
 * the Kirby Air Ride-style achievement board layout.
 */

import * as SQLite from 'expo-sqlite';
import logger from '../../utils/logger';

export const addAchievementGridSupport = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    logger.info('DATA', 'Running achievement grid migration');

    // Check if achievement_grid table already exists
    const tableCheck = await db.getFirstAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='achievement_grid'"
    );

    if (tableCheck) {
      logger.info('DATA', 'Achievement grid table already exists, skipping migration');
      return;
    }

    // Create achievement_grid table
    // Stores the grid layout with seeded positions for each user
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS achievement_grid (
        id TEXT PRIMARY KEY,
        seed TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        positions TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_achievement_grid_seed
        ON achievement_grid(seed);
    `);

    logger.info('DATA', 'Achievement grid table created');
    logger.info('DATA', 'Achievement grid migration completed successfully');
  } catch (error) {
    logger.error('DATA', 'Failed to run achievement grid migration', { error });
    // Don't throw - allow app to continue even if migration fails
  }
};
