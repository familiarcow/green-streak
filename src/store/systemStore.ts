/**
 * System Store
 * 
 * Zustand store for system-wide application state.
 * Manages app-level concerns like current date, app state, etc.
 */

import { create } from 'zustand';
import { getTodayString } from '../utils/dateHelpers';
import logger from '../utils/logger';

interface SystemState {
  // Date management
  currentDate: string;
  lastDateCheck: number;
  
  // Actions
  setCurrentDate: (date: string) => void;
  updateLastDateCheck: () => void;
  
  // Helpers
  isToday: (date: string) => boolean;
}

export const useSystemStore = create<SystemState>((set, get) => ({
  // Initial state
  currentDate: getTodayString(),
  lastDateCheck: Date.now(),
  
  // Actions
  setCurrentDate: (date: string) => {
    const previousDate = get().currentDate;
    if (date !== previousDate) {
      logger.info('STORE', 'System date updated', {
        from: previousDate,
        to: date
      });
      
      set({
        currentDate: date,
        lastDateCheck: Date.now()
      });
    }
  },
  
  updateLastDateCheck: () => {
    set({ lastDateCheck: Date.now() });
  },
  
  // Helpers
  isToday: (date: string) => {
    return date === get().currentDate;
  }
}));

// Selector hooks for specific values
export const useCurrentDate = () => useSystemStore(state => state.currentDate);
export const useIsToday = () => useSystemStore(state => state.isToday);

// Export for non-hook contexts (services, etc)
export const getSystemState = () => useSystemStore.getState();
export const setSystemDate = (date: string) => useSystemStore.getState().setCurrentDate(date);