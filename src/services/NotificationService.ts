import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Task } from '../types';
import logger from '../utils/logger';

export interface NotificationPermissions {
  status: 'granted' | 'denied' | 'undetermined';
  canAskAgain: boolean;
}

class NotificationService {
  private static instance: NotificationService;
  private scheduledNotifications: Map<string, string> = new Map(); // Map custom ID to expo ID

  private constructor() {
    this.configureNotifications();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private configureNotifications(): void {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    // Handle notification responses
    Notifications.addNotificationResponseReceivedListener(response => {
      logger.info('NOTIF', 'Notification tapped', {
        identifier: response.notification.request.identifier,
        data: response.notification.request.content.data,
      });
      
      // TODO: Navigate to appropriate screen based on notification data
      this.handleNotificationTap(response.notification.request.content.data);
    });

    logger.debug('NOTIF', 'Notification service configured');
  }

  private handleNotificationTap(data: any): void {
    if (data?.type === 'daily_reminder') {
      // Navigate to today's daily log screen
      logger.debug('NOTIF', 'Opening daily log from notification');
    } else if (data?.type === 'task_reminder' && data?.taskId) {
      // Navigate to specific task or daily log for that task
      logger.debug('NOTIF', 'Opening task from notification', { taskId: data.taskId });
    }
  }

  async requestPermissions(): Promise<NotificationPermissions> {
    try {
      logger.debug('NOTIF', 'Requesting notification permissions');
      
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      let canAskAgain = true;

      if (existingStatus !== 'granted') {
        const { status, canAskAgain: canAsk } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
        canAskAgain = canAsk;
      }

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('daily-reminders', {
          name: 'Daily Reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#22c55e',
        });

        await Notifications.setNotificationChannelAsync('task-reminders', {
          name: 'Task Reminders',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3b82f6',
        });
      }

      logger.info('NOTIF', 'Permission request completed', {
        status: finalStatus,
        canAskAgain,
      });

      return {
        status: finalStatus as 'granted' | 'denied' | 'undetermined',
        canAskAgain,
      };
    } catch (error) {
      logger.error('NOTIF', 'Failed to request permissions', { error });
      throw error;
    }
  }

