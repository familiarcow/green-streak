import { DataService, dataService } from './DataService';
import { TaskService, createTaskService } from './TaskService';
import { StreakService, createStreakService } from './StreakService';
import { DateService, createDateService } from './DateService';
import { TaskAnalyticsService, taskAnalyticsService } from './TaskAnalyticsService';
import { ValidationService, validationService } from './ValidationService';
import notificationService from './NotificationService';
import { ToastNotificationService } from './ToastNotificationService';
import { SoundEffectsService } from './SoundEffectsService';
import { ConfettiService } from './ConfettiService';
import { createNotificationOrchestrator, NotificationOrchestrator } from './NotificationOrchestrator';
import { createNotificationManager, NotificationManager } from './NotificationManager';
import { repositoryFactory } from '../database/repositories/RepositoryFactory';
import logger from '../utils/logger';

/**
 * Service Registry
 * 
 * Centralized registry for all application services. Provides
 * dependency injection capabilities and service lifecycle management.
 */
export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, any> = new Map();

  private constructor() {
    this.registerDefaultServices();
  }

  static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Register default services
   */
  private registerDefaultServices(): void {
    try {
      logger.debug('SERVICE', 'Registering default services');
      
      // Create TaskService with dependencies
      const taskRepository = repositoryFactory.getTaskRepository();
      const taskService = createTaskService(taskRepository, validationService);
      
      // Create StreakService with dependencies
      const streakRepository = repositoryFactory.getStreakRepository();
      const logRepository = repositoryFactory.getLogRepository();
      const streakService = createStreakService(streakRepository, logRepository, taskRepository);
      
      // Create DateService (singleton)
      const dateService = createDateService();
      
      // Create effects services (shared instances)
      const soundService = new SoundEffectsService();
      const confettiService = new ConfettiService();
      
      // Create ToastNotificationService with injected dependencies
      const toastService = new ToastNotificationService(soundService, confettiService);
      
      // Create NotificationOrchestrator
      const orchestrator = createNotificationOrchestrator(notificationService, toastService);
      
      // Create NotificationManager with dependencies
      const notificationManager = createNotificationManager(
        taskService,
        streakService,
        dataService
      );
      
      this.register('data', dataService);
      this.register('task', taskService);
      this.register('streak', streakService);
      this.register('date', dateService);
      this.register('analytics', taskAnalyticsService);
      this.register('validation', validationService);
      this.register('notification', notificationService);
      this.register('notificationManager', notificationManager);
      this.register('toast', toastService);
      this.register('sound', soundService);
      this.register('confetti', confettiService);
      this.register('orchestrator', orchestrator);
      
      logger.info('SERVICE', 'Default services registered successfully', {
        servicesCount: this.services.size
      });
    } catch (error) {
      logger.error('SERVICE', 'Failed to register default services', { error });
      throw error;
    }
  }

  /**
   * Register a service with the registry
   */
  register<T>(name: string, service: T): void {
    try {
      if (this.services.has(name)) {
        logger.warn('SERVICE', 'Overriding existing service', { serviceName: name });
      }
      
      this.services.set(name, service);
      logger.debug('SERVICE', 'Service registered', { serviceName: name });
    } catch (error) {
      logger.error('SERVICE', 'Failed to register service', { error, serviceName: name });
      throw error;
    }
  }

  /**
   * Get a service from the registry
   */
  get<T>(name: string): T {
    const service = this.services.get(name) as T;
    
    if (!service) {
      const error = new Error(`Service '${name}' not found in registry`);
      logger.error('SERVICE', 'Service not found', { serviceName: name });
      throw error;
    }
    
    return service;
  }

  /**
   * Check if a service is registered
   */
  has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Unregister a service
   */
  unregister(name: string): boolean {
    const existed = this.services.delete(name);
    if (existed) {
      logger.debug('SERVICE', 'Service unregistered', { serviceName: name });
    }
    return existed;
  }

  /**
   * Get all registered service names
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Clear all services (useful for testing)
   */
  clear(): void {
    logger.debug('SERVICE', 'Clearing all services');
    this.services.clear();
  }
  
  /**
   * Destroy all services that have destroy methods
   */
  destroyAll(): void {
    logger.debug('SERVICE', 'Destroying all services with cleanup');
    
    // Destroy services that have destroy methods
    this.services.forEach((service, name) => {
      if (service && typeof service.destroy === 'function') {
        try {
          service.destroy();
          logger.debug('SERVICE', 'Destroyed service', { serviceName: name });
        } catch (error) {
          logger.error('SERVICE', 'Failed to destroy service', { 
            serviceName: name, 
            error 
          });
        }
      } else if (service && typeof service.cleanup === 'function') {
        // Fallback to cleanup method if destroy doesn't exist
        try {
          service.cleanup();
          logger.debug('SERVICE', 'Cleaned up service', { serviceName: name });
        } catch (error) {
          logger.error('SERVICE', 'Failed to cleanup service', { 
            serviceName: name, 
            error 
          });
        }
      }
    });
    
    // Clear the registry after destroying services
    this.clear();
  }

  /**
   * Get service health status
   */
  getHealthStatus(): ServiceHealthStatus {
    const registeredServices = this.getRegisteredServices();
    const healthStatus: ServiceHealthStatus = {
      isHealthy: true,
      services: {},
      timestamp: new Date().toISOString(),
    };

    for (const serviceName of registeredServices) {
      try {
        const service = this.get(serviceName);
        
        // Basic health check - service exists and is defined
        healthStatus.services[serviceName] = {
          status: 'healthy',
          lastChecked: new Date().toISOString(),
        };
      } catch (error) {
        healthStatus.isHealthy = false;
        healthStatus.services[serviceName] = {
          status: 'unhealthy',
          lastChecked: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    logger.debug('SERVICE', 'Health check completed', { 
      isHealthy: healthStatus.isHealthy,
      servicesCount: registeredServices.length 
    });

    return healthStatus;
  }
}

// Type definitions
export interface ServiceHealthStatus {
  isHealthy: boolean;
  services: Record<string, {
    status: 'healthy' | 'unhealthy';
    lastChecked: string;
    error?: string;
  }>;
  timestamp: string;
}

// Convenience exports
export const serviceRegistry = ServiceRegistry.getInstance();

// Service getters for easy access
export const getDataService = (): DataService => serviceRegistry.get<DataService>('data');
export const getTaskService = (): TaskService => serviceRegistry.get<TaskService>('task');
export const getStreakService = (): StreakService => serviceRegistry.get<StreakService>('streak');
export const getDateService = (): DateService => serviceRegistry.get<DateService>('date');
export const getAnalyticsService = (): TaskAnalyticsService => serviceRegistry.get<TaskAnalyticsService>('analytics');
export const getValidationService = (): ValidationService => serviceRegistry.get<ValidationService>('validation');
export const getNotificationService = () => serviceRegistry.get('notification');
export const getNotificationManager = (): NotificationManager => serviceRegistry.get<NotificationManager>('notificationManager');
export const getToastService = (): ToastNotificationService => serviceRegistry.get<ToastNotificationService>('toast');
export const getSoundService = (): SoundEffectsService => serviceRegistry.get<SoundEffectsService>('sound');
export const getConfettiService = (): ConfettiService => serviceRegistry.get<ConfettiService>('confetti');
export const getOrchestrator = (): NotificationOrchestrator => serviceRegistry.get<NotificationOrchestrator>('orchestrator');

export default ServiceRegistry;