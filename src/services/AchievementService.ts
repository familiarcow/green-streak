/**
 * Achievement Service
 *
 * Core business logic for achievement detection, tracking, and unlocking.
 */

import {
  AchievementDefinition,
  AchievementCheckContext,
  AchievementUnlockEvent,
  AchievementWithStatus,
  AchievementStats,
  AchievementCategory,
  AchievementRarity,
  UnlockedAchievement,
  AchievementProgress,
} from '../types/achievements';
import { IAchievementRepository } from '../database/repositories/interfaces/IAchievementRepository';
import { ITaskRepository } from '../database/repositories/interfaces/ITaskRepository';
import { ILogRepository } from '../database/repositories/interfaces/ILogRepository';
import { IStreakRepository } from '../database/repositories/interfaces/IStreakRepository';
import {
  ACHIEVEMENTS,
  getAchievementById,
  TOTAL_ACHIEVEMENTS,
} from '../data/achievementLibrary';
import { formatDateString } from '../utils/dateHelpers';
import logger from '../utils/logger';

// Event listener type
type AchievementListener = (events: AchievementUnlockEvent[]) => void;

export class AchievementService {
  private listeners: Set<AchievementListener> = new Set();
  private unlockedCache: Set<string> | null = null;

  constructor(
    private achievementRepository: IAchievementRepository,
    private taskRepository: ITaskRepository,
    private logRepository: ILogRepository,
    private streakRepository: IStreakRepository
  ) {
    logger.debug('SERVICES', 'AchievementService initialized');
  }

  // ============================================
  // Event Subscription
  // ============================================

