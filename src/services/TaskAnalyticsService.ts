import { Task, TaskLog, ContributionData } from '../types';
import { dataService } from './DataService';
import { formatDate, getTodayString } from '../utils/dateHelpers';
import logger from '../utils/logger';

/**
 * Task Analytics Service
 * 
 * Provides business logic for task analytics, statistics, and insights.
 * Coordinates data from multiple sources to generate meaningful analytics.
 */
export class TaskAnalyticsService {
  private static instance: TaskAnalyticsService;

  static getInstance(): TaskAnalyticsService {
    if (!TaskAnalyticsService.instance) {
      TaskAnalyticsService.instance = new TaskAnalyticsService();
    }
    return TaskAnalyticsService.instance;
  }

  /**
   * Get comprehensive analytics for a specific task
   */
  async getTaskAnalytics(taskId: string, days = 365): Promise<TaskAnalytics> {
    try {
      logger.debug('SERVICE', 'Generating task analytics', { taskId, days });
      
      const task = await dataService.getTaskById(taskId);
      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }

      const logs = await dataService.getTaskLogs(taskId);
      const endDate = getTodayString();
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const recentLogs = logs.filter(log => log.date >= startDate && log.date <= endDate);
      
      const analytics: TaskAnalytics = {
        task,
        totalCompletions: logs.reduce((sum, log) => sum + log.count, 0),
        recentCompletions: recentLogs.reduce((sum, log) => sum + log.count, 0),
        activeDays: logs.filter(log => log.count > 0).length,
        recentActiveDays: recentLogs.filter(log => log.count > 0).length,
        longestStreak: this.calculateLongestStreak(logs),
        currentStreak: this.calculateCurrentStreak(logs),
        averageCompletionsPerDay: this.calculateAverageCompletions(recentLogs, days),
        completionsByWeekday: this.getCompletionsByWeekday(recentLogs),
        monthlyTrends: this.getMonthlyTrends(logs),
        consistencyScore: this.calculateConsistencyScore(recentLogs, days),
      };

      logger.info('SERVICE', 'Task analytics generated successfully', { 
        taskId, 
        totalCompletions: analytics.totalCompletions,
        currentStreak: analytics.currentStreak 
      });

      return analytics;
    } catch (error) {
      logger.error('SERVICE', 'Failed to generate task analytics', { error, taskId });
      throw error;
    }
  }

  /**
   * Get overview analytics for all tasks
   */
  async getOverviewAnalytics(): Promise<OverviewAnalytics> {
    try {
      logger.debug('SERVICE', 'Generating overview analytics');
      
      const tasksWithActivity = await dataService.getTasksWithRecentActivity(30);
      const totalTasks = tasksWithActivity.length;
      const activeTasks = tasksWithActivity.filter(t => t.recentCompletions > 0).length;
      const totalCompletions = tasksWithActivity.reduce((sum, t) => sum + t.recentCompletions, 0);
      
      const analytics: OverviewAnalytics = {
        totalTasks,
        activeTasks,
        inactiveTasks: totalTasks - activeTasks,
        totalCompletions,
        averageCompletionsPerTask: totalTasks > 0 ? totalCompletions / totalTasks : 0,
        mostActiveTask: this.findMostActiveTask(tasksWithActivity),
        leastActiveTask: this.findLeastActiveTask(tasksWithActivity),
        taskActivityDistribution: this.getTaskActivityDistribution(tasksWithActivity),
      };

      logger.info('SERVICE', 'Overview analytics generated successfully', {
        totalTasks,
        activeTasks,
        totalCompletions
      });

      return analytics;
    } catch (error) {
      logger.error('SERVICE', 'Failed to generate overview analytics', { error });
      throw error;
    }
  }

  private calculateLongestStreak(logs: TaskLog[]): number {
    if (logs.length === 0) return 0;

    const sortedLogs = logs
      .filter(log => log.count > 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    let longestStreak = 0;
    let currentStreak = 0;
    let previousDate: Date | null = null;

    for (const log of sortedLogs) {
      const currentDate = new Date(log.date);
      
      if (previousDate === null) {
        currentStreak = 1;
      } else {
        const daysDiff = Math.floor((currentDate.getTime() - previousDate.getTime()) / (24 * 60 * 60 * 1000));
        
        if (daysDiff === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      }
      
      previousDate = currentDate;
    }

    return Math.max(longestStreak, currentStreak);
  }

  private calculateCurrentStreak(logs: TaskLog[]): number {
    const today = new Date(getTodayString());
    const recentLogs = logs
      .filter(log => log.count > 0)
      .sort((a, b) => b.date.localeCompare(a.date));

    let streak = 0;
    let checkDate = new Date(today);

    for (let i = 0; i < recentLogs.length; i++) {
      const logDate = new Date(recentLogs[i].date);
      const expectedDate = formatDate(checkDate);
      
      if (recentLogs[i].date === expectedDate) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  private calculateAverageCompletions(logs: TaskLog[], days: number): number {
    const totalCompletions = logs.reduce((sum, log) => sum + log.count, 0);
    return days > 0 ? totalCompletions / days : 0;
  }

  private getCompletionsByWeekday(logs: TaskLog[]): Record<string, number> {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const completionsByWeekday: Record<string, number> = {};
    
    weekdays.forEach(day => completionsByWeekday[day] = 0);

    logs.forEach(log => {
      const date = new Date(log.date);
      const weekday = weekdays[date.getDay()];
      completionsByWeekday[weekday] += log.count;
    });

    return completionsByWeekday;
  }

  private getMonthlyTrends(logs: TaskLog[]): Array<{ month: string; completions: number }> {
    const monthlyTotals: Record<string, number> = {};

    logs.forEach(log => {
      const date = new Date(log.date);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + log.count;
    });

    return Object.entries(monthlyTotals)
      .map(([month, completions]) => ({ month, completions }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  }

  private calculateConsistencyScore(logs: TaskLog[], days: number): number {
    if (days === 0) return 0;
    
    const activeDays = logs.filter(log => log.count > 0).length;
    return Math.round((activeDays / days) * 100);
  }

  private findMostActiveTask(tasks: Array<Task & { recentCompletions: number }>): Task | null {
    if (tasks.length === 0) return null;
    
    return tasks.reduce((most, current) => {
      if (!most) return current;
      return current.recentCompletions > most.recentCompletions ? current : most;
    });
  }

  private findLeastActiveTask(tasks: Array<Task & { recentCompletions: number }>): Task | null {
    const activeTasks = tasks.filter(t => t.recentCompletions > 0);
    if (activeTasks.length === 0) return null;
    
    return activeTasks.reduce((least, current) => {
      if (!least) return current;
      return current.recentCompletions < least.recentCompletions ? current : least;
    });
  }

  private getTaskActivityDistribution(tasks: Array<Task & { recentCompletions: number }>): TaskActivityDistribution {
    const highly = tasks.filter(t => t.recentCompletions >= 20).length;
    const moderately = tasks.filter(t => t.recentCompletions >= 5 && t.recentCompletions < 20).length;
    const lightly = tasks.filter(t => t.recentCompletions > 0 && t.recentCompletions < 5).length;
    const inactive = tasks.filter(t => t.recentCompletions === 0).length;

    return { highly, moderately, lightly, inactive };
  }
}

// Type definitions
export interface TaskAnalytics {
  task: Task;
  totalCompletions: number;
  recentCompletions: number;
  activeDays: number;
  recentActiveDays: number;
  longestStreak: number;
  currentStreak: number;
  averageCompletionsPerDay: number;
  completionsByWeekday: Record<string, number>;
  monthlyTrends: Array<{ month: string; completions: number }>;
  consistencyScore: number;
}

export interface OverviewAnalytics {
  totalTasks: number;
  activeTasks: number;
  inactiveTasks: number;
  totalCompletions: number;
  averageCompletionsPerTask: number;
  mostActiveTask: Task | null;
  leastActiveTask: Task | null;
  taskActivityDistribution: TaskActivityDistribution;
}

export interface TaskActivityDistribution {
  highly: number;
  moderately: number;
  lightly: number;
  inactive: number;
}

export const taskAnalyticsService = TaskAnalyticsService.getInstance();
export default taskAnalyticsService;