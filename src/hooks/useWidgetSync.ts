import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { getWidgetDataService } from '../services';
import { useDateRefresh } from './useDateRefresh';
import logger from '../utils/logger';

/**
 * Hook to manage widget data synchronization lifecycle
 *
 * Handles:
 * - Initializing WidgetDataService on mount
 * - Syncing data when app returns to foreground
 * - Syncing data on midnight date rollover
 * - Cleaning up on unmount
 */
export const useWidgetSync = () => {
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isInitializedRef = useRef(false);

  // Handle date change (midnight rollover)
  const handleDateChange = useCallback((newDate: string) => {
    if (Platform.OS !== 'ios') return;

    logger.debug('HOOK', 'Date changed, syncing widget data', { newDate });
    try {
      const widgetService = getWidgetDataService();
      widgetService.forceSync();
    } catch (error) {
      logger.error('HOOK', 'Failed to sync widget on date change', { error });
    }
  }, []);

  // Subscribe to date changes
  useDateRefresh(handleDateChange);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    // Initialize widget data service
    if (!isInitializedRef.current) {
      try {
        const widgetService = getWidgetDataService();
        widgetService.initialize();
        isInitializedRef.current = true;
        logger.info('HOOK', 'Widget sync initialized');
      } catch (error) {
        logger.error('HOOK', 'Failed to initialize widget sync', { error });
      }
    }

    // Handle app state changes (foreground/background)
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        logger.debug('HOOK', 'App foregrounded, syncing widget data');
        try {
          const widgetService = getWidgetDataService();
          widgetService.forceSync();
        } catch (error) {
          logger.error('HOOK', 'Failed to sync widget on foreground', { error });
        }
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  // Return a manual sync function for components that need it
  const syncWidgetData = useCallback(async () => {
    if (Platform.OS !== 'ios') return;

    try {
      const widgetService = getWidgetDataService();
      await widgetService.forceSync();
    } catch (error) {
      logger.error('HOOK', 'Manual widget sync failed', { error });
    }
  }, []);

  return { syncWidgetData };
};

export default useWidgetSync;
