/**
 * Settings Store Notification Tests
 *
 * Tests for notification-related functionality in settingsStore:
 * - Time validation and normalization
 * - Settings migration from legacy to new structure
 * - Settings sync between legacy and new fields
 */

// Mock the logger
jest.mock('../../utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock the services module
const mockScheduleGlobalDailyReminder = jest.fn();
const mockCancelGlobalDailyReminder = jest.fn();
const mockSyncAllNotifications = jest.fn();

jest.mock('../../services', () => ({
  getNotificationService: jest.fn(() => ({
    scheduleGlobalDailyReminder: mockScheduleGlobalDailyReminder,
    cancelGlobalDailyReminder: mockCancelGlobalDailyReminder,
  })),
  getNotificationManager: jest.fn(() => ({
    syncAllNotifications: mockSyncAllNotifications,
  })),
}));

// Import after mocks
import { useSettingsStore } from '../settingsStore';
import logger from '../../utils/logger';

// Default notification settings for resetting store
const defaultNotificationSettings = {
  global: {
    enabled: false,
    quietHours: { enabled: false, start: '22:00', end: '08:00' },
    weekendMode: 'normal' as const,
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
    weeklyRecapDay: 'sunday' as const,
    weeklyRecapTime: '19:00',
  },
};

describe('settingsStore - Notification Features', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store to defaults
    useSettingsStore.setState({
      globalReminderEnabled: false,
      globalReminderTime: '20:00',
      notificationSettings: defaultNotificationSettings,
    });
  });

  describe('Time Validation', () => {
    describe('updateGlobalReminder', () => {
      it('should accept valid time format HH:MM', async () => {
        mockScheduleGlobalDailyReminder.mockResolvedValue('notification-id');

        await useSettingsStore.getState().updateGlobalReminder(true, '09:30');

        expect(useSettingsStore.getState().globalReminderTime).toBe('09:30');
        expect(mockScheduleGlobalDailyReminder).toHaveBeenCalledWith('09:30', true);
      });

      it('should normalize single-digit hours (9:05 -> 09:05)', async () => {
        mockScheduleGlobalDailyReminder.mockResolvedValue('notification-id');

        await useSettingsStore.getState().updateGlobalReminder(true, '9:05');

        expect(useSettingsStore.getState().globalReminderTime).toBe('09:05');
      });

      it('should reject invalid time format', async () => {
        await expect(
          useSettingsStore.getState().updateGlobalReminder(true, 'invalid')
        ).rejects.toThrow('Invalid time format: invalid. Expected HH:MM format.');

        expect(logger.error).toHaveBeenCalledWith(
          'STATE',
          'Invalid time format for global reminder',
          { time: 'invalid' }
        );
      });

      it('should reject time with invalid hours (25:00)', async () => {
        await expect(
          useSettingsStore.getState().updateGlobalReminder(true, '25:00')
        ).rejects.toThrow('Invalid time format: 25:00. Expected HH:MM format.');
      });

      it('should reject time with invalid minutes (12:60)', async () => {
        await expect(
          useSettingsStore.getState().updateGlobalReminder(true, '12:60')
        ).rejects.toThrow('Invalid time format: 12:60. Expected HH:MM format.');
      });

      it('should accept edge case times (00:00 and 23:59)', async () => {
        mockScheduleGlobalDailyReminder.mockResolvedValue('notification-id');

        await useSettingsStore.getState().updateGlobalReminder(true, '00:00');
        expect(useSettingsStore.getState().globalReminderTime).toBe('00:00');

        await useSettingsStore.getState().updateGlobalReminder(true, '23:59');
        expect(useSettingsStore.getState().globalReminderTime).toBe('23:59');
      });
    });

    describe('updateDailyNotification', () => {
      it('should validate time format', async () => {
        await expect(
          useSettingsStore.getState().updateDailyNotification({ time: 'bad-time' })
        ).rejects.toThrow('Invalid time format: bad-time. Expected HH:MM format.');
      });

      it('should normalize and accept valid time', async () => {
        mockSyncAllNotifications.mockResolvedValue(undefined);

        await useSettingsStore.getState().updateDailyNotification({ time: '8:30' });

        expect(useSettingsStore.getState().notificationSettings?.daily.time).toBe('08:30');
      });

      it('should update other fields without time validation', async () => {
        mockSyncAllNotifications.mockResolvedValue(undefined);

        await useSettingsStore.getState().updateDailyNotification({
          enabled: true,
          smartMode: false,
        });

        const state = useSettingsStore.getState();
        expect(state.notificationSettings?.daily.enabled).toBe(true);
        expect(state.notificationSettings?.daily.smartMode).toBe(false);
      });
    });

    describe('updateStreakProtection', () => {
      it('should validate protectionTime format', async () => {
        await expect(
          useSettingsStore.getState().updateStreakProtection({ protectionTime: 'noon' })
        ).rejects.toThrow('Invalid time format: noon. Expected HH:MM format.');
      });

      it('should normalize and accept valid protectionTime', async () => {
        mockSyncAllNotifications.mockResolvedValue(undefined);

        await useSettingsStore.getState().updateStreakProtection({ protectionTime: '9:00' });

        expect(useSettingsStore.getState().notificationSettings?.streaks.protectionTime).toBe(
          '09:00'
        );
      });
    });
  });

  describe('Legacy Settings Migration', () => {
    it('should migrate legacy settings to new structure on load', async () => {
      // Set up legacy settings that need migration
      useSettingsStore.setState({
        globalReminderEnabled: true,
        globalReminderTime: '18:00',
        notificationSettings: {
          ...defaultNotificationSettings,
          global: { ...defaultNotificationSettings.global, enabled: false },
          daily: { ...defaultNotificationSettings.daily, enabled: false },
        },
      });

      await useSettingsStore.getState().loadSettings();

      const state = useSettingsStore.getState();
      expect(state.notificationSettings?.global.enabled).toBe(true);
      expect(state.notificationSettings?.daily.enabled).toBe(true);
      expect(state.notificationSettings?.daily.time).toBe('18:00');

      expect(logger.info).toHaveBeenCalledWith('STATE', 'Migrating legacy notification settings');
    });

    it('should not migrate if already using new settings', async () => {
      // Set up state where new settings are already configured
      useSettingsStore.setState({
        globalReminderEnabled: false,
        globalReminderTime: '20:00',
        notificationSettings: {
          ...defaultNotificationSettings,
          global: { ...defaultNotificationSettings.global, enabled: true },
          daily: { ...defaultNotificationSettings.daily, enabled: true, time: '19:00' },
        },
      });

      await useSettingsStore.getState().loadSettings();

      // Should not have migrated
      expect(logger.info).not.toHaveBeenCalledWith(
        'STATE',
        'Migrating legacy notification settings'
      );
    });
  });

  describe('Settings Sync', () => {
    it('should sync legacy and new settings when updating global reminder', async () => {
      mockScheduleGlobalDailyReminder.mockResolvedValue('notification-id');

      await useSettingsStore.getState().updateGlobalReminder(true, '15:30');

      const state = useSettingsStore.getState();

      // Legacy fields should be updated
      expect(state.globalReminderEnabled).toBe(true);
      expect(state.globalReminderTime).toBe('15:30');

      // New settings should also be updated
      expect(state.notificationSettings?.global.enabled).toBe(true);
      expect(state.notificationSettings?.daily.enabled).toBe(true);
      expect(state.notificationSettings?.daily.time).toBe('15:30');
    });

    it('should sync both settings when disabling reminder', async () => {
      // Start with enabled reminder
      useSettingsStore.setState({
        globalReminderEnabled: true,
        globalReminderTime: '20:00',
        notificationSettings: {
          ...defaultNotificationSettings,
          global: { ...defaultNotificationSettings.global, enabled: true },
          daily: { ...defaultNotificationSettings.daily, enabled: true },
        },
      });

      await useSettingsStore.getState().updateGlobalReminder(false);

      const state = useSettingsStore.getState();

      // Both legacy and new should be disabled
      expect(state.globalReminderEnabled).toBe(false);
      expect(state.notificationSettings?.global.enabled).toBe(false);
      expect(state.notificationSettings?.daily.enabled).toBe(false);

      expect(mockCancelGlobalDailyReminder).toHaveBeenCalled();
    });

    it('should use default time when none provided', async () => {
      mockScheduleGlobalDailyReminder.mockResolvedValue('notification-id');

      // Clear the time to test default fallback
      useSettingsStore.setState({
        globalReminderEnabled: false,
        globalReminderTime: undefined as any,
      });

      await useSettingsStore.getState().updateGlobalReminder(true);

      // Should use default '20:00'
      expect(useSettingsStore.getState().globalReminderTime).toBe('20:00');
      expect(mockScheduleGlobalDailyReminder).toHaveBeenCalledWith('20:00', true);
    });
  });

  describe('Notification Sync', () => {
    it('should call syncNotifications after updating daily settings', async () => {
      mockSyncAllNotifications.mockResolvedValue(undefined);

      await useSettingsStore.getState().updateDailyNotification({ enabled: true });

      expect(mockSyncAllNotifications).toHaveBeenCalled();
    });

    it('should call syncNotifications after updating streak protection', async () => {
      mockSyncAllNotifications.mockResolvedValue(undefined);

      await useSettingsStore.getState().updateStreakProtection({ protectionEnabled: true });

      expect(mockSyncAllNotifications).toHaveBeenCalled();
    });

    it('should fallback to basic service if manager unavailable', async () => {
      // Make manager throw to trigger fallback
      mockSyncAllNotifications.mockRejectedValue(new Error('Manager unavailable'));
      mockScheduleGlobalDailyReminder.mockResolvedValue('notification-id');

      // Set up state to trigger the global notification scheduling in fallback
      useSettingsStore.setState({
        notificationSettings: {
          ...defaultNotificationSettings,
          global: { ...defaultNotificationSettings.global, enabled: true },
          daily: { ...defaultNotificationSettings.daily, enabled: true, time: '20:00' },
        },
      });

      await useSettingsStore.getState().syncNotifications();

      expect(logger.warn).toHaveBeenCalledWith(
        'STATE',
        'NotificationManager not available, using basic service',
        expect.any(Object)
      );
      expect(mockScheduleGlobalDailyReminder).toHaveBeenCalledWith('20:00', true);
    });
  });

  describe('Error Handling', () => {
    it('should handle notification service errors gracefully', async () => {
      mockScheduleGlobalDailyReminder.mockRejectedValue(new Error('Service error'));

      await expect(
        useSettingsStore.getState().updateGlobalReminder(true, '09:00')
      ).rejects.toThrow('Service error');

      expect(logger.error).toHaveBeenCalledWith(
        'STATE',
        'Failed to update global reminder',
        expect.objectContaining({ enabled: true, time: '09:00' })
      );
    });
  });
});
