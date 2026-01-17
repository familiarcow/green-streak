/**
 * Streak Service
 * 
 * Manages streak calculations and tracking for tasks,
 * including support for skip days and minimum completion requirements.
 */

import { Task, TaskStreak, TaskLog } from '../types';
import { IStreakRepository } from '../database/repositories/interfaces/IStreakRepository';
import { ILogRepository } from '../database/repositories/interfaces/ILogRepository';
import { ITaskRepository } from '../database/repositories/interfaces/ITaskRepository';
import { StreakRulesEngine } from './StreakRulesEngine';
import { calculateStreakFromLogs, calculateStreakAsOfDate } from './StreakCalculator';
import { withTransaction } from '../database/DatabaseTransaction';
import { formatDateString } from '../utils/dateHelpers';
import logger from '../utils/logger';

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedStreak {
  data: TaskStreak;
  timestamp: number;
}

export class StreakService {
  private streakCache = new Map<string, CachedStreak>();
  private allStreaksCache: { data: TaskStreak[], timestamp: number } | null = null;

  constructor(
    private streakRepository: IStreakRepository,
    private logRepository: ILogRepository,
    private taskRepository: ITaskRepository
  ) {
    logger.debug('SERVICES', 'StreakService initialized');
  }

  /**
   * Get the streak count for a specific task on a specific date
   * This is useful for displaying date-appropriate streaks in the UI
   */
  async getStreakForTaskOnDate(
    taskId: string,
    targetDate: string
  ): Promise<{
    streakCount: number;
    hasCompletedToday: boolean;
    isActiveStreak: boolean;
  }> {
    try {
      const task = await this.taskRepository.getById(taskId);
      if (!task || !task.streakEnabled) {
        return {
          streakCount: 0,
          hasCompletedToday: false,
          isActiveStreak: false
        };
      }
      
      const logs = await this.logRepository.findByTask(taskId);
      
      const result = calculateStreakAsOfDate(
        logs,
        targetDate,
        task.streakMinimumCount || 1,
        task.streakSkipWeekends || false,
        task.streakSkipDays || []
      );
      
      logger.debug('SERVICES', 'Calculated streak for date', {
        taskId,
        targetDate,
        streakCount: result.streakCount
      });
      
      return result;
    } catch (error) {
      logger.error('SERVICES', 'Failed to get streak for task on date', {
        error,
        taskId,
        targetDate
      });
      return {
        streakCount: 0,
        hasCompletedToday: false,
        isActiveStreak: false
      };
    }
  }

  /**
   * Get streaks for all tasks on a specific date
   */
  async getStreaksForDate(
    targetDate: string
  ): Promise<Map<string, { streakCount: number; hasCompletedToday: boolean; isActiveStreak: boolean }>> {
    try {
      const tasks = await this.taskRepository.getAll();
      const streaksMap = new Map();
      
      for (const task of tasks) {
        if (task.streakEnabled && !task.archivedAt) {
          const streakData = await this.getStreakForTaskOnDate(task.id, targetDate);
          streaksMap.set(task.id, streakData);
        }
      }
      
      logger.debug('SERVICES', 'Calculated streaks for date', {
        targetDate,
        taskCount: streaksMap.size
      });
      
      return streaksMap;
    } catch (error) {
      logger.error('SERVICES', 'Failed to get streaks for date', { error, targetDate });
      return new Map();
    }
  }

  /**
   * Get all streaks (with caching)
   */
  async getAllStreaks(): Promise<TaskStreak[]> {
    try {
      // Check cache first
      if (this.allStreaksCache && Date.now() - this.allStreaksCache.timestamp < CACHE_TTL) {
        logger.debug('SERVICES', 'Returning cached all streaks');
        return this.allStreaksCache.data;
      }

      // Fetch from repository
      const streaks = await this.streakRepository.getAll();
      
      // Update cache
      this.allStreaksCache = {
        data: streaks,
        timestamp: Date.now()
      };

      logger.debug('SERVICES', 'Fetched and cached all streaks', { count: streaks.length });
      return streaks;
    } catch (error) {
      logger.error('SERVICES', 'Failed to get all streaks', { error });
      throw error;
    }
  }

