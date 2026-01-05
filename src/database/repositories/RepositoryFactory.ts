import { ITaskRepository, ILogRepository } from './interfaces';
import { TaskRepository } from './TaskRepository';
import { LogRepository } from './LogRepository';

/**
 * Repository Factory
 * 
 * Provides centralized access to repository instances and enables
 * dependency injection for better testability.
 */
export class RepositoryFactory {
  private static _instance: RepositoryFactory;
  private _taskRepository: ITaskRepository;
  private _logRepository: ILogRepository;

  private constructor() {
    // Initialize default implementations
    this._taskRepository = new TaskRepository();
    this._logRepository = new LogRepository();
  }

  /**
   * Get singleton instance of RepositoryFactory
   */
  public static getInstance(): RepositoryFactory {
    if (!RepositoryFactory._instance) {
      RepositoryFactory._instance = new RepositoryFactory();
    }
    return RepositoryFactory._instance;
  }

  /**
   * Get task repository instance
   */
  public getTaskRepository(): ITaskRepository {
    return this._taskRepository;
  }

  /**
   * Get log repository instance
   */
  public getLogRepository(): ILogRepository {
    return this._logRepository;
  }

  /**
   * Set task repository implementation (for testing/dependency injection)
   */
  public setTaskRepository(repository: ITaskRepository): void {
    this._taskRepository = repository;
  }

  /**
   * Set log repository implementation (for testing/dependency injection)
   */
  public setLogRepository(repository: ILogRepository): void {
    this._logRepository = repository;
  }

  /**
   * Reset to default implementations
   */
  public resetToDefaults(): void {
    this._taskRepository = new TaskRepository();
    this._logRepository = new LogRepository();
  }
}

// Convenience exports for direct access
export const repositoryFactory = RepositoryFactory.getInstance();
export const taskRepository = repositoryFactory.getTaskRepository();
export const logRepository = repositoryFactory.getLogRepository();

export default RepositoryFactory;