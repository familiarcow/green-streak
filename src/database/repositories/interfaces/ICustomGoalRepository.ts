import { CustomGoalDefinition, CreateCustomGoalInput, UpdateCustomGoalInput } from '../../../types/goals';

/**
 * Interface for Custom Goal Definition repository operations
 * Defines the contract for user-created goal definitions persistence
 */
export interface ICustomGoalRepository {
  /**
   * Retrieve all active (non-deleted) custom goal definitions
   */
  getAll(): Promise<CustomGoalDefinition[]>;

  /**
   * Find a specific custom goal by ID
   */
  getById(id: string): Promise<CustomGoalDefinition | null>;

  /**
   * Create a new custom goal definition
   */
  create(data: CreateCustomGoalInput): Promise<CustomGoalDefinition>;

  /**
   * Update an existing custom goal definition
   */
  update(id: string, data: UpdateCustomGoalInput): Promise<CustomGoalDefinition>;

  /**
   * Soft delete a custom goal definition
   * Sets deleted_at timestamp instead of removing the record
   */
  delete(id: string): Promise<void>;
}

export default ICustomGoalRepository;
