import { useCallback, useEffect } from 'react';
import { useTasksStore } from '../store/tasksStore';
import { useLogsStore } from '../store/logsStore';
import { useStreaksStore } from '../store/streaksStore';
import { useSettingsStore } from '../store/settingsStore';
import { useAchievementsStore } from '../store/achievementsStore';
import { useToast } from '../contexts/ToastContext';
import { getStreakMessage, isStreakMilestone, getCelebrationLevel, shouldShowStreakToast, getConfettiType } from '../utils/toastMessages';
import { getTodayString } from '../utils/dateHelpers';
import { UseTaskActionsReturn } from '../types';
import { getDataService, getValidationService } from '../services';
import logger from '../utils/logger';

/**
 * Custom hook for task-related operations
 * Provides reusable task actions like quick add, refresh operations, etc.
 */
export const useTaskActions = (): UseTaskActionsReturn => {
  const { tasks, loadTasks } = useTasksStore();
  const { logTaskCompletion, getLogForTaskAndDate, loadContributionData } = useLogsStore();
  const { updateStreakOnCompletion, streaks } = useStreaksStore();
  const { dynamicIconEnabled } = useSettingsStore();
  const { checkForAchievements } = useAchievementsStore();
  const { showToast } = useToast();

  /**
   * Update dynamic app icon if the feature is enabled.
   * Fails silently to not disrupt main task operations.
   */
  const updateDynamicIconIfEnabled = useCallback(async () => {
    if (!dynamicIconEnabled) return;

    try {
      const { getDynamicIconService } = await import('../services/ServiceRegistry');
      const dynamicIconService = getDynamicIconService();
      await dynamicIconService.updateIconFromActivity();
      logger.debug('UI', 'Dynamic icon updated');
    } catch (error) {
      // Don't fail the operation if icon update fails
      logger.warn('UI', 'Failed to update dynamic icon', { error });
    }
  }, [dynamicIconEnabled]);

  const handleQuickAdd = useCallback(async (taskId: string, date?: string) => {
    try {
      const targetDate = date || getTodayString();
      
      // Use service layer for data operations
      const dataService = getDataService();
      const currentLog = await dataService.getLogForTaskAndDate(taskId, targetDate);
      const newCount = (currentLog?.count || 0) + 1;
      
      // Validate the log data before proceeding
      const validationService = getValidationService();
      const validation = validationService.validateTaskLog({
        taskId,
        date: targetDate,
        count: newCount
      });
      
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      await logTaskCompletion(taskId, targetDate, newCount);
      
      // Get previous streak value
      const previousStreak = streaks.find(s => s.taskId === taskId)?.currentStreak || 0;
      
      // Update streak for the task
      const updatedStreak = await updateStreakOnCompletion(taskId, targetDate, newCount);
      
      // Show toast notification for meaningful streak events (only if today)
      if (updatedStreak && targetDate === getTodayString()) {
        const currentStreak = updatedStreak?.currentStreak || 0;
        const shouldShowToast = shouldShowStreakToast(currentStreak, previousStreak, newCount);
        
        if (shouldShowToast) {
          const task = tasks.find(t => t.id === taskId);
          const taskName = task?.name || 'Task';
          
          // Get appropriate message
          const message = getStreakMessage(currentStreak, previousStreak);
          const isMilestone = isStreakMilestone(currentStreak);
          const confettiType = getConfettiType(currentStreak);
          
          // Determine icon based on streak level
          let icon = '✨';
          if (currentStreak === 365) icon = '🎊';
          else if (currentStreak >= 100) icon = '💯';
          else if (currentStreak >= 50) icon = '🌟';
          else if (currentStreak >= 30) icon = '🏆';
          else if (currentStreak >= 7) icon = '🔥';
          else if (currentStreak === 1 && previousStreak > 1) icon = '💪';
          else if (currentStreak === 1) icon = '🚀';
          
          // Show toast with enhanced effects
          showToast({
            message,
            variant: isMilestone ? 'celebration' : 'success',
            icon,
            effects: {
              sound: isMilestone ? 'milestone' : 'streak',
              confetti: confettiType,  // Uses the new granular confetti system
              haptic: true,
            },
            duration: isMilestone ? 5000 : 3000,  // Longer duration for milestones
          });
        }
      }
      
      // Refresh data to reflect changes - expand date range to include target date if needed
      await loadContributionData(true, targetDate);

      // Update dynamic app icon if enabled
      await updateDynamicIconIfEnabled();

      // Check for achievement unlocks (task completion)
      try {
        await checkForAchievements({
          trigger: 'task_completion',
          taskId,
          date: targetDate,
          count: newCount,
        });

        // Check for streak-based achievements if streak changed
        if (updatedStreak && updatedStreak.currentStreak !== previousStreak) {
          await checkForAchievements({
            trigger: 'streak_update',
            taskId,
            date: targetDate,
          });
        }
      } catch (achievementError) {
        // Don't fail the operation if achievement check fails
        logger.warn('UI', 'Failed to check achievements', { error: achievementError });
      }

      logger.debug('UI', 'Quick add completed', { taskId, newCount });
    } catch (error) {
      console.error('Quick add error:', error);
      logger.error('UI', 'Failed to quick add task', { error, taskId });
      throw error; // Re-throw so components can handle UI feedback
    }
  }, [logTaskCompletion, loadContributionData, updateStreakOnCompletion, streaks, tasks, showToast, updateDynamicIconIfEnabled, checkForAchievements]);

  const handleQuickRemove = useCallback(async (taskId: string, date?: string) => {
    try {
      const targetDate = date || getTodayString();
      const currentLog = getLogForTaskAndDate(taskId, targetDate);
      const currentCount = currentLog?.count || 0;
      
      
      if (currentCount > 0) {
        const newCount = currentCount - 1;
        await logTaskCompletion(taskId, targetDate, newCount);

        // Refresh data to reflect changes - expand date range to include target date if needed
        await loadContributionData(true, targetDate);

        // Update dynamic app icon if enabled
        await updateDynamicIconIfEnabled();

        logger.debug('UI', 'Quick remove completed', { taskId, newCount });
      }
    } catch (error) {
      logger.error('UI', 'Failed to quick remove task', { error, taskId });
      throw error; // Re-throw so components can handle UI feedback
    }
  }, [logTaskCompletion, getLogForTaskAndDate, loadContributionData, updateDynamicIconIfEnabled]);

  const refreshAllData = useCallback(async () => {
    try {
      await Promise.all([
        loadTasks(),
        loadContributionData(true)
      ]);
      logger.debug('UI', 'All data refreshed successfully');
    } catch (error) {
      logger.error('UI', 'Failed to refresh data', { error });
      throw error;
    }
  }, [loadTasks, loadContributionData]);

  const refreshContributionData = useCallback(async () => {
    try {
      await loadContributionData(true);
      logger.debug('UI', 'Contribution data refreshed');
    } catch (error) {
      logger.error('UI', 'Failed to refresh contribution data', { error });
      throw error;
    }
  }, [loadContributionData]);

  return {
    handleQuickAdd,
    handleQuickRemove,
    refreshAllData,
    refreshContributionData,
  };
};