/**
 * NotificationManager Service
 * 
 * Central orchestrator for all intelligent notification logic.
 * Coordinates between settings, tasks, user activity, and notification scheduling.
 */

import {
  NotificationSettings,
  NotificationContext,
  NotificationType,
  NotificationStrategy,
  ActivitySummary,
  StreakNotificationData,
  TaskNotificationData,
  ScheduledNotification,
  NotificationPriority,
  UserActivityPattern,
  CacheEntry,
} from '../types';
import notificationService from './NotificationService';
import { TaskService } from './TaskService';
import { StreakService } from './StreakService';
import { DataService } from './DataService';
import { getTodayString, formatDate } from '../utils/dateHelpers';
import logger from '../utils/logger';
import {
  DailyNotificationStrategy,
  StreakProtectionStrategy,
  WeeklyRecapStrategy,
} from './notifications/strategies';

export class NotificationManager {
  private strategies: Map<NotificationType, NotificationStrategy> = new Map();
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes
  private notificationService = notificationService;

  constructor(
    private taskService: TaskService,
    private streakService: StreakService,
    private dataService: DataService
  ) {
    this.initializeStrategies();
  }

  /**
   * Initialize notification strategies
   */
  private initializeStrategies(): void {
    // Register strategies
    this.strategies.set('daily_summary', new DailyNotificationStrategy());
    this.strategies.set('streak_protection', new StreakProtectionStrategy());
    this.strategies.set('weekly_recap', new WeeklyRecapStrategy());

    logger.debug('NOTIF', 'NotificationManager initialized with strategies', {
      strategies: Array.from(this.strategies.keys()),
    });
  }

  /**
   * Build notification context from current state
   */
  private async buildNotificationContext(settings: NotificationSettings): Promise<NotificationContext> {
    const activity = await this.checkTodayActivity();
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const hoursUntilMidnight = (midnight.getTime() - now.getTime()) / (1000 * 60 * 60);

    return {
      date: getTodayString(),
      tasks: [...activity.completedTasks, ...activity.incompleteTasks],
      streaks: activity.streaksAtRisk,
      completedToday: activity.completedTasks.map(t => t.id),
      settings,
      timeUntilMidnight: hoursUntilMidnight,
      isWeekend: now.getDay() === 0 || now.getDay() === 6,
    };
  }

  /**
   * Schedule smart daily notification based on user activity
   */
  async scheduleSmartDailyNotification(settings: NotificationSettings): Promise<void> {
    if (!settings.daily.enabled) {
      await this.notificationService.cancelGlobalDailyReminder();
      return;
    }

    try {
      logger.debug('NOTIF', 'Scheduling smart daily notification', { 
        time: settings.daily.time,
        smartMode: settings.daily.smartMode 
      });

      // If smart mode is disabled, use simple notification
      if (!settings.daily.smartMode) {
        await this.notificationService.scheduleGlobalDailyReminder(
          settings.daily.time,
          true
        );
        return;
      }

      // Smart mode: Generate contextual message using strategy
      const { title, body } = await this.generateSmartDailyMessage(settings);

      // Get priority from strategy
      const strategy = this.strategies.get('daily_summary');
      const context = await this.buildNotificationContext(settings);
      const priority = strategy?.getPriority(context) || { level: 'medium', sound: true, vibrate: true };

      // Schedule the notification with smart message
      const [hours, minutes] = settings.daily.time.split(':').map(Number);

      await this.scheduleNotification({
        id: 'smart-daily-notification',
        type: 'daily_summary',
        title,
        body,
        scheduledFor: this.getNextScheduleTime(hours, minutes),
        priority,
        recurring: true,
        recurringPattern: 'daily',
      });

      logger.info('NOTIF', 'Smart daily notification scheduled', { title, body });
    } catch (error) {
      logger.error('NOTIF', 'Failed to schedule smart daily notification', { error });
      throw error;
    }
  }

