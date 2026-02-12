import { Milestone, CreateMilestoneInput } from '../../../types/goals';

/**
 * Interface for Milestone repository operations
 * Defines the contract for milestone data persistence
 */
export interface IMilestoneRepository {
  /**
   * Get a milestone by its ID
   */
  getById(id: string): Promise<Milestone | null>;

  /**
   * Get all milestones for a specific goal
   * @param userGoalId - The user_goals.id (not the goalId/definition ID)
   * @returns Milestones sorted by date (newest first)
   */
  getByGoalId(userGoalId: string): Promise<Milestone[]>;

  /**
   * Get milestones for multiple goals in a single query (batch)
   * @param userGoalIds - Array of user_goals.id values
   * @returns Record keyed by userGoalId with arrays of milestones
   */
  getByGoalIds(userGoalIds: string[]): Promise<Record<string, Milestone[]>>;

  /**
   * Create a new milestone
   */
  create(data: CreateMilestoneInput): Promise<Milestone>;

  /**
   * Soft delete a milestone
   */
  delete(id: string): Promise<void>;
}

export default IMilestoneRepository;
