/**
 * Migration to add reminder_text column to tasks table
 *
 * This migration adds a reminder_text column that allows users
 * to customize the notification body text for each habit.
 */

import * as SQLite from 'expo-sqlite';
import logger from '../../utils/logger';

export const addReminderText = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    logger.info('DATA', 'Running reminder_text migration');

    // Check if reminder_text column exists in tasks table
    const tableInfo = await db.getAllAsync("PRAGMA table_info(tasks)");
    const columnNames = tableInfo.map((col: any) => col.name);

    if (!columnNames.includes('reminder_text')) {
      // Add reminder_text column
      await db.execAsync(`
        ALTER TABLE tasks ADD COLUMN reminder_text TEXT;
      `);

      logger.info('DATA', 'Added reminder_text column to tasks table');
    } else {
      logger.debug('DATA', 'reminder_text column already exists, skipping');
    }

    logger.info('DATA', 'Reminder text migration completed successfully');
  } catch (error) {
    logger.error('DATA', 'Failed to run reminder_text migration', { error });
    // Don't throw - allow app to continue even if migration fails
  }
};
