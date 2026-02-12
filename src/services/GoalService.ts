/**
 * Goal Service
 *
 * Encapsulates all goal-related business logic, including goal selection,
 * habit linking, progress calculation, and custom goal management.
 */

import {
  UserGoal,
  UserGoalWithDetails,
  GoalProgress,
  GoalHabitLink,
  HabitStats,
  CustomGoalDefinition,
  CreateCustomGoalInput,
  UpdateCustomGoalInput,
  AnyGoalDefinition,
  isCustomGoal,
  Milestone,
  CreateMilestoneInput,
} from '../types/goals';
import { IGoalRepository } from '../database/repositories/interfaces/IGoalRepository';
import { ICustomGoalRepository } from '../database/repositories/interfaces/ICustomGoalRepository';
import { IMilestoneRepository } from '../database/repositories/interfaces/IMilestoneRepository';
import { ITaskRepository } from '../database/repositories/interfaces/ITaskRepository';
import { ILogRepository } from '../database/repositories/interfaces/ILogRepository';
import { GOAL_MAP, getGoalById as getPredefinedGoalById, GOALS } from '../data/goalLibrary';
import { getTodayString, formatDate } from '../utils/dateHelpers';
import logger from '../utils/logger';

/**
 * Get an array of date strings for the last N days
 */
function getLastNDays(date: Date, n: number): string[] {
  const dates: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(date);
    d.setDate(date.getDate() - i);
    dates.push(formatDate(d));
  }
  return dates;
}

/**
 * Service for managing goal-related operations
 */
export class GoalService {
  constructor(
    private goalRepository: IGoalRepository,
    private customGoalRepository: ICustomGoalRepository,
    private milestoneRepository: IMilestoneRepository,
    private taskRepository: ITaskRepository,
    private logRepository: ILogRepository
  ) {
    logger.debug('SERVICES', 'GoalService initialized');
  }

  // ============================================
  // Goal Definition Lookups
  // ============================================

  /**
   * Get a goal definition by ID (predefined or custom)
   */
  async getGoalDefinition(goalId: string): Promise<AnyGoalDefinition | null> {
    // First check predefined goals
    const predefined = getPredefinedGoalById(goalId);
    if (predefined) {
      return predefined;
    }

    // Then check custom goals
    const custom = await this.customGoalRepository.getById(goalId);
    return custom;
  }

  /**
   * Get all custom goal definitions
   */
  async getCustomGoals(): Promise<CustomGoalDefinition[]> {
    try {
      return await this.customGoalRepository.getAll();
    } catch (error) {
      logger.error('SERVICES', 'Failed to get custom goals', { error });
      throw error;
    }
  }

  /**
   * Get all goal definitions (predefined + custom)
   */
  async getAllGoalDefinitions(): Promise<AnyGoalDefinition[]> {
    try {
      const customGoals = await this.customGoalRepository.getAll();
      return [...GOALS, ...customGoals];
    } catch (error) {
      logger.error('SERVICES', 'Failed to get all goal definitions', { error });
      throw error;
    }
  }

  /**
   * Get all active goals with their definitions
   * Optimized with batch queries to avoid N+1 problem
   */
  async getAllGoals(): Promise<UserGoalWithDetails[]> {
    try {
      logger.debug('SERVICES', 'Fetching all goals with details');

      const goals = await this.goalRepository.getAllGoals();

      if (goals.length === 0) {
        return [];
      }

      // Batch fetch all custom goals (predefined goals are in-memory)
      const customGoals = await this.customGoalRepository.getAll();
      const customGoalMap = new Map(customGoals.map(g => [g.id, g]));

      // Batch fetch all habit links for all goals
      const goalIds = goals.map(g => g.id);
      const habitLinksMap = await this.goalRepository.getHabitsForGoals(goalIds);

      const goalsWithDetails: UserGoalWithDetails[] = [];

      for (const goal of goals) {
        // Look up definition - first check predefined (in-memory), then custom (from batch)
        let definition: AnyGoalDefinition | undefined = getPredefinedGoalById(goal.goalId);
        if (!definition) {
          definition = customGoalMap.get(goal.goalId);
        }

        if (!definition) {
          logger.warn('SERVICES', 'Goal definition not found', { goalId: goal.goalId });
          continue;
        }

        const linkedHabitIds = habitLinksMap.get(goal.id) ?? [];

        goalsWithDetails.push({
          ...goal,
          definition,
          linkedHabitIds,
        });
      }

      logger.info('SERVICES', 'Goals fetched with details (batch)', { count: goalsWithDetails.length });
      return goalsWithDetails;
    } catch (error) {
      logger.error('SERVICES', 'Failed to fetch goals with details', { error });
      throw error;
    }
  }

