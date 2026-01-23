import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { getWidgetDataService } from '../services';
import { useDateRefresh } from './useDateRefresh';
import { useTaskActions } from './useTaskActions';
import { useTasksStore } from '../store/tasksStore';
import { useToast } from '../contexts/ToastContext';
import { PendingWidgetAction } from '../services/WidgetDataService';
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
  const isProcessingRef = useRef(false);

  // Get task actions for processing widget quick adds
  const { handleQuickAdd, handleQuickRemove } = useTaskActions();
  const { tasks } = useTasksStore();
  const { showToast } = useToast();

  // Build toast message for processed actions
  const buildToastMessage = useCallback((actions: PendingWidgetAction[]): string | null => {
    if (actions.length === 0) return null;

    // Group actions by taskId and type
    const addCounts: Record<string, number> = {};

    for (const action of actions) {
      if (action.type === 'quick_add') {
        addCounts[action.taskId] = (addCounts[action.taskId] || 0) + 1;
      }
    }

    // Build message parts
    const parts: string[] = [];
    for (const [taskId, count] of Object.entries(addCounts)) {
      const task = tasks.find(t => t.id === taskId);
      const taskName = task?.name || 'Unknown Task';
      parts.push(`${count}x ${taskName}`);
    }

    if (parts.length === 0) return null;

    return `Adding ${parts.join(', ')} from Widget`;
  }, [tasks]);

  // Process pending widget actions
  // Returns the result so callers can check if actions were processed
  const processPendingWidgetActions = useCallback(async (): Promise<{ processed: string[]; failed: string[] } | null> => {
    if (Platform.OS !== 'ios') return null;
    if (isProcessingRef.current) {
      logger.debug('HOOK', 'Already processing widget actions, skipping');
      return null;
    }

    isProcessingRef.current = true;
    try {
      const widgetService = getWidgetDataService();

      // Get pending actions first to build toast message
      const pendingActions = await widgetService.getPendingActions();
      const toastMessage = buildToastMessage(pendingActions);

      const result = await widgetService.processPendingActions({
        onQuickAdd: handleQuickAdd,
        onQuickRemove: handleQuickRemove,
      });

      if (result.processed.length > 0) {
        logger.info('HOOK', 'Processed pending widget actions', {
          processed: result.processed.length,
          failed: result.failed.length,
        });

        // Show toast notification
        if (toastMessage) {
          showToast({
            message: toastMessage,
            variant: 'success',
            duration: 3000,
          });
        }
      }
      return result;
    } catch (error) {
      logger.error('HOOK', 'Failed to process pending widget actions', { error });
      return null;
    } finally {
      isProcessingRef.current = false;
    }
  }, [handleQuickAdd, handleQuickRemove, buildToastMessage, showToast]);

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

    // Initialize widget data service and process any pending actions
    const initializeAndProcessPending = async () => {
      if (!isInitializedRef.current) {
        try {
          const widgetService = getWidgetDataService();
          widgetService.initialize();
          isInitializedRef.current = true;
          logger.info('HOOK', 'Widget sync initialized');

          // Process any pending widget actions on initial mount
          await processPendingWidgetActions();

          // Always sync after a short delay to ensure contribution data is loaded
          // The delay allows HomeScreen's refreshAllData() to complete
          setTimeout(async () => {
            try {
              logger.debug('HOOK', 'Running delayed initial widget sync');
              await widgetService.forceSync();
            } catch (error) {
              logger.error('HOOK', 'Failed delayed initial widget sync', { error });
            }
          }, 1000);
        } catch (error) {
          logger.error('HOOK', 'Failed to initialize widget sync', { error });
        }
      }
    };

    initializeAndProcessPending();

    // Handle app state changes (foreground/background)
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        logger.debug('HOOK', 'App foregrounded, processing widget actions and syncing');
        try {
          // Process pending widget actions FIRST
          await processPendingWidgetActions();
          // Then sync to update widget with real data from app DB
          const widgetService = getWidgetDataService();
          await widgetService.forceSync();
        } catch (error) {
          logger.error('HOOK', 'Failed to process/sync widget on foreground', { error });
        }
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [processPendingWidgetActions]);

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
