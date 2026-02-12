import { TaskLog, ContributionData } from '../../../types';

/**
 * Interface for Log repository operations
 * Defines the contract for task completion log persistence
 */
export interface ILogRepository {
  /**
   * Retrieve all task logs
   */
  getAll(): Promise<TaskLog[]>;
  
  /**
   * Find a log entry for a specific task and date
   */
  getByTaskAndDate(taskId: string, date: string): Promise<TaskLog | null>;
  
  /**
   * Create a new log entry
   */
  create(logData: { taskId: string; date: string; count: number }): Promise<TaskLog>;
  
  /**
   * Create or update a log entry (upsert operation)
   */
  createOrUpdate(taskId: string, date: string, count: number): Promise<TaskLog>;
  
  /**
   * Find all logs for a specific task
   */
  findByTask(taskId: string): Promise<TaskLog[]>;

  /**
   * Find logs for multiple tasks and a specific date (batch)
   */
  getByTasksAndDate(taskIds: string[], date: string): Promise<TaskLog[]>;

  /**
   * Find all logs for multiple tasks (batch)
   */
  findByTasks(taskIds: string[]): Promise<TaskLog[]>;
  
  /**
   * Find logs within a date range
   */
  findByDateRange(startDate: string, endDate: string): Promise<TaskLog[]>;
  
  /**
   * Find a log entry for a specific task and date
   */
  findByTaskAndDate(taskId: string, date: string): Promise<TaskLog | null>;
  
  /**
   * Get aggregated contribution data for multiple dates
   */
  getContributionData(dates: string[]): Promise<ContributionData[]>;
  
  /**
   * Delete all logs for a specific task
   */
  deleteByTask(taskId: string): Promise<void>;
}

export default ILogRepository;