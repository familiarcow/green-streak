/**
 * Daily Notification Strategy
 * 
 * Handles smart daily summary notifications based on user activity
 */

import { BaseNotificationStrategy } from './BaseNotificationStrategy';
import {
  NotificationType,
  NotificationContext,
  NotificationPriority,
} from '../../../types';

export class DailyNotificationStrategy extends BaseNotificationStrategy {
  type: NotificationType = 'daily_summary';

  shouldNotify(context: NotificationContext): boolean {
    // Check if daily notifications are enabled
    if (!context.settings.daily.enabled) {
      this.logDecision(false, 'Daily notifications disabled');
      return false;
    }

    // Check quiet hours
    if (this.isInQuietHours(context)) {
      this.logDecision(false, 'In quiet hours');
      return false;
    }

    // Check weekend mode
    if (this.shouldApplyWeekendMode(context)) {
      this.logDecision(false, 'Weekend mode active');
      return false;
    }

    this.logDecision(true, 'Should send daily notification');
    return true;
  }

  getMessage(context: NotificationContext): { title: string; body: string } {
    const title = 'Green Streak';
    let body: string;

    // Smart mode - contextual messages
    if (context.settings.daily.smartMode) {
      body = this.generateSmartMessage(context);
    } else {
      // Simple mode - static message
      body = "Time to log your daily habits! How did you do today?";
    }

    // Add motivational quote if enabled
    if (context.settings.daily.includeMotivation) {
      const quote = this.getMotivationalQuote();
      body = `${body}\n\n💭 "${quote}"`;
    }

    return { title, body };
  }

  getScheduleTime(context: NotificationContext): Date {
    const [hours, minutes] = context.settings.daily.time.split(':').map(Number);
    const scheduleTime = new Date();
    scheduleTime.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    const now = new Date();
    if (scheduleTime <= now) {
      scheduleTime.setDate(scheduleTime.getDate() + 1);
    }

    return scheduleTime;
  }

  private generateSmartMessage(context: NotificationContext): string {
    const completed = context.completedToday.length;
    const total = context.tasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Perfect day
    if (completed === total && total > 0) {
      return `Perfect day! All ${total} habits completed! 🌟`;
    }

    // Good progress
    if (percentage >= 80) {
      return `Great job! You completed ${completed}/${total} habits today 🎯`;
    }

    // Some progress
    if (percentage >= 50) {
      return `Good progress! ${completed}/${total} habits done. Keep going! 💪`;
    }

    // Started
    if (completed > 0) {
      return `You've started! ${completed}/${total} complete. Finish strong! 🚀`;
    }

    // Check for at-risk streaks
    const atRiskCount = context.streaks.filter(s => s.atRisk).length;
    if (atRiskCount > 0) {
      const longestStreak = Math.max(
        ...context.streaks.filter(s => s.atRisk).map(s => s.currentStreak)
      );
      
      if (atRiskCount === 1) {
        const streak = context.streaks.find(s => s.atRisk)!;
        return `Don't break your ${streak.currentStreak} day ${streak.taskName} streak! 🔥`;
      } else {
        return `${atRiskCount} streaks at risk! Your longest is ${longestStreak} days 🔥`;
      }
    }

    // Default message
    return "Time to log today's habits! How did you do? 📝";
  }

  private getMotivationalQuote(): string {
    const quotes = [
      "Success is the sum of small efforts repeated day in and day out.",
      "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
      "The secret of getting ahead is getting started.",
      "Don't watch the clock; do what it does. Keep going.",
      "A year from now, you'll wish you had started today.",
      "The only way to do great work is to love what you do.",
      "Believe you can and you're halfway there.",
      "Success is not final, failure is not fatal: it is the courage to continue that counts.",
      "The difference between ordinary and extraordinary is that little extra.",
      "Your future is created by what you do today, not tomorrow.",
    ];

    return quotes[Math.floor(Math.random() * quotes.length)];
  }

  getPriority(context: NotificationContext): NotificationPriority {
    // Higher priority if streaks are at risk
    const hasAtRiskStreaks = context.streaks.some(s => s.atRisk);
    
    if (hasAtRiskStreaks) {
      return {
        level: 'high',
        sound: context.settings.global.soundEnabled,
        vibrate: context.settings.global.vibrationEnabled,
      };
    }

    return super.getPriority(context);
  }
}