  /**
   * Schedule streak protection notifications for at-risk streaks
   */
  async scheduleStreakProtection(settings: NotificationSettings): Promise<void> {
    if (!settings.streaks.protectionEnabled) {
      await this.cancelStreakProtectionNotifications();
      return;
    }

    try {
      logger.debug('NOTIF', 'Scheduling streak protection', {
        time: settings.streaks.protectionTime,
        threshold: settings.streaks.protectionThreshold,
      });

      const streaksAtRisk = await this.getStreaksAtRisk(settings);
      
      for (const streak of streaksAtRisk) {
        const priority = this.calculateStreakPriority(
          streak.currentStreak,
          settings.streaks.priorityBasedAlerts
        );

        await this.scheduleNotification({
          id: `streak-protection-${streak.taskId}`,
          type: 'streak_protection',
          title: 'Streak at Risk! 🔥',
          body: `Your ${streak.currentStreak} day ${streak.taskName} streak ends soon!`,
          scheduledFor: this.getScheduleTimeFromString(settings.streaks.protectionTime),
          priority,
          data: { taskId: streak.taskId, streakDays: streak.currentStreak },
        });
      }

      logger.info('NOTIF', 'Streak protection scheduled', { 
        count: streaksAtRisk.length 
      });
    } catch (error) {
      logger.error('NOTIF', 'Failed to schedule streak protection', { error });
      throw error;
    }
  }

  /**
   * Sync all notifications based on current settings and state
   */
  async syncAllNotifications(settings: NotificationSettings): Promise<void> {
    try {
      logger.debug('NOTIF', 'Syncing all notifications');

      if (!settings.global.enabled) {
        await this.notificationService.cancelAllNotifications();
        logger.info('NOTIF', 'All notifications disabled');
        return;
      }

      // Schedule daily notification
      await this.scheduleSmartDailyNotification(settings);

      // Schedule streak protection
      await this.scheduleStreakProtection(settings);

      // Sync task reminders
      const tasks = await this.taskService.getAllTasks();
      await this.notificationService.syncTaskReminders(tasks);

      // Schedule weekly recap if enabled
      if (settings.achievements.weeklyRecapEnabled) {
        await this.scheduleWeeklyRecap(settings);
      }

      logger.info('NOTIF', 'All notifications synced successfully');
    } catch (error) {
      logger.error('NOTIF', 'Failed to sync notifications', { error });
      throw error;
    }
  }

  /**
   * Check today's activity for smart notifications
   */
  async checkTodayActivity(): Promise<ActivitySummary> {
    const cacheKey = `activity-${getTodayString()}`;
    const cached = this.getFromCache<ActivitySummary>(cacheKey);
    if (cached) return cached;

    try {
      const today = getTodayString();
      const tasks = await this.taskService.getAllTasks();
      const logs = await this.dataService.getLogsForDate(today);
      
      const completedTaskIds = new Set(
        logs.filter(log => log.count > 0).map(log => log.taskId)
      );

      const completedTasks: TaskNotificationData[] = [];
      const incompleteTasks: TaskNotificationData[] = [];

      for (const task of tasks) {
        const taskData: TaskNotificationData = {
          id: task.id,
          name: task.name,
          icon: task.icon,
          reminderEnabled: task.reminderEnabled,
          reminderTime: task.reminderTime,
          completedToday: completedTaskIds.has(task.id),
        };

        if (taskData.completedToday) {
          completedTasks.push(taskData);
        } else {
          incompleteTasks.push(taskData);
        }
      }

      const streaksAtRisk = await this.getStreaksAtRisk();

      const summary: ActivitySummary = {
        date: today,
        hasLoggedToday: completedTasks.length > 0,
        totalTasks: tasks.length,
        completedTasks,
        incompleteTasks,
        streaksAtRisk,
        perfectDay: completedTasks.length === tasks.length && tasks.length > 0,
        completionRate: tasks.length > 0 
          ? Math.round((completedTasks.length / tasks.length) * 100)
          : 0,
      };

      this.setCache(cacheKey, summary);
      return summary;
    } catch (error) {
      logger.error('NOTIF', 'Failed to check today activity', { error });
      throw error;
    }
  }

