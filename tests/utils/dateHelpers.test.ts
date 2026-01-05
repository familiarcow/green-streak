import { 
  formatDate, 
  getTodayString, 
  getAdaptiveRange, 
  isDateToday,
  areDatesEqual 
} from '../../src/utils/dateHelpers';

describe('dateHelpers', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-01-03T12:00:00Z');
      expect(formatDate(date)).toBe('2025-01-03');
    });
  });

  describe('getTodayString', () => {
    it('should return today in YYYY-MM-DD format', () => {
      const today = getTodayString();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getAdaptiveRange', () => {
    it('should return 5 days for small data counts', () => {
      const range = getAdaptiveRange(3);
      expect(range).toHaveLength(5);
    });

    it('should return 14 days for medium data counts', () => {
      const range = getAdaptiveRange(10);
      expect(range).toHaveLength(14);
    });

    it('should return 30 days for larger data counts', () => {
      const range = getAdaptiveRange(25);
      expect(range).toHaveLength(30);
    });

    it('should return 365 days for very large data counts', () => {
      const range = getAdaptiveRange(100);
      expect(range).toHaveLength(365);
    });
  });

  describe('isDateToday', () => {
    it('should return true for today', () => {
      const today = new Date();
      expect(isDateToday(today)).toBe(true);
    });

    it('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(isDateToday(yesterday)).toBe(false);
    });
  });

  describe('areDatesEqual', () => {
    it('should return true for same dates', () => {
      const date1 = new Date('2025-01-03');
      const date2 = new Date('2025-01-03');
      expect(areDatesEqual(date1, date2)).toBe(true);
    });

    it('should return false for different dates', () => {
      const date1 = new Date('2025-01-03');
      const date2 = new Date('2025-01-04');
      expect(areDatesEqual(date1, date2)).toBe(false);
    });
  });
});