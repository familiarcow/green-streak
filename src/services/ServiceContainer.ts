/**
 * Service Container - Dependency Injection Pattern
 * 
 * Manages service lifecycle and dependencies for better testability and scalability.
 * Provides centralized service registration and resolution.
 */

import logger from '../utils/logger';

/**
 * Service registration information
 */
interface ServiceRegistration {
  factory: () => any;
  instance?: any;
  singleton: boolean;
  dependencies?: string[];
}

/**
 * Service container for dependency injection
 */
export class ServiceContainer {
  private services = new Map<string, ServiceRegistration>();
  private creating = new Set<string>();

  /**
   * Register a service with the container
   */
  register<T>(
    name: string,
    factory: () => T,
    options: {
      singleton?: boolean;
      dependencies?: string[];
    } = {}
  ): void {
    const { singleton = true, dependencies = [] } = options;

    if (this.services.has(name)) {
      logger.warn('SERVICES', 'Service already registered, overwriting', { name });
    }

    this.services.set(name, {
      factory,
      singleton,
      dependencies,
    });

    logger.debug('SERVICES', 'Service registered', { name, singleton, dependencies });
  }

  /**
   * Register a singleton service
   */
  registerSingleton<T>(
    name: string,
    factory: () => T,
    dependencies?: string[]
  ): void {
    this.register(name, factory, { singleton: true, dependencies });
  }

  /**
   * Register a transient service (new instance each time)
   */
  registerTransient<T>(
    name: string,
    factory: () => T,
    dependencies?: string[]
  ): void {
    this.register(name, factory, { singleton: false, dependencies });
  }

  /**
   * Register an instance directly
   */
  registerInstance<T>(name: string, instance: T): void {
    this.services.set(name, {
      factory: () => instance,
      instance,
      singleton: true,
    });

    logger.debug('SERVICES', 'Instance registered', { name });
  }

  /**
   * Resolve a service by name
   */
  resolve<T>(name: string): T {
    const registration = this.services.get(name);
    
    if (!registration) {
      const error = new Error(`Service '${name}' not found`);
      logger.error('SERVICES', 'Service resolution failed', { name, error: error.message });
      throw error;
    }

    // Check for circular dependencies
    if (this.creating.has(name)) {
      const error = new Error(`Circular dependency detected for service '${name}'`);
      logger.error('SERVICES', 'Circular dependency detected', { name });
      throw error;
    }

    // Return existing singleton instance
    if (registration.singleton && registration.instance) {
      return registration.instance;
    }

    try {
      this.creating.add(name);

      // Resolve dependencies first
      const dependencies = registration.dependencies || [];
      const resolvedDependencies = dependencies.map(dep => {
        logger.debug('SERVICES', 'Resolving dependency', { service: name, dependency: dep });
        return this.resolve(dep);
      });

      // Create service instance
      logger.debug('SERVICES', 'Creating service instance', { name });
      const instance = registration.factory(...resolvedDependencies);

      // Cache singleton instances
      if (registration.singleton) {
        registration.instance = instance;
      }

      logger.debug('SERVICES', 'Service resolved successfully', { name });
      return instance;

    } finally {
      this.creating.delete(name);
    }
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
  unregister(name: string): void {
    if (this.services.has(name)) {
      this.services.delete(name);
      logger.debug('SERVICES', 'Service unregistered', { name });
    }
  }

  /**
   * Clear all services
   */
  clear(): void {
    const serviceNames = Array.from(this.services.keys());
    this.services.clear();
    this.creating.clear();
    logger.info('SERVICES', 'All services cleared', { count: serviceNames.length });
  }

  /**
   * Get all registered service names
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Get service registration info
   */
  getServiceInfo(name: string): ServiceRegistration | undefined {
    return this.services.get(name);
  }

  /**
   * Validate all service dependencies
   */
  validateDependencies(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [serviceName, registration] of this.services) {
      const dependencies = registration.dependencies || [];
      
      for (const dependency of dependencies) {
        if (!this.services.has(dependency)) {
          errors.push(`Service '${serviceName}' depends on unregistered service '${dependency}'`);
        }
      }
    }

    const valid = errors.length === 0;
    
    if (valid) {
      logger.debug('SERVICES', 'All service dependencies are valid');
    } else {
      logger.error('SERVICES', 'Service dependency validation failed', { errors });
    }

    return { valid, errors };
  }

  /**
   * Initialize all registered singleton services
   */
  initializeAll(): void {
    const singletonServices = Array.from(this.services.entries())
      .filter(([, registration]) => registration.singleton);

    logger.info('SERVICES', 'Initializing all singleton services', { 
      count: singletonServices.length 
    });

    for (const [name] of singletonServices) {
      try {
        this.resolve(name);
        logger.debug('SERVICES', 'Service initialized', { name });
      } catch (error) {
        logger.error('SERVICES', 'Failed to initialize service', { 
          name, 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    logger.info('SERVICES', 'Service initialization complete');
  }

  /**
   * Get container health status
   */
  getHealthStatus(): {
    totalServices: number;
    initializedSingletons: number;
    validDependencies: boolean;
    errors: string[];
  } {
    const totalServices = this.services.size;
    const initializedSingletons = Array.from(this.services.values())
      .filter(reg => reg.singleton && reg.instance).length;
    
    const { valid: validDependencies, errors } = this.validateDependencies();

    return {
      totalServices,
      initializedSingletons,
      validDependencies,
      errors,
    };
  }
}

/**
 * Default global service container instance
 */
export const serviceContainer = new ServiceContainer();

/**
 * Convenience function to register a service
 */
export const registerService = <T>(
  name: string,
  factory: () => T,
  options?: { singleton?: boolean; dependencies?: string[] }
): void => {
  serviceContainer.register(name, factory, options);
};

/**
 * Convenience function to resolve a service
 */
export const resolveService = <T>(name: string): T => {
  return serviceContainer.resolve<T>(name);
};

/**
 * Convenience function to check if service exists
 */
export const hasService = (name: string): boolean => {
  return serviceContainer.has(name);
};