  /**
   * Get a single goal by ID with details
   */
  async getGoalById(id: string): Promise<UserGoalWithDetails | null> {
    try {
      const goal = await this.goalRepository.getGoalById(id);
      if (!goal) {
        return null;
      }

      const definition = await this.getGoalDefinition(goal.goalId);
      if (!definition) {
        logger.warn('SERVICES', 'Goal definition not found', { goalId: goal.goalId });
        return null;
      }

      const linkedHabitIds = await this.goalRepository.getHabitsForGoal(goal.id);

      return {
        ...goal,
        definition,
        linkedHabitIds,
      };
    } catch (error) {
      logger.error('SERVICES', 'Failed to fetch goal by ID', { error, id });
      throw error;
    }
  }

  /**
   * Get the primary goal with details
   */
  async getPrimaryGoal(): Promise<UserGoalWithDetails | null> {
    try {
      const goal = await this.goalRepository.getPrimaryGoal();
      if (!goal) {
        return null;
      }

      const definition = await this.getGoalDefinition(goal.goalId);
      if (!definition) {
        logger.warn('SERVICES', 'Goal definition not found', { goalId: goal.goalId });
        return null;
      }

      const linkedHabitIds = await this.goalRepository.getHabitsForGoal(goal.id);

      return {
        ...goal,
        definition,
        linkedHabitIds,
      };
    } catch (error) {
      logger.error('SERVICES', 'Failed to fetch primary goal', { error });
      throw error;
    }
  }

  /**
   * Select a goal (add to user's goals)
   * Works for both predefined and custom goals
   */
  async selectGoal(goalId: string, isPrimary: boolean = false): Promise<UserGoal> {
    try {
      logger.debug('SERVICES', 'Selecting goal', { goalId, isPrimary });

      // Verify goal exists (predefined or custom)
      const definition = await this.getGoalDefinition(goalId);
      if (!definition) {
        throw new Error(`Goal '${goalId}' not found`);
      }

      // Check if already selected
      const existing = await this.goalRepository.getGoalByGoalId(goalId);
      if (existing) {
        logger.info('SERVICES', 'Goal already selected', { goalId });
        return existing;
      }

      const goal = await this.goalRepository.createGoal(goalId, isPrimary);
      logger.info('SERVICES', 'Goal selected', { goalId, id: goal.id, isPrimary, isCustom: isCustomGoal(definition) });

      return goal;
    } catch (error) {
      logger.error('SERVICES', 'Failed to select goal', { error, goalId });
      throw error;
    }
  }

  /**
   * Deselect a goal (archive it)
   */
  async deselectGoal(goalId: string): Promise<void> {
    try {
      logger.debug('SERVICES', 'Deselecting goal', { goalId });

      const goal = await this.goalRepository.getGoalByGoalId(goalId);
      if (!goal) {
        logger.info('SERVICES', 'Goal not selected, nothing to deselect', { goalId });
        return;
      }

      await this.goalRepository.archiveGoal(goal.id);
      logger.info('SERVICES', 'Goal deselected', { goalId, id: goal.id });
    } catch (error) {
      logger.error('SERVICES', 'Failed to deselect goal', { error, goalId });
      throw error;
    }
  }

  /**
   * Set a goal as primary
   */
  async setPrimaryGoal(goalId: string): Promise<void> {
    try {
      logger.debug('SERVICES', 'Setting primary goal', { goalId });

      const goal = await this.goalRepository.getGoalByGoalId(goalId);
      if (!goal) {
        throw new Error(`Goal '${goalId}' is not selected`);
      }

      await this.goalRepository.setPrimaryGoal(goal.id);
      logger.info('SERVICES', 'Primary goal set', { goalId, id: goal.id });
    } catch (error) {
      logger.error('SERVICES', 'Failed to set primary goal', { error, goalId });
      throw error;
    }
  }

