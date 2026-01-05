import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Task } from '../types';
import logger from '../utils/logger';

export interface NotificationPermissions {
  status: 'granted' | 'denied' | 'undetermined';
  canAskAgain: boolean;
}

export interface ScheduledNotification {
  identifier: string;
  taskId?: string;
  type: 'daily_reminder' | 'task_reminder';
  time: string; // HH:MM format
  frequency: 'daily' | 'weekly';
  enabled: boolean;
}

class NotificationService {
  private static instance: NotificationService;

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
      
      const identifier = await Notifications.scheduleNotificationAsync({
        identifier: 'global-daily-reminder',
        content: {
          title: 'Green Streak',
          body: 'Time to log your daily habits! How did you do today?',
          data: {
            type: 'daily_reminder',
            scheduledTime: time,
          },
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
        } as Notifications.CalendarTriggerInput,
      });

      logger.info('NOTIF', 'Global daily reminder scheduled', {
        identifier,
        time,
      });

      return identifier;
    } catch (error) {
      logger.error('NOTIF', 'Failed to schedule global daily reminder', { error, time });
      throw error;
    }
  }

  async cancelGlobalDailyReminder(): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync('global-daily-reminder');
      logger.debug('NOTIF', 'Global daily reminder canceled');
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
        weekday: 1, // Monday
        hour: hours,
        minute: minutes,
        repeats: true,
      } as Notifications.CalendarTriggerInput : {
        hour: hours,
        minute: minutes,
        repeats: true,
      } as Notifications.CalendarTriggerInput;

      const notificationId = await Notifications.scheduleNotificationAsync({
        identifier,
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
          },
        },
        trigger,
      });

      logger.info('NOTIF', 'Task reminder scheduled', {
        taskId: task.id,
        taskName: task.name,
        identifier: notificationId,
        time,
        frequency,
      });

      return notificationId;
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
      await Notifications.cancelScheduledNotificationAsync(identifier);
      logger.debug('NOTIF', 'Task reminder canceled', { taskId, identifier });
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