import { create } from 'zustand';
import { UserGoalWithDetails, GoalProgress } from '../types/goals';
import { getGoalService } from '../services';
import logger from '../utils/logger';

interface GoalsState {
  // State
  goals: UserGoalWithDetails[];
  primaryGoal: UserGoalWithDetails | null;
  goalProgress: GoalProgress[];
  loading: boolean;
  error: string | null;
  canShowModal: boolean; // Critical for iOS modal sequencing

  // Actions
  loadGoals: () => Promise<void>;
  selectGoal: (goalId: string, isPrimary?: boolean) => Promise<void>;
  deselectGoal: (goalId: string) => Promise<void>;
  setPrimaryGoal: (goalId: string) => Promise<void>;
  linkHabit: (goalId: string, taskId: string) => Promise<void>;
  unlinkHabit: (goalId: string, taskId: string) => Promise<void>;
  setTaskGoals: (taskId: string, goalIds: string[]) => Promise<void>;
  getGoalsForTask: (taskId: string) => Promise<string[]>;
  refreshProgress: (date?: string) => Promise<void>;
  setCanShowModal: (value: boolean) => void;
  getGoalById: (id: string) => UserGoalWithDetails | undefined;
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: [],
  primaryGoal: null,
  goalProgress: [],
  loading: false,
  error: null,
  canShowModal: true,

  loadGoals: async () => {
    set({ loading: true, error: null });

    try {
      logger.debug('STORE', 'Loading goals via GoalService');
      const goalService = getGoalService();

      const [goals, primaryGoal, goalProgress] = await Promise.all([
        goalService.getAllGoals(),
        goalService.getPrimaryGoal(),
        goalService.getAllGoalProgress(),
      ]);

      set({
        goals,
        primaryGoal,
        goalProgress,
        loading: false,
      });

      logger.info('STORE', 'Goals loaded', {
        count: goals.length,
        hasPrimary: !!primaryGoal,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STORE', 'Failed to load goals', { error: errorMessage });
      set({ loading: false, error: errorMessage });
    }
  },

  selectGoal: async (goalId, isPrimary = false) => {
    set({ loading: true, error: null });

    try {
      logger.debug('STORE', 'Selecting goal', { goalId, isPrimary });
      const goalService = getGoalService();

      await goalService.selectGoal(goalId, isPrimary);

      // Reload goals to get updated state
      await get().loadGoals();

      logger.info('STORE', 'Goal selected', { goalId, isPrimary });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STORE', 'Failed to select goal', { error: errorMessage, goalId });
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  deselectGoal: async (goalId) => {
    set({ loading: true, error: null });

    try {
      logger.debug('STORE', 'Deselecting goal', { goalId });
      const goalService = getGoalService();

      await goalService.deselectGoal(goalId);

      // Reload goals to get updated state
      await get().loadGoals();

      logger.info('STORE', 'Goal deselected', { goalId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STORE', 'Failed to deselect goal', { error: errorMessage, goalId });
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  setPrimaryGoal: async (goalId) => {
    set({ loading: true, error: null });

    try {
      logger.debug('STORE', 'Setting primary goal', { goalId });
      const goalService = getGoalService();

      await goalService.setPrimaryGoal(goalId);

      // Reload goals to get updated state
      await get().loadGoals();

      logger.info('STORE', 'Primary goal set', { goalId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STORE', 'Failed to set primary goal', { error: errorMessage, goalId });
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  linkHabit: async (goalId, taskId) => {
    try {
      logger.debug('STORE', 'Linking habit to goal', { goalId, taskId });
      const goalService = getGoalService();

      await goalService.linkHabit(goalId, taskId);

      // Reload goals to get updated linked habits
      await get().loadGoals();

      logger.info('STORE', 'Habit linked to goal', { goalId, taskId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STORE', 'Failed to link habit to goal', { error: errorMessage, goalId, taskId });
      throw error;
    }
  },

  unlinkHabit: async (goalId, taskId) => {
    try {
      logger.debug('STORE', 'Unlinking habit from goal', { goalId, taskId });
      const goalService = getGoalService();

      await goalService.unlinkHabit(goalId, taskId);

      // Reload goals to get updated linked habits
      await get().loadGoals();

      logger.info('STORE', 'Habit unlinked from goal', { goalId, taskId });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STORE', 'Failed to unlink habit from goal', { error: errorMessage, goalId, taskId });
      throw error;
    }
  },

  setTaskGoals: async (taskId, goalIds) => {
    try {
      logger.debug('STORE', 'Setting task goals', { taskId, goalIds });
      const goalService = getGoalService();

      await goalService.setTaskGoals(taskId, goalIds);

      // Reload goals to get updated linked habits
      await get().loadGoals();

      logger.info('STORE', 'Task goals set', { taskId, count: goalIds.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STORE', 'Failed to set task goals', { error: errorMessage, taskId });
      throw error;
    }
  },

  getGoalsForTask: async (taskId) => {
    try {
      const goalService = getGoalService();
      return await goalService.getGoalsForTask(taskId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STORE', 'Failed to get goals for task', { error: errorMessage, taskId });
      throw error;
    }
  },

  refreshProgress: async (date) => {
    try {
      logger.debug('STORE', 'Refreshing goal progress', { date });
      const goalService = getGoalService();

      const goalProgress = await goalService.getAllGoalProgress(date);

      set({ goalProgress });

      logger.debug('STORE', 'Goal progress refreshed', { count: goalProgress.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STORE', 'Failed to refresh goal progress', { error: errorMessage });
      // Don't throw - this is a non-critical operation
    }
  },

  setCanShowModal: (value) => {
    set({ canShowModal: value });
  },

  getGoalById: (id) => {
    return get().goals.find(goal => goal.id === id);
  },
}));

export default useGoalsStore;
