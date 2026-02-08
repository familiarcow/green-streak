import { format, startOfDay, subDays, eachDayOfInterval, isToday, isSameDay } from 'date-fns';

export { subDays };

export const formatDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const formatDisplayDate = (date: Date): string => {
  return format(date, 'MMM d, yyyy');
};

export const formatDisplayTime = (date: Date): string => {
  return format(date, 'h:mm a');
};

export const getToday = (): Date => {
  return startOfDay(new Date());
};

export const getTodayString = (): string => {
  return formatDate(getToday());
};

export const formatDateString = (date: Date): string => {
  // Always use local timezone for consistent date handling
  // This replaces toISOString().split('T')[0] which uses UTC
  return format(date, 'yyyy-MM-dd');
};

export const parseDateString = (dateString: string): Date => {
  // Parse date string as local date, not UTC
  // "2026-01-09" becomes Jan 9 midnight local time, not UTC
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// ============================================================================
// Timezone-safe date string extraction utilities
// ============================================================================
// IMPORTANT: Use these instead of `new Date(dateString).getMonth()` etc.
// JavaScript's Date constructor interprets "YYYY-MM-DD" as UTC midnight,
// but getMonth()/getFullYear() return local timezone values, causing
// off-by-one errors in timezones west of UTC.
// ============================================================================

/**
 * Extract year from YYYY-MM-DD date string without timezone conversion.
 */
export const getYearFromDateString = (dateString: string): number => {
  return Number(dateString.slice(0, 4));
};

/**
 * Extract month (1-12) from YYYY-MM-DD date string without timezone conversion.
 */
export const getMonthFromDateString = (dateString: string): number => {
  return Number(dateString.slice(5, 7));
};

/**
 * Extract day (1-31) from YYYY-MM-DD date string without timezone conversion.
 */
export const getDayFromDateString = (dateString: string): number => {
  return Number(dateString.slice(8, 10));
};

/**
 * Get month letter (J, F, M, A, M, J, J, A, S, O, N, D) from YYYY-MM-DD date string.
 * Timezone-safe alternative to new Date(str).getMonth().
 */
export const getMonthLetterFromDateString = (dateString: string): string => {
  const monthLetters = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const month = getMonthFromDateString(dateString);
  return monthLetters[month - 1]; // month is 1-indexed
};

export const getDateRange = (startDate: Date, endDate: Date): Date[] => {
  return eachDayOfInterval({ start: startDate, end: endDate });
};

export const getAdaptiveRange = (dataPointCount: number, latestDate: Date = new Date()): Date[] => {
  let daysToShow: number;
  
  // Start with at least 35 days to match LiveCalendar default view (5 weeks)
  if (dataPointCount < 35) {
    daysToShow = 35;
  } else if (dataPointCount < 60) {
    daysToShow = 60;
  } else if (dataPointCount < 90) {
    daysToShow = 90;
  } else if (dataPointCount < 180) {
    daysToShow = 180;
  } else {
    daysToShow = 365;
  }
  
  const startDate = subDays(latestDate, daysToShow - 1);
  return getDateRange(startDate, latestDate);
};

export const isDateToday = (date: Date): boolean => {
  return isToday(date);
};

export const areDatesEqual = (date1: Date, date2: Date): boolean => {
  return isSameDay(date1, date2);
};

export const getWeekDayName = (date: Date): string => {
  return format(date, 'EEE');
};

export const getMonthName = (date: Date): string => {
  return format(date, 'MMM');
};