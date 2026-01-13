/**
 * Base Notification Strategy
 * 
 * Abstract base class for all notification strategies
 */

import {
  NotificationStrategy,
  NotificationType,
  NotificationContext,
  NotificationPriority,
} from '../../../types';
import logger from '../../../utils/logger';

export abstract class BaseNotificationStrategy implements NotificationStrategy {
  abstract type: NotificationType;

  /**
   * Determine if notification should be sent
   */
  abstract shouldNotify(context: NotificationContext): boolean;

  /**
   * Generate notification message
   */
  abstract getMessage(context: NotificationContext): { title: string; body: string };

  /**
   * Get schedule time for notification
   */
  abstract getScheduleTime(context: NotificationContext): Date;

  /**
   * Get notification priority
   */
  getPriority(context: NotificationContext): NotificationPriority {
    return {
      level: 'medium',
      sound: context.settings.global.soundEnabled,
      vibrate: context.settings.global.vibrationEnabled,
    };
  }

  /**
   * Check if current time is within quiet hours
   */
  protected isInQuietHours(context: NotificationContext): boolean {
    if (!context.settings.global.quietHours.enabled) {
      return false;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = context.settings.global.quietHours.start
      .split(':')
      .map(Number);
    const [endHour, endMinute] = context.settings.global.quietHours.end
      .split(':')
      .map(Number);

    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    }

    return currentTime >= startTime && currentTime < endTime;
  }

  /**
   * Check if weekend mode should affect notification
   */
  protected shouldApplyWeekendMode(context: NotificationContext): boolean {
    if (context.settings.global.weekendMode === 'normal') {
      return false;
    }

    if (!context.isWeekend) {
      return false;
    }

    return context.settings.global.weekendMode === 'off';
  }

  /**
   * Log strategy decision
   */
  protected logDecision(
    decision: boolean,
    reason: string,
    context?: Record<string, any>
  ): void {
    logger.debug('NOTIF', `${this.type} strategy: ${reason}`, {
      decision,
      ...context,
    });
  }
}