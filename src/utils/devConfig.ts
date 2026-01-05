import { SeedConfig, LogLevel } from '../types';
import logger from './logger';

/**
 * Read development configuration from environment and seed config file
 */
export function getDevConfig(): {
  shouldSeed: boolean;
  seedConfig: SeedConfig | null;
  logLevel: LogLevel;
} {
  try {
    // Check if we should seed data
    const shouldSeed = __DEV__ && process.env.DEV_SEED === 'true';
    
    // Get log level from environment
    const envLogLevel = process.env.DEV_LOG_LEVEL as LogLevel;
    const logLevel: LogLevel = ['DEBUG', 'INFO', 'WARN', 'ERROR'].includes(envLogLevel) 
      ? envLogLevel 
      : 'INFO';
    
    // Try to read seed configuration from environment variables
    let seedConfig: SeedConfig | null = null;
    
    if (shouldSeed) {
      try {
        // Read configuration from environment variables set by CLI
        const tasks = parseInt(process.env.DEV_SEED_TASKS || '5', 10);
        const days = parseInt(process.env.DEV_SEED_DAYS || '30', 10);
        const reset = process.env.DEV_SEED_RESET === 'true';
        const seedValue = process.env.DEV_SEED_RANDOM ? parseInt(process.env.DEV_SEED_RANDOM, 10) : undefined;
        const verbose = process.env.DEV_SEED_VERBOSE === 'true' || logLevel === 'DEBUG';
        
        seedConfig = {
          tasks,
          days,
          reset,
          seed: seedValue,
          verbose,
        };
        
        logger.debug('DEV', 'Development seeding enabled with CLI configuration', {
          tasks: seedConfig.tasks,
          days: seedConfig.days,
          reset: seedConfig.reset,
          seed: seedConfig.seed,
          verbose: seedConfig.verbose,
          logLevel,
        });
        
      } catch (error) {
        logger.warn('DEV', 'Could not parse seed config from environment, using defaults', { error });
        seedConfig = {
          tasks: 5,
          days: 30,
          reset: false,
          verbose: false,
        };
      }
    }
    
    return {
      shouldSeed,
      seedConfig,
      logLevel,
    };
    
  } catch (error) {
    logger.error('DEV', 'Failed to read dev config', { error });
    return {
      shouldSeed: false,
      seedConfig: null,
      logLevel: 'INFO',
    };
  }
}

/**
 * Set up development environment based on configuration
 */
export function setupDevEnvironment(): void {
  const { logLevel } = getDevConfig();
  
  if (__DEV__) {
    logger.info('DEV', 'Development mode enabled', { logLevel });
    
    // Set global log level for development
    logger.setLogLevel(logLevel);
    
    // You could add more development setup here
    // - Enable React Developer Tools
    // - Set up debug overlays
    // - Configure performance monitoring
    
    // Log helpful development information
    if (logLevel === 'DEBUG') {
      logger.debug('DEV', 'Debug logging enabled - all logs will be shown');
    }
  }
}

export default {
  getDevConfig,
  setupDevEnvironment,
};