  async scheduleGlobalDailyReminder(time: string, enabled: boolean = true): Promise<string | null> {
    if (!enabled) {
      await this.cancelGlobalDailyReminder();
      return null;
    }

    try {
      const permissions = await this.requestPermissions();
      if (permissions.status !== 'granted') {
        logger.warn('NOTIF', 'Cannot schedule notification without permission');
        return null;
      }

      // Cancel existing global reminder
      await this.cancelGlobalDailyReminder();

      const [hours, minutes] = time.split(':').map(Number);
      
      // Validate time values
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new Error(`Invalid time format: ${time}. Expected HH:MM format with valid hours (0-23) and minutes (0-59)`);
      }
      
      logger.debug('NOTIF', 'Scheduling daily reminder with values', { 
        hours, 
        minutes, 
        time,
        parsedCorrectly: !isNaN(hours) && !isNaN(minutes) 
      });
      
      // Try with calendar trigger type
      try {
        const expoId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Green Streak',
            body: 'Time to log your daily habits! How did you do today?',
            data: {
              type: 'daily_reminder',
              scheduledTime: time,
              identifier: 'global-daily-reminder',
            },
          },
          trigger: {
            type: 'calendar',
            repeats: true,
            hour: hours,
            minute: minutes,
          } as Notifications.CalendarTriggerInput,
        });
        
        // Store mapping
        this.scheduledNotifications.set('global-daily-reminder', expoId);

        logger.info('NOTIF', 'Global daily reminder scheduled', {
          customId: 'global-daily-reminder',
          expoId,
          time,
        });

        return expoId;
      } catch (triggerError) {
        logger.warn('NOTIF', 'Trying alternate trigger format', {
          error: triggerError instanceof Error ? triggerError.message : String(triggerError),
        });
        
        // Try with daily trigger type (alternative format)
        const expoId = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Green Streak',
            body: 'Time to log your daily habits! How did you do today?',
            data: {
              type: 'daily_reminder',
              scheduledTime: time,
              identifier: 'global-daily-reminder',
            },
          },
          trigger: {
            type: 'daily',
            hour: hours,
            minute: minutes,
          } as Notifications.DailyTriggerInput,
        });

        // Store mapping
        this.scheduledNotifications.set('global-daily-reminder', expoId);

        logger.info('NOTIF', 'Global daily reminder scheduled (alternate format)', {
          customId: 'global-daily-reminder',
          expoId,
          time,
        });

        return expoId;
      }
    } catch (error) {
      logger.error('NOTIF', 'Failed to schedule global daily reminder', { 
        error: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        time 
      });
      throw error;
    }
  }

  async cancelGlobalDailyReminder(): Promise<void> {
    try {
      const expoId = this.scheduledNotifications.get('global-daily-reminder');
      if (expoId) {
        await Notifications.cancelScheduledNotificationAsync(expoId);
        this.scheduledNotifications.delete('global-daily-reminder');
        logger.debug('NOTIF', 'Global daily reminder canceled', { expoId });
      } else {
        // Try to find and cancel by checking all scheduled notifications
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const notif of scheduled) {
          if (notif.content.data?.identifier === 'global-daily-reminder') {
            await Notifications.cancelScheduledNotificationAsync(notif.identifier);
            logger.debug('NOTIF', 'Global daily reminder canceled (found by search)', { 
              expoId: notif.identifier 
            });
            break;
          }
        }
      }
    } catch (error) {
      logger.error('NOTIF', 'Failed to cancel global daily reminder', { error });
    }
  }

  async scheduleTaskReminder(
    task: Task, 
    time: string, 
    frequency: 'daily' | 'weekly' = 'daily'
  ): Promise<string | null> {
    if (!task.reminderEnabled || !task.reminderTime) {
      await this.cancelTaskReminder(task.id);
      return null;
    }

    try {
      const permissions = await this.requestPermissions();
      if (permissions.status !== 'granted') {
        logger.warn('NOTIF', 'Cannot schedule task notification without permission');
        return null;
      }

      // Cancel existing reminder for this task
      await this.cancelTaskReminder(task.id);

      const [hours, minutes] = time.split(':').map(Number);
      const identifier = `task-reminder-${task.id}`;

      const trigger: Notifications.NotificationTriggerInput = frequency === 'weekly' ? {
        type: 'calendar',
        weekday: 1, // Monday
        hour: hours,
        minute: minutes,
        repeats: true,
      } as Notifications.CalendarTriggerInput : {
        type: 'daily',
        hour: hours,
        minute: minutes,
      } as Notifications.DailyTriggerInput;

      const expoId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${task.icon} ${task.name}`,
          body: task.description 
            ? `Time for ${task.name.toLowerCase()}: ${task.description}`
            : `Don't forget your ${task.name.toLowerCase()} habit!`,
          data: {
            type: 'task_reminder',
            taskId: task.id,
            taskName: task.name,
            scheduledTime: time,
            frequency,
            identifier,
          },
        },
        trigger,
      });

      // Store mapping
      this.scheduledNotifications.set(identifier, expoId);

      logger.info('NOTIF', 'Task reminder scheduled', {
        taskId: task.id,
        taskName: task.name,
        customId: identifier,
        expoId,
        time,
        frequency,
      });

      return expoId;
    } catch (error) {
      logger.error('NOTIF', 'Failed to schedule task reminder', {
        error,
        taskId: task.id,
        time,
        frequency,
      });
      throw error;
    }
  }

  async cancelTaskReminder(taskId: string): Promise<void> {
    try {
      const identifier = `task-reminder-${taskId}`;
      const expoId = this.scheduledNotifications.get(identifier);
      
      if (expoId) {
        await Notifications.cancelScheduledNotificationAsync(expoId);
        this.scheduledNotifications.delete(identifier);
        logger.debug('NOTIF', 'Task reminder canceled', { taskId, identifier, expoId });
      } else {
        // Try to find and cancel by checking all scheduled notifications
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        for (const notif of scheduled) {
          if (notif.content.data?.identifier === identifier) {
            await Notifications.cancelScheduledNotificationAsync(notif.identifier);
            logger.debug('NOTIF', 'Task reminder canceled (found by search)', { 
              taskId, 
              expoId: notif.identifier 
            });
            break;
          }
        }
      }
    } catch (error) {
      logger.error('NOTIF', 'Failed to cancel task reminder', { error, taskId });
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      logger.info('NOTIF', 'All notifications canceled');
    } catch (error) {
      logger.error('NOTIF', 'Failed to cancel all notifications', { error });
    }
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      logger.debug('NOTIF', 'Retrieved scheduled notifications', { count: scheduled.length });
      return scheduled;
    } catch (error) {
      logger.error('NOTIF', 'Failed to get scheduled notifications', { error });
      return [];
    }
  }

  async isNotificationScheduled(identifier: string): Promise<boolean> {
    try {
      const scheduled = await this.getScheduledNotifications();
      return scheduled.some(notification => notification.identifier === identifier);
    } catch (error) {
      logger.error('NOTIF', 'Failed to check notification status', { error, identifier });
      return false;
    }
  }

  async cancelScheduledNotificationAsync(identifier: string): Promise<void> {
    try {
      // Check if this is a custom ID we've mapped
      const expoId = this.scheduledNotifications.get(identifier);
      
      if (expoId) {
        await Notifications.cancelScheduledNotificationAsync(expoId);
        this.scheduledNotifications.delete(identifier);
        logger.debug('NOTIF', 'Notification cancelled', { customId: identifier, expoId });
      } else {
        // Assume it's an expo ID and try to cancel directly
        await Notifications.cancelScheduledNotificationAsync(identifier);
        
        // Also remove from map if it exists as a value
        for (const [key, value] of this.scheduledNotifications.entries()) {
          if (value === identifier) {
            this.scheduledNotifications.delete(key);
            break;
          }
        }
        
        logger.debug('NOTIF', 'Notification cancelled', { expoId: identifier });
      }
    } catch (error) {
      logger.error('NOTIF', 'Failed to cancel notification', { error, identifier });
    }
  }

  async scheduleNotificationAsync(request: any): Promise<string> {
    try {
      // Extract identifier if provided and move it to data
      const { identifier, ...notificationRequest } = request;
      
      if (identifier && notificationRequest.content) {
        notificationRequest.content.data = {
          ...notificationRequest.content.data,
          identifier,
        };
      }
      
      const expoId = await Notifications.scheduleNotificationAsync(notificationRequest);
      
      // Store mapping if we have a custom identifier
      if (identifier) {
        this.scheduledNotifications.set(identifier, expoId);
      }
      
      logger.debug('NOTIF', 'Notification scheduled', { 
        customId: identifier,
        expoId,
        trigger: notificationRequest.trigger 
      });
      return expoId;
    } catch (error) {
      logger.error('NOTIF', 'Failed to schedule notification', { error, request });
      throw error;
    }
  }

  // Helper method to sync task reminders with current task state
  async syncTaskReminders(tasks: Task[]): Promise<void> {
    try {
      logger.debug('NOTIF', 'Syncing task reminders', { taskCount: tasks.length });

      // Cancel all existing task reminders
      const scheduled = await this.getScheduledNotifications();
      const taskReminders = scheduled.filter(n => n.identifier.startsWith('task-reminder-'));
      
      for (const reminder of taskReminders) {
        await Notifications.cancelScheduledNotificationAsync(reminder.identifier);
      }

      // Schedule new reminders for enabled tasks
      for (const task of tasks) {
        if (task.reminderEnabled && task.reminderTime) {
          await this.scheduleTaskReminder(
            task, 
            task.reminderTime, 
            task.reminderFrequency || 'daily'
          );
        }
      }

      logger.info('NOTIF', 'Task reminders synced', {
        totalTasks: tasks.length,
        enabledReminders: tasks.filter(t => t.reminderEnabled).length,
      });
    } catch (error) {
      logger.error('NOTIF', 'Failed to sync task reminders', { error });
    }
  }
}

export const notificationService = NotificationService.getInstance();
export default notificationService;