  /**
   * Subscribe to achievement unlock events
   * Returns an unsubscribe function
   */
  subscribe(listener: AchievementListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of unlock events
   */
  private notifyListeners(events: AchievementUnlockEvent[]): void {
    if (events.length === 0) return;

    this.listeners.forEach(listener => {
      try {
        listener(events);
      } catch (error) {
        logger.error('SERVICES', 'Error in achievement listener', { error });
      }
    });
  }

  // ============================================
  // Achievement Status
  // ============================================

  /**
   * Get all achievements with their unlock status and progress
   */
  async getAllAchievementsWithStatus(): Promise<AchievementWithStatus[]> {
    try {
      const unlockedIds = await this.getUnlockedIds();
      const unlockedMap = await this.getUnlockedMap();
      const progressMap = await this.getProgressMap();

      return ACHIEVEMENTS.map(definition => {
        const unlocked = unlockedMap.get(definition.id) || null;
        const progress = progressMap.get(definition.id) || null;
        const isUnlocked = unlockedIds.has(definition.id);

        // Hidden achievements show as "???" unless unlocked
        const isHidden = definition.hidden === true && !isUnlocked;

        return {
          definition,
          unlocked,
          progress,
          isUnlocked,
          isHidden,
        };
      });
    } catch (error) {
      logger.error('SERVICES', 'Failed to get achievements with status', { error });
      throw error;
    }
  }

  /**
   * Get achievement statistics
   */
  async getStats(): Promise<AchievementStats> {
    try {
      const unlockedIds = await this.getUnlockedIds();
      const unlockedList = await this.achievementRepository.getAllUnlocked();

      // Calculate by category
      const byCategory: Record<AchievementCategory, { unlocked: number; total: number }> = {
        streak: { unlocked: 0, total: 0 },
        consistency: { unlocked: 0, total: 0 },
        early_bird: { unlocked: 0, total: 0 },
        perfect: { unlocked: 0, total: 0 },
        habit_mastery: { unlocked: 0, total: 0 },
        special: { unlocked: 0, total: 0 },
        explorer: { unlocked: 0, total: 0 },
        recovery: { unlocked: 0, total: 0 },
        time_based: { unlocked: 0, total: 0 },
      };

      // Calculate by rarity
      const byRarity: Record<AchievementRarity, number> = {
        common: 0,
        uncommon: 0,
        rare: 0,
        epic: 0,
        legendary: 0,
      };

      ACHIEVEMENTS.forEach(a => {
        byCategory[a.category].total++;

        if (unlockedIds.has(a.id)) {
          byCategory[a.category].unlocked++;
          byRarity[a.rarity]++;
        }
      });

      // Get recent unlocks (last 5)
      const recentUnlocks = unlockedList.slice(0, 5);

      return {
        totalUnlocked: unlockedIds.size,
        totalAchievements: TOTAL_ACHIEVEMENTS,
        percentage: Math.floor((unlockedIds.size / TOTAL_ACHIEVEMENTS) * 100),
        byCategory,
        byRarity,
        recentUnlocks,
      };
    } catch (error) {
      logger.error('SERVICES', 'Failed to get achievement stats', { error });
      throw error;
    }
  }

  // ============================================
  // Achievement Checking
  // ============================================

  /**
   * Check for newly unlocked achievements based on context
   */
  async checkForUnlockedAchievements(
    context: AchievementCheckContext
  ): Promise<AchievementUnlockEvent[]> {
    try {
      logger.debug('SERVICES', 'Checking for unlocked achievements', { context });

      const unlockedIds = await this.getUnlockedIds();
      const newUnlocks: AchievementUnlockEvent[] = [];

      // Get achievements that can potentially be unlocked
      const candidates = ACHIEVEMENTS.filter(a => {
        // Already unlocked
        if (unlockedIds.has(a.id)) return false;

        // Check prerequisite
        if (a.prerequisiteId && !unlockedIds.has(a.prerequisiteId)) return false;

        return true;
      });

      // Evaluate each candidate
      for (const achievement of candidates) {
        const shouldUnlock = await this.evaluateCondition(achievement, context);

        if (shouldUnlock) {
          const unlockRecord = await this.achievementRepository.recordUnlock(
            achievement.id,
            context.taskId,
            { trigger: context.trigger, date: context.date }
          );

          // Delete progress since it's now unlocked
          await this.achievementRepository.deleteProgress(achievement.id);

          newUnlocks.push({
            achievement,
            unlockRecord,
            isNew: true,
          });

          // Invalidate cache
          this.unlockedCache = null;

          logger.info('SERVICES', 'Achievement unlocked', {
            achievementId: achievement.id,
            name: achievement.name,
            trigger: context.trigger,
          });
        }
      }

      // Notify listeners
      this.notifyListeners(newUnlocks);

      return newUnlocks;
    } catch (error) {
      logger.error('SERVICES', 'Failed to check for achievements', { error, context });
      return [];
    }
  }

  /**
   * Mark achievements as viewed
   */
  async markAsViewed(achievementIds: string[]): Promise<void> {
    await this.achievementRepository.markAsViewed(achievementIds);
  }

  /**
   * Get unviewed achievements (for showing pending unlock modals)
   */
  async getUnviewedAchievements(): Promise<AchievementUnlockEvent[]> {
    try {
      const unviewed = await this.achievementRepository.getUnviewedAchievements();

      return unviewed.map(unlockRecord => {
        const achievement = getAchievementById(unlockRecord.achievementId);
        return {
          achievement: achievement!,
          unlockRecord,
          isNew: false,
        };
      }).filter(e => e.achievement !== undefined);
    } catch (error) {
      logger.error('SERVICES', 'Failed to get unviewed achievements', { error });
      return [];
    }
  }

  // ============================================
  // Condition Evaluators
  // ============================================

  /**
   * Evaluate if an achievement's condition is met
   */
  private async evaluateCondition(
    achievement: AchievementDefinition,
    context: AchievementCheckContext
  ): Promise<boolean> {
    const { condition } = achievement;

    switch (condition.type) {
      case 'first_action':
        return this.evaluateFirstAction(condition.action!, context);

      case 'task_count':
        return this.evaluateTaskCount(condition.value!);

      case 'streak_days':
        return this.evaluateStreakDays(condition.value!);

      case 'total_completions':
        return this.evaluateTotalCompletions(condition.value!, context.taskId);

      case 'all_habits_streak':
        return this.evaluateAllHabitsStreak(condition.value!);

      case 'perfect_week':
        return this.evaluatePerfectWeek(condition.value!);

      case 'early_completion':
        return this.evaluateEarlyCompletion(
          condition.value!,
          condition.time!,
          context
        );

      case 'date_specific':
        return this.evaluateDateSpecific(condition.date!, context.date);

      case 'app_anniversary':
        return this.evaluateAppAnniversary(condition.value!);

      case 'multi_habit_same_day':
        return this.evaluateMultiHabitSameDay(condition.value!, context);

      case 'evening_completion':
        return this.evaluateEveningCompletion(
          condition.value!,
          condition.time!,
          context
        );

      case 'streak_recovery':
        return this.evaluateStreakRecovery(
          condition.value!,
          condition.minLostStreak || 0
        );

      case 'weekend_streak':
        return this.evaluateWeekendStreak(condition.value!);

      case 'total_habits_completions':
        return this.evaluateTotalHabitsCompletions(condition.value!);

      case 'multi_habit_streak':
        return this.evaluateMultiHabitStreak(condition.value!, condition.days!);

      default:
        logger.warn('SERVICES', 'Unknown achievement condition type', {
          type: condition.type,
        });
        return false;
    }
  }

  /**
   * First action achievements (first task, first completion, etc.)
   */
  private async evaluateFirstAction(
    action: 'create_task' | 'complete_task' | 'customize_task',
    context: AchievementCheckContext
  ): Promise<boolean> {
    switch (action) {
      case 'create_task':
        if (context.trigger !== 'task_created') return false;
        const tasks = await this.taskRepository.getAll();
        return tasks.length >= 1;

      case 'complete_task':
        if (context.trigger !== 'task_completion') return false;
        // If we're triggering a completion, this is it
        return true;

      case 'customize_task':
        // This would need custom tracking, for now return false
        // Could be triggered when a task is updated with icon/color
        return context.trigger === 'task_customized';

      default:
        return false;
    }
  }

  /**
   * Task count achievements
   */
  private async evaluateTaskCount(requiredCount: number): Promise<boolean> {
    const tasks = await this.taskRepository.getAll();
    return tasks.length >= requiredCount;
  }

  /**
   * Streak days achievements (any task reaching X day streak)
   */
  private async evaluateStreakDays(requiredDays: number): Promise<boolean> {
    const streaks = await this.streakRepository.getAll();
    return streaks.some(s => s.currentStreak >= requiredDays);
  }

  /**
   * Total completions on a single task
   */
  private async evaluateTotalCompletions(
    requiredCount: number,
    taskId?: string
  ): Promise<boolean> {
    // Check all tasks or specific task
    const tasks = taskId
      ? [await this.taskRepository.getById(taskId)].filter(Boolean)
      : await this.taskRepository.getAll();

    for (const task of tasks) {
      if (!task) continue;
      const logs = await this.logRepository.findByTask(task.id);
      const totalCompletions = logs.reduce((sum, log) => sum + log.count, 0);

      if (totalCompletions >= requiredCount) {
        // Update progress for other mastery achievements
        await this.updateMasteryProgress(task.id, totalCompletions);
        return true;
      }
    }

    return false;
  }

  /**
   * All habits completed for X consecutive days
   */
  private async evaluateAllHabitsStreak(requiredDays: number): Promise<boolean> {
    const tasks = await this.taskRepository.getAll();
    if (tasks.length === 0) return false;

    const today = formatDateString(new Date());

    // Check each day going backwards
    for (let i = 0; i < requiredDays; i++) {
      const date = this.subtractDays(today, i);
      let allCompleted = true;

      for (const task of tasks) {
        if (task.archivedAt) continue;

        const logs = await this.logRepository.findByTask(task.id);
        const logForDate = logs.find(l => l.date === date);

        if (!logForDate || logForDate.count < 1) {
          allCompleted = false;
          break;
        }
      }

      if (!allCompleted) {
        return false;
      }
    }

    return true;
  }

  /**
   * Perfect week (all habits completed every day for X weeks)
   */
  private async evaluatePerfectWeek(requiredWeeks: number): Promise<boolean> {
    // A perfect week is 7 days where all habits are completed
    // This is similar to all_habits_streak but counted in weeks
    const requiredDays = requiredWeeks * 7;
    return this.evaluateAllHabitsStreak(requiredDays);
  }

  /**
   * Early completion achievement
   */
  private async evaluateEarlyCompletion(
    requiredDays: number,
    beforeTime: string,
    context: AchievementCheckContext
  ): Promise<boolean> {
    // This would require tracking completion times
    // For now, check if current time is before the threshold
    if (context.trigger !== 'task_completion') return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    if (currentTime >= beforeTime) {
      return false;
    }

    // For simplicity, this checks if user completed early today
    // A full implementation would track early completions over time
    // and check if they've done it for requiredDays

    // Get or update progress
    const achievement = ACHIEVEMENTS.find(
      a => a.condition.type === 'early_completion' && a.condition.value === requiredDays
    );

    if (!achievement) return false;

    const progress = await this.achievementRepository.getProgress(achievement.id);
    const currentValue = (progress?.currentValue || 0) + 1;

    await this.achievementRepository.updateProgress(
      achievement.id,
      currentValue,
      requiredDays
    );

    return currentValue >= requiredDays;
  }

  /**
   * Date-specific achievement (holidays)
   */
  private evaluateDateSpecific(
    targetDate: string,
    currentDate?: string
  ): Promise<boolean> {
    const date = currentDate || formatDateString(new Date());
    const monthDay = date.slice(5); // Get MM-DD from YYYY-MM-DD
    return Promise.resolve(monthDay === targetDate);
  }

  /**
   * App anniversary achievement
   */
  private async evaluateAppAnniversary(requiredYears: number): Promise<boolean> {
    // This would require tracking the app install/first use date
    // For now, check if any task is old enough
    const tasks = await this.taskRepository.findAll();
    if (tasks.length === 0) return false;

    const oldestTask = tasks.reduce((oldest, task) =>
      task.createdAt < oldest.createdAt ? task : oldest
    );

    const createdDate = new Date(oldestTask.createdAt);
    const now = new Date();
    const yearsDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

    return yearsDiff >= requiredYears;
  }

  /**
   * Multiple habits completed on the same day
   */
  private async evaluateMultiHabitSameDay(
    requiredCount: number,
    context: AchievementCheckContext
  ): Promise<boolean> {
    if (context.trigger !== 'task_completion') return false;

    const date = context.date || formatDateString(new Date());
    const tasks = await this.taskRepository.getAll();

    let completedCount = 0;
    for (const task of tasks) {
      if (task.archivedAt) continue;

      const logs = await this.logRepository.findByTask(task.id);
      const logForDate = logs.find(l => l.date === date);

      if (logForDate && logForDate.count >= 1) {
        completedCount++;
      }
    }

    return completedCount >= requiredCount;
  }

  /**
   * Multi-habit streak: complete X+ habits daily for Y consecutive days
   */
  private async evaluateMultiHabitStreak(
    minHabits: number,
    requiredDays: number
  ): Promise<boolean> {
    const tasks = await this.taskRepository.getAll();
    const activeTasks = tasks.filter(t => !t.archivedAt);
    if (activeTasks.length < minHabits) return false;

    const today = formatDateString(new Date());

    // Check each day going backwards
    for (let i = 0; i < requiredDays; i++) {
      const date = this.subtractDays(today, i);
      let completedCount = 0;

      for (const task of activeTasks) {
        const logs = await this.logRepository.findByTask(task.id);
        const logForDate = logs.find(l => l.date === date);

        if (logForDate && logForDate.count >= 1) {
          completedCount++;
        }
      }

      if (completedCount < minHabits) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evening completion achievement (complete after specified time)
   */
  private async evaluateEveningCompletion(
    requiredDays: number,
    afterTime: string,
    context: AchievementCheckContext
  ): Promise<boolean> {
    if (context.trigger !== 'task_completion') return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Must be after the specified time
    if (currentTime < afterTime) {
      return false;
    }

    // Find the matching achievement and update progress
    const achievement = ACHIEVEMENTS.find(
      a => a.condition.type === 'evening_completion' && a.condition.value === requiredDays
    );

    if (!achievement) return false;

    const progress = await this.achievementRepository.getProgress(achievement.id);
    const currentValue = (progress?.currentValue || 0) + 1;

    await this.achievementRepository.updateProgress(
      achievement.id,
      currentValue,
      requiredDays
    );

    return currentValue >= requiredDays;
  }

  /**
   * Streak recovery achievement
   * Triggered when user rebuilds a streak after losing one
   */
  private async evaluateStreakRecovery(
    requiredNewStreak: number,
    minLostStreak: number
  ): Promise<boolean> {
    const streaks = await this.streakRepository.getAll();

    for (const streak of streaks) {
      // Check if current streak meets the rebuild requirement
      if (streak.currentStreak >= requiredNewStreak) {
        // Check if they previously had a streak >= minLostStreak that was lost
        // bestStreak tracks the highest streak ever achieved
        if (streak.bestStreak >= minLostStreak && streak.currentStreak < streak.bestStreak) {
          // They had a good streak, lost it, and rebuilt
          return true;
        }
        // Also check: if current streak is building back up and best was higher
        if (minLostStreak === 0) {
          // For Phoenix Rising (minLostStreak=0), just need to resume within 2 days
          // This is tracked differently - we need to check gap in logs
          const logs = await this.logRepository.findByTask(streak.taskId);
          if (logs.length >= 2) {
            // Sort by date descending
            const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));
            // Check if there was a gap of 1-2 days and then resumed
            for (let i = 0; i < sortedLogs.length - 1; i++) {
              const currentDate = new Date(sortedLogs[i].date);
              const prevDate = new Date(sortedLogs[i + 1].date);
              const daysDiff = Math.floor(
                (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
              );
              // Found a gap of 2-3 days (meaning 1-2 missed days)
              if (daysDiff >= 2 && daysDiff <= 3) {
                return true;
              }
            }
          }
        }
      }
    }

    return false;
  }

  /**
   * Weekend streak achievement
   * Consecutive weekends with both Saturday and Sunday completed
   */
  private async evaluateWeekendStreak(requiredWeekends: number): Promise<boolean> {
    const tasks = await this.taskRepository.getAll();
    if (tasks.length === 0) return false;

    // We need to check the last N weekends
    const today = new Date();
    let consecutiveWeekends = 0;

    // Go back through weekends
    for (let weekOffset = 0; weekOffset < requiredWeekends + 5; weekOffset++) {
      // Find the most recent Saturday relative to today minus weekOffset weeks
      const saturday = new Date(today);
      saturday.setDate(today.getDate() - today.getDay() - 1 - (weekOffset * 7)); // Previous Saturday
      const sunday = new Date(saturday);
      sunday.setDate(saturday.getDate() + 1);

      const saturdayStr = formatDateString(saturday);
      const sundayStr = formatDateString(sunday);

      // Check if any task was completed on both days
      let completedBothDays = false;

      for (const task of tasks) {
        if (task.archivedAt) continue;

        const logs = await this.logRepository.findByTask(task.id);
        const satLog = logs.find(l => l.date === saturdayStr && l.count >= 1);
        const sunLog = logs.find(l => l.date === sundayStr && l.count >= 1);

        if (satLog && sunLog) {
          completedBothDays = true;
          break;
        }
      }

      if (completedBothDays) {
        consecutiveWeekends++;
        if (consecutiveWeekends >= requiredWeekends) {
          return true;
        }
      } else {
        // Break in weekend streak, reset counter
        if (weekOffset > 0) {
          // Don't break on current week if it's not yet Sunday
          consecutiveWeekends = 0;
        }
      }
    }

    return consecutiveWeekends >= requiredWeekends;
  }

  /**
   * Total completions across ALL habits
   */
  private async evaluateTotalHabitsCompletions(
    requiredTotal: number
  ): Promise<boolean> {
    const tasks = await this.taskRepository.getAll();
    let totalCompletions = 0;

    for (const task of tasks) {
      const logs = await this.logRepository.findByTask(task.id);
      totalCompletions += logs.reduce((sum, log) => sum + log.count, 0);
    }

    // Update progress tracking
    const achievement = ACHIEVEMENTS.find(
      a => a.condition.type === 'total_habits_completions' && a.condition.value === requiredTotal
    );

    if (achievement) {
      const unlockedIds = await this.getUnlockedIds();
      if (!unlockedIds.has(achievement.id) && totalCompletions < requiredTotal) {
        await this.achievementRepository.updateProgress(
          achievement.id,
          totalCompletions,
          requiredTotal
        );
      }
    }

    return totalCompletions >= requiredTotal;
  }

  // ============================================
  // Progress Tracking Helpers
  // ============================================

  /**
   * Update progress for mastery achievements
   */
  private async updateMasteryProgress(
    taskId: string,
    totalCompletions: number
  ): Promise<void> {
    const masteryAchievements = ACHIEVEMENTS.filter(
      a => a.condition.type === 'total_completions'
    );

    const unlockedIds = await this.getUnlockedIds();

    for (const achievement of masteryAchievements) {
      if (unlockedIds.has(achievement.id)) continue;

      const targetValue = achievement.condition.value!;
      if (totalCompletions < targetValue) {
        await this.achievementRepository.updateProgress(
          achievement.id,
          totalCompletions,
          targetValue
        );
      }
    }
  }

  // ============================================
  // Private Helpers
  // ============================================

  /**
   * Get cached unlocked IDs (with lazy loading)
   */
  private async getUnlockedIds(): Promise<Set<string>> {
    if (!this.unlockedCache) {
      this.unlockedCache = await this.achievementRepository.getUnlockedIds();
    }
    return this.unlockedCache;
  }

  /**
   * Get map of unlocked achievements
   */
  private async getUnlockedMap(): Promise<Map<string, UnlockedAchievement>> {
    const unlocked = await this.achievementRepository.getAllUnlocked();
    return new Map(unlocked.map(u => [u.achievementId, u]));
  }

  /**
   * Get map of progress records
   */
  private async getProgressMap(): Promise<Map<string, AchievementProgress>> {
    const progress = await this.achievementRepository.getAllProgress();
    return new Map(progress.map(p => [p.achievementId, p]));
  }

  /**
   * Subtract days from a date string
   */
  private subtractDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() - days);
    return formatDateString(date);
  }

  /**
   * Invalidate cache (call when external changes happen)
   */
  invalidateCache(): void {
    this.unlockedCache = null;
  }
}

/**
 * Factory function to create AchievementService with dependencies
 */
export const createAchievementService = (
  achievementRepository: IAchievementRepository,
  taskRepository: ITaskRepository,
  logRepository: ILogRepository,
  streakRepository: IStreakRepository
): AchievementService => {
  return new AchievementService(
    achievementRepository,
    taskRepository,
    logRepository,
    streakRepository
  );
};
