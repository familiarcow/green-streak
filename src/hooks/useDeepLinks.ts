import { useEffect, useCallback, useRef } from 'react';
import { Linking, Platform } from 'react-native';
import logger from '../utils/logger';

// URL scheme for the app
const URL_SCHEME = 'greenstreak://';

/**
 * Deep link routes and their handlers
 */
export interface DeepLinkHandlers {
  /** Handle calendar deep link - navigates to a specific date */
  onCalendarLink?: (date: string) => void;
  /** Handle task deep link - opens a specific task */
  onTaskLink?: (taskId: string) => void;
  /** Handle generic app open (no specific route) */
  onAppOpen?: () => void;
}

/**
 * Parse a deep link URL into route and params
 */
function parseDeepLink(url: string): { route: string; params: Record<string, string> } | null {
  try {
    if (!url.startsWith(URL_SCHEME)) {
      return null;
    }

    // Remove the scheme prefix
    const path = url.replace(URL_SCHEME, '');

    // Split into route and query string
    const [routePart, queryString] = path.split('?');
    const route = routePart || '';

    // Parse query parameters
    const params: Record<string, string> = {};
    if (queryString) {
      const searchParams = new URLSearchParams(queryString);
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }

    return { route, params };
  } catch (error) {
    logger.error('HOOK', 'Failed to parse deep link', { url, error });
    return null;
  }
}

/**
 * Hook to handle deep links from widgets and other sources
 *
 * Supported deep links:
 * - greenstreak://calendar?date=YYYY-MM-DD - Navigate to calendar date
 * - greenstreak://task?id=<taskId> - Open specific task
 * - greenstreak:// - Just open the app
 */
export const useDeepLinks = (handlers: DeepLinkHandlers) => {
  const handlersRef = useRef(handlers);

  // Keep handlers ref up to date
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  // Process a deep link URL
  const handleDeepLink = useCallback((url: string | null) => {
    if (!url) return;

    logger.debug('HOOK', 'Processing deep link', { url });

    const parsed = parseDeepLink(url);
    if (!parsed) {
      logger.warn('HOOK', 'Invalid deep link URL', { url });
      return;
    }

    const { route, params } = parsed;

    switch (route) {
      case 'calendar':
        if (params.date && handlersRef.current.onCalendarLink) {
          logger.info('HOOK', 'Handling calendar deep link', { date: params.date });
          handlersRef.current.onCalendarLink(params.date);
        }
        break;

      case 'task':
        if (params.id && handlersRef.current.onTaskLink) {
          logger.info('HOOK', 'Handling task deep link', { taskId: params.id });
          handlersRef.current.onTaskLink(params.id);
        }
        break;

      case '':
        // Just opening the app
        if (handlersRef.current.onAppOpen) {
          logger.info('HOOK', 'Handling app open deep link');
          handlersRef.current.onAppOpen();
        }
        break;

      default:
        logger.warn('HOOK', 'Unknown deep link route', { route, params });
    }
  }, []);

  useEffect(() => {
    // Check if app was opened with a deep link
    const getInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          logger.debug('HOOK', 'App opened with initial URL', { url: initialUrl });
          handleDeepLink(initialUrl);
        }
      } catch (error) {
        logger.error('HOOK', 'Failed to get initial URL', { error });
      }
    };

    getInitialURL();

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      logger.debug('HOOK', 'Received deep link event', { url: event.url });
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [handleDeepLink]);

  return { handleDeepLink };
};

export default useDeepLinks;