  /**
   * Get streaks that are at risk of breaking
   */
  async getStreaksAtRisk(settings?: NotificationSettings): Promise<StreakNotificationData[]> {
    const cacheKey = `streaks-at-risk-${getTodayString()}`;
    const cached = this.getFromCache<StreakNotificationData[]>(cacheKey);
    if (cached) return cached;

    try {
      const today = getTodayString();
      const tasks = await this.taskService.getAllTasks();
      const streaks = await this.streakService.getAllStreaks();
      const logs = await this.dataService.getLogsForDate(today);
      
      const completedToday = new Set(
        logs.filter(log => log.count > 0).map(log => log.taskId)
      );

      const threshold = settings?.streaks.protectionThreshold || 3;
      const atRiskStreaks: StreakNotificationData[] = [];

      for (const streak of streaks) {
        // Skip if streak is below threshold
        if (streak.currentStreak < threshold) continue;

        // Skip if already completed today
        if (completedToday.has(streak.taskId)) continue;

        // Check if last completion was yesterday (streak is active)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0];
        
        if (streak.lastCompletionDate === yesterday) {
          const task = tasks.find(t => t.id === streak.taskId);
          if (task) {
            atRiskStreaks.push({
              taskId: streak.taskId,
              taskName: task.name,
              currentStreak: streak.currentStreak,
              bestStreak: streak.bestStreak,
              lastCompletionDate: streak.lastCompletionDate,
              atRisk: true,
            });
          }
        }
      }

      this.setCache(cacheKey, atRiskStreaks);
      return atRiskStreaks;
    } catch (error) {
      logger.error('NOTIF', 'Failed to get streaks at risk', { error });
      return [];
    }
  }

  /**
   * Generate smart daily notification message using the strategy pattern
   */
  private async generateSmartDailyMessage(settings: NotificationSettings): Promise<{ title: string; body: string }> {
    try {
      const strategy = this.strategies.get('daily_summary');
      if (!strategy) {
        logger.warn('NOTIF', 'Daily strategy not found, using fallback');
        return {
          title: 'Green Streak',
          body: "Don't forget to log your habits today! 📝",
        };
      }

      const context = await this.buildNotificationContext(settings);

      // Check if we should notify based on strategy rules (quiet hours, weekend mode, etc.)
      if (!strategy.shouldNotify(context)) {
        logger.debug('NOTIF', 'Strategy determined notification should not be sent');
        return {
          title: 'Green Streak',
          body: "Time to log your daily habits!",
        };
      }

      return strategy.getMessage(context);
    } catch (error) {
      logger.error('NOTIF', 'Failed to generate smart message', { error });
      return {
        title: 'Green Streak',
        body: "Don't forget to log your habits today! 📝",
      };
    }
  }

  /**
   * Schedule weekly recap notification
   */
  private async scheduleWeeklyRecap(settings: NotificationSettings): Promise<void> {
    try {
      const dayMap = { sunday: 0, monday: 1 };
      const targetDay = dayMap[settings.achievements.weeklyRecapDay];
      const [hours, minutes] = settings.achievements.weeklyRecapTime.split(':').map(Number);

      // Calculate next occurrence of target day
      const now = new Date();
      const currentDay = now.getDay();
      let daysUntilTarget = targetDay - currentDay;
      
      if (daysUntilTarget <= 0) {
        daysUntilTarget += 7;
      }

      const scheduledDate = new Date(now);
      scheduledDate.setDate(scheduledDate.getDate() + daysUntilTarget);
      scheduledDate.setHours(hours, minutes, 0, 0);

      await this.scheduleNotification({
        id: 'weekly-recap',
        type: 'weekly_recap',
        title: 'Weekly Recap 📊',
        body: "See how you did this week!",
        scheduledFor: scheduledDate,
        priority: { level: 'low', sound: true },
        recurring: true,
        recurringPattern: 'weekly',
      });

      logger.info('NOTIF', 'Weekly recap scheduled', { 
        day: settings.achievements.weeklyRecapDay,
        time: settings.achievements.weeklyRecapTime,
      });
    } catch (error) {
      logger.error('NOTIF', 'Failed to schedule weekly recap', { error });
    }
  }

