/**
 * Notification Strategies Tests
 *
 * Tests for notification strategy classes:
 * - DailyNotificationStrategy
 * - StreakProtectionStrategy
 * - WeeklyRecapStrategy
 */

import {
  DailyNotificationStrategy,
  StreakProtectionStrategy,
  WeeklyRecapStrategy,
} from '../strategies';
import {
  NotificationContext,
  NotificationSettings,
  TaskNotificationData,
  StreakNotificationData,
} from '../../../types';

// Mock the logger
jest.mock('../../../utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Helper to create base settings
const createSettings = (overrides?: Partial<NotificationSettings>): NotificationSettings => ({
  global: {
    enabled: true,
    quietHours: { enabled: false, start: '22:00', end: '08:00' },
    weekendMode: 'normal',
    soundEnabled: true,
    vibrationEnabled: true,
    ...overrides?.global,
  },
  daily: {
    enabled: true,
    time: '20:00',
    smartMode: true,
    includeMotivation: false,
    ...overrides?.daily,
  },
  streaks: {
    protectionEnabled: true,
    protectionTime: '21:00',
    protectionThreshold: 3,
    priorityBasedAlerts: true,
    ...overrides?.streaks,
  },
  achievements: {
    enabled: true,
    milestoneAlerts: true,
    weeklyRecapEnabled: true,
    weeklyRecapDay: 'sunday',
    weeklyRecapTime: '19:00',
    ...overrides?.achievements,
  },
});

// Helper to create base context
const createContext = (overrides?: Partial<NotificationContext>): NotificationContext => ({
  date: '2024-01-15',
  tasks: [],
  streaks: [],
  completedToday: [],
  settings: createSettings(),
  timeUntilMidnight: 4,
  isWeekend: false,
  ...overrides,
});

// Sample task data
const sampleTasks: TaskNotificationData[] = [
  {
    id: 'task-1',
    name: 'Exercise',
    icon: '💪',
    reminderEnabled: true,
    reminderTime: '09:00',
    completedToday: false,
  },
  {
    id: 'task-2',
    name: 'Read',
    icon: '📚',
    reminderEnabled: false,
    completedToday: true,
  },
  {
    id: 'task-3',
    name: 'Meditate',
    icon: '🧘',
    reminderEnabled: true,
    reminderTime: '07:00',
    completedToday: false,
  },
];

const sampleStreaks: StreakNotificationData[] = [
  {
    taskId: 'task-1',
    taskName: 'Exercise',
    currentStreak: 10,
    bestStreak: 15,
    lastCompletionDate: '2024-01-14',
    atRisk: true,
  },
  {
    taskId: 'task-2',
    taskName: 'Read',
    currentStreak: 5,
    bestStreak: 10,
    lastCompletionDate: '2024-01-15',
    atRisk: false,
  },
];

describe('DailyNotificationStrategy', () => {
  let strategy: DailyNotificationStrategy;

  beforeEach(() => {
    strategy = new DailyNotificationStrategy();
    jest.clearAllMocks();
  });

  describe('type', () => {
    it('should have correct type', () => {
      expect(strategy.type).toBe('daily_summary');
    });
  });

  describe('shouldNotify', () => {
    it('should return true when daily is enabled', () => {
      const context = createContext();

      expect(strategy.shouldNotify(context)).toBe(true);
    });

    it('should return false when daily is disabled', () => {
      const context = createContext({
        settings: createSettings({
          daily: { enabled: false, time: '20:00', smartMode: true, includeMotivation: false },
        }),
      });

      expect(strategy.shouldNotify(context)).toBe(false);
    });

    it('should return false during quiet hours', () => {
      const context = createContext({
        settings: createSettings({
          global: {
            enabled: true,
            quietHours: { enabled: true, start: '22:00', end: '08:00' },
            weekendMode: 'normal',
            soundEnabled: true,
            vibrationEnabled: true,
          },
        }),
      });

      // Mock current time to be in quiet hours
      const realDate = Date;
      const mockDate = new Date('2024-01-15T23:00:00');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);

      expect(strategy.shouldNotify(context)).toBe(false);

      global.Date = realDate;
    });

    it('should return false on weekend when weekend mode is off', () => {
      const context = createContext({
        isWeekend: true,
        settings: createSettings({
          global: {
            enabled: true,
            quietHours: { enabled: false, start: '22:00', end: '08:00' },
            weekendMode: 'off',
            soundEnabled: true,
            vibrationEnabled: true,
          },
        }),
      });

      expect(strategy.shouldNotify(context)).toBe(false);
    });

    it('should return true on weekend when weekend mode is normal', () => {
      const context = createContext({
        isWeekend: true,
        settings: createSettings({
          global: {
            enabled: true,
            quietHours: { enabled: false, start: '22:00', end: '08:00' },
            weekendMode: 'normal',
            soundEnabled: true,
            vibrationEnabled: true,
          },
        }),
      });

      expect(strategy.shouldNotify(context)).toBe(true);
    });
  });

  describe('getMessage', () => {
    it('should return perfect day message when all tasks completed', () => {
      const context = createContext({
        tasks: sampleTasks,
        completedToday: ['task-1', 'task-2', 'task-3'],
      });

      const message = strategy.getMessage(context);

      expect(message.title).toBe('Green Streak');
      expect(message.body).toContain('Perfect day');
      expect(message.body).toContain('3');
    });

    it('should return great job message for 80%+ completion', () => {
      // 5 tasks, 4 completed = 80%
      const tasks = [
        ...sampleTasks,
        { id: 'task-4', name: 'Task 4', reminderEnabled: false, completedToday: false },
        { id: 'task-5', name: 'Task 5', reminderEnabled: false, completedToday: false },
      ];
      const context = createContext({
        tasks,
        completedToday: ['task-1', 'task-2', 'task-3', 'task-4'], // 4/5 = 80%
      });

      const message = strategy.getMessage(context);

      expect(message.body).toContain('Great job');
    });

    it('should return good progress message for 50%+ completion', () => {
      const context = createContext({
        tasks: sampleTasks, // 3 tasks
        completedToday: ['task-1', 'task-2'], // 2/3 = 66%
      });

      const message = strategy.getMessage(context);

      expect(message.body).toContain('Good progress');
    });

    it('should return started message for partial completion', () => {
      const context = createContext({
        tasks: sampleTasks, // 3 tasks
        completedToday: ['task-1'], // 1/3 = 33%
      });

      const message = strategy.getMessage(context);

      expect(message.body).toContain("You've started");
    });

    it('should warn about at-risk streaks when nothing completed', () => {
      const context = createContext({
        tasks: sampleTasks,
        streaks: sampleStreaks.filter(s => s.atRisk),
        completedToday: [],
      });

      const message = strategy.getMessage(context);

      expect(message.body).toContain('streak');
    });

    it('should return default message when no activity', () => {
      const context = createContext({
        tasks: sampleTasks,
        streaks: [],
        completedToday: [],
      });

      const message = strategy.getMessage(context);

      expect(message.body).toContain("Time to log today's habits");
    });

    it('should include motivation when enabled', () => {
      const context = createContext({
        tasks: sampleTasks,
        completedToday: [],
        settings: createSettings({
          daily: { enabled: true, time: '20:00', smartMode: true, includeMotivation: true },
        }),
      });

      const message = strategy.getMessage(context);

      expect(message.body).toContain('💭');
    });

    it('should use simple message when smart mode is disabled', () => {
      const context = createContext({
        tasks: sampleTasks,
        completedToday: ['task-1'],
        settings: createSettings({
          daily: { enabled: true, time: '20:00', smartMode: false, includeMotivation: false },
        }),
      });

      const message = strategy.getMessage(context);

      expect(message.body).toBe("Time to log your daily habits! How did you do today?");
    });
  });

  describe('getScheduleTime', () => {
    it('should return correct schedule time from settings', () => {
      const context = createContext({
        settings: createSettings({
          daily: { enabled: true, time: '18:30', smartMode: true, includeMotivation: false },
        }),
      });

      const scheduleTime = strategy.getScheduleTime(context);

      expect(scheduleTime.getHours()).toBe(18);
      expect(scheduleTime.getMinutes()).toBe(30);
    });

    it('should schedule for tomorrow if time has passed', () => {
      const now = new Date();
      const pastTime = `${String(now.getHours() - 1).padStart(2, '0')}:00`;

      const context = createContext({
        settings: createSettings({
          daily: { enabled: true, time: pastTime, smartMode: true, includeMotivation: false },
        }),
      });

      const scheduleTime = strategy.getScheduleTime(context);

      expect(scheduleTime.getDate()).toBe(now.getDate() + 1);
    });
  });

  describe('getPriority', () => {
    it('should return high priority when streaks are at risk', () => {
      const context = createContext({
        streaks: sampleStreaks, // includes at-risk streak
      });

      const priority = strategy.getPriority(context);

      expect(priority.level).toBe('high');
    });

    it('should return medium priority when no at-risk streaks', () => {
      const context = createContext({
        streaks: sampleStreaks.filter(s => !s.atRisk),
      });

      const priority = strategy.getPriority(context);

      expect(priority.level).toBe('medium');
    });

    it('should respect sound settings', () => {
      const context = createContext({
        settings: createSettings({
          global: {
            enabled: true,
            quietHours: { enabled: false, start: '22:00', end: '08:00' },
            weekendMode: 'normal',
            soundEnabled: false,
            vibrationEnabled: true,
          },
        }),
      });

      const priority = strategy.getPriority(context);

      expect(priority.sound).toBe(false);
    });
  });
});

