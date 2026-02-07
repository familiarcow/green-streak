/**
 * Migration to add reminder_day_of_week column to tasks table
 *
 * This migration adds a reminder_day_of_week column that allows users
 * to specify which day of the week a weekly reminder should fire.
 * Values: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
 * Default: 1 (Monday)
 */

import * as SQLite from 'expo-sqlite';
import logger from '../../utils/logger';

export const addReminderDayOfWeek = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    logger.info('DATA', 'Running reminder_day_of_week migration');

    // Check if reminder_day_of_week column exists in tasks table
    const tableInfo = await db.getAllAsync("PRAGMA table_info(tasks)");
    const columnNames = tableInfo.map((col: any) => col.name);

    if (!columnNames.includes('reminder_day_of_week')) {
      // Add reminder_day_of_week column with default value of 1 (Monday)
      await db.execAsync(`
        ALTER TABLE tasks ADD COLUMN reminder_day_of_week INTEGER DEFAULT 1;
      `);

      logger.info('DATA', 'Added reminder_day_of_week column to tasks table');
    } else {
      logger.debug('DATA', 'reminder_day_of_week column already exists, skipping');
    }

    logger.info('DATA', 'Reminder day of week migration completed successfully');
  } catch (error) {
    logger.error('DATA', 'Failed to run reminder_day_of_week migration', { error });
    // Don't throw - allow app to continue even if migration fails
  }
};