  /**
   * Link a habit to a goal
   */
  async linkHabit(goalId: string, taskId: string): Promise<GoalHabitLink> {
    try {
      logger.debug('SERVICES', 'Linking habit to goal', { goalId, taskId });

      // Verify goal exists
      const goal = await this.goalRepository.getGoalByGoalId(goalId);
      if (!goal) {
        throw new Error(`Goal '${goalId}' is not selected`);
      }

      // Verify task exists
      const task = await this.taskRepository.getById(taskId);
      if (!task) {
        throw new Error(`Task '${taskId}' not found`);
      }

      const link = await this.goalRepository.linkHabitToGoal(goal.id, taskId);
      logger.info('SERVICES', 'Habit linked to goal', { goalId, taskId });

      return link;
    } catch (error) {
      logger.error('SERVICES', 'Failed to link habit to goal', { error, goalId, taskId });
      throw error;
    }
  }

  /**
   * Unlink a habit from a goal
   */
  async unlinkHabit(goalId: string, taskId: string): Promise<void> {
    try {
      logger.debug('SERVICES', 'Unlinking habit from goal', { goalId, taskId });

      const goal = await this.goalRepository.getGoalByGoalId(goalId);
      if (!goal) {
        logger.info('SERVICES', 'Goal not found, nothing to unlink', { goalId });
        return;
      }

      await this.goalRepository.unlinkHabitFromGoal(goal.id, taskId);
      logger.info('SERVICES', 'Habit unlinked from goal', { goalId, taskId });
    } catch (error) {
      logger.error('SERVICES', 'Failed to unlink habit from goal', { error, goalId, taskId });
      throw error;
    }
  }

  /**
   * Set all goals for a habit (replaces existing links)
   */
  async setTaskGoals(taskId: string, goalIds: string[]): Promise<void> {
    try {
      logger.debug('SERVICES', 'Setting task goals', { taskId, goalIds });

      // Get user_goals.id for each goalId
      const userGoalIds: string[] = [];
      for (const goalId of goalIds) {
        const goal = await this.goalRepository.getGoalByGoalId(goalId);
        if (goal) {
          userGoalIds.push(goal.id);
        }
      }

      await this.goalRepository.setHabitGoals(taskId, userGoalIds);
      logger.info('SERVICES', 'Task goals set', { taskId, count: userGoalIds.length });
    } catch (error) {
      logger.error('SERVICES', 'Failed to set task goals', { error, taskId });
      throw error;
    }
  }

  /**
   * Get goals linked to a habit
   */
  async getGoalsForTask(taskId: string): Promise<string[]> {
    try {
      const userGoalIds = await this.goalRepository.getGoalsForHabit(taskId);

      // Convert user_goals.id to goal_id (definition ID)
      const goalIds: string[] = [];
      for (const userGoalId of userGoalIds) {
        const goal = await this.goalRepository.getGoalById(userGoalId);
        if (goal) {
          goalIds.push(goal.goalId);
        }
      }

      return goalIds;
    } catch (error) {
      logger.error('SERVICES', 'Failed to get goals for task', { error, taskId });
      throw error;
    }
  }