describe('StreakProtectionStrategy', () => {
  let strategy: StreakProtectionStrategy;

  beforeEach(() => {
    strategy = new StreakProtectionStrategy();
    jest.clearAllMocks();
  });

  describe('type', () => {
    it('should have correct type', () => {
      expect(strategy.type).toBe('streak_protection');
    });
  });

  describe('shouldNotify', () => {
    it('should return true when protection is enabled, streaks at risk, and close to end of day', () => {
      const context = createContext({
        streaks: sampleStreaks.filter(s => s.atRisk),
        timeUntilMidnight: 3, // Less than 4 hours
      });

      expect(strategy.shouldNotify(context)).toBe(true);
    });

    it('should return false when protection is disabled', () => {
      const context = createContext({
        streaks: sampleStreaks,
        timeUntilMidnight: 3,
        settings: createSettings({
          streaks: {
            protectionEnabled: false,
            protectionTime: '21:00',
            protectionThreshold: 3,
            priorityBasedAlerts: true,
          },
        }),
      });

      expect(strategy.shouldNotify(context)).toBe(false);
    });

    it('should return false when no streaks are at risk', () => {
      const context = createContext({
        streaks: sampleStreaks.filter(s => !s.atRisk),
        timeUntilMidnight: 3,
      });

      expect(strategy.shouldNotify(context)).toBe(false);
    });

    it('should return false when too early in the day', () => {
      const context = createContext({
        streaks: sampleStreaks.filter(s => s.atRisk),
        timeUntilMidnight: 10, // More than 4 hours - too early
      });

      expect(strategy.shouldNotify(context)).toBe(false);
    });

    it('should override quiet hours for high-value streaks (30+ days)', () => {
      const context = createContext({
        streaks: [{ ...sampleStreaks[0], currentStreak: 50, atRisk: true }],
        timeUntilMidnight: 2,
        settings: createSettings({
          global: {
            enabled: true,
            quietHours: { enabled: true, start: '22:00', end: '08:00' },
            weekendMode: 'normal',
            soundEnabled: true,
            vibrationEnabled: true,
          },
        }),
      });

      // Mock time at 23:00 (in quiet hours)
      const realDate = Date;
      jest.spyOn(global, 'Date').mockImplementation(() => new realDate('2024-01-15T23:00:00') as any);

      // Should still notify because streak is 50 days (high value)
      expect(strategy.shouldNotify(context)).toBe(true);

      global.Date = realDate;
    });
  });

  describe('getMessage', () => {
    it('should mention longest at-risk streak', () => {
      const context = createContext({
        streaks: [
          { ...sampleStreaks[0], currentStreak: 50, atRisk: true },
        ],
      });

      const message = strategy.getMessage(context);

      expect(message.title).toContain('Streak');
      expect(message.body).toContain('50');
    });

    it('should mention multiple at-risk streaks', () => {
      const context = createContext({
        streaks: [
          { ...sampleStreaks[0], atRisk: true },
          { ...sampleStreaks[1], atRisk: true },
        ],
        timeUntilMidnight: 3,
      });

      const message = strategy.getMessage(context);

      // Title should show count of at-risk streaks
      expect(message.title).toContain('2');
      // Body should mention task names
      expect(message.body).toContain('Exercise');
      expect(message.body).toContain('Read');
    });
  });

  describe('getPriority', () => {
    it('should return critical priority for 100+ day streaks', () => {
      const context = createContext({
        streaks: [{ ...sampleStreaks[0], currentStreak: 100, atRisk: true }],
        timeUntilMidnight: 3,
      });

      const priority = strategy.getPriority(context);

      expect(priority.level).toBe('critical');
      expect(priority.persistent).toBe(true);
    });

    it('should return critical priority when less than 1 hour remaining', () => {
      const context = createContext({
        streaks: [{ ...sampleStreaks[0], currentStreak: 10, atRisk: true }],
        timeUntilMidnight: 0.5, // 30 minutes
      });

      const priority = strategy.getPriority(context);

      expect(priority.level).toBe('critical');
    });

    it('should return high priority for 30+ day streaks', () => {
      const context = createContext({
        streaks: [{ ...sampleStreaks[0], currentStreak: 30, atRisk: true }],
        timeUntilMidnight: 3,
      });

      const priority = strategy.getPriority(context);

      expect(priority.level).toBe('high');
    });

    it('should return high priority when less than 2 hours remaining', () => {
      const context = createContext({
        streaks: [{ ...sampleStreaks[0], currentStreak: 10, atRisk: true }],
        timeUntilMidnight: 1.5,
      });

      const priority = strategy.getPriority(context);

      expect(priority.level).toBe('high');
    });

    it('should return medium priority for 7+ day streaks', () => {
      const context = createContext({
        streaks: [{ ...sampleStreaks[0], currentStreak: 10, atRisk: true }],
        timeUntilMidnight: 3,
      });

      const priority = strategy.getPriority(context);

      expect(priority.level).toBe('medium');
    });

    it('should return low priority for short streaks', () => {
      const context = createContext({
        streaks: [{ ...sampleStreaks[0], currentStreak: 5, atRisk: true }],
        timeUntilMidnight: 3,
      });

      const priority = strategy.getPriority(context);

      expect(priority.level).toBe('low');
    });
  });
});

