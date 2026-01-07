import {
  getTodayString,
  formatDisplayDate,
  formatDate,
  getToday,
  getMonthName,
  getWeekDayName,
  getDateRange,
  getAdaptiveRange,
  isDateToday,
  areDatesEqual,
  subDays,
} from '../dateHelpers';

describe('dateHelpers', () => {
  // Mock Date.now to return a consistent date for testing
  const mockDate = new Date('2024-01-15T12:00:00.000Z');
  
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getTodayString', () => {
    it('returns today date in YYYY-MM-DD format', () => {
      const result = getTodayString();
      expect(result).toBe('2024-01-15');
    });
  });

  describe('formatDisplayDate', () => {
    it('formats date as "Mon D, YYYY"', () => {
      // Use explicit date construction to avoid timezone issues
      const date = new Date(2024, 0, 15); // Month is 0-indexed
      const result = formatDisplayDate(date);
      expect(result).toBe('Jan 15, 2024');
    });

    it('handles different months correctly', () => {
      const date = new Date(2024, 5, 1); // June = month 5
      const result = formatDisplayDate(date);
      expect(result).toBe('Jun 1, 2024');
    });

    it('handles leap year correctly', () => {
      const date = new Date(2024, 1, 29); // February = month 1
      const result = formatDisplayDate(date);
      expect(result).toBe('Feb 29, 2024');
    });
  });

  describe('formatDate', () => {
    it('formats date as YYYY-MM-DD', () => {
      const date = new Date(2024, 0, 15);
      const result = formatDate(date);
      expect(result).toBe('2024-01-15');
    });
  });

  describe('getMonthName', () => {
    it('returns correct month names (abbreviated)', () => {
      const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ];

      months.forEach((month, index) => {
        const date = new Date(2024, index, 1); // Use 0-indexed month
        expect(getMonthName(date)).toBe(month);
      });
    });
  });

  describe('getWeekDayName', () => {
    it('returns correct weekday names (abbreviated)', () => {
      const testCases = [
        { date: new Date(2024, 0, 14), expected: 'Sun' }, // Sunday
        { date: new Date(2024, 0, 15), expected: 'Mon' }, // Monday
        { date: new Date(2024, 0, 16), expected: 'Tue' }, // Tuesday
        { date: new Date(2024, 0, 17), expected: 'Wed' }, // Wednesday
        { date: new Date(2024, 0, 18), expected: 'Thu' }, // Thursday
        { date: new Date(2024, 0, 19), expected: 'Fri' }, // Friday
        { date: new Date(2024, 0, 20), expected: 'Sat' }, // Saturday
      ];

      testCases.forEach(({ date, expected }) => {
        const result = getWeekDayName(date);
        expect(result).toBe(expected);
      });
    });
  });

  describe('getDateRange', () => {
    it('generates correct date range', () => {
      const start = new Date(2024, 0, 1);
      const end = new Date(2024, 0, 3);
      
      const result = getDateRange(start, end);
      expect(result).toHaveLength(3);
      expect(formatDate(result[0])).toBe('2024-01-01');
      expect(formatDate(result[1])).toBe('2024-01-02');
      expect(formatDate(result[2])).toBe('2024-01-03');
    });

    it('handles single day range', () => {
      const start = new Date(2024, 0, 15);
      const end = new Date(2024, 0, 15);
      
      const result = getDateRange(start, end);
      expect(result).toHaveLength(1);
      expect(formatDate(result[0])).toBe('2024-01-15');
    });
  });

  describe('getAdaptiveRange', () => {
    it('returns 35 days minimum for small datasets', () => {
      const result = getAdaptiveRange(3);
      expect(result).toHaveLength(35);
    });

    it('returns 35 days for datasets under 35', () => {
      const result = getAdaptiveRange(20);
      expect(result).toHaveLength(35);
    });

    it('returns 60 days for medium datasets', () => {
      const result = getAdaptiveRange(40);
      expect(result).toHaveLength(60);
    });

    it('returns 90 days for larger datasets', () => {
      const result = getAdaptiveRange(70);
      expect(result).toHaveLength(90);
    });

    it('returns 365 days for very large datasets', () => {
      const result = getAdaptiveRange(200);
      expect(result).toHaveLength(365);
    });
  });

  describe('isDateToday', () => {
    it('returns true for today', () => {
      const result = isDateToday(mockDate);
      expect(result).toBe(true);
    });

    it('returns false for other dates', () => {
      const yesterday = new Date(2024, 0, 14);
      const tomorrow = new Date(2024, 0, 16);
      
      expect(isDateToday(yesterday)).toBe(false);
      expect(isDateToday(tomorrow)).toBe(false);
    });
  });

  describe('areDatesEqual', () => {
    it('returns true for same day dates', () => {
      const date1 = new Date(2024, 0, 15, 9, 0, 0);
      const date2 = new Date(2024, 0, 15, 18, 0, 0);
      
      const result = areDatesEqual(date1, date2);
      expect(result).toBe(true);
    });

    it('returns false for different days', () => {
      const date1 = new Date(2024, 0, 15);
      const date2 = new Date(2024, 0, 16);
      
      const result = areDatesEqual(date1, date2);
      expect(result).toBe(false);
    });
  });

  describe('subDays', () => {
    it('subtracts days correctly', () => {
      const date = new Date(2024, 0, 15);
      const result = subDays(date, 5);
      
      expect(formatDate(result)).toBe('2024-01-10');
    });

    it('handles month boundary', () => {
      const date = new Date(2024, 1, 5); // February
      const result = subDays(date, 10);
      
      expect(formatDate(result)).toBe('2024-01-26');
    });
  });
});