import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DataExportService, { ImportResult } from '../services/DataExportService';
import { getDatabase } from '../database';
import { getNotificationService, getAchievementService } from '../services';
import logger from '../utils/logger';

interface DataState {
  isExporting: boolean;
  isImporting: boolean;
  isClearing: boolean;
  lastExportDate?: string;
  lastImportDate?: string;
  exportData: (onComplete?: (success: boolean, filePath?: string, error?: string) => void) => Promise<void>;
  importData: (onComplete?: (result: ImportResult) => void) => Promise<void>;
  clearAllData: () => Promise<{ success: boolean; error?: string }>;
}

export const useDataStore = create<DataState>((set, get) => ({
  isExporting: false,
  isImporting: false,
  isClearing: false,
  lastExportDate: undefined,
  lastImportDate: undefined,

  exportData: async (onComplete) => {
    const { isExporting, isImporting } = get();
    
    if (isExporting || isImporting) {
      logger.warn('DATA', 'Export/import already in progress');
      onComplete?.(false, undefined, 'Another operation is already in progress');
      return;
    }

    set({ isExporting: true });
    logger.info('DATA', 'Starting data export process');

    try {
      const result = await DataExportService.exportData();
      
      if (result.success) {
        set({ 
          lastExportDate: new Date().toISOString(),
          isExporting: false,
        });
        logger.info('DATA', 'Data export completed successfully');
        onComplete?.(true, result.filePath);
      } else {
        set({ isExporting: false });
        logger.error('DATA', 'Data export failed', { error: result.error });
        onComplete?.(false, undefined, result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown export error';
      set({ isExporting: false });
      logger.error('DATA', 'Data export error', { error: errorMessage });
      onComplete?.(false, undefined, errorMessage);
    }
  },

  importData: async (onComplete) => {
    const { isExporting, isImporting } = get();
    
    if (isExporting || isImporting) {
      logger.warn('DATA', 'Export/import already in progress');
      onComplete?.({
        success: false,
        message: 'Another operation is already in progress',
      });
      return;
    }

    set({ isImporting: true });
    logger.info('DATA', 'Starting data import process');

    try {
      const result = await DataExportService.importData();
      
      if (result.success) {
        set({
          lastImportDate: new Date().toISOString(),
          isImporting: false,
        });

        // Invalidate achievement cache since imported data may differ
        try {
          const achievementService = getAchievementService();
          achievementService.invalidateCache();
          logger.debug('DATA', 'AchievementService cache invalidated after import');
        } catch (cacheError) {
          logger.warn('DATA', 'Failed to invalidate achievement cache after import', { error: cacheError });
        }

        logger.info('DATA', 'Data import completed successfully');
      } else {
        set({ isImporting: false });
        logger.error('DATA', 'Data import failed', { message: result.message });
      }
      
      onComplete?.(result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown import error';
      set({ isImporting: false });
      logger.error('DATA', 'Data import error', { error: errorMessage });
      onComplete?.({
        success: false,
        message: `Import failed: ${errorMessage}`,
      });
    }
  },

  clearAllData: async () => {
    const { isExporting, isImporting, isClearing } = get();

    if (isExporting || isImporting || isClearing) {
      logger.warn('DATA', 'Cannot clear data - another operation is in progress');
      return { success: false, error: 'Another operation is in progress' };
    }

    set({ isClearing: true });
    logger.info('DATA', 'Starting clear all data process');

    try {
      // 1. Cancel all notifications
      try {
        const notificationService = getNotificationService();
        await notificationService.cancelAllNotifications();
        logger.debug('DATA', 'All notifications cancelled');
      } catch (notifError) {
        logger.warn('DATA', 'Failed to cancel notifications during clear', { error: notifError });
      }

      // 2. Clear SQLite database tables
      try {
        const db = getDatabase();
        // Delete all data from tables (order matters due to foreign keys)
        await db.runAsync('DELETE FROM logs');
        await db.runAsync('DELETE FROM goal_habits'); // FK to user_goals and tasks
        await db.runAsync('DELETE FROM user_goals');
        await db.runAsync('DELETE FROM streaks');
        await db.runAsync('DELETE FROM unlocked_achievements');
        await db.runAsync('DELETE FROM tasks');
        await db.runAsync('DELETE FROM settings');
        logger.debug('DATA', 'SQLite tables cleared');
      } catch (dbError) {
        logger.error('DATA', 'Failed to clear SQLite tables', { error: dbError });
        throw dbError;
      }

      // 3. Clear AsyncStorage (zustand persisted stores)
      try {
        const keys = await AsyncStorage.getAllKeys();
        // Filter to only clear app-related keys
        const appKeys = keys.filter(key =>
          key.startsWith('green-streak') ||
          key.startsWith('onboarding') ||
          key.startsWith('settings') ||
          key.startsWith('achievements')
        );
        if (appKeys.length > 0) {
          await AsyncStorage.multiRemove(appKeys);
        }
        logger.debug('DATA', 'AsyncStorage cleared', { keysRemoved: appKeys.length });
      } catch (asyncError) {
        logger.error('DATA', 'Failed to clear AsyncStorage', { error: asyncError });
        throw asyncError;
      }

      // 4. Reset in-memory zustand stores to trigger onboarding
      try {
        const { useOnboardingStore } = await import('./onboardingStore');
        const { useTasksStore } = await import('./tasksStore');
        const { useLogsStore } = await import('./logsStore');
        const { useSettingsStore } = await import('./settingsStore');
        const { useAchievementsStore } = await import('./achievementsStore');
        const { useStreaksStore } = await import('./streaksStore');
        const { useGoalsStore } = await import('./goalsStore');

        // Reset onboarding to trigger the flow
        useOnboardingStore.getState().resetOnboarding();

        // Clear tasks in memory
        useTasksStore.setState({ tasks: [], loading: false });

        // Clear logs in memory
        useLogsStore.setState({ contributionData: [], loading: false });

        // Reset settings to defaults
        await useSettingsStore.getState().resetSettings();

        // Clear achievements in memory
        useAchievementsStore.setState({ achievements: [], stats: null, loading: false });

        // Invalidate AchievementService cache
        try {
          const achievementService = getAchievementService();
          achievementService.invalidateCache();
          logger.debug('DATA', 'AchievementService cache invalidated');
        } catch (cacheError) {
          logger.warn('DATA', 'Failed to invalidate achievement cache', { error: cacheError });
        }

        // Clear streaks in memory
        useStreaksStore.setState({ streaks: [], loading: false });

        // Clear goals in memory
        useGoalsStore.setState({
          goals: [],
          primaryGoal: null,
          goalProgress: [],
          loading: false,
          error: null,
        });

        logger.debug('DATA', 'In-memory stores reset');
      } catch (storeError) {
        logger.warn('DATA', 'Failed to reset some in-memory stores', { error: storeError });
        // Don't throw - the main data is cleared, stores will refresh on next load
      }

      set({ isClearing: false });
      logger.info('DATA', 'All data cleared successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      set({ isClearing: false });
      logger.error('DATA', 'Failed to clear all data', { error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
}));