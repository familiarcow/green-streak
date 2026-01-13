/**
 * Weekly Recap Strategy
 * 
 * Provides weekly summary and motivation
 */

import { BaseNotificationStrategy } from './BaseNotificationStrategy';
import {
  NotificationType,
  NotificationContext,
  NotificationPriority,
} from '../../../types';

export class WeeklyRecapStrategy extends BaseNotificationStrategy {
  type: NotificationType = 'weekly_recap';

  shouldNotify(context: NotificationContext): boolean {
    // Check if weekly recap is enabled
    if (!context.settings.achievements.weeklyRecapEnabled) {
      this.logDecision(false, 'Weekly recap disabled');
      return false;
    }

    // Check if it's the right day
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday
    const targetDay = context.settings.achievements.weeklyRecapDay === 'sunday' ? 0 : 1;
    
    if (today !== targetDay) {
      this.logDecision(false, 'Not the scheduled recap day', { today, targetDay });
      return false;
    }

    // Check quiet hours (weekly recap is non-urgent)
    if (this.isInQuietHours(context)) {
      this.logDecision(false, 'In quiet hours');
      return false;
    }

    this.logDecision(true, 'Should send weekly recap');
    return true;
  }

  getMessage(context: NotificationContext): { title: string; body: string } {
    const stats = this.calculateWeeklyStats(context);
    
    let title = 'Weekly Recap 📊';
    let body: string;

    // Perfect week
    if (stats.completionRate === 100) {
      title = 'Perfect Week! 🏆';
      body = `Incredible! You completed all ${stats.totalPossible} habits this week! Keep up the amazing work!`;
    }
    // Great week
    else if (stats.completionRate >= 80) {
      title = 'Great Week! 🌟';
      body = `You completed ${stats.totalCompleted}/${stats.totalPossible} habits (${stats.completionRate}%). Excellent consistency!`;
    }
    // Good week
    else if (stats.completionRate >= 60) {
      title = 'Good Progress! 💪';
      body = `You completed ${stats.totalCompleted}/${stats.totalPossible} habits (${stats.completionRate}%). Keep building momentum!`;
    }
    // Needs improvement
    else {
      title = 'New Week, New Start! 🚀';
      body = `You completed ${stats.totalCompleted} habits this week. Every day is a fresh opportunity!`;
    }

    // Add streak highlights
    if (stats.longestStreak > 0) {
      body += `\n\n🔥 Longest streak: ${stats.longestStreak} days`;
    }

    if (stats.newMilestones.length > 0) {
      body += `\n🎉 New milestones: ${stats.newMilestones.join(', ')}`;
    }

    return { title, body };
  }

  getScheduleTime(context: NotificationContext): Date {
    const [hours, minutes] = context.settings.achievements.weeklyRecapTime
      .split(':')
      .map(Number);
    
    const dayMap = { sunday: 0, monday: 1 };
    const targetDay = dayMap[context.settings.achievements.weeklyRecapDay];
    
    const scheduleTime = new Date();
    const currentDay = scheduleTime.getDay();
    let daysUntilTarget = targetDay - currentDay;
    
    // If target day has passed this week, schedule for next week
    if (daysUntilTarget < 0) {
      daysUntilTarget += 7;
    }
    // If it's the target day but time has passed, schedule for next week
    else if (daysUntilTarget === 0) {
      const currentTime = new Date();
      currentTime.setHours(hours, minutes, 0, 0);
      if (currentTime <= new Date()) {
        daysUntilTarget = 7;
      }
    }
    
    scheduleTime.setDate(scheduleTime.getDate() + daysUntilTarget);
    scheduleTime.setHours(hours, minutes, 0, 0);
    
    return scheduleTime;
  }

  getPriority(context: NotificationContext): NotificationPriority {
    // Weekly recap is always low priority (informational)
    return {
      level: 'low',
      sound: false, // Silent by default
      vibrate: false,
    };
  }

  private calculateWeeklyStats(context: NotificationContext): WeeklyStats {
    // This is a simplified calculation
    // In production, would need to query actual weekly data
    const totalTasks = context.tasks.length;
    const daysInWeek = 7;
    const totalPossible = totalTasks * daysInWeek;
    
    // For now, use current completion as a proxy
    const completedToday = context.completedToday.length;
    const estimatedWeeklyCompleted = completedToday * 5; // Rough estimate
    
    const completionRate = totalPossible > 0
      ? Math.round((estimatedWeeklyCompleted / totalPossible) * 100)
      : 0;
    
    const longestStreak = Math.max(
      0,
      ...context.streaks.map(s => s.currentStreak)
    );
    
    // Check for new milestones (7, 30, 100 days)
    const newMilestones: string[] = [];
    context.streaks.forEach(streak => {
      if (streak.currentStreak === 7) {
        newMilestones.push(`${streak.taskName} (1 week)`);
      } else if (streak.currentStreak === 30) {
        newMilestones.push(`${streak.taskName} (1 month)`);
      } else if (streak.currentStreak === 100) {
        newMilestones.push(`${streak.taskName} (100 days!)`);
      }
    });
    
    return {
      totalCompleted: estimatedWeeklyCompleted,
      totalPossible,
      completionRate,
      longestStreak,
      newMilestones,
    };
  }
}

interface WeeklyStats {
  totalCompleted: number;
  totalPossible: number;
  completionRate: number;
  longestStreak: number;
  newMilestones: string[];
}