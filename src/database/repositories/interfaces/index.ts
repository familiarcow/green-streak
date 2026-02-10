/**
 * Repository interfaces
 * 
 * These interfaces define the contracts for data persistence operations.
 * They provide abstraction over the actual implementation details,
 * making the code more testable and allowing for easy swapping of
 * persistence mechanisms.
 */

export { ITaskRepository } from './ITaskRepository';
export { ILogRepository } from './ILogRepository';
export { IStreakRepository } from './IStreakRepository';
export { IAchievementRepository } from './IAchievementRepository';
export { IAchievementGridRepository } from './IAchievementGridRepository';
export { IGoalRepository } from './IGoalRepository';

export type { default as ITaskRepositoryType } from './ITaskRepository';
export type { default as ILogRepositoryType } from './ILogRepository';
export type { default as IAchievementRepositoryType } from './IAchievementRepository';
export type { IAchievementGridRepository as IAchievementGridRepositoryType } from './IAchievementGridRepository';
export type { default as IGoalRepositoryType } from './IGoalRepository';