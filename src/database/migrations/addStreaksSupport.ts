/**
 * Migration to add streak support to existing database
 * 
 * This migration:
 * 1. Adds streak columns to existing tasks table
 * 2. Creates the streaks table if it doesn't exist
 * 3. Initializes streak data for existing tasks
 */

import * as SQLite from 'expo-sqlite';
import logger from '../../utils/logger';
import uuid from 'react-native-uuid';

export const addStreaksSupport = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  
  try {
    logger.info('DATA', 'Running streaks migration');
    
    // Check if streak columns exist in tasks table
    const tableInfo = await db.getAllAsync("PRAGMA table_info(tasks)");
    const columnNames = tableInfo.map((col: any) => col.name);
    
    // Add streak columns if they don't exist
    if (!columnNames.includes('streak_enabled')) {
      await db.execAsync(`
        ALTER TABLE tasks ADD COLUMN streak_enabled BOOLEAN DEFAULT TRUE;
        ALTER TABLE tasks ADD COLUMN streak_skip_weekends BOOLEAN DEFAULT FALSE;
        ALTER TABLE tasks ADD COLUMN streak_skip_days TEXT;
        ALTER TABLE tasks ADD COLUMN streak_minimum_count INTEGER DEFAULT 1;
      `);
      
      logger.info('DATA', 'Added streak columns to tasks table');
    }
    
    // Create streaks table if it doesn't exist
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS streaks (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL UNIQUE,
        current_streak INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0,
        last_completion_date TEXT,
        streak_start_date TEXT,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_streaks_task ON streaks(task_id);
      CREATE INDEX IF NOT EXISTS idx_streaks_last_completion ON streaks(last_completion_date);
      CREATE INDEX IF NOT EXISTS idx_streaks_current ON streaks(current_streak) WHERE current_streak > 0;
    `);
    
    logger.info('DATA', 'Streaks table created/verified');
    
    // Initialize streak records for existing tasks
    const tasks = await db.getAllAsync<{ id: string }>("SELECT id FROM tasks WHERE archived_at IS NULL");
    
    for (const task of tasks) {
      // Check if streak record already exists
      const existingStreak = await db.getFirstAsync(
        "SELECT id FROM streaks WHERE task_id = ?",
        task.id
      );
      
      if (!existingStreak) {
        // Create initial streak record
        const streakId = uuid.v4() as string;
        const updatedAt = new Date().toISOString();
        
        await db.runAsync(
          `INSERT INTO streaks (id, task_id, current_streak, best_streak, updated_at) 
           VALUES (?, ?, 0, 0, ?)`,
          streakId,
          task.id,
          updatedAt
        );
        
        logger.debug('DATA', 'Created streak record for task', { taskId: task.id });
      }
    }
    
    logger.info('DATA', 'Streaks migration completed successfully');
  } catch (error) {
    logger.error('DATA', 'Failed to run streaks migration', { error });
    // Don't throw - allow app to continue even if migration fails
  }
};