  /**
   * Calculate notification priority based on streak length
   */
  private calculateStreakPriority(
    streakDays: number, 
    priorityBasedAlerts: boolean
  ): NotificationPriority {
    if (!priorityBasedAlerts) {
      return { level: 'medium', sound: true, vibrate: true };
    }

    if (streakDays >= 100) {
      return { level: 'critical', sound: true, vibrate: true, persistent: true };
    } else if (streakDays >= 30) {
      return { level: 'high', sound: true, vibrate: true };
    } else if (streakDays >= 7) {
      return { level: 'medium', sound: true, vibrate: true };
    } else {
      return { level: 'low', sound: true };
    }
  }

  /**
   * Cancel all streak protection notifications
   */
  private async cancelStreakProtectionNotifications(): Promise<void> {
    try {
      const scheduled = await this.notificationService.getScheduledNotifications();
      const streakProtectionIds = scheduled
        .filter(n => n.identifier.startsWith('streak-protection-'))
        .map(n => n.identifier);

      for (const id of streakProtectionIds) {
        await this.notificationService.cancelScheduledNotificationAsync(id);
      }

      logger.debug('NOTIF', 'Streak protection notifications cancelled');
    } catch (error) {
      logger.error('NOTIF', 'Failed to cancel streak protection', { error });
    }
  }

  /**
   * Schedule a notification using the NotificationService
   */
  private async scheduleNotification(notification: ScheduledNotification): Promise<void> {
    try {
      logger.debug('NOTIF', 'Scheduling notification', { 
        type: notification.type,
        id: notification.id 
      });

      // For daily and weekly recurring notifications, use calendar trigger
      if (notification.recurring) {
        const hours = notification.scheduledFor.getHours();
        const minutes = notification.scheduledFor.getMinutes();
        
        const trigger = notification.recurringPattern === 'weekly' 
          ? {
              type: 'calendar' as const,
              weekday: notification.scheduledFor.getDay() + 1, // expo uses 1-7
              hour: hours,
              minute: minutes,
              repeats: true,
            }
          : {
              type: 'daily' as const,
              hour: hours,
              minute: minutes,
            };

        await this.notificationService.scheduleNotificationAsync({
          content: {
            title: notification.title,
            body: notification.body,
            data: {
              ...notification.data,
              type: notification.type,
              identifier: notification.id,
            },
            // Map priority to expo notification options
            priority: notification.priority.level === 'critical' ? 'high' : 'default',
          },
          trigger,
        });
      } else {
        // One-time notification with specific date/time
        const trigger = {
          date: notification.scheduledFor,
        };

        await this.notificationService.scheduleNotificationAsync({
          content: {
            title: notification.title,
            body: notification.body,
            data: {
              ...notification.data,
              type: notification.type,
              identifier: notification.id,
            },
            priority: notification.priority.level === 'critical' ? 'high' : 'default',
          },
          trigger,
        });
      }

      logger.info('NOTIF', 'Notification scheduled successfully', {
        id: notification.id,
        type: notification.type,
        scheduledFor: notification.scheduledFor.toISOString(),
      });
    } catch (error) {
      logger.error('NOTIF', 'Failed to schedule notification', {
        error,
        notificationId: notification.id,
        type: notification.type,
      });
      throw error;
    }
  }

  /**
   * Get next occurrence of a specific time
   */
  private getNextScheduleTime(hours: number, minutes: number): Date {
    const now = new Date();
    const scheduled = new Date();
    scheduled.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduled <= now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }

    return scheduled;
  }

  /**
   * Parse time string to Date
   */
  private getScheduleTimeFromString(time: string): Date {
    const [hours, minutes] = time.split(':').map(Number);
    return this.getNextScheduleTime(hours, minutes);
  }

  /**
   * Cache management utilities
   */
  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setCache(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.CACHE_TTL,
    });
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.debug('NOTIF', 'Notification cache cleared');
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.clearCache();
    this.strategies.clear();
    logger.debug('NOTIF', 'NotificationManager destroyed');
  }
}

// Export singleton instance
export const createNotificationManager = (
  taskService: TaskService,
  streakService: StreakService,
  dataService: DataService
): NotificationManager => {
  return new NotificationManager(
    taskService,
    streakService,
    dataService
  );
};