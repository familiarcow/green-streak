import { useEffect, useRef } from 'react';
import { useCurrentDate } from '../store/systemStore';
import { getDateService } from '../services';
import logger from '../utils/logger';

/**
 * Hook to listen for date changes from the centralized DateService
 * 
 * @param onDateChange - Callback when date changes
 * @returns Current date from system store
 */
export const useDateRefresh = (onDateChange: (newDate: string) => void) => {
  const currentDate = useCurrentDate();
  const lastDateRef = useRef<string>(currentDate);

  useEffect(() => {
    // Subscribe to date changes from DateService
    const dateService = getDateService();
    const unsubscribe = dateService.subscribe((newDate) => {
      logger.debug('HOOK', 'Date change received in useDateRefresh', { newDate });
      onDateChange(newDate);
    });

    return unsubscribe;
  }, [onDateChange]);

  // Track date changes from store
  useEffect(() => {
    if (currentDate !== lastDateRef.current) {
      logger.debug('HOOK', 'Date changed in store', {
        from: lastDateRef.current,
        to: currentDate
      });
      lastDateRef.current = currentDate;
    }
  }, [currentDate]);

  return currentDate;
};

/**
 * Hook to get dynamically updating "today" string from system store
 * Much more efficient than the old implementation - just subscribes to store
 */
export const useDynamicToday = () => {
  return useCurrentDate();
};