/**
 * Services Module
 * 
 * Centralized exports for all application services and service management utilities.
 * Provides both individual service access and service registry functionality.
 */

// Core Services
export { DataService, dataService } from './DataService';
export { TaskAnalyticsService, taskAnalyticsService } from './TaskAnalyticsService';
export { ValidationService, validationService } from './ValidationService';
export { default as NotificationService } from './NotificationService';

// Service Registry
export { 
  ServiceRegistry, 
  serviceRegistry,
  getDataService,
  getAnalyticsService,
  getValidationService,
  getNotificationService
} from './ServiceRegistry';

// Type exports
export type { TaskAnalytics, OverviewAnalytics, TaskActivityDistribution } from './TaskAnalyticsService';
export type { ValidationResult, BulkValidationResult } from './ValidationService';
export type { ServiceHealthStatus } from './ServiceRegistry';

// Utility imports for services that aren't part of the main business logic layer
export { default as dataExportService } from './DataExportService';
export { default as encryptionService } from './EncryptionService';