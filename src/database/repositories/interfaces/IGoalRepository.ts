import { UserGoal, GoalHabitLink } from '../../../types/goals';

/**
 * Interface for Goal repository operations
 * Defines the contract for goal data persistence
 */
export interface IGoalRepository {
  /**
   * Retrieve all active (non-archived) user goals
   */
  getAllGoals(): Promise<UserGoal[]>;

  /**
   * Find a specific goal by ID
   */
  getGoalById(id: string): Promise<UserGoal | null>;

  /**
   * Find a user goal by its goal definition ID
   */
  getGoalByGoalId(goalId: string): Promise<UserGoal | null>;

  /**
   * Create a new user goal (select a goal)
   */
  createGoal(goalId: string, isPrimary?: boolean): Promise<UserGoal>;

  /**
   * Set a goal as the primary goal (unsets other primaries)
   */
  setPrimaryGoal(id: string): Promise<void>;

  /**
   * Archive a goal (soft delete)
   */
  archiveGoal(id: string): Promise<void>;

  /**
   * Permanently delete a goal
   */
  deleteGoal(id: string): Promise<void>;

  /**
   * Update sort order for multiple goals (for drag-and-drop reordering)
   */
  updateSortOrders(updates: Array<{ id: string; sortOrder: number }>): Promise<void>;

  /**
   * Get the primary goal
   */
  getPrimaryGoal(): Promise<UserGoal | null>;

  // ============================================
  // Goal-Habit Link Operations
  // ============================================

  /**
   * Link a habit to a goal
   */
  linkHabitToGoal(goalId: string, taskId: string): Promise<GoalHabitLink>;

  /**
   * Unlink a habit from a goal
   */
  unlinkHabitFromGoal(goalId: string, taskId: string): Promise<void>;

  /**
   * Get all habit IDs linked to a goal
   */
  getHabitsForGoal(goalId: string): Promise<string[]>;

  /**
   * Get all goal IDs linked to a habit
   */
  getGoalsForHabit(taskId: string): Promise<string[]>;

  /**
   * Get all goal-habit links for a goal
   */
  getLinksForGoal(goalId: string): Promise<GoalHabitLink[]>;

  /**
   * Set all habit links for a task (replaces existing links)
   */
  setHabitGoals(taskId: string, goalIds: string[]): Promise<void>;

  /**
   * Get count of linked habits for each goal
   */
  getLinkedHabitCounts(): Promise<Record<string, number>>;
}

export default IGoalRepository;
