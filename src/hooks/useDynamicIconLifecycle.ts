import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import logger from '../utils/logger';

/**
 * Hook to manage dynamic icon lifecycle.
 * - Updates icon when app comes to foreground (in case day changed)
 * - Clears cache when app goes to background
 * - Cleans up on unmount
 */
export const useDynamicIconLifecycle = () => {
  const { dynamicIconEnabled } = useSettingsStore();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (!dynamicIconEnabled) return;

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      // App coming to foreground from background
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        logger.debug('UI', 'App became active, updating dynamic icon');

        try {
          const { getDynamicIconService } = await import('../services/ServiceRegistry');
          const dynamicIconService = getDynamicIconService();

          // Clear cache to force re-check (day may have changed while in background)
          dynamicIconService.clearCache();

          // Update the icon
          await dynamicIconService.updateIconFromActivity();
        } catch (error) {
          logger.warn('UI', 'Failed to update dynamic icon on foreground', { error });
        }
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Cleanup on unmount
    return () => {
      subscription.remove();

      // Clean up service resources
      import('../services/ServiceRegistry')
        .then(({ getDynamicIconService }) => {
          try {
            getDynamicIconService().cleanup();
            logger.debug('UI', 'Dynamic icon service cleaned up on unmount');
          } catch (error) {
            // Service may not be available, ignore
          }
        })
        .catch(() => {
          // Ignore import errors during cleanup
        });
    };
  }, [dynamicIconEnabled]);
};

export default useDynamicIconLifecycle;
