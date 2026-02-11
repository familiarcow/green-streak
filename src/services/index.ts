/**
 * Services Module
 *
 * Centralized exports for all application services and service management utilities.
 * Provides both individual service access and service registry functionality.
 */

// Core Services
export { DataService, dataService } from './DataService';
export { TaskService, createTaskService } from './TaskService';
export { TaskAnalyticsService, taskAnalyticsService } from './TaskAnalyticsService';
export { ValidationService, validationService } from './ValidationService';
export { default as NotificationService } from './NotificationService';
export { StreakService, createStreakService } from './StreakService';
export { StreakRulesEngine, createStreakRulesEngine } from './StreakRulesEngine';
export { DateService, createDateService } from './DateService';
export { ToastNotificationService } from './ToastNotificationService';
export { SoundEffectsService } from './SoundEffectsService';
export { ConfettiService } from './ConfettiService';
export { ToastQueue } from './ToastQueue';
export { NotificationOrchestrator, createNotificationOrchestrator } from './NotificationOrchestrator';
export { NotificationManager, createNotificationManager } from './NotificationManager';
export { AchievementService, createAchievementService } from './AchievementService';
export { AchievementGridService, createAchievementGridService, SeededRandom, GRID_CONFIGS, STARTER_ACHIEVEMENT_ID } from './AchievementGridService';
export { GoalService, createGoalService } from './GoalService';
export { sortTemplatesByGoals, getTemplateScore, getOrderedUserGoals } from './TemplateSortingService';

// Service Registry
export {
  ServiceRegistry,
  serviceRegistry,
  getDataService,
  getTaskService,
  getStreakService,
  getDateService,
  getAnalyticsService,
  getValidationService,
  getNotificationService,
  getNotificationManager,
  getToastService,
  getSoundService,
  getConfettiService,
  getOrchestrator,
  getAchievementService,
  getAchievementGridService,
  getWidgetDataService,
  getGoalService
} from './ServiceRegistry';

// Type exports
export type { CreateTaskData, UpdateTaskData } from './TaskService';
export type { TaskAnalytics, OverviewAnalytics, TaskActivityDistribution } from './TaskAnalyticsService';
export type { ValidationResult, BulkValidationResult } from './ValidationService';
export type { ServiceHealthStatus } from './ServiceRegistry';

// Utility imports for services that aren't part of the main business logic layer
export { default as encryptionService } from './EncryptionService';
export { WidgetDataService, widgetDataService } from './WidgetDataService';