describe('WeeklyRecapStrategy', () => {
  let strategy: WeeklyRecapStrategy;
  let realDate: DateConstructor;

  beforeEach(() => {
    strategy = new WeeklyRecapStrategy();
    jest.clearAllMocks();
    realDate = Date;
  });

  afterEach(() => {
    global.Date = realDate;
  });

  describe('type', () => {
    it('should have correct type', () => {
      expect(strategy.type).toBe('weekly_recap');
    });
  });

  describe('shouldNotify', () => {
    it('should return true when weekly recap is enabled and its the right day', () => {
      // Mock Sunday
      jest.spyOn(global, 'Date').mockImplementation(() => {
        const d = new realDate('2024-01-14T15:00:00'); // Sunday
        return d;
      });

      const context = createContext({
        settings: createSettings({
          achievements: {
            enabled: true,
            milestoneAlerts: true,
            weeklyRecapEnabled: true,
            weeklyRecapDay: 'sunday',
            weeklyRecapTime: '19:00',
          },
        }),
      });

      expect(strategy.shouldNotify(context)).toBe(true);
    });

    it('should return false when weekly recap is disabled', () => {
      const context = createContext({
        settings: createSettings({
          achievements: {
            enabled: true,
            milestoneAlerts: true,
            weeklyRecapEnabled: false,
            weeklyRecapDay: 'sunday',
            weeklyRecapTime: '19:00',
          },
        }),
      });

      expect(strategy.shouldNotify(context)).toBe(false);
    });

    it('should return false when its not the scheduled day', () => {
      // Mock Monday
      jest.spyOn(global, 'Date').mockImplementation(() => {
        const d = new realDate('2024-01-15T15:00:00'); // Monday
        return d;
      });

      const context = createContext({
        settings: createSettings({
          achievements: {
            enabled: true,
            milestoneAlerts: true,
            weeklyRecapEnabled: true,
            weeklyRecapDay: 'sunday', // But today is Monday
            weeklyRecapTime: '19:00',
          },
        }),
      });

      expect(strategy.shouldNotify(context)).toBe(false);
    });

    it('should return true on Monday when configured for Monday', () => {
      // Mock Monday
      jest.spyOn(global, 'Date').mockImplementation(() => {
        const d = new realDate('2024-01-15T15:00:00'); // Monday
        return d;
      });

      const context = createContext({
        settings: createSettings({
          achievements: {
            enabled: true,
            milestoneAlerts: true,
            weeklyRecapEnabled: true,
            weeklyRecapDay: 'monday',
            weeklyRecapTime: '19:00',
          },
        }),
      });

      expect(strategy.shouldNotify(context)).toBe(true);
    });
  });

  describe('getMessage', () => {
    it('should return weekly recap message with stats', () => {
      const context = createContext({
        tasks: sampleTasks,
        completedToday: ['task-1', 'task-2', 'task-3'], // All completed
        streaks: sampleStreaks,
      });

      const message = strategy.getMessage(context);

      // Title should be something related to week status
      expect(message.title.length).toBeGreaterThan(0);
      expect(message.body.length).toBeGreaterThan(0);
    });

    it('should mention longest streak in body', () => {
      const context = createContext({
        tasks: sampleTasks,
        completedToday: ['task-1'],
        streaks: [{ ...sampleStreaks[0], currentStreak: 25 }],
      });

      const message = strategy.getMessage(context);

      expect(message.body).toContain('25');
    });
  });

  describe('getScheduleTime', () => {
    it('should schedule for configured day and time', () => {
      const context = createContext({
        settings: createSettings({
          achievements: {
            enabled: true,
            milestoneAlerts: true,
            weeklyRecapEnabled: true,
            weeklyRecapDay: 'sunday',
            weeklyRecapTime: '19:00',
          },
        }),
      });

      const scheduleTime = strategy.getScheduleTime(context);

      expect(scheduleTime.getDay()).toBe(0); // Sunday
      expect(scheduleTime.getHours()).toBe(19);
      expect(scheduleTime.getMinutes()).toBe(0);
    });

    it('should schedule for monday when configured', () => {
      const context = createContext({
        settings: createSettings({
          achievements: {
            enabled: true,
            milestoneAlerts: true,
            weeklyRecapEnabled: true,
            weeklyRecapDay: 'monday',
            weeklyRecapTime: '09:00',
          },
        }),
      });

      const scheduleTime = strategy.getScheduleTime(context);

      expect(scheduleTime.getDay()).toBe(1); // Monday
    });
  });

  describe('getPriority', () => {
    it('should return low priority for weekly recap', () => {
      const context = createContext();

      const priority = strategy.getPriority(context);

      expect(priority.level).toBe('low');
    });
  });
});