  /**
   * Calculate progress for a goal (habits completed today, week, all time)
   * Optimized with batch queries to avoid N+1 problem
   */
  async getGoalProgress(goal: UserGoalWithDetails, date?: string): Promise<GoalProgress> {
    try {
      const targetDate = date || getTodayString();
      const linkedHabitIds = goal.linkedHabitIds;

      if (linkedHabitIds.length === 0) {
        return {
          goal,
          completedToday: 0,
          totalHabits: 0,
          percentage: 0,
          habitStats: [],
        };
      }

      // Get date ranges for calculations
      const now = new Date();
      const weekDates = new Set(getLastNDays(now, 7));
      const monthDates = new Set(getLastNDays(now, 30));

      // Batch fetch all data (3 queries total instead of 3N)
      const [tasks, todayLogs, allLogs] = await Promise.all([
        this.taskRepository.getByIds(linkedHabitIds),
        this.logRepository.getByTasksAndDate(linkedHabitIds, targetDate),
        this.logRepository.findByTasks(linkedHabitIds),
      ]);

      // Index data by taskId for O(1) lookups
      const taskMap = new Map(tasks.map(t => [t.id, t]));
      const todayLogMap = new Map(todayLogs.map(l => [l.taskId, l]));

      // Group all logs by taskId
      const allLogsByTask = new Map<string, typeof allLogs>();
      for (const log of allLogs) {
        const existing = allLogsByTask.get(log.taskId) ?? [];
        existing.push(log);
        allLogsByTask.set(log.taskId, existing);
      }

      // Calculate stats for each linked habit
      const habitStats: HabitStats[] = [];
      let completedTodayCount = 0;

      for (const taskId of linkedHabitIds) {
        const task = taskMap.get(taskId);
        if (!task) continue;

        const todayLog = todayLogMap.get(taskId);
        const completionsToday = todayLog?.count || 0;

        if (completionsToday > 0) {
          completedTodayCount++;
        }

        const taskLogs = allLogsByTask.get(taskId) ?? [];

        // Calculate week completions (last 7 days)
        let completionsThisWeek = 0;
        // Calculate month completions (last 30 days)
        let completionsThisMonth = 0;
        // Calculate all-time completions
        let completionsAllTime = 0;

        for (const log of taskLogs) {
          completionsAllTime += log.count;
          if (weekDates.has(log.date)) {
            completionsThisWeek += log.count;
          }
          if (monthDates.has(log.date)) {
            completionsThisMonth += log.count;
          }
        }

        habitStats.push({
          taskId,
          name: task.name,
          icon: task.icon || 'checkCircle',
          color: task.color,
          completionsToday,
          completionsThisWeek,
          completionsThisMonth,
          completionsAllTime,
        });
      }

      const percentage = Math.round((completedTodayCount / linkedHabitIds.length) * 100);

      return {
        goal,
        completedToday: completedTodayCount,
        totalHabits: linkedHabitIds.length,
        percentage,
        habitStats,
      };
    } catch (error) {
      logger.error('SERVICES', 'Failed to calculate goal progress', { error, goalId: goal.id });
      throw error;
    }
  }

  /**
   * Get progress for all goals
   */
  async getAllGoalProgress(date?: string): Promise<GoalProgress[]> {
    try {
      const goals = await this.getAllGoals();
      const progressList: GoalProgress[] = [];

      for (const goal of goals) {
        const progress = await this.getGoalProgress(goal, date);
        progressList.push(progress);
      }

      return progressList;
    } catch (error) {
      logger.error('SERVICES', 'Failed to get all goal progress', { error });
      throw error;
    }
  }

  /**
   * Check if a goal definition is already selected by the user
   */
  async isGoalSelected(goalId: string): Promise<boolean> {
    try {
      const goal = await this.goalRepository.getGoalByGoalId(goalId);
      return goal !== null;
    } catch (error) {
      logger.error('SERVICES', 'Failed to check if goal is selected', { error, goalId });
      throw error;
    }
  }

  /**
   * Get count of selected goals
   */
  async getSelectedGoalCount(): Promise<number> {
    try {
      const goals = await this.goalRepository.getAllGoals();
      return goals.length;
    } catch (error) {
      logger.error('SERVICES', 'Failed to get selected goal count', { error });
      throw error;
    }
  }

  /**
   * Get total count of linked habits across all goals
   */
  async getTotalLinkedHabitCount(): Promise<number> {
    try {
      const counts = await this.goalRepository.getLinkedHabitCounts();
      return Object.values(counts).reduce((sum, count) => sum + count, 0);
    } catch (error) {
      logger.error('SERVICES', 'Failed to get total linked habit count', { error });
      throw error;
    }
  }

  // ============================================
  // Custom Goal CRUD Operations
  // ============================================

  /**
   * Create a new custom goal definition
   * Optionally selects it immediately
   */
  async createCustomGoal(
    data: CreateCustomGoalInput,
    options?: { select?: boolean; isPrimary?: boolean }
  ): Promise<CustomGoalDefinition> {
    try {
      logger.debug('SERVICES', 'Creating custom goal', { title: data.title });

      const customGoal = await this.customGoalRepository.create(data);
      logger.info('SERVICES', 'Custom goal created', { id: customGoal.id, title: customGoal.title });

      // Optionally select the goal immediately
      if (options?.select) {
        await this.selectGoal(customGoal.id, options.isPrimary ?? false);
      }

      return customGoal;
    } catch (error) {
      logger.error('SERVICES', 'Failed to create custom goal', { error, title: data.title });
      throw error;
    }
  }

  /**
   * Update a custom goal definition
   */
  async updateCustomGoal(id: string, data: UpdateCustomGoalInput): Promise<CustomGoalDefinition> {
    try {
      logger.debug('SERVICES', 'Updating custom goal', { id });

      const customGoal = await this.customGoalRepository.update(id, data);
      logger.info('SERVICES', 'Custom goal updated', { id, title: customGoal.title });

      return customGoal;
    } catch (error) {
      logger.error('SERVICES', 'Failed to update custom goal', { error, id });
      throw error;
    }
  }

