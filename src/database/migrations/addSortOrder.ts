/**
 * Migration to add sort_order column to tasks table
 *
 * This migration:
 * 1. Adds sort_order column to existing tasks table
 * 2. Initializes sort_order based on created_at (oldest = 0, newest = highest)
 * 3. Creates index for sort_order
 */

import * as SQLite from 'expo-sqlite';
import logger from '../../utils/logger';

export const addSortOrder = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  try {
    logger.info('DATA', 'Running sort_order migration');

    // Check if sort_order column exists in tasks table
    const tableInfo = await db.getAllAsync("PRAGMA table_info(tasks)");
    const columnNames = tableInfo.map((col: any) => col.name);

    if (!columnNames.includes('sort_order')) {
      // Add sort_order column
      await db.execAsync(`
        ALTER TABLE tasks ADD COLUMN sort_order INTEGER DEFAULT 0;
      `);

      logger.info('DATA', 'Added sort_order column to tasks table');

      // Initialize sort_order based on created_at (oldest first = lowest number)
      // This gives us the order: oldest task = 0, next oldest = 1, etc.
      const tasks = await db.getAllAsync<{ id: string; created_at: string }>(
        "SELECT id, created_at FROM tasks ORDER BY created_at ASC"
      );

      for (let i = 0; i < tasks.length; i++) {
        await db.runAsync(
          "UPDATE tasks SET sort_order = ? WHERE id = ?",
          i,
          tasks[i].id
        );
      }

      logger.info('DATA', 'Initialized sort_order for existing tasks', { count: tasks.length });
    } else {
      logger.debug('DATA', 'sort_order column already exists, skipping column creation');
    }

    // Always ensure index exists (for both fresh installs and migrations)
    await db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_tasks_sort_order ON tasks(sort_order);
    `);
    logger.debug('DATA', 'Ensured sort_order index exists');

    logger.info('DATA', 'Sort order migration completed successfully');
  } catch (error) {
    logger.error('DATA', 'Failed to run sort_order migration', { error });
    // Don't throw - allow app to continue even if migration fails
  }
};
