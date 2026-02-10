import * as SQLite from 'expo-sqlite';
import { CREATE_TABLES, DEFAULT_SETTINGS } from './schema';
import { addStreaksSupport } from './migrations/addStreaksSupport';
import { addSortOrder } from './migrations/addSortOrder';
import { addAchievementsSupport } from './migrations/addAchievementsSupport';
import { addReminderText } from './migrations/addReminderText';
import { addReminderDayOfWeek } from './migrations/addReminderDayOfWeek';
import { addAchievementGridSupport } from './migrations/addAchievementGridSupport';
import logger from '../utils/logger';

let database: SQLite.SQLiteDatabase;

export const initializeDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  try {
    logger.info('DATA', 'Initializing database');
    
    database = await SQLite.openDatabaseAsync('green_streak.db');
    
    await database.execAsync(CREATE_TABLES);
    logger.info('DATA', 'Database tables created successfully');
    
    // Initialize default settings
    await initializeDefaultSettings();
    
    // Run migrations
    await addStreaksSupport(database);
    await addSortOrder(database);
    await addAchievementsSupport(database);
    await addReminderText(database);
    await addReminderDayOfWeek(database);
    await addAchievementGridSupport(database);

    logger.info('DATA', 'Database initialized successfully');
    
    return database;
  } catch (error) {
    logger.fatal('DATA', 'Critical database initialization error', { error });
    throw error;
  }
};

const initializeDefaultSettings = async (): Promise<void> => {
  try {
    for (const setting of DEFAULT_SETTINGS) {
      await database.runAsync(
        'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
        setting.key,
        setting.value
      );
    }
    logger.debug('DATA', 'Default settings initialized');
  } catch (error: any) {
    logger.error('DATA', 'Failed to initialize default settings', { error: error.message });
    throw error;
  }
};

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!database) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return database;
};

export const closeDatabase = async (): Promise<void> => {
  if (database) {
    logger.info('DATA', 'Closing database connection');
    await database.closeAsync();
  }
};