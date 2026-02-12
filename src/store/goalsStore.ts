import { create } from 'zustand';
import {
  UserGoalWithDetails,
  GoalProgress,
  CustomGoalDefinition,
  CreateCustomGoalInput,
  UpdateCustomGoalInput,
} from '../types/goals';
import { getGoalService } from '../services';
import logger from '../utils/logger';

interface GoalsState {
  // State
  goals: UserGoalWithDetails[];
  primaryGoal: UserGoalWithDetails | null;
  goalProgress: GoalProgress[];
  customGoals: CustomGoalDefinition[];
  loading: boolean;
  error: string | null;
  canShowModal: boolean; // Critical for iOS modal sequencing

  // Goal Selection Actions
  loadGoals: () => Promise<void>;
  selectGoal: (goalId: string, isPrimary?: boolean) => Promise<void>;
  deselectGoal: (goalId: string) => Promise<void>;
  setPrimaryGoal: (goalId: string) => Promise<void>;

  // Habit Linking Actions
  linkHabit: (goalId: string, taskId: string) => Promise<void>;
  unlinkHabit: (goalId: string, taskId: string) => Promise<void>;
  setTaskGoals: (taskId: string, goalIds: string[]) => Promise<void>;
  getGoalsForTask: (taskId: string) => string[];

  // Progress & Modal Actions
  refreshProgress: (date?: string) => Promise<void>;
  setCanShowModal: (value: boolean) => void;
  getGoalById: (id: string) => UserGoalWithDetails | undefined;

  // Custom Goal Actions
  loadCustomGoals: () => Promise<void>;
  createCustomGoal: (data: CreateCustomGoalInput, options?: { select?: boolean; isPrimary?: boolean }) => Promise<CustomGoalDefinition>;
  updateCustomGoal: (id: string, data: UpdateCustomGoalInput) => Promise<CustomGoalDefinition>;
  deleteCustomGoal: (id: string) => Promise<void>;
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: [],
  primaryGoal: null,
  goalProgress: [],
  customGoals: [],
  loading: false,
  error: null,
  canShowModal: true,

  loadGoals: async () => {
    set({ loading: true, error: null });

    try {
      logger.debug('STORE', 'Loading goals via GoalService');
      const goalService = getGoalService();

      const [goals, primaryGoal, goalProgress, customGoals] = await Promise.all([
        goalService.getAllGoals(),
        goalService.getPrimaryGoal(),
        goalService.getAllGoalProgress(),
        goalService.getCustomGoals(),
      ]);

      set({
        goals,
        primaryGoal,
        goalProgress,
        customGoals,
        loading: false,
      });

      logger.info('STORE', 'Goals loaded', {
        count: goals.length,
        customCount: customGoals.length,
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

  getGoalsForTask: (taskId) => {
    // Derive from existing state - no async needed
    // Each goal has linkedHabitIds (task IDs), filter to find goals containing this task
    return get().goals
      .filter(goal => goal.linkedHabitIds.includes(taskId))
      .map(goal => goal.goalId);
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

  // ============================================
  // Custom Goal Actions
  // ============================================

  loadCustomGoals: async () => {
    try {
      logger.debug('STORE', 'Loading custom goals');
      const goalService = getGoalService();

      const customGoals = await goalService.getCustomGoals();
      set({ customGoals });

      logger.info('STORE', 'Custom goals loaded', { count: customGoals.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STORE', 'Failed to load custom goals', { error: errorMessage });
      // Don't throw - this is a non-critical operation
    }
  },

  createCustomGoal: async (data, options) => {
    set({ loading: true, error: null });

    try {
      logger.debug('STORE', 'Creating custom goal', { title: data.title });
      const goalService = getGoalService();

      const customGoal = await goalService.createCustomGoal(data, options);

      // Reload goals to get updated state (includes new custom goal in definitions)
      await get().loadGoals();

      logger.info('STORE', 'Custom goal created', { id: customGoal.id, title: customGoal.title });
      return customGoal;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STORE', 'Failed to create custom goal', { error: errorMessage, title: data.title });
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  updateCustomGoal: async (id, data) => {
    set({ loading: true, error: null });

    try {
      logger.debug('STORE', 'Updating custom goal', { id });
      const goalService = getGoalService();

      const customGoal = await goalService.updateCustomGoal(id, data);

      // Reload goals to get updated state
      await get().loadGoals();

      logger.info('STORE', 'Custom goal updated', { id, title: customGoal.title });
      return customGoal;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STORE', 'Failed to update custom goal', { error: errorMessage, id });
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },

  deleteCustomGoal: async (id) => {
    set({ loading: true, error: null });

    try {
      logger.debug('STORE', 'Deleting custom goal', { id });
      const goalService = getGoalService();

      await goalService.deleteCustomGoal(id);

      // Reload goals to get updated state
      await get().loadGoals();

      logger.info('STORE', 'Custom goal deleted', { id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STORE', 'Failed to delete custom goal', { error: errorMessage, id });
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },
}));

export default useGoalsStore;