  /**
   * Delete a custom goal definition
   * Cascades: archives user_goals record, handles primary promotion
   */
  async deleteCustomGoal(id: string): Promise<void> {
    try {
      logger.debug('SERVICES', 'Deleting custom goal', { id });

      // Check if this custom goal is currently selected
      const userGoal = await this.goalRepository.getGoalByGoalId(id);

      if (userGoal) {
        // Handle primary goal promotion if needed
        if (userGoal.isPrimary) {
          const allGoals = await this.goalRepository.getAllGoals();
          const nextPrimary = allGoals.find(g => g.id !== userGoal.id);

          if (nextPrimary) {
            await this.goalRepository.setPrimaryGoal(nextPrimary.id);
            logger.info('SERVICES', 'Promoted new primary goal after deletion', {
              deletedGoalId: id,
              newPrimaryId: nextPrimary.id,
            });
          }
        }

        // Archive the user_goals record (this cascades to goal_habits via FK)
        await this.goalRepository.archiveGoal(userGoal.id);
        logger.info('SERVICES', 'Archived user goal during custom goal deletion', {
          customGoalId: id,
          userGoalId: userGoal.id,
        });
      }

      // Soft delete the custom goal definition
      await this.customGoalRepository.delete(id);
      logger.info('SERVICES', 'Custom goal deleted', { id });
    } catch (error) {
      logger.error('SERVICES', 'Failed to delete custom goal', { error, id });
      throw error;
    }
  }

  // ============================================
  // Milestone Operations
  // ============================================

  /**
   * Get all milestones for a specific goal
   * @param userGoalId - The user_goals.id (not the goalId/definition ID)
   */
  async getMilestonesForGoal(userGoalId: string): Promise<Milestone[]> {
    try {
      return await this.milestoneRepository.getByGoalId(userGoalId);
    } catch (error) {
      logger.error('SERVICES', 'Failed to get milestones for goal', { error, userGoalId });
      throw error;
    }
  }

  /**
   * Get milestones for multiple goals (batch)
   * @param userGoalIds - Array of user_goals.id values
   * @returns Map keyed by userGoalId with arrays of milestones
   */
  async getMilestonesForGoals(userGoalIds: string[]): Promise<Map<string, Milestone[]>> {
    try {
      const record = await this.milestoneRepository.getByGoalIds(userGoalIds);
      return new Map(Object.entries(record));
    } catch (error) {
      logger.error('SERVICES', 'Failed to get milestones for goals', { error, count: userGoalIds.length });
      throw error;
    }
  }

  /**
   * Create a new milestone for a goal
   */
  async createMilestone(data: CreateMilestoneInput): Promise<Milestone> {
    try {
      logger.debug('SERVICES', 'Creating milestone', { userGoalId: data.userGoalId, title: data.title });

      // Verify goal exists
      const goal = await this.goalRepository.getGoalById(data.userGoalId);
      if (!goal) {
        throw new Error(`Goal '${data.userGoalId}' not found`);
      }

      const milestone = await this.milestoneRepository.create(data);
      logger.info('SERVICES', 'Milestone created', { id: milestone.id, userGoalId: data.userGoalId });

      return milestone;
    } catch (error) {
      logger.error('SERVICES', 'Failed to create milestone', { error, data });
      throw error;
    }
  }

  /**
   * Delete a milestone (soft delete)
   */
  async deleteMilestone(milestoneId: string): Promise<void> {
    try {
      logger.debug('SERVICES', 'Deleting milestone', { milestoneId });
      await this.milestoneRepository.delete(milestoneId);
      logger.info('SERVICES', 'Milestone deleted', { milestoneId });
    } catch (error) {
      logger.error('SERVICES', 'Failed to delete milestone', { error, milestoneId });
      throw error;
    }
  }
}

/**
 * Factory function for creating GoalService with dependencies
 */
export const createGoalService = (
  goalRepository: IGoalRepository,
  customGoalRepository: ICustomGoalRepository,
  milestoneRepository: IMilestoneRepository,
  taskRepository: ITaskRepository,
  logRepository: ILogRepository
): GoalService => {
  return new GoalService(goalRepository, customGoalRepository, milestoneRepository, taskRepository, logRepository);
};
