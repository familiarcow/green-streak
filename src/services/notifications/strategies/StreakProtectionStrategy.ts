/**
 * Streak Protection Strategy
 * 
 * Protects users from breaking their streaks with timely reminders
 */

import { BaseNotificationStrategy } from './BaseNotificationStrategy';
import {
  NotificationType,
  NotificationContext,
  NotificationPriority,
  StreakNotificationData,
} from '../../../types';

export class StreakProtectionStrategy extends BaseNotificationStrategy {
  type: NotificationType = 'streak_protection';

  shouldNotify(context: NotificationContext): boolean {
    // Check if streak protection is enabled
    if (!context.settings.streaks.protectionEnabled) {
      this.logDecision(false, 'Streak protection disabled');
      return false;
    }

    // Check quiet hours (but override for critical streaks)
    const hasHighValueStreak = context.streaks.some(s => 
      s.atRisk && s.currentStreak >= 30
    );
    
    if (this.isInQuietHours(context) && !hasHighValueStreak) {
      this.logDecision(false, 'In quiet hours and no critical streaks');
      return false;
    }

    // Check if there are any streaks at risk
    const atRiskStreaks = this.getAtRiskStreaks(context);
    if (atRiskStreaks.length === 0) {
      this.logDecision(false, 'No streaks at risk');
      return false;
    }

    // Check if it's close enough to end of day
    if (context.timeUntilMidnight > 4) {
      this.logDecision(false, 'Too early for streak protection', {
        hoursRemaining: context.timeUntilMidnight,
      });
      return false;
    }

    this.logDecision(true, 'Should send streak protection', {
      atRiskCount: atRiskStreaks.length,
      hoursRemaining: context.timeUntilMidnight,
    });
    return true;
  }

  getMessage(context: NotificationContext): { title: string; body: string } {
    const atRiskStreaks = this.getAtRiskStreaks(context);
    
    if (atRiskStreaks.length === 0) {
      return {
        title: 'Streaks Safe',
        body: 'All your streaks are safe for today! 🛡️',
      };
    }

    // Single streak at risk
    if (atRiskStreaks.length === 1) {
      const streak = atRiskStreaks[0];
      const urgency = this.getUrgencyEmoji(context.timeUntilMidnight);
      
      return {
        title: `Streak at Risk ${urgency}`,
        body: `Your ${streak.currentStreak} day ${streak.taskName} streak ends in ${Math.ceil(context.timeUntilMidnight)} hours!`,
      };
    }

    // Multiple streaks at risk
    const longestStreak = Math.max(...atRiskStreaks.map(s => s.currentStreak));
    const taskNames = atRiskStreaks
      .slice(0, 2)
      .map(s => s.taskName)
      .join(', ');
    const moreCount = atRiskStreaks.length > 2 ? ` +${atRiskStreaks.length - 2} more` : '';
    
    return {
      title: `${atRiskStreaks.length} Streaks at Risk! 🚨`,
      body: `${taskNames}${moreCount} • Longest: ${longestStreak} days • ${Math.ceil(context.timeUntilMidnight)}h remaining`,
    };
  }

  getScheduleTime(context: NotificationContext): Date {
    const [hours, minutes] = context.settings.streaks.protectionTime
      .split(':')
      .map(Number);
    
    const scheduleTime = new Date();
    scheduleTime.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    const now = new Date();
    if (scheduleTime <= now) {
      scheduleTime.setDate(scheduleTime.getDate() + 1);
    }

    return scheduleTime;
  }

  getPriority(context: NotificationContext): NotificationPriority {
    const atRiskStreaks = this.getAtRiskStreaks(context);
    
    if (atRiskStreaks.length === 0) {
      return super.getPriority(context);
    }

    const longestStreak = Math.max(...atRiskStreaks.map(s => s.currentStreak));
    const hoursRemaining = context.timeUntilMidnight;

    // Critical priority for long streaks or very little time
    if (longestStreak >= 100 || hoursRemaining <= 1) {
      return {
        level: 'critical',
        sound: true,
        vibrate: true,
        persistent: true, // Don't auto-dismiss
      };
    }

    // High priority for significant streaks
    if (longestStreak >= 30 || hoursRemaining <= 2) {
      return {
        level: 'high',
        sound: context.settings.global.soundEnabled,
        vibrate: true,
      };
    }

    // Medium priority for moderate streaks
    if (longestStreak >= 7) {
      return {
        level: 'medium',
        sound: context.settings.global.soundEnabled,
        vibrate: context.settings.global.vibrationEnabled,
      };
    }

    // Low priority for short streaks
    return {
      level: 'low',
      sound: context.settings.global.soundEnabled,
      vibrate: false,
    };
  }

  private getAtRiskStreaks(context: NotificationContext): StreakNotificationData[] {
    const threshold = context.settings.streaks.protectionThreshold;
    
    return context.streaks.filter(streak => {
      // Must be at risk
      if (!streak.atRisk) return false;
      
      // Must meet minimum threshold
      if (streak.currentStreak < threshold) return false;
      
      // Must not be completed today
      const isCompletedToday = context.completedToday.includes(streak.taskId);
      if (isCompletedToday) return false;
      
      return true;
    });
  }

  private getUrgencyEmoji(hoursRemaining: number): string {
    if (hoursRemaining <= 1) return '🚨';
    if (hoursRemaining <= 2) return '⚠️';
    if (hoursRemaining <= 3) return '⏰';
    return '🔥';
  }
}