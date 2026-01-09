import { useCallback } from 'react';
import { useTasksStore } from '../store/tasksStore';
import { useLogsStore } from '../store/logsStore';
import { useStreaksStore } from '../store/streaksStore';
import { getTodayString } from '../utils/dateHelpers';
import { UseTaskActionsReturn } from '../types';
import { getDataService, getValidationService } from '../services';
import logger from '../utils/logger';

/**
 * Custom hook for task-related operations
 * Provides reusable task actions like quick add, refresh operations, etc.
 */
export const useTaskActions = (): UseTaskActionsReturn => {
  const { loadTasks } = useTasksStore();
  const { logTaskCompletion, getLogForTaskAndDate, loadContributionData } = useLogsStore();
  const { updateStreakOnCompletion } = useStreaksStore();

  const handleQuickAdd = useCallback(async (taskId: string, date?: string) => {
    try {
      console.log('handleQuickAdd called for taskId:', taskId, 'date:', date);
      const targetDate = date || getTodayString();
      
      // Use service layer for data operations
      const dataService = getDataService();
      const currentLog = await dataService.getLogForTaskAndDate(taskId, targetDate);
      const newCount = (currentLog?.count || 0) + 1;
      
      console.log('Adding completion:', { taskId, targetDate, currentCount: currentLog?.count || 0, newCount });
      
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
      
      // Update streak for the task
      await updateStreakOnCompletion(taskId, targetDate, newCount);
      
      // Refresh data to reflect changes - expand date range to include target date if needed
      await loadContributionData(true, targetDate);
      
      logger.debug('UI', 'Quick add completed', { taskId, newCount });
      console.log('Quick add completed successfully');
    } catch (error) {
      console.error('Quick add error:', error);
      logger.error('UI', 'Failed to quick add task', { error, taskId });
      throw error; // Re-throw so components can handle UI feedback
    }
  }, [logTaskCompletion, loadContributionData, updateStreakOnCompletion]);

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
        
        logger.debug('UI', 'Quick remove completed', { taskId, newCount });
      }
    } catch (error) {
      logger.error('UI', 'Failed to quick remove task', { error, taskId });
      throw error; // Re-throw so components can handle UI feedback
    }
  }, [logTaskCompletion, getLogForTaskAndDate, loadContributionData]);

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