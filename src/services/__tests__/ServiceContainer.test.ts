import { ServiceContainer } from '../ServiceContainer';

// Mock logger
jest.mock('../../utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

describe('ServiceContainer', () => {
  let container: ServiceContainer;

  beforeEach(() => {
    container = new ServiceContainer();
  });

  afterEach(() => {
    container.clear();
  });

  describe('Service Registration', () => {
    it('should register a singleton service', () => {
      const factory = jest.fn(() => ({ value: 'test' }));
      
      container.registerSingleton('testService', factory);
      
      expect(container.has('testService')).toBe(true);
      expect(container.getRegisteredServices()).toContain('testService');
    });

    it('should register a transient service', () => {
      const factory = jest.fn(() => ({ value: 'test' }));
      
      container.registerTransient('testService', factory);
      
      expect(container.has('testService')).toBe(true);
      
      const serviceInfo = container.getServiceInfo('testService');
      expect(serviceInfo?.singleton).toBe(false);
    });

    it('should register an instance directly', () => {
      const instance = { value: 'direct' };
      
      container.registerInstance('testInstance', instance);
      
      expect(container.has('testInstance')).toBe(true);
      expect(container.resolve('testInstance')).toBe(instance);
    });

    it('should overwrite existing service registration', () => {
      const factory1 = () => ({ value: 'first' });
      const factory2 = () => ({ value: 'second' });
      
      container.registerSingleton('testService', factory1);
      container.registerSingleton('testService', factory2);
      
      const resolved = container.resolve('testService');
      expect(resolved.value).toBe('second');
    });

    it('should register service with dependencies', () => {
      container.registerSingleton('dependency', () => ({ dep: true }));
      container.registerSingleton('service', () => ({ main: true }), ['dependency']);
      
      const serviceInfo = container.getServiceInfo('service');
      expect(serviceInfo?.dependencies).toEqual(['dependency']);
    });
  });

  describe('Service Resolution', () => {
    it('should resolve a registered service', () => {
      const expectedValue = { value: 'test' };
      container.registerSingleton('testService', () => expectedValue);
      
      const resolved = container.resolve('testService');
      
      expect(resolved).toBe(expectedValue);
    });

    it('should throw error for unregistered service', () => {
      expect(() => {
        container.resolve('nonexistent');
      }).toThrow("Service 'nonexistent' not found");
    });

    it('should return same instance for singleton services', () => {
      let callCount = 0;
      container.registerSingleton('singleton', () => {
        callCount++;
        return { call: callCount };
      });
      
      const first = container.resolve('singleton');
      const second = container.resolve('singleton');
      
      expect(first).toBe(second);
      expect(callCount).toBe(1);
    });

    it('should return different instances for transient services', () => {
      let callCount = 0;
      container.registerTransient('transient', () => {
        callCount++;
        return { call: callCount };
      });
      
      const first = container.resolve('transient');
      const second = container.resolve('transient');
      
      expect(first).not.toBe(second);
      expect(callCount).toBe(2);
    });

    it('should resolve services with dependencies', () => {
      container.registerSingleton('database', () => ({ type: 'database' }));
      container.registerSingleton('logger', () => ({ type: 'logger' }));
      container.registerSingleton(
        'service',
        () => ({ type: 'service', deps: ['resolved'] }),
        ['database', 'logger']
      );
      
      const service = container.resolve('service');
      
      expect(service.type).toBe('service');
    });

    it('should detect circular dependencies', () => {
      container.registerSingleton('serviceA', () => ({}), ['serviceB']);
      container.registerSingleton('serviceB', () => ({}), ['serviceA']);
      
      expect(() => {
        container.resolve('serviceA');
      }).toThrow("Circular dependency detected for service 'serviceA'");
    });
  });

  describe('Service Management', () => {
    it('should unregister a service', () => {
      container.registerSingleton('testService', () => ({}));
      expect(container.has('testService')).toBe(true);
      
      container.unregister('testService');
      
      expect(container.has('testService')).toBe(false);
    });

    it('should clear all services', () => {
      container.registerSingleton('service1', () => ({}));
      container.registerSingleton('service2', () => ({}));
      
      expect(container.getRegisteredServices()).toHaveLength(2);
      
      container.clear();
      
      expect(container.getRegisteredServices()).toHaveLength(0);
    });

    it('should get service information', () => {
      const factory = () => ({});
      container.registerSingleton('testService', factory, ['dependency']);
      
      const info = container.getServiceInfo('testService');
      
      expect(info?.factory).toBe(factory);
      expect(info?.singleton).toBe(true);
      expect(info?.dependencies).toEqual(['dependency']);
    });
  });

  describe('Dependency Validation', () => {
    it('should validate all dependencies successfully', () => {
      container.registerSingleton('dependency', () => ({}));
      container.registerSingleton('service', () => ({}), ['dependency']);
      
      const result = container.validateDependencies();
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing dependencies', () => {
      container.registerSingleton('service', () => ({}), ['missing']);
      
      const result = container.validateDependencies();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Service 'service' depends on unregistered service 'missing'"
      );
    });

    it('should detect multiple missing dependencies', () => {
      container.registerSingleton('service1', () => ({}), ['missing1']);
      container.registerSingleton('service2', () => ({}), ['missing2']);
      
      const result = container.validateDependencies();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('Initialization', () => {
    it('should initialize all singleton services', () => {
      const factory1 = jest.fn(() => ({ service: 1 }));
      const factory2 = jest.fn(() => ({ service: 2 }));
      const factory3 = jest.fn(() => ({ service: 3 }));
      
      container.registerSingleton('service1', factory1);
      container.registerSingleton('service2', factory2);
      container.registerTransient('service3', factory3); // Should not be initialized
      
      container.initializeAll();
      
      expect(factory1).toHaveBeenCalled();
      expect(factory2).toHaveBeenCalled();
      expect(factory3).not.toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', () => {
      const goodFactory = jest.fn(() => ({ good: true }));
      const badFactory = jest.fn(() => {
        throw new Error('Initialization failed');
      });
      
      container.registerSingleton('goodService', goodFactory);
      container.registerSingleton('badService', badFactory);
      
      // Should not throw
      expect(() => container.initializeAll()).not.toThrow();
      
      expect(goodFactory).toHaveBeenCalled();
      expect(badFactory).toHaveBeenCalled();
    });
  });

  describe('Health Status', () => {
    it('should return correct health status', () => {
      container.registerSingleton('dependency', () => ({}));
      container.registerSingleton('service', () => ({}), ['dependency']);
      container.registerTransient('transient', () => ({}));
      
      // Initialize one singleton
      container.resolve('dependency');
      
      const health = container.getHealthStatus();
      
      expect(health.totalServices).toBe(3);
      expect(health.initializedSingletons).toBe(1);
      expect(health.validDependencies).toBe(true);
      expect(health.errors).toHaveLength(0);
    });

    it('should report health issues', () => {
      container.registerSingleton('service', () => ({}), ['missing']);
      
      const health = container.getHealthStatus();
      
      expect(health.totalServices).toBe(1);
      expect(health.initializedSingletons).toBe(0);
      expect(health.validDependencies).toBe(false);
      expect(health.errors).toHaveLength(1);
    });
  });

  describe('Convenience Functions', () => {
    it('should work with global convenience functions', () => {
      const { registerService, resolveService, hasService } = require('../ServiceContainer');
      
      registerService('globalTest', () => ({ global: true }));
      
      expect(hasService('globalTest')).toBe(true);
      
      const resolved = resolveService('globalTest');
      expect(resolved.global).toBe(true);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle deep dependency chains', () => {
      container.registerSingleton('level1', () => ({ level: 1 }));
      container.registerSingleton('level2', () => ({ level: 2 }), ['level1']);
      container.registerSingleton('level3', () => ({ level: 3 }), ['level2']);
      container.registerSingleton('level4', () => ({ level: 4 }), ['level3']);
      
      const result = container.resolve('level4');
      
      expect(result.level).toBe(4);
    });

    it('should handle multiple dependencies', () => {
      container.registerSingleton('dep1', () => ({ type: 'dep1' }));
      container.registerSingleton('dep2', () => ({ type: 'dep2' }));
      container.registerSingleton('dep3', () => ({ type: 'dep3' }));
      container.registerSingleton(
        'service',
        () => ({ type: 'main' }),
        ['dep1', 'dep2', 'dep3']
      );
      
      const result = container.resolve('service');
      
      expect(result.type).toBe('main');
    });

    it('should maintain separate instances across containers', () => {
      const container2 = new ServiceContainer();
      
      container.registerSingleton('shared', () => ({ container: 1 }));
      container2.registerSingleton('shared', () => ({ container: 2 }));
      
      const result1 = container.resolve('shared');
      const result2 = container2.resolve('shared');
      
      expect(result1.container).toBe(1);
      expect(result2.container).toBe(2);
      
      container2.clear();
    });
  });
});