import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings } from '../types';
import notificationService from '../services/NotificationService';
import logger from '../utils/logger';

interface SettingsState extends AppSettings {
  // Actions
  loadSettings: () => Promise<void>;
  updateGlobalReminder: (enabled: boolean, time?: string) => Promise<void>;
  setDebugLogging: (enabled: boolean) => void;
  setLogLevel: (level: AppSettings['currentLogLevel']) => void;
  setFirstDayOfWeek: (day: AppSettings['firstDayOfWeek']) => void;
  exportSettings: () => string;
  resetSettings: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  globalReminderEnabled: false,
  globalReminderTime: '20:00',
  debugLoggingEnabled: false,
  currentLogLevel: 'WARN',
  firstDayOfWeek: 'sunday',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,

      loadSettings: async () => {
        try {
          logger.debug('STATE', 'Loading settings');
          // Settings are loaded from persistence automatically
          // This method can be used to refresh from external source if needed
          
          const state = get();
          logger.info('STATE', 'Settings loaded', {
            globalReminderEnabled: state.globalReminderEnabled,
            debugLoggingEnabled: state.debugLoggingEnabled,
          });
        } catch (error) {
          logger.error('STATE', 'Failed to load settings', { error });
        }
      },

      updateGlobalReminder: async (enabled: boolean, time?: string) => {
        const currentState = get();
        const newTime = time || currentState.globalReminderTime;

        try {
          logger.debug('STATE', 'Updating global reminder', { enabled, time: newTime });

          if (enabled && newTime) {
            // Schedule the notification
            const notificationId = await notificationService.scheduleGlobalDailyReminder(newTime, enabled);
            
            if (notificationId) {
              set({
                globalReminderEnabled: true,
                globalReminderTime: newTime,
              });
              logger.info('STATE', 'Global reminder enabled', { time: newTime, notificationId });
            } else {
              // Permission denied or other issue
              set({
                globalReminderEnabled: false,
                globalReminderTime: newTime,
              });
              logger.warn('STATE', 'Global reminder could not be enabled', { time: newTime });
            }
          } else {
            // Disable the notification
            await notificationService.cancelGlobalDailyReminder();
            set({
              globalReminderEnabled: false,
              globalReminderTime: newTime,
            });
            logger.info('STATE', 'Global reminder disabled');
          }
        } catch (error) {
          logger.error('STATE', 'Failed to update global reminder', { error, enabled, time: newTime });
          throw error;
        }
      },

      setDebugLogging: (enabled: boolean) => {
        try {
          set({ debugLoggingEnabled: enabled });
          
          // Update the logger's level based on debug setting
          const newLevel = enabled ? 'DEBUG' : 'WARN';
          logger.setLogLevel(newLevel);
          
          set({ currentLogLevel: newLevel });
          
          logger.info('STATE', 'Debug logging updated', { enabled, newLevel });
        } catch (error) {
          logger.error('STATE', 'Failed to set debug logging', { error, enabled });
        }
      },

      setLogLevel: (level: AppSettings['currentLogLevel']) => {
        try {
          set({ currentLogLevel: level });
          logger.setLogLevel(level);
          logger.info('STATE', 'Log level updated', { level });
        } catch (error) {
          logger.error('STATE', 'Failed to set log level', { error, level });
        }
      },

      setFirstDayOfWeek: (day: AppSettings['firstDayOfWeek']) => {
        try {
          set({ firstDayOfWeek: day });
          logger.info('STATE', 'First day of week updated', { day });
        } catch (error) {
          logger.error('STATE', 'Failed to set first day of week', { error, day });
        }
      },

      exportSettings: () => {
        try {
          const state = get();
          const settingsExport = {
            globalReminderEnabled: state.globalReminderEnabled,
            globalReminderTime: state.globalReminderTime,
            debugLoggingEnabled: state.debugLoggingEnabled,
            currentLogLevel: state.currentLogLevel,
            exportedAt: new Date().toISOString(),
          };
          
          const exportString = JSON.stringify(settingsExport, null, 2);
          logger.info('STATE', 'Settings exported');
          return exportString;
        } catch (error) {
          logger.error('STATE', 'Failed to export settings', { error });
          return JSON.stringify({ error: 'Export failed' });
        }
      },

      resetSettings: async () => {
        try {
          logger.debug('STATE', 'Resetting settings to defaults');
          
          // Cancel any existing notifications
          await notificationService.cancelGlobalDailyReminder();
          
          // Reset to defaults
          set(defaultSettings);
          
          logger.info('STATE', 'Settings reset to defaults');
        } catch (error) {
          logger.error('STATE', 'Failed to reset settings', { error });
          throw error;
        }
      },
    }),
    {
      name: 'green-streak-settings',
      partialize: (state) => ({
        globalReminderEnabled: state.globalReminderEnabled,
        globalReminderTime: state.globalReminderTime,
        debugLoggingEnabled: state.debugLoggingEnabled,
        currentLogLevel: state.currentLogLevel,
        firstDayOfWeek: state.firstDayOfWeek,
      }),
    }
  )
);

// Initialize settings on app start
export const initializeSettings = async () => {
  try {
    const settingsStore = useSettingsStore.getState();
    await settingsStore.loadSettings();
    
    // Sync notification service with current settings
    if (settingsStore.globalReminderEnabled && settingsStore.globalReminderTime) {
      await notificationService.scheduleGlobalDailyReminder(
        settingsStore.globalReminderTime,
        settingsStore.globalReminderEnabled
      );
    }
    
    logger.info('STATE', 'Settings initialized');
  } catch (error) {
    logger.error('STATE', 'Failed to initialize settings', { error });
  }
};