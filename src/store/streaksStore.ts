import { create } from 'zustand';
import { TaskStreak, Task } from '../types';
import { getStreakService } from '../services';
import { StreakService } from '../services/StreakService';
import logger from '../utils/logger';

interface StreaksState {
  streaks: TaskStreak[];
  activeStreaks: Array<{
    task: Task;
    streak: TaskStreak;
    isAtRisk: boolean;
  }>;
  dateSpecificStreaks: Map<string, { streakCount: number; hasCompletedToday: boolean; isActiveStreak: boolean }>;
  loading: boolean;
  error: string | null;
  
  // Actions
  loadStreaks: () => Promise<void>;
  loadActiveStreaks: () => Promise<void>;
  loadStreaksForDate: (date: string) => Promise<void>;
  getStreakForTaskOnDate: (taskId: string, date: string) => { streakCount: number; hasCompletedToday: boolean; isActiveStreak: boolean } | null;
  updateStreakOnCompletion: (taskId: string, date: string, count: number) => Promise<TaskStreak | null>;
  checkStreakStatus: (taskId: string, date: string) => Promise<{
    isActive: boolean;
    isAtRisk: boolean;
    currentStreak: number;
    bestStreak: number;
    daysUntilBreak: number;
  } | null>;
  resetStreak: (taskId: string) => Promise<void>;
  checkDailyStreaks: (date: string) => Promise<void>;
  clearError: () => void;
}

export const useStreaksStore = create<StreaksState>((set, get) => ({
  streaks: [],
  activeStreaks: [],
  dateSpecificStreaks: new Map(),
  loading: false,
  error: null,

  loadStreaks: async () => {
    set({ loading: true, error: null });
    try {
      const streakService = getStreakService() as StreakService;
      const streaks = await streakService.getAllStreaks();
      
      set({ streaks, loading: false });
      logger.debug('STATE', 'Streaks loaded', { count: streaks.length });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load streaks';
      logger.error('STATE', 'Failed to load streaks', { error });
      set({ error: errorMsg, loading: false });
    }
  },

  loadActiveStreaks: async () => {
    set({ loading: true, error: null });
    try {
      const streakService = getStreakService() as StreakService;
      const activeStreaks = await streakService.getAllActiveStreaks();
      
      set({ activeStreaks, loading: false });
      logger.debug('STATE', 'Active streaks loaded', { count: activeStreaks.length });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load active streaks';
      logger.error('STATE', 'Failed to load active streaks', { error });
      set({ error: errorMsg, loading: false });
    }
  },

  loadStreaksForDate: async (date: string) => {
    try {
      const streakService = getStreakService() as StreakService;
      const dateStreaks = await streakService.getStreaksForDate(date);
      
      set({ dateSpecificStreaks: dateStreaks });
      logger.debug('STATE', 'Date-specific streaks loaded', { 
        date, 
        count: dateStreaks.size 
      });
    } catch (error) {
      logger.error('STATE', 'Failed to load streaks for date', { error, date });
    }
  },

  getStreakForTaskOnDate: (taskId: string, date: string) => {
    const dateStreaks = get().dateSpecificStreaks;
    return dateStreaks.get(taskId) || null;
  },

  updateStreakOnCompletion: async (taskId: string, date: string, count: number) => {
    try {
      const streakService = getStreakService() as StreakService;
      
      // Get current streak to determine optimistic update
      const currentStreak = get().streaks.find(s => s.taskId === taskId);
      
      // Only apply optimistic update if we can predict the outcome
      if (currentStreak) {
        const isSameDay = currentStreak.lastCompletionDate === date;
        
        if (!isSameDay) {
          // Only do optimistic update if it's a new day
          // We can't easily predict if the streak continues without the rules engine
          logger.debug('STATE', 'Skipping optimistic update for date-aware calculation', { 
            taskId, 
            date,
            lastCompletionDate: currentStreak.lastCompletionDate 
          });
        }
      }

      // Perform actual update
      const updatedStreak = await streakService.updateStreakOnCompletion(taskId, date, count);
      
      // Update with real data
      set((state) => ({
        streaks: state.streaks.map(s => 
          s.taskId === taskId ? updatedStreak : s
        ).concat(
          state.streaks.find(s => s.taskId === taskId) ? [] : [updatedStreak]
        )
      }));

      logger.debug('STATE', 'Streak updated on completion', { 
        taskId, 
        date,
        currentStreak: updatedStreak.currentStreak 
      });

      // Reload active streaks to update UI
      await get().loadActiveStreaks();
      
      // Also reload date-specific streaks for the affected date
      await get().loadStreaksForDate(date);
      
      return updatedStreak;
    } catch (error) {
      // Rollback optimistic update on error
      logger.error('STATE', 'Failed to update streak on completion', { error, taskId });
      
      // Reload to get correct state
      await get().loadStreaks();
      
      return null;
    }
  },

  checkStreakStatus: async (taskId: string, date: string) => {
    try {
      const streakService = getStreakService() as StreakService;
      const status = await streakService.checkStreakStatus(taskId, date);
      
      logger.debug('STATE', 'Streak status checked', { taskId, status });
      return status;
    } catch (error) {
      logger.error('STATE', 'Failed to check streak status', { error, taskId });
      return null;
    }
  },

  resetStreak: async (taskId: string) => {
    try {
      const streakService = getStreakService() as StreakService;
      await streakService.resetStreak(taskId);
      
      // Update the streak in state
      set((state) => ({
        streaks: state.streaks.map(s => 
          s.taskId === taskId ? { ...s, currentStreak: 0 } : s
        ),
        activeStreaks: state.activeStreaks.filter(as => as.task.id !== taskId)
      }));

      logger.debug('STATE', 'Streak reset', { taskId });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to reset streak';
      logger.error('STATE', 'Failed to reset streak', { error, taskId });
      set({ error: errorMsg });
    }
  },

  checkDailyStreaks: async (date: string) => {
    try {
      const streakService = getStreakService() as StreakService;
      await streakService.checkDailyStreaks(date);
      
      // Reload streaks after daily check
      await get().loadStreaks();
      await get().loadActiveStreaks();
      
      logger.debug('STATE', 'Daily streaks checked', { date });
    } catch (error) {
      logger.error('STATE', 'Failed to check daily streaks', { error, date });
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));