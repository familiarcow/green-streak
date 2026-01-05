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

export const getDateRange = (startDate: Date, endDate: Date): Date[] => {
  return eachDayOfInterval({ start: startDate, end: endDate });
};

export const getAdaptiveRange = (dataPointCount: number, latestDate: Date = new Date()): Date[] => {
  let daysToShow: number;
  
  if (dataPointCount < 5) {
    daysToShow = 5;
  } else if (dataPointCount < 14) {
    daysToShow = 14;
  } else if (dataPointCount < 30) {
    daysToShow = 30;
  } else if (dataPointCount < 90) {
    daysToShow = 90;
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