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

export type { default as ITaskRepositoryType } from './ITaskRepository';
export type { default as ILogRepositoryType } from './ILogRepository';
export type { default as IAchievementRepositoryType } from './IAchievementRepository';