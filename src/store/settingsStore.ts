import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings, NotificationSettings, DeepPartial } from '../types';
import { getNotificationService, getNotificationManager, getSoundService } from '../services';
import logger from '../utils/logger';

/**
 * Validate time string format (HH:MM)
 * Returns true if valid, false otherwise
 */
const isValidTimeFormat = (time: string): boolean => {
  if (!time || typeof time !== 'string') return false;

  const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
  if (!timeRegex.test(time)) return false;

  const [hours, minutes] = time.split(':').map(Number);
  return !isNaN(hours) && !isNaN(minutes) &&
         hours >= 0 && hours <= 23 &&
         minutes >= 0 && minutes <= 59;
};

/**
 * Normalize time to HH:MM format (e.g., "9:05" -> "09:05")
 */
const normalizeTime = (time: string): string => {
  if (!isValidTimeFormat(time)) return time;

  const [hours, minutes] = time.split(':').map(Number);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

// Default signature green for calendar
export const DEFAULT_CALENDAR_COLOR = '#22c55e';

interface SettingsState extends AppSettings {
  // Actions
  loadSettings: () => Promise<void>;
  updateGlobalReminder: (enabled: boolean, time?: string) => Promise<void>;
  setDebugLogging: (enabled: boolean) => void;
  setLogLevel: (level: AppSettings['currentLogLevel']) => void;
  setCalendarColor: (color: string) => void;
  setSoundEffectsEnabled: (enabled: boolean) => void;
  exportSettings: () => string;
  resetSettings: () => Promise<void>;

  // New notification settings actions
  updateNotificationSettings: (settings: DeepPartial<NotificationSettings>) => Promise<void>;
  updateDailyNotification: (settings: Partial<NotificationSettings['daily']>) => Promise<void>;
  updateStreakProtection: (settings: Partial<NotificationSettings['streaks']>) => Promise<void>;
  syncNotifications: () => Promise<void>;
}

const defaultNotificationSettings: NotificationSettings = {
  global: {
    enabled: false,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
    weekendMode: 'normal',
    soundEnabled: true,
    vibrationEnabled: true,
  },
  daily: {
    enabled: false,
    time: '20:00',
    smartMode: true,
    includeMotivation: false,
  },
  streaks: {
    protectionEnabled: false,
    protectionTime: '21:00',
    protectionThreshold: 3,
    priorityBasedAlerts: true,
  },
  achievements: {
    enabled: true,
    milestoneAlerts: true,
    weeklyRecapEnabled: false,
    weeklyRecapDay: 'sunday',
    weeklyRecapTime: '19:00',
  },
};

const defaultSettings: AppSettings = {
  // Legacy fields (deprecated - use notificationSettings.daily instead)
  // Kept for backward compatibility, will be migrated on load
  globalReminderEnabled: false,
  globalReminderTime: '20:00',
  debugLoggingEnabled: false,
  currentLogLevel: 'WARN',
  notificationSettings: defaultNotificationSettings,
  calendarColor: DEFAULT_CALENDAR_COLOR,
  soundEffectsEnabled: true,
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

          // Migrate legacy settings to new structure if needed
          const needsMigration = state.globalReminderEnabled &&
            !state.notificationSettings?.daily?.enabled;

          if (needsMigration) {
            logger.info('STATE', 'Migrating legacy notification settings');
            const currentNotificationSettings = state.notificationSettings || defaultNotificationSettings;

            const migratedSettings: NotificationSettings = {
              ...currentNotificationSettings,
              global: {
                ...currentNotificationSettings.global,
                enabled: true,
              },
              daily: {
                ...currentNotificationSettings.daily,
                enabled: state.globalReminderEnabled,
                time: state.globalReminderTime || '20:00',
              },
            };

            set({ notificationSettings: migratedSettings });
            logger.info('STATE', 'Legacy settings migrated to notificationSettings.daily');
          }

          logger.info('STATE', 'Settings loaded', {
            globalReminderEnabled: state.globalReminderEnabled,
            dailyEnabled: state.notificationSettings?.daily?.enabled,
            debugLoggingEnabled: state.debugLoggingEnabled,
          });
        } catch (error) {
          logger.error('STATE', 'Failed to load settings', { error });
        }
      },

      updateGlobalReminder: async (enabled: boolean, time?: string) => {
        const currentState = get();
        let newTime = time || currentState.globalReminderTime || '20:00';

        // Validate and normalize time format
        if (time && !isValidTimeFormat(time)) {
          logger.error('STATE', 'Invalid time format for global reminder', { time });
          throw new Error(`Invalid time format: ${time}. Expected HH:MM format.`);
        }
        if (time) {
          newTime = normalizeTime(time);
        }

        // Helper to sync both legacy and new settings structures
        const syncSettings = (reminderEnabled: boolean) => {
          const currentNotificationSettings = currentState.notificationSettings || defaultNotificationSettings;
          set({
            // Legacy fields (kept for backward compatibility)
            globalReminderEnabled: reminderEnabled,
            globalReminderTime: newTime,
            // New settings structure (source of truth)
            notificationSettings: {
              ...currentNotificationSettings,
              global: {
                ...currentNotificationSettings.global,
                enabled: reminderEnabled,
              },
              daily: {
                ...currentNotificationSettings.daily,
                enabled: reminderEnabled,
                time: newTime,
              },
            },
          });
        };

        try {
          logger.debug('STATE', 'Updating global reminder', { enabled, time: newTime });

          if (enabled && newTime) {
            // Schedule the notification
            const notificationService = getNotificationService();
            const notificationId = await notificationService.scheduleGlobalDailyReminder(newTime, enabled);

            if (notificationId) {
              syncSettings(true);
              logger.info('STATE', 'Global reminder enabled', { time: newTime, notificationId });
            } else {
              // Permission denied or other issue
              syncSettings(false);
              logger.warn('STATE', 'Global reminder could not be enabled', { time: newTime });
            }
          } else {
            // Disable the notification
            const notificationService = getNotificationService();
            await notificationService.cancelGlobalDailyReminder();
            syncSettings(false);
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

      setCalendarColor: (color: string) => {
        try {
          set({ calendarColor: color });
          logger.info('STATE', 'Calendar color updated', { color });
        } catch (error) {
          logger.error('STATE', 'Failed to set calendar color', { error, color });
        }
      },

      setSoundEffectsEnabled: (enabled: boolean) => {
        try {
          set({ soundEffectsEnabled: enabled });

          // Sync with SoundEffectsService
          try {
            const soundService = getSoundService();
            soundService.setSoundEnabled(enabled);
          } catch (soundError) {
            logger.debug('STATE', 'Sound service not available for settings sync', { error: soundError });
          }

          logger.info('STATE', 'Sound effects enabled updated', { enabled });
        } catch (error) {
          logger.error('STATE', 'Failed to set sound effects enabled', { error, enabled });
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
          const notificationService = getNotificationService();
          await notificationService.cancelGlobalDailyReminder();
          
          // Reset to defaults
          set(defaultSettings);
          
          logger.info('STATE', 'Settings reset to defaults');
        } catch (error) {
          logger.error('STATE', 'Failed to reset settings', { error });
          throw error;
        }
      },

      updateNotificationSettings: async (settings: DeepPartial<NotificationSettings>) => {
        try {
          logger.debug('STATE', 'Updating notification settings', { settings });

          const currentState = get();
          const currentNotificationSettings = currentState.notificationSettings || defaultNotificationSettings;

          // Deep merge settings to handle nested partial updates
          const newNotificationSettings: NotificationSettings = {
            global: {
              ...currentNotificationSettings.global,
              ...settings.global,
              quietHours: {
                ...currentNotificationSettings.global.quietHours,
                ...settings.global?.quietHours,
              },
            },
            daily: { ...currentNotificationSettings.daily, ...settings.daily },
            streaks: { ...currentNotificationSettings.streaks, ...settings.streaks },
            achievements: { ...currentNotificationSettings.achievements, ...settings.achievements },
          };
          
          set({ notificationSettings: newNotificationSettings });

          // Sync sound/haptic settings with SoundEffectsService
          try {
            const soundService = getSoundService();
            soundService.setSoundEnabled(newNotificationSettings.global.soundEnabled ?? true);
            soundService.setHapticEnabled(newNotificationSettings.global.vibrationEnabled ?? true);
          } catch (soundError) {
            logger.debug('STATE', 'Sound service not available for settings sync', { error: soundError });
          }

          // Sync notifications with new settings
          await get().syncNotifications();

          logger.info('STATE', 'Notification settings updated');
        } catch (error) {
          logger.error('STATE', 'Failed to update notification settings', { error });
          throw error;
        }
      },

      updateDailyNotification: async (settings: Partial<NotificationSettings['daily']>) => {
        // Validate time format if provided
        if (settings.time !== undefined) {
          if (!isValidTimeFormat(settings.time)) {
            logger.error('STATE', 'Invalid time format for daily notification', { time: settings.time });
            throw new Error(`Invalid time format: ${settings.time}. Expected HH:MM format.`);
          }
          settings = { ...settings, time: normalizeTime(settings.time) };
        }

        try {
          logger.debug('STATE', 'Updating daily notification settings', { settings });

          const currentState = get();
          const currentNotificationSettings = currentState.notificationSettings || defaultNotificationSettings;

          const newNotificationSettings: NotificationSettings = {
            ...currentNotificationSettings,
            daily: { ...currentNotificationSettings.daily, ...settings },
          };

          set({ notificationSettings: newNotificationSettings });
          
          // Sync notifications with new settings
          await get().syncNotifications();
          
          logger.info('STATE', 'Daily notification settings updated');
        } catch (error) {
          logger.error('STATE', 'Failed to update daily notification settings', { error });
          throw error;
        }
      },

      updateStreakProtection: async (settings: Partial<NotificationSettings['streaks']>) => {
        // Validate time format if provided
        if (settings.protectionTime !== undefined) {
          if (!isValidTimeFormat(settings.protectionTime)) {
            logger.error('STATE', 'Invalid time format for streak protection', { time: settings.protectionTime });
            throw new Error(`Invalid time format: ${settings.protectionTime}. Expected HH:MM format.`);
          }
          settings = { ...settings, protectionTime: normalizeTime(settings.protectionTime) };
        }

        try {
          logger.debug('STATE', 'Updating streak protection settings', { settings });

          const currentState = get();
          const currentNotificationSettings = currentState.notificationSettings || defaultNotificationSettings;

          const newNotificationSettings: NotificationSettings = {
            ...currentNotificationSettings,
            streaks: { ...currentNotificationSettings.streaks, ...settings },
          };

          set({ notificationSettings: newNotificationSettings });
          
          // Sync notifications with new settings
          await get().syncNotifications();
          
          logger.info('STATE', 'Streak protection settings updated');
        } catch (error) {
          logger.error('STATE', 'Failed to update streak protection settings', { error });
          throw error;
        }
      },

      syncNotifications: async () => {
        try {
          logger.debug('STATE', 'Syncing notifications with current settings');

          const state = get();
          const notificationSettings = state.notificationSettings || defaultNotificationSettings;

          // Use NotificationManager for smart notifications
          try {
            const notificationManager = getNotificationManager();
            await notificationManager.syncAllNotifications(notificationSettings);
          } catch (managerError) {
            // Fallback to basic notification service if manager not available
            logger.warn('STATE', 'NotificationManager not available, using basic service', { error: managerError });

            const notificationService = getNotificationService();
            if (notificationSettings.global.enabled && notificationSettings.daily.enabled) {
              await notificationService.scheduleGlobalDailyReminder(
                notificationSettings.daily.time,
                true
              );
            } else {
              await notificationService.cancelGlobalDailyReminder();
            }
          }

          // Also sync task/habit notifications (they check global.enabled internally)
          try {
            const { useTasksStore } = await import('./tasksStore');
            await useTasksStore.getState().syncNotifications();
          } catch (taskSyncError) {
            logger.warn('STATE', 'Failed to sync task notifications', { error: taskSyncError });
          }

          logger.info('STATE', 'Notifications synced');
        } catch (error) {
          logger.error('STATE', 'Failed to sync notifications', { error });
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
        notificationSettings: state.notificationSettings,
        calendarColor: state.calendarColor,
        soundEffectsEnabled: state.soundEffectsEnabled,
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
      const notificationService = getNotificationService();
      await notificationService.scheduleGlobalDailyReminder(
        settingsStore.globalReminderTime,
        settingsStore.globalReminderEnabled
      );
    }

    // Sync sound/haptic service with current settings
    try {
      const soundService = getSoundService();
      const globalSettings = settingsStore.notificationSettings?.global;
      // Sync notification sounds and haptics
      soundService.setSoundEnabled(globalSettings?.soundEnabled ?? true);
      soundService.setHapticEnabled(globalSettings?.vibrationEnabled ?? true);
    } catch (soundError) {
      logger.debug('STATE', 'Sound service not available at init', { error: soundError });
    }

    logger.info('STATE', 'Settings initialized');
  } catch (error) {
    logger.error('STATE', 'Failed to initialize settings', { error });
  }
};