  /**
   * Get streak by task ID (with caching)
   */
  async getStreakByTaskId(taskId: string): Promise<TaskStreak | null> {
    try {
      // Check cache first
      const cached = this.streakCache.get(taskId);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        logger.debug('SERVICES', 'Returning cached streak', { taskId });
        return cached.data;
      }

      // Fetch from repository
      const streak = await this.streakRepository.getByTaskId(taskId);
      
      // Update cache if found
      if (streak) {
        this.streakCache.set(taskId, {
          data: streak,
          timestamp: Date.now()
        });
      }

      return streak;
    } catch (error) {
      logger.error('SERVICES', 'Failed to get streak by task ID', { error, taskId });
      throw error;
    }
  }

  /**
   * Invalidate cache for a specific task
   */
  private invalidateCache(taskId?: string): void {
    if (taskId) {
      this.streakCache.delete(taskId);
    }
    this.allStreaksCache = null;
  }

  /**
   * Update streak when a task is completed
   */
  async updateStreakOnCompletion(
    taskId: string, 
    date: string, 
    count: number
  ): Promise<TaskStreak> {
    try {
      logger.debug('SERVICES', 'Updating streak on completion', { taskId, date, count });

      // Get task configuration
      const task = await this.taskRepository.getById(taskId);
      if (!task) {
        throw new Error(`Task ${taskId} not found`);
      }

      // Use StreakRulesEngine for configuration logic
      const rulesEngine = new StreakRulesEngine(task);
      
      // If streaks are disabled for this task, don't track
      if (!rulesEngine.isEnabled()) {
        logger.debug('SERVICES', 'Streaks disabled for task', { taskId });
        return await this.getOrCreateStreak(taskId);
      }

      // Check if count meets minimum requirement
      if (!rulesEngine.meetsMinimumRequirement(count)) {
        logger.debug('SERVICES', 'Count below minimum for streak', { 
          taskId, 
          count 
        });
        // Don't update streak if minimum not met
        return await this.getOrCreateStreak(taskId);
      }

      // Get current streak data
      let streak = await this.streakRepository.getByTaskId(taskId);
      
      if (!streak) {
        // Create new streak with initial completion
        logger.debug('SERVICES', 'Creating new streak for task', { taskId, date });
        streak = await this.streakRepository.create({
          taskId,
          currentStreak: 1,
          bestStreak: 1,
          lastCompletionDate: date,
          streakStartDate: date
        });
        
        // Invalidate cache after creation
        this.invalidateCache(taskId);
        
        return streak;
      }

      // Check if we already completed this task on this date
      if (streak.lastCompletionDate === date) {
        logger.debug('SERVICES', 'Task already completed on this date, updating count only', { 
          taskId, 
          date,
          currentStreak: streak.currentStreak
        });
        // Same day completion - don't change streak, just return current
        return streak;
      }

      // Check if this continues the streak based on last completion
      const continuesStreak = rulesEngine.checkStreakContinuation(
        streak.lastCompletionDate,
        date
      );

      let updatedStreak: TaskStreak;
      if (continuesStreak) {
        // Continue the streak - increment by 1
        const currentStreak = streak.currentStreak + 1;
        const bestStreak = Math.max(currentStreak, streak.bestStreak);
        
        logger.debug('SERVICES', 'Continuing streak', {
          taskId,
          date,
          previousStreak: streak.currentStreak,
          newStreak: currentStreak
        });
        
        updatedStreak = await this.streakRepository.update(taskId, {
          currentStreak,
          bestStreak,
          lastCompletionDate: date
        });
      } else {
        // Gap detected - recalculate from full log history
        // This handles backfilling that bridges previously disconnected streak segments
        const logs = await this.logRepository.findByTask(taskId);
        const today = formatDateString(new Date());

        const calculated = calculateStreakFromLogs(
          logs,
          task.streakMinimumCount || 1,
          task.streakSkipWeekends || false,
          task.streakSkipDays || [],
          today
        );

        logger.debug('SERVICES', 'Recalculated streak from logs', {
          taskId,
          date,
          lastCompletionDate: streak.lastCompletionDate,
          previousStreak: streak.currentStreak,
          calculatedStreak: calculated.currentStreak
        });

        updatedStreak = await this.streakRepository.update(taskId, {
          currentStreak: calculated.currentStreak,
          bestStreak: Math.max(streak.bestStreak, calculated.bestStreak),
          lastCompletionDate: calculated.lastCompletionDate,
          streakStartDate: calculated.streakStartDate
        });
      }

      // Invalidate cache after update
      this.invalidateCache(taskId);
      
      return updatedStreak;
    } catch (error) {
      logger.error('SERVICES', 'Failed to update streak on completion', { 
        error, 
        taskId, 
        date 
      });
      throw error;
    }
  }

  /**
   * Check the current streak status for a task
   */
  async checkStreakStatus(taskId: string, currentDate: string): Promise<{
    isActive: boolean;
    isAtRisk: boolean;
    currentStreak: number;
    bestStreak: number;
    daysUntilBreak: number;
  }> {
    try {
      const task = await this.taskRepository.getById(taskId);
      if (!task || !task.streakEnabled) {
        return {
          isActive: false,
          isAtRisk: false,
          currentStreak: 0,
          bestStreak: 0,
          daysUntilBreak: 0
        };
      }

      const streak = await this.streakRepository.getByTaskId(taskId);
      if (!streak || streak.currentStreak === 0) {
        return {
          isActive: false,
          isAtRisk: false,
          currentStreak: 0,
          bestStreak: streak?.bestStreak || 0,
          daysUntilBreak: 0
        };
      }

      // Check if streak is still active using rules engine
      const statusRulesEngine = new StreakRulesEngine(task);
      const isActive = statusRulesEngine.checkStreakContinuation(
        streak.lastCompletionDate,
        currentDate
      );

      // Calculate days until break
      const daysUntilBreak = statusRulesEngine.calculateDaysUntilBreak(
        streak.lastCompletionDate || currentDate,
        currentDate
      );

      return {
        isActive,
        isAtRisk: isActive && daysUntilBreak === 1,
        currentStreak: isActive ? streak.currentStreak : 0,
        bestStreak: streak.bestStreak,
        daysUntilBreak: isActive ? daysUntilBreak : 0
      };
    } catch (error) {
      logger.error('SERVICES', 'Failed to check streak status', { error, taskId });
      throw error;
    }
  }

  /**
   * Handle when task completion is removed/decremented
   */
  async handleTaskDecrementForStreak(
    taskId: string, 
    date: string, 
    newCount: number
  ): Promise<TaskStreak | null> {
    try {
      const task = await this.taskRepository.getById(taskId);
      if (!task || !task.streakEnabled) {
        return null;
      }

      const streak = await this.streakRepository.getByTaskId(taskId);
      if (!streak) {
        return null;
      }

      const rulesEngine = new StreakRulesEngine(task);
      
      // If the new count falls below minimum, we might need to break the streak
      if (!rulesEngine.meetsMinimumRequirement(newCount) && streak.lastCompletionDate === date) {
        // The completion on this date no longer meets requirements
        // We need to recalculate the streak
        
        // Find the previous valid completion date
        const logs = await this.logRepository.findByTask(taskId);
        const validLogs = logs
          .filter(log => log.date < date && rulesEngine.meetsMinimumRequirement(log.count))
          .sort((a, b) => b.date.localeCompare(a.date));
        
        if (validLogs.length > 0) {
          // Revert to the previous valid completion
          const previousDate = validLogs[0].date;
          
          // Recalculate streak from that point
          let newCurrentStreak = 1;
          for (let i = 1; i < validLogs.length; i++) {
            if (rulesEngine.checkStreakContinuation(validLogs[i].date, validLogs[i - 1].date)) {
              newCurrentStreak++;
            } else {
              break;
            }
          }
          
          const updatedStreak = await this.streakRepository.update(taskId, {
            currentStreak: newCurrentStreak,
            lastCompletionDate: previousDate
          });
          
          this.invalidateCache(taskId);
          return updatedStreak;
        } else {
          // No valid completions left, reset the streak
          await this.resetStreak(taskId);
          return await this.getStreakByTaskId(taskId);
        }
      }
      
      // If the count still meets minimum, streak remains unchanged
      return streak;
    } catch (error) {
      logger.error('SERVICES', 'Failed to handle task decrement for streak', { error, taskId });
      return null;
    }
  }

  /**
   * Reset a task's current streak
   */
  async resetStreak(taskId: string): Promise<void> {
    try {
      await this.streakRepository.update(taskId, {
        currentStreak: 0,
        streakStartDate: undefined
      });
      this.invalidateCache(taskId);
      logger.info('SERVICES', 'Streak reset', { taskId });
    } catch (error) {
      logger.error('SERVICES', 'Failed to reset streak', { error, taskId });
      throw error;
    }
  }

  /**
   * Complete a task with atomic streak update (transaction)
   */
  async completeTaskWithStreak(
    taskId: string,
    date: string,
    count: number
  ): Promise<{
    log: TaskLog;
    streak: TaskStreak;
  }> {
    return withTransaction(async (tx) => {
      try {
        logger.debug('SERVICES', 'Starting atomic task completion with streak', { 
          taskId, 
          date, 
          count 
        });

        // Create or update the log within transaction
        const log = await this.logRepository.createOrUpdate(taskId, date, count);
        
        // Update the streak within the same transaction
        const streak = await this.updateStreakOnCompletion(taskId, date, count);
        
        logger.info('SERVICES', 'Task completed atomically with streak update', { 
          taskId, 
          date,
          logId: log.id,
          currentStreak: streak.currentStreak 
        });
        
        return { log, streak };
      } catch (error) {
        logger.error('SERVICES', 'Failed to complete task with streak atomically', { 
          error, 
          taskId, 
          date 
        });
        throw error;
      }
    });
  }

  /**
   * Get streak statistics for a task
   */
  async getStreakStats(taskId: string): Promise<{
    currentStreak: number;
    bestStreak: number;
    totalCompletions: number;
    lastCompletionDate?: string;
    streakStartDate?: string;
  }> {
    try {
      const streak = await this.streakRepository.getByTaskId(taskId);
      const logs = await this.logRepository.findByTask(taskId);
      
      const totalCompletions = logs.reduce((sum, log) => sum + log.count, 0);

      return {
        currentStreak: streak?.currentStreak || 0,
        bestStreak: streak?.bestStreak || 0,
        totalCompletions,
        lastCompletionDate: streak?.lastCompletionDate,
        streakStartDate: streak?.streakStartDate
      };
    } catch (error) {
      logger.error('SERVICES', 'Failed to get streak stats', { error, taskId });
      throw error;
    }
  }

  /**
   * Get all active streaks (optimized with batch loading)
   */
  async getAllActiveStreaks(): Promise<Array<{
    task: Task;
    streak: TaskStreak;
    isAtRisk: boolean;
  }>> {
    try {
      const allStreaks = await this.streakRepository.getAll();
      const today = formatDateString(new Date());
      
      // Filter active streaks and collect task IDs
      const activeStreaks = allStreaks.filter(s => s.currentStreak > 0);
      const taskIds = activeStreaks.map(s => s.taskId);
      
      if (taskIds.length === 0) {
        return [];
      }

      // Batch fetch all tasks
      const tasks = await this.taskRepository.getByIds(taskIds);
      const taskMap = new Map(tasks.map(t => [t.id, t]));
      
      const results = [];
      
      for (const streak of activeStreaks) {
        const task = taskMap.get(streak.taskId);
        if (task && task.streakEnabled && !task.archivedAt) {
          const status = await this.checkStreakStatus(streak.taskId, today);
          if (status.isActive) {
            results.push({
              task,
              streak,
              isAtRisk: status.isAtRisk
            });
          }
        }
      }

      logger.debug('SERVICES', 'Active streaks loaded', { count: results.length });
      return results;
    } catch (error) {
      logger.error('SERVICES', 'Failed to get all active streaks', { error });
      throw error;
    }
  }

  /**
   * Check and update all streaks for a new day
   */
  async checkDailyStreaks(currentDate: string): Promise<void> {
    try {
      logger.debug('SERVICES', 'Checking daily streaks', { currentDate });
      
      const allStreaks = await this.streakRepository.getAll();
      
      for (const streak of allStreaks) {
        if (streak.currentStreak > 0) {
          const task = await this.taskRepository.getById(streak.taskId);
          if (task && task.streakEnabled) {
            const status = await this.checkStreakStatus(streak.taskId, currentDate);
            
            if (!status.isActive && streak.currentStreak > 0) {
              // Streak broken
              await this.resetStreak(streak.taskId);
              logger.info('SERVICES', 'Streak broken', { 
                taskId: streak.taskId,
                previousStreak: streak.currentStreak 
              });
            }
          }
        }
      }
    } catch (error) {
      logger.error('SERVICES', 'Failed to check daily streaks', { error });
      throw error;
    }
  }

  /**
   * Recalculate all streaks from completion history (called on app load)
   * This ensures streaks are accurate based on actual completion data
   */
  // Legacy method name for compatibility
  async validateAllStreaks(): Promise<void> {
    return this.recalculateAllStreaksFromHistory();
  }

  async recalculateAllStreaksFromHistory(): Promise<void> {
    try {
      const currentDate = formatDateString(new Date());
      logger.info('SERVICES', 'Recalculating all streaks from history', { currentDate });
      
      const allTasks = await this.taskRepository.getAll();
      logger.info('SERVICES', 'Found tasks to process', { count: allTasks.length });
      let recalculated = 0;
      
      for (const task of allTasks) {
        if (!task.streakEnabled || task.archivedAt) {
          continue;
        }
        
        // Get all logs for this task
        const logs = await this.logRepository.findByTask(task.id);
        
        // Use the simple calculator
        const calculated = calculateStreakFromLogs(
          logs,
          task.streakMinimumCount || 1,
          task.streakSkipWeekends || false,
          task.streakSkipDays || [],
          currentDate
        );
        
        // Update the streak record with calculated values
        let streak = await this.streakRepository.getByTaskId(task.id);
        if (!streak) {
          if (calculated.currentStreak > 0 || calculated.bestStreak > 0) {
            streak = await this.streakRepository.create({
              taskId: task.id,
              currentStreak: calculated.currentStreak,
              bestStreak: calculated.bestStreak,
              lastCompletionDate: calculated.lastCompletionDate,
              streakStartDate: calculated.streakStartDate
            });
            recalculated++;
          }
        } else {
          // Always update to ensure accuracy
          await this.streakRepository.update(task.id, {
            currentStreak: calculated.currentStreak,
            bestStreak: Math.max(streak.bestStreak, calculated.bestStreak), // Never decrease best streak
            lastCompletionDate: calculated.lastCompletionDate,
            streakStartDate: calculated.streakStartDate
          });
          recalculated++;
        }
        
        logger.info('SERVICES', 'Recalculated streak for task', {
          taskId: task.id,
          taskName: task.name,
          currentStreak: calculated.currentStreak,
          bestStreak: calculated.bestStreak,
          isActive: calculated.isActive,
          lastCompletion: calculated.lastCompletionDate
        });
      }
      
      logger.info('SERVICES', 'Streak recalculation complete', { 
        tasksChecked: allTasks.length,
        streaksRecalculated: recalculated
      });
      
      // Invalidate cache to ensure fresh data
      this.allStreaksCache = null;
      this.streakCache.clear();
    } catch (error) {
      logger.error('SERVICES', 'Failed to recalculate streaks', { error });
      // Don't throw - allow app to continue even if validation fails
    }
  }

  // Private helper methods

  private async getOrCreateStreak(taskId: string): Promise<TaskStreak> {
    let streak = await this.streakRepository.getByTaskId(taskId);
    if (!streak) {
      streak = await this.createNewStreak(taskId);
    }
    return streak;
  }

  private async createNewStreak(
    taskId: string, 
    date?: string
  ): Promise<TaskStreak> {
    return await this.streakRepository.create({
      taskId,
      currentStreak: date ? 1 : 0,
      bestStreak: date ? 1 : 0,
      lastCompletionDate: date,
      streakStartDate: date
    });
  }

}

/**
 * Factory function to create StreakService with dependencies
 */
export const createStreakService = (
  streakRepository: IStreakRepository,
  logRepository: ILogRepository,
  taskRepository: ITaskRepository
): StreakService => {
  return new StreakService(streakRepository, logRepository, taskRepository);
};