import { create } from 'zustand';
import { TaskLog, ContributionData } from '../types';
import { getDataService } from '../services';
import { formatDate, getAdaptiveRange, getTodayString } from '../utils/dateHelpers';
import logger from '../utils/logger';

interface LogsState {
  logs: Record<string, TaskLog[]>; // taskId -> logs
  contributionData: ContributionData[];
  dateRange: string[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadLogsForTask: (taskId: string) => Promise<void>;
  loadContributionData: (forceRefresh?: boolean, minDate?: string) => Promise<void>;
  getTaskContributionData: (taskId: string, days?: number) => Promise<ContributionData[]>;
  logTaskCompletion: (taskId: string, date: string, count: number) => Promise<void>;
  getLogForTaskAndDate: (taskId: string, date: string) => TaskLog | undefined;
  getTotalCompletionsForDate: (date: string) => number;
}

export const useLogsStore = create<LogsState>((set, get) => ({
  logs: {},
  contributionData: [],
  dateRange: [],
  loading: false,
  error: null,
  
  loadLogsForTask: async (taskId) => {
    set({ loading: true, error: null });
    
    try {
      logger.debug('STATE', 'Loading logs for task via DataService', { taskId });
      const dataService = getDataService();
      const taskLogs = await dataService.getTaskLogs(taskId);
      
      set(state => ({
        logs: {
          ...state.logs,
          [taskId]: taskLogs,
        },
        loading: false,
      }));
      
      logger.debug('STATE', 'Logs loaded for task via DataService', { taskId, count: taskLogs.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STATE', 'Failed to load logs for task via DataService', { error: errorMessage, taskId });
      set({ loading: false, error: errorMessage });
    }
  },
  
  loadContributionData: async (forceRefresh = false, minDate?: string) => {
    const state = get();
    
    if (!forceRefresh && state.contributionData.length > 0 && !minDate) {
      logger.debug('STATE', 'Using cached contribution data');
      return;
    }
    
    set({ loading: true, error: null });
    
    try {
      logger.debug('STATE', 'Loading contribution data via DataService', { minDate });
      
      // Get all logs to determine data range
      const allLogs = Object.values(state.logs).flat();
      const dataPointCount = allLogs.length;
      
      // MINIMUM_DAYS should match what LiveCalendar shows (35 days for 5 weeks)
      // This ensures we always load enough data for the default "Live" view
      const MINIMUM_DAYS = 35;
      
      // Generate adaptive date range, but ensure minimum for calendar display
      let adaptiveDates = getAdaptiveRange(Math.max(dataPointCount, MINIMUM_DAYS));
      
      // Expand range if we need to include a specific date
      if (minDate) {
        const minDateTime = new Date(minDate);
        const earliestDate = adaptiveDates[0];
        
        if (minDateTime < earliestDate) {
          // Expand the range to include the minDate
          const daysDiff = Math.ceil((earliestDate.getTime() - minDateTime.getTime()) / (1000 * 60 * 60 * 24));
          const expandedDays = adaptiveDates.length + daysDiff + 7; // Add some buffer
          adaptiveDates = getAdaptiveRange(Math.max(dataPointCount, expandedDays));
        }
      }
      
      const dateStrings = adaptiveDates.map(date => formatDate(date));
      
      // Get contribution data for the date range
      const dataService = getDataService();
      const contributionData = await dataService.getContributionData(dateStrings);
      
      set({
        contributionData,
        dateRange: dateStrings,
        loading: false,
      });
      
      logger.info('STATE', 'Contribution data loaded via DataService', {
        dateRange: dateStrings.length,
        activeDays: contributionData.filter(d => d.count > 0).length,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STATE', 'Failed to load contribution data via DataService', { error: errorMessage });
      set({ loading: false, error: errorMessage });
    }
  },
  
  logTaskCompletion: async (taskId, date, count) => {
    try {
      logger.debug('STATE', 'Logging task completion via DataService', { taskId, date, count });
      const dataService = getDataService();
      const log = await dataService.logTaskCompletion(taskId, date, count);
      
      set(state => {
        const taskLogs = state.logs[taskId] || [];
        const existingLogIndex = taskLogs.findIndex(l => l.date === date);
        
        let updatedTaskLogs;
        if (existingLogIndex >= 0) {
          // Update existing log
          updatedTaskLogs = [...taskLogs];
          updatedTaskLogs[existingLogIndex] = log;
        } else {
          // Add new log
          updatedTaskLogs = [...taskLogs, log];
        }
        
        return {
          logs: {
            ...state.logs,
            [taskId]: updatedTaskLogs.sort((a, b) => b.date.localeCompare(a.date)),
          },
        };
      });
      
      // Refresh contribution data if logging for today or recent dates
      const today = getTodayString();
      if (date === today || get().dateRange.includes(date)) {
        await get().loadContributionData(true);
      }
      
      logger.info('STATE', 'Task completion logged via DataService', { taskId, date, count });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STATE', 'Failed to log task completion via DataService', { 
        error: errorMessage, 
        taskId, 
        date, 
        count 
      });
      set({ error: errorMessage });
      throw error;
    }
  },
  
  getLogForTaskAndDate: (taskId, date) => {
    const state = get();
    const taskLogs = state.logs[taskId];
    return taskLogs?.find(log => log.date === date);
  },
  
  getTaskContributionData: async (taskId, days = 365) => {
    try {
      logger.debug('STATE', 'Loading task contribution data via DataService', { taskId, days });
      
      // Generate date range for the last N days
      const dates: Date[] = [];
      const today = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(date);
      }
      
      const dateStrings = dates.map(date => formatDate(date));
      
      // Get logs for this specific task
      await get().loadLogsForTask(taskId);
      const taskLogs = get().logs[taskId] || [];
      
      // Create contribution data for each date
      const contributionData: ContributionData[] = dateStrings.map(date => {
        const log = taskLogs.find(l => l.date === date);
        return {
          date,
          count: log?.count || 0,
          tasks: log ? [{
            taskId: log.taskId,
            name: '', // Will be filled by the component
            count: log.count,
            color: '', // Will be filled by the component
          }] : [],
        };
      });
      
      logger.info('STATE', 'Task contribution data loaded via DataService', {
        taskId,
        totalDays: contributionData.length,
        activeDays: contributionData.filter(d => d.count > 0).length,
        totalCompletions: contributionData.reduce((sum, d) => sum + d.count, 0),
      });
      
      return contributionData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STATE', 'Failed to load task contribution data via DataService', { error: errorMessage, taskId });
      throw error;
    }
  },

  getTotalCompletionsForDate: (date) => {
    const state = get();
    const dayData = state.contributionData.find(d => d.date === date);
    return dayData?.count || 0;
  },
}));