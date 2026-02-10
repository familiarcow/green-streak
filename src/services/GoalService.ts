/**
 * Goal Service
 *
 * Encapsulates all goal-related business logic, including goal selection,
 * habit linking, and progress calculation.
 */

import { UserGoal, UserGoalWithDetails, GoalProgress, GoalHabitLink } from '../types/goals';
import { IGoalRepository } from '../database/repositories/interfaces/IGoalRepository';
import { ITaskRepository } from '../database/repositories/interfaces/ITaskRepository';
import { ILogRepository } from '../database/repositories/interfaces/ILogRepository';
import { GOAL_MAP, getGoalById } from '../data/goalLibrary';
import { getTodayString } from '../utils/dateHelpers';
import logger from '../utils/logger';

/**
 * Service for managing goal-related operations
 */
export class GoalService {
  constructor(
    private goalRepository: IGoalRepository,
    private taskRepository: ITaskRepository,
    private logRepository: ILogRepository
  ) {
    logger.debug('SERVICES', 'GoalService initialized');
  }

  /**
   * Get all active goals with their definitions
   */
  async getAllGoals(): Promise<UserGoalWithDetails[]> {
    try {
      logger.debug('SERVICES', 'Fetching all goals with details');

      const goals = await this.goalRepository.getAllGoals();
      const habitCounts = await this.goalRepository.getLinkedHabitCounts();

      const goalsWithDetails: UserGoalWithDetails[] = [];

      for (const goal of goals) {
        const definition = GOAL_MAP[goal.goalId];
        if (!definition) {
          logger.warn('SERVICES', 'Goal definition not found', { goalId: goal.goalId });
          continue;
        }

        const linkedHabitIds = await this.goalRepository.getHabitsForGoal(goal.id);

        goalsWithDetails.push({
          ...goal,
          definition,
          linkedHabitIds,
        });
      }

      logger.info('SERVICES', 'Goals fetched with details', { count: goalsWithDetails.length });
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

      const definition = GOAL_MAP[goal.goalId];
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

      const definition = GOAL_MAP[goal.goalId];
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
   */
  async selectGoal(goalId: string, isPrimary: boolean = false): Promise<UserGoal> {
    try {
      logger.debug('SERVICES', 'Selecting goal', { goalId, isPrimary });

      // Verify goal exists in library
      const definition = getGoalById(goalId);
      if (!definition) {
        throw new Error(`Goal '${goalId}' not found in goal library`);
      }

      // Check if already selected
      const existing = await this.goalRepository.getGoalByGoalId(goalId);
      if (existing) {
        logger.info('SERVICES', 'Goal already selected', { goalId });
        return existing;
      }

      const goal = await this.goalRepository.createGoal(goalId, isPrimary);
      logger.info('SERVICES', 'Goal selected', { goalId, id: goal.id, isPrimary });

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
   * Calculate progress for a goal (habits completed today)
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
        };
      }

      // Get logs for linked habits on the target date
      let completedToday = 0;
      for (const taskId of linkedHabitIds) {
        const log = await this.logRepository.getByTaskAndDate(taskId, targetDate);
        if (log && log.count > 0) {
          completedToday++;
        }
      }

      const percentage = Math.round((completedToday / linkedHabitIds.length) * 100);

      return {
        goal,
        completedToday,
        totalHabits: linkedHabitIds.length,
        percentage,
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
}

/**
 * Factory function for creating GoalService with dependencies
 */
export const createGoalService = (
  goalRepository: IGoalRepository,
  taskRepository: ITaskRepository,
  logRepository: ILogRepository
): GoalService => {
  return new GoalService(goalRepository, taskRepository, logRepository);
};
