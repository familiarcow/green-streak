/**
 * NotificationManager Tests
 *
 * Tests for the NotificationManager service:
 * - Strategy delegation
 * - Context building
 * - Notification scheduling
 * - Cache management
 */

import { NotificationManager } from '../NotificationManager';
import { TaskService } from '../TaskService';
import { StreakService } from '../StreakService';
import { DataService } from '../DataService';
import {
  NotificationSettings,
  NotificationContext,
  Task,
} from '../../types';

// Mock the logger
jest.mock('../../utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock the notification service
const mockScheduleGlobalDailyReminder = jest.fn();
const mockCancelGlobalDailyReminder = jest.fn();
const mockCancelAllNotifications = jest.fn();
const mockSyncTaskReminders = jest.fn();
const mockGetScheduledNotifications = jest.fn();
const mockCancelScheduledNotificationAsync = jest.fn();
const mockScheduleNotificationAsync = jest.fn();

jest.mock('../NotificationService', () => ({
  __esModule: true,
  default: {
    scheduleGlobalDailyReminder: (...args: any[]) => mockScheduleGlobalDailyReminder(...args),
    cancelGlobalDailyReminder: (...args: any[]) => mockCancelGlobalDailyReminder(...args),
    cancelAllNotifications: (...args: any[]) => mockCancelAllNotifications(...args),
    syncTaskReminders: (...args: any[]) => mockSyncTaskReminders(...args),
    getScheduledNotifications: (...args: any[]) => mockGetScheduledNotifications(...args),
    cancelScheduledNotificationAsync: (...args: any[]) => mockCancelScheduledNotificationAsync(...args),
    scheduleNotificationAsync: (...args: any[]) => mockScheduleNotificationAsync(...args),
  },
}));

// Mock date helpers
jest.mock('../../utils/dateHelpers', () => ({
  getTodayString: jest.fn(() => '2024-01-15'),
  formatDate: jest.fn((date) => date),
}));

import logger from '../../utils/logger';

// Helper to create mock services
const createMockTaskService = (): jest.Mocked<TaskService> => ({
  getAllTasks: jest.fn(),
  getTaskById: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  archiveTask: jest.fn(),
  deleteTask: jest.fn(),
  restoreTask: jest.fn(),
  getTasksWithRecentActivity: jest.fn(),
  validateTask: jest.fn(),
} as any);

const createMockStreakService = (): jest.Mocked<StreakService> => ({
  getAllStreaks: jest.fn(),
  getStreakForTask: jest.fn(),
  updateStreak: jest.fn(),
} as any);

const createMockDataService = (): jest.Mocked<DataService> => ({
  getLogsInDateRange: jest.fn(),
  createLog: jest.fn(),
  updateLog: jest.fn(),
} as any);

// Sample data
const mockTasks: Task[] = [
  {
    id: 'task-1',
    name: 'Exercise',
    icon: '💪',
    color: '#22c55e',
    isMultiCompletion: false,
    createdAt: '2024-01-01',
    reminderEnabled: true,
    reminderTime: '09:00',
  },
  {
    id: 'task-2',
    name: 'Read',
    icon: '📚',
    color: '#3b82f6',
    isMultiCompletion: false,
    createdAt: '2024-01-01',
    reminderEnabled: false,
  },
];

const mockStreaks = [
  {
    taskId: 'task-1',
    currentStreak: 10,
    bestStreak: 15,
    lastCompletionDate: '2024-01-14', // yesterday
  },
  {
    taskId: 'task-2',
    currentStreak: 3,
    bestStreak: 5,
    lastCompletionDate: '2024-01-14',
  },
];

const mockLogs = [
  { taskId: 'task-1', count: 1, date: '2024-01-15' },
];

const defaultSettings: NotificationSettings = {
  global: {
    enabled: true,
    quietHours: { enabled: false, start: '22:00', end: '08:00' },
    weekendMode: 'normal',
    soundEnabled: true,
    vibrationEnabled: true,
  },
  daily: {
    enabled: true,
    time: '20:00',
    smartMode: true,
    includeMotivation: false,
  },
  streaks: {
    protectionEnabled: true,
    protectionTime: '21:00',
    protectionThreshold: 3,
    priorityBasedAlerts: true,
  },
  achievements: {
    enabled: true,
    milestoneAlerts: true,
    weeklyRecapEnabled: true,
    weeklyRecapDay: 'sunday',
    weeklyRecapTime: '19:00',
  },
};

describe('NotificationManager', () => {
  let notificationManager: NotificationManager;
  let mockTaskService: jest.Mocked<TaskService>;
  let mockStreakService: jest.Mocked<StreakService>;
  let mockDataService: jest.Mocked<DataService>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTaskService = createMockTaskService();
    mockStreakService = createMockStreakService();
    mockDataService = createMockDataService();

    // Default mock implementations
    mockTaskService.getAllTasks.mockResolvedValue(mockTasks);
    mockStreakService.getAllStreaks.mockResolvedValue(mockStreaks);
    mockDataService.getLogsInDateRange.mockResolvedValue(mockLogs);
    mockGetScheduledNotifications.mockResolvedValue([]);
    mockScheduleNotificationAsync.mockResolvedValue('expo-notification-id');

    notificationManager = new NotificationManager(
      mockTaskService,
      mockStreakService,
      mockDataService
    );
  });

  describe('Initialization', () => {
    it('should initialize with strategies', () => {
      expect(logger.debug).toHaveBeenCalledWith(
        'NOTIF',
        'NotificationManager initialized with strategies',
        expect.objectContaining({
          strategies: expect.arrayContaining(['daily_summary', 'streak_protection', 'weekly_recap']),
        })
      );
    });
  });

  describe('scheduleSmartDailyNotification', () => {
    it('should cancel notification when daily is disabled', async () => {
      const settings = {
        ...defaultSettings,
        daily: { ...defaultSettings.daily, enabled: false },
      };

      await notificationManager.scheduleSmartDailyNotification(settings);

      expect(mockCancelGlobalDailyReminder).toHaveBeenCalled();
      expect(mockScheduleNotificationAsync).not.toHaveBeenCalled();
    });

    it('should use simple notification when smart mode is disabled', async () => {
      const settings = {
        ...defaultSettings,
        daily: { ...defaultSettings.daily, smartMode: false },
      };

      await notificationManager.scheduleSmartDailyNotification(settings);

      expect(mockScheduleGlobalDailyReminder).toHaveBeenCalledWith('20:00', true);
    });

    it('should schedule smart notification with strategy-generated message', async () => {
      await notificationManager.scheduleSmartDailyNotification(defaultSettings);

      expect(mockScheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            title: 'Green Streak',
            body: expect.any(String),
          }),
        })
      );

      expect(logger.info).toHaveBeenCalledWith(
        'NOTIF',
        'Smart daily notification scheduled',
        expect.objectContaining({
          title: 'Green Streak',
          body: expect.any(String),
        })
      );
    });

    it('should use strategy priority for at-risk streaks', async () => {
      // Set up scenario with at-risk streak (not completed today)
      mockDataService.getLogsInDateRange.mockResolvedValue([]); // No completions today

      await notificationManager.scheduleSmartDailyNotification(defaultSettings);

      // Should have scheduled with higher priority due to at-risk streaks
      expect(mockScheduleNotificationAsync).toHaveBeenCalled();
    });
  });

  describe('scheduleStreakProtection', () => {
    it('should cancel notifications when protection is disabled', async () => {
      const settings = {
        ...defaultSettings,
        streaks: { ...defaultSettings.streaks, protectionEnabled: false },
      };

      mockGetScheduledNotifications.mockResolvedValue([
        { identifier: 'streak-protection-task-1' },
      ]);

      await notificationManager.scheduleStreakProtection(settings);

      expect(mockCancelScheduledNotificationAsync).toHaveBeenCalledWith('streak-protection-task-1');
    });

    it('should schedule notifications for at-risk streaks', async () => {
      // No logs today means streaks are at risk
      mockDataService.getLogsInDateRange.mockResolvedValue([]);

      await notificationManager.scheduleStreakProtection(defaultSettings);

      expect(logger.info).toHaveBeenCalledWith(
        'NOTIF',
        'Streak protection scheduled',
        expect.objectContaining({ count: expect.any(Number) })
      );
    });

    it('should not schedule for streaks below threshold', async () => {
      mockStreakService.getAllStreaks.mockResolvedValue([
        { taskId: 'task-1', currentStreak: 1, bestStreak: 2, lastCompletionDate: '2024-01-14' },
      ]);
      mockDataService.getLogsInDateRange.mockResolvedValue([]);

      await notificationManager.scheduleStreakProtection(defaultSettings);

      // Streak of 1 is below threshold of 3
      expect(logger.info).toHaveBeenCalledWith(
        'NOTIF',
        'Streak protection scheduled',
        { count: 0 }
      );
    });

    it('should skip streaks already completed today', async () => {
      // task-1 completed today
      mockDataService.getLogsInDateRange.mockResolvedValue([
        { taskId: 'task-1', count: 1, date: '2024-01-15' },
      ]);

      await notificationManager.scheduleStreakProtection(defaultSettings);

      // Only task-2 should be at risk (task-1 is completed)
      expect(logger.info).toHaveBeenCalledWith(
        'NOTIF',
        'Streak protection scheduled',
        expect.any(Object)
      );
    });
  });

  describe('syncAllNotifications', () => {
    it('should cancel all notifications when global is disabled', async () => {
      const settings = {
        ...defaultSettings,
        global: { ...defaultSettings.global, enabled: false },
      };

      await notificationManager.syncAllNotifications(settings);

      expect(mockCancelAllNotifications).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('NOTIF', 'All notifications disabled');
    });

    it('should sync all notification types when enabled', async () => {
      await notificationManager.syncAllNotifications(defaultSettings);

      expect(logger.info).toHaveBeenCalledWith('NOTIF', 'All notifications synced successfully');
    });

    it('should sync task reminders', async () => {
      await notificationManager.syncAllNotifications(defaultSettings);

      expect(mockSyncTaskReminders).toHaveBeenCalledWith(mockTasks);
    });

    it('should schedule weekly recap when enabled', async () => {
      await notificationManager.syncAllNotifications(defaultSettings);

      expect(logger.info).toHaveBeenCalledWith(
        'NOTIF',
        'Weekly recap scheduled',
        expect.objectContaining({
          day: 'sunday',
          time: '19:00',
        })
      );
    });
  });

  describe('checkTodayActivity', () => {
    it('should return activity summary', async () => {
      const activity = await notificationManager.checkTodayActivity();

      expect(activity).toMatchObject({
        date: '2024-01-15',
        hasLoggedToday: true,
        totalTasks: 2,
        completedTasks: expect.any(Array),
        incompleteTasks: expect.any(Array),
      });
    });

    it('should identify completed vs incomplete tasks', async () => {
      const activity = await notificationManager.checkTodayActivity();

      expect(activity.completedTasks).toHaveLength(1);
      expect(activity.completedTasks[0].id).toBe('task-1');
      expect(activity.incompleteTasks).toHaveLength(1);
      expect(activity.incompleteTasks[0].id).toBe('task-2');
    });

    it('should detect perfect day', async () => {
      // All tasks completed
      mockDataService.getLogsInDateRange.mockResolvedValue([
        { taskId: 'task-1', count: 1, date: '2024-01-15' },
        { taskId: 'task-2', count: 1, date: '2024-01-15' },
      ]);

      const activity = await notificationManager.checkTodayActivity();

      expect(activity.perfectDay).toBe(true);
      expect(activity.completionRate).toBe(100);
    });

    it('should calculate completion rate', async () => {
      const activity = await notificationManager.checkTodayActivity();

      expect(activity.completionRate).toBe(50); // 1/2 tasks
    });

    it('should use cache for repeated calls', async () => {
      // Clear any prior calls
      mockTaskService.getAllTasks.mockClear();

      await notificationManager.checkTodayActivity();
      const callsAfterFirst = mockTaskService.getAllTasks.mock.calls.length;

      await notificationManager.checkTodayActivity();
      const callsAfterSecond = mockTaskService.getAllTasks.mock.calls.length;

      // Second call should not increase the call count (cached)
      expect(callsAfterSecond).toBe(callsAfterFirst);
    });
  });

  describe('getStreaksAtRisk', () => {
    it('should identify streaks at risk', async () => {
      // Mock Date to make yesterday calculation predictable
      const realDate = global.Date;
      const mockNow = new Date('2024-01-15T12:00:00.000Z');
      jest.spyOn(global, 'Date').mockImplementation((arg?: any) => {
        if (arg) return new realDate(arg);
        return mockNow;
      });
      (global.Date as any).now = () => mockNow.getTime();

      mockDataService.getLogsInDateRange.mockResolvedValue([]); // Nothing completed today

      const atRisk = await notificationManager.getStreaksAtRisk(defaultSettings);

      // Restore Date
      global.Date = realDate;

      expect(atRisk.length).toBeGreaterThan(0);
      expect(atRisk[0]).toMatchObject({
        taskId: expect.any(String),
        currentStreak: expect.any(Number),
        atRisk: true,
      });
    });

    it('should exclude completed streaks', async () => {
      // task-1 is completed
      mockDataService.getLogsInDateRange.mockResolvedValue([
        { taskId: 'task-1', count: 1, date: '2024-01-15' },
      ]);

      const atRisk = await notificationManager.getStreaksAtRisk(defaultSettings);

      expect(atRisk.find(s => s.taskId === 'task-1')).toBeUndefined();
    });

    it('should respect protection threshold', async () => {
      mockStreakService.getAllStreaks.mockResolvedValue([
        { taskId: 'task-1', currentStreak: 2, bestStreak: 5, lastCompletionDate: '2024-01-14' },
      ]);
      mockDataService.getLogsInDateRange.mockResolvedValue([]);

      const atRisk = await notificationManager.getStreaksAtRisk(defaultSettings);

      // Streak of 2 is below threshold of 3
      expect(atRisk).toHaveLength(0);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache on clearCache()', async () => {
      // Clear any prior calls
      mockTaskService.getAllTasks.mockClear();

      // Populate cache
      await notificationManager.checkTodayActivity();
      const callsAfterFirst = mockTaskService.getAllTasks.mock.calls.length;

      // Clear cache
      notificationManager.clearCache();

      // Should fetch again since cache was cleared
      await notificationManager.checkTodayActivity();
      const callsAfterSecond = mockTaskService.getAllTasks.mock.calls.length;

      // Second call should have made new requests
      expect(callsAfterSecond).toBeGreaterThan(callsAfterFirst);
      expect(logger.debug).toHaveBeenCalledWith('NOTIF', 'Notification cache cleared');
    });

    it('should clean up on destroy()', () => {
      notificationManager.destroy();

      expect(logger.debug).toHaveBeenCalledWith('NOTIF', 'NotificationManager destroyed');
    });
  });

  describe('Error Handling', () => {
    it('should handle task service errors', async () => {
      mockTaskService.getAllTasks.mockRejectedValue(new Error('Database error'));

      await expect(notificationManager.checkTodayActivity()).rejects.toThrow('Database error');

      expect(logger.error).toHaveBeenCalledWith(
        'NOTIF',
        'Failed to check today activity',
        expect.any(Object)
      );
    });

    it('should handle streak service errors gracefully', async () => {
      mockStreakService.getAllStreaks.mockRejectedValue(new Error('Streak error'));

      const result = await notificationManager.getStreaksAtRisk(defaultSettings);

      expect(result).toEqual([]);
      expect(logger.error).toHaveBeenCalledWith(
        'NOTIF',
        'Failed to get streaks at risk',
        expect.any(Object)
      );
    });

    it('should handle scheduling errors', async () => {
      mockScheduleNotificationAsync.mockRejectedValue(new Error('Scheduling failed'));

      await expect(
        notificationManager.scheduleSmartDailyNotification(defaultSettings)
      ).rejects.toThrow('Scheduling failed');

      expect(logger.error).toHaveBeenCalledWith(
        'NOTIF',
        'Failed to schedule smart daily notification',
        expect.any(Object)
      );
    });
  });
});
