import { Task } from '../../../types';

/**
 * Interface for Task repository operations
 * Defines the contract for task data persistence
 */
export interface ITaskRepository {
  /**
   * Retrieve all active (non-archived) tasks
   */
  getAll(): Promise<Task[]>;
  
  /**
   * Find a specific task by ID
   */
  getById(id: string): Promise<Task | null>;
  
  /**
   * Find multiple tasks by IDs (batch loading)
   */
  getByIds(ids: string[]): Promise<Task[]>;
  
  /**
   * Create a new task
   */
  create(taskData: Omit<Task, 'id' | 'createdAt' | 'sortOrder'>): Promise<Task>;

  /**
   * Update an existing task
   */
  update(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task>;

  /**
   * Archive a task (soft delete)
   */
  archive(id: string): Promise<void>;

  /**
   * Permanently delete a task
   */
  delete(id: string): Promise<void>;

  /**
   * Update sort order for multiple tasks (for drag-and-drop reordering)
   */
  updateSortOrders(updates: Array<{ id: string; sortOrder: number }>): Promise<void>;

  /**
   * Find all tasks (including archived)
   */
  findAll(): Promise<Task[]>;

  /**
   * Find a task by ID (including archived)
   */
  findById(id: string): Promise<Task | null>;
}

export default ITaskRepository;