/**
 * Date Service
 * 
 * Centralized service for managing date/time state across the application.
 * Handles date change detection, app state monitoring, and notification of date changes.
 */

import { AppState, AppStateStatus, NativeEventSubscription } from 'react-native';
import { getTodayString } from '../utils/dateHelpers';
import logger from '../utils/logger';

type DateChangeListener = (newDate: string) => void;

export class DateService {
  private static instance: DateService | null = null;
  private listeners = new Set<DateChangeListener>();
  private currentDate: string;
  private checkInterval: NodeJS.Timeout | null = null;
  private appStateSubscription: NativeEventSubscription | null = null;
  private isInitialized = false;

  private constructor() {
    this.currentDate = getTodayString();
    logger.debug('SERVICE', 'DateService instantiated', { currentDate: this.currentDate });
  }

  /**
   * Get singleton instance of DateService
   */
  static getInstance(): DateService {
    if (!DateService.instance) {
      DateService.instance = new DateService();
    }
    return DateService.instance;
  }

  /**
   * Initialize the date service
   * Sets up interval checking and app state monitoring
   */
  initialize(): void {
    if (this.isInitialized) {
      logger.warn('SERVICE', 'DateService already initialized');
      return;
    }

    try {
      logger.info('SERVICE', 'Initializing DateService');

      // Check for date changes every minute
      this.checkInterval = setInterval(() => {
        this.checkForDateChange();
      }, 60000); // 1 minute

      // Monitor app state changes
      this.appStateSubscription = AppState.addEventListener(
        'change',
        this.handleAppStateChange
      );

      // Initial check
      this.checkForDateChange();

      this.isInitialized = true;
      logger.info('SERVICE', 'DateService initialized successfully');
    } catch (error) {
      logger.error('SERVICE', 'Failed to initialize DateService', { error });
      throw error;
    }
  }

  /**
   * Handle app state changes (foreground/background)
   */
  private handleAppStateChange = (nextAppState: AppStateStatus): void => {
    if (nextAppState === 'active') {
      logger.debug('SERVICE', 'App became active, checking for date change');
      this.checkForDateChange();
    }
  };

  /**
   * Check if the date has changed and notify listeners
   */
  private checkForDateChange(): void {
    try {
      const newDate = getTodayString();
      
      if (newDate !== this.currentDate) {
        const oldDate = this.currentDate;
        this.currentDate = newDate;
        
        logger.info('SERVICE', 'Date change detected', {
          from: oldDate,
          to: newDate
        });
        
        this.notifyListeners(newDate);
      }
    } catch (error) {
      logger.error('SERVICE', 'Error checking for date change', { error });
    }
  }

  /**
   * Notify all registered listeners of date change
   */
  private notifyListeners(newDate: string): void {
    this.listeners.forEach(listener => {
      try {
        listener(newDate);
      } catch (error) {
        logger.error('SERVICE', 'Error notifying date change listener', { error });
      }
    });
  }

  /**
   * Subscribe to date changes
   * Returns unsubscribe function
   */
  subscribe(listener: DateChangeListener): () => void {
    this.listeners.add(listener);
    logger.debug('SERVICE', 'DateService listener added', { 
      listenerCount: this.listeners.size 
    });
    
    return () => {
      this.listeners.delete(listener);
      logger.debug('SERVICE', 'DateService listener removed', { 
        listenerCount: this.listeners.size 
      });
    };
  }

  /**
   * Get the current date
   */
  getCurrentDate(): string {
    return this.currentDate;
  }

  /**
   * Force a date check (useful for testing)
   */
  forceCheck(): void {
    logger.debug('SERVICE', 'Forcing date check');
    this.checkForDateChange();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    logger.info('SERVICE', 'Destroying DateService');
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    
    this.listeners.clear();
    this.isInitialized = false;
    DateService.instance = null;
  }

  /**
   * Get service health status
   */
  getHealthStatus(): {
    isHealthy: boolean;
    currentDate: string;
    listenerCount: number;
    isInitialized: boolean;
  } {
    return {
      isHealthy: this.isInitialized && this.checkInterval !== null,
      currentDate: this.currentDate,
      listenerCount: this.listeners.size,
      isInitialized: this.isInitialized
    };
  }
}

/**
 * Factory function to create DateService instance
 */
export const createDateService = (): DateService => {
  return DateService.getInstance();
};

export default DateService;