describe('BaseNotificationStrategy (via DailyNotificationStrategy)', () => {
  let strategy: DailyNotificationStrategy;

  beforeEach(() => {
    strategy = new DailyNotificationStrategy();
    jest.clearAllMocks();
  });

  describe('isInQuietHours', () => {
    it('should detect overnight quiet hours correctly', () => {
      // Quiet hours from 22:00 to 08:00
      const context = createContext({
        settings: createSettings({
          global: {
            enabled: true,
            quietHours: { enabled: true, start: '22:00', end: '08:00' },
            weekendMode: 'normal',
            soundEnabled: true,
            vibrationEnabled: true,
          },
        }),
      });

      // Mock time at 23:00 (in quiet hours)
      const realDate = Date;
      jest.spyOn(global, 'Date').mockImplementation(() => {
        const d = new realDate('2024-01-15T23:00:00');
        return d;
      });

      expect(strategy.shouldNotify(context)).toBe(false);

      global.Date = realDate;
    });

    it('should allow notifications outside quiet hours', () => {
      const context = createContext({
        settings: createSettings({
          global: {
            enabled: true,
            quietHours: { enabled: true, start: '22:00', end: '08:00' },
            weekendMode: 'normal',
            soundEnabled: true,
            vibrationEnabled: true,
          },
        }),
      });

      // Mock time at 15:00 (outside quiet hours)
      const realDate = Date;
      jest.spyOn(global, 'Date').mockImplementation(() => {
        const d = new realDate('2024-01-15T15:00:00');
        return d;
      });

      expect(strategy.shouldNotify(context)).toBe(true);

      global.Date = realDate;
    });

    it('should not apply quiet hours when disabled', () => {
      const context = createContext({
        settings: createSettings({
          global: {
            enabled: true,
            quietHours: { enabled: false, start: '22:00', end: '08:00' },
            weekendMode: 'normal',
            soundEnabled: true,
            vibrationEnabled: true,
          },
        }),
      });

      // Mock time at 23:00 (would be in quiet hours if enabled)
      const realDate = Date;
      jest.spyOn(global, 'Date').mockImplementation(() => {
        const d = new realDate('2024-01-15T23:00:00');
        return d;
      });

      expect(strategy.shouldNotify(context)).toBe(true);

      global.Date = realDate;
    });
  });

  describe('shouldApplyWeekendMode', () => {
    it('should block notifications on weekend when mode is off', () => {
      const context = createContext({
        isWeekend: true,
        settings: createSettings({
          global: {
            enabled: true,
            quietHours: { enabled: false, start: '22:00', end: '08:00' },
            weekendMode: 'off',
            soundEnabled: true,
            vibrationEnabled: true,
          },
        }),
      });

      expect(strategy.shouldNotify(context)).toBe(false);
    });

    it('should not affect weekdays regardless of weekend mode', () => {
      const context = createContext({
        isWeekend: false,
        settings: createSettings({
          global: {
            enabled: true,
            quietHours: { enabled: false, start: '22:00', end: '08:00' },
            weekendMode: 'off',
            soundEnabled: true,
            vibrationEnabled: true,
          },
        }),
      });

      expect(strategy.shouldNotify(context)).toBe(true);
    });
  });
});
