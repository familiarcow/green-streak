import { ITaskRepository, ILogRepository, IStreakRepository, IAchievementRepository, IAchievementGridRepository, IGoalRepository, IMilestoneRepository } from './interfaces';
import { ICustomGoalRepository } from './interfaces/ICustomGoalRepository';
import { TaskRepository } from './TaskRepository';
import { LogRepository } from './LogRepository';
import { StreakRepository } from './StreakRepository';
import { AchievementRepository } from './AchievementRepository';
import { AchievementGridRepository } from './AchievementGridRepository';
import { GoalRepository } from './GoalRepository';
import { CustomGoalRepository } from './CustomGoalRepository';
import { MilestoneRepository } from './MilestoneRepository';

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
  private _achievementGridRepository: IAchievementGridRepository;
  private _goalRepository: IGoalRepository;
  private _customGoalRepository: ICustomGoalRepository;
  private _milestoneRepository: IMilestoneRepository;

  private constructor() {
    // Initialize default implementations
    this._taskRepository = new TaskRepository();
    this._logRepository = new LogRepository();
    this._streakRepository = new StreakRepository();
    this._achievementRepository = new AchievementRepository();
    this._achievementGridRepository = new AchievementGridRepository();
    this._goalRepository = new GoalRepository();
    this._customGoalRepository = new CustomGoalRepository();
    this._milestoneRepository = new MilestoneRepository();
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
   * Get achievement grid repository instance
   */
  public getAchievementGridRepository(): IAchievementGridRepository {
    return this._achievementGridRepository;
  }

  /**
   * Get goal repository instance
   */
  public getGoalRepository(): IGoalRepository {
    return this._goalRepository;
  }

  /**
   * Get custom goal repository instance
   */
  public getCustomGoalRepository(): ICustomGoalRepository {
    return this._customGoalRepository;
  }

  /**
   * Get milestone repository instance
   */
  public getMilestoneRepository(): IMilestoneRepository {
    return this._milestoneRepository;
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
   * Set achievement grid repository implementation (for testing/dependency injection)
   */
  public setAchievementGridRepository(repository: IAchievementGridRepository): void {
    this._achievementGridRepository = repository;
  }

  /**
   * Set goal repository implementation (for testing/dependency injection)
   */
  public setGoalRepository(repository: IGoalRepository): void {
    this._goalRepository = repository;
  }

  /**
   * Set custom goal repository implementation (for testing/dependency injection)
   */
  public setCustomGoalRepository(repository: ICustomGoalRepository): void {
    this._customGoalRepository = repository;
  }

  /**
   * Set milestone repository implementation (for testing/dependency injection)
   */
  public setMilestoneRepository(repository: IMilestoneRepository): void {
    this._milestoneRepository = repository;
  }

  /**
   * Reset to default implementations
   */
  public resetToDefaults(): void {
    this._taskRepository = new TaskRepository();
    this._logRepository = new LogRepository();
    this._streakRepository = new StreakRepository();
    this._achievementRepository = new AchievementRepository();
    this._achievementGridRepository = new AchievementGridRepository();
    this._goalRepository = new GoalRepository();
    this._customGoalRepository = new CustomGoalRepository();
    this._milestoneRepository = new MilestoneRepository();
  }
}

// Convenience exports for direct access
export const repositoryFactory = RepositoryFactory.getInstance();
export const taskRepository = repositoryFactory.getTaskRepository();
export const logRepository = repositoryFactory.getLogRepository();
export const streakRepository = repositoryFactory.getStreakRepository();
export const achievementRepository = repositoryFactory.getAchievementRepository();
export const achievementGridRepository = repositoryFactory.getAchievementGridRepository();
export const goalRepository = repositoryFactory.getGoalRepository();
export const customGoalRepository = repositoryFactory.getCustomGoalRepository();
export const milestoneRepository = repositoryFactory.getMilestoneRepository();

export default RepositoryFactory;