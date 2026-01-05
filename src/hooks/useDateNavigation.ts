import { useState, useCallback } from 'react';
import { getTodayString } from '../utils/dateHelpers';
import { UseDateNavigationReturn } from '../types';
import logger from '../utils/logger';

/**
 * Custom hook for date navigation and selection
 * Provides reusable date management functionality
 */
export const useDateNavigation = (): UseDateNavigationReturn => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());

  const handleDayPress = useCallback((date: string) => {
    logger.debug('UI', 'Day selected', { date });
    setSelectedDate(date);
  }, []);

  const handleDateChange = useCallback((newDate: string) => {
    logger.debug('UI', 'Date changed', { from: selectedDate, to: newDate });
    setSelectedDate(newDate);
  }, [selectedDate]);

  const navigateToToday = useCallback(() => {
    const today = getTodayString();
    setSelectedDate(today);
    logger.debug('UI', 'Navigated to today', { date: today });
  }, []);

  const navigateDate = useCallback((direction: 'prev' | 'next') => {
    const currentDate = new Date(selectedDate);
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    const newDateString = newDate.toISOString().split('T')[0];
    
    setSelectedDate(newDateString);
    logger.debug('UI', 'Date navigation', { 
      direction, 
      from: selectedDate, 
      to: newDateString 
    });
    
    return newDateString;
  }, [selectedDate]);

  const isToday = useCallback((date?: string) => {
    const checkDate = date || selectedDate;
    return checkDate === getTodayString();
  }, [selectedDate]);

  return {
    selectedDate,
    handleDayPress,
    handleDateChange,
    navigateToToday,
    navigateDate,
    isToday,
    setSelectedDate,
  };
};