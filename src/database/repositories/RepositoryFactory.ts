import { ITaskRepository, ILogRepository, IStreakRepository, IAchievementRepository } from './interfaces';
import { TaskRepository } from './TaskRepository';
import { LogRepository } from './LogRepository';
import { StreakRepository } from './StreakRepository';
import { AchievementRepository } from './AchievementRepository';

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
  private _streakRepository: IStreakRepository;
  private _achievementRepository: IAchievementRepository;

  private constructor() {
    // Initialize default implementations
    this._taskRepository = new TaskRepository();
    this._logRepository = new LogRepository();
    this._streakRepository = new StreakRepository();
    this._achievementRepository = new AchievementRepository();
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
   * Get streak repository instance
   */
  public getStreakRepository(): IStreakRepository {
    return this._streakRepository;
  }

  /**
   * Get achievement repository instance
   */
  public getAchievementRepository(): IAchievementRepository {
    return this._achievementRepository;
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
   * Set streak repository implementation (for testing/dependency injection)
   */
  public setStreakRepository(repository: IStreakRepository): void {
    this._streakRepository = repository;
  }

  /**
   * Set achievement repository implementation (for testing/dependency injection)
   */
  public setAchievementRepository(repository: IAchievementRepository): void {
    this._achievementRepository = repository;
  }

  /**
   * Reset to default implementations
   */
  public resetToDefaults(): void {
    this._taskRepository = new TaskRepository();
    this._logRepository = new LogRepository();
    this._streakRepository = new StreakRepository();
    this._achievementRepository = new AchievementRepository();
  }
}

// Convenience exports for direct access
export const repositoryFactory = RepositoryFactory.getInstance();
export const taskRepository = repositoryFactory.getTaskRepository();
export const logRepository = repositoryFactory.getLogRepository();
export const streakRepository = repositoryFactory.getStreakRepository();
export const achievementRepository = repositoryFactory.getAchievementRepository();

export default RepositoryFactory;