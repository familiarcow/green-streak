/**
 * Repository exports
 * 
 * This module provides centralized access to all repository-related
 * functionality, including interfaces, implementations, and the factory.
 */

// Interfaces
export * from './interfaces';

// Implementations
export { TaskRepository } from './TaskRepository';
export { LogRepository } from './LogRepository';

// Factory and instances
export { 
  RepositoryFactory, 
  repositoryFactory, 
  taskRepository, 
  logRepository 
} from './RepositoryFactory';

// Type exports
export type { TaskRepository as TaskRepositoryType } from './TaskRepository';
export type { LogRepository as LogRepositoryType } from './LogRepository';