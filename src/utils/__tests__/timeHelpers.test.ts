import {
  formatTimeDisplay,
  convert12hTo24h,
  parse24hTime,
  getTimeOfDay,
} from '../timeHelpers';

describe('timeHelpers', () => {
  describe('formatTimeDisplay', () => {
    describe('12-hour format (use24Hour = false)', () => {
      it('formats morning time correctly', () => {
        expect(formatTimeDisplay('08:00', false)).toBe('8:00 AM');
        expect(formatTimeDisplay('09:30', false)).toBe('9:30 AM');
        expect(formatTimeDisplay('11:45', false)).toBe('11:45 AM');
      });

      it('formats afternoon time correctly', () => {
        expect(formatTimeDisplay('13:00', false)).toBe('1:00 PM');
        expect(formatTimeDisplay('14:30', false)).toBe('2:30 PM');
        expect(formatTimeDisplay('23:59', false)).toBe('11:59 PM');
      });

      it('formats noon correctly', () => {
        expect(formatTimeDisplay('12:00', false)).toBe('12:00 PM');
        expect(formatTimeDisplay('12:30', false)).toBe('12:30 PM');
      });

      it('formats midnight correctly', () => {
        expect(formatTimeDisplay('00:00', false)).toBe('12:00 AM');
        expect(formatTimeDisplay('00:30', false)).toBe('12:30 AM');
      });
    });

    describe('24-hour format (use24Hour = true)', () => {
      it('formats times with leading zeros', () => {
        expect(formatTimeDisplay('08:00', true)).toBe('08:00');
        expect(formatTimeDisplay('09:30', true)).toBe('09:30');
      });

      it('formats afternoon times correctly', () => {
        expect(formatTimeDisplay('13:00', true)).toBe('13:00');
        expect(formatTimeDisplay('23:59', true)).toBe('23:59');
      });

      it('formats midnight correctly', () => {
        expect(formatTimeDisplay('00:00', true)).toBe('00:00');
        expect(formatTimeDisplay('00:30', true)).toBe('00:30');
      });

      it('formats noon correctly', () => {
        expect(formatTimeDisplay('12:00', true)).toBe('12:00');
      });
    });
  });

  describe('convert12hTo24h', () => {
    describe('AM times', () => {
      it('converts regular AM hours correctly', () => {
        expect(convert12hTo24h(1, 0, false)).toBe('01:00');
        expect(convert12hTo24h(8, 30, false)).toBe('08:30');
        expect(convert12hTo24h(11, 45, false)).toBe('11:45');
      });

      it('converts 12 AM (midnight) correctly', () => {
        expect(convert12hTo24h(12, 0, false)).toBe('00:00');
        expect(convert12hTo24h(12, 30, false)).toBe('00:30');
      });
    });

    describe('PM times', () => {
      it('converts regular PM hours correctly', () => {
        expect(convert12hTo24h(1, 0, true)).toBe('13:00');
        expect(convert12hTo24h(8, 30, true)).toBe('20:30');
        expect(convert12hTo24h(11, 45, true)).toBe('23:45');
      });

      it('converts 12 PM (noon) correctly', () => {
        expect(convert12hTo24h(12, 0, true)).toBe('12:00');
        expect(convert12hTo24h(12, 30, true)).toBe('12:30');
      });
    });

    it('pads single-digit minutes correctly', () => {
      expect(convert12hTo24h(5, 5, false)).toBe('05:05');
      expect(convert12hTo24h(5, 0, true)).toBe('17:00');
    });
  });

  describe('parse24hTime', () => {
    describe('AM times', () => {
      it('parses morning hours correctly', () => {
        expect(parse24hTime('08:00')).toEqual({ hour12: 8, minutes: 0, isPM: false });
        expect(parse24hTime('09:30')).toEqual({ hour12: 9, minutes: 30, isPM: false });
        expect(parse24hTime('11:45')).toEqual({ hour12: 11, minutes: 45, isPM: false });
      });

      it('parses midnight correctly', () => {
        expect(parse24hTime('00:00')).toEqual({ hour12: 12, minutes: 0, isPM: false });
        expect(parse24hTime('00:30')).toEqual({ hour12: 12, minutes: 30, isPM: false });
      });
    });

    describe('PM times', () => {
      it('parses afternoon hours correctly', () => {
        expect(parse24hTime('13:00')).toEqual({ hour12: 1, minutes: 0, isPM: true });
        expect(parse24hTime('20:30')).toEqual({ hour12: 8, minutes: 30, isPM: true });
        expect(parse24hTime('23:45')).toEqual({ hour12: 11, minutes: 45, isPM: true });
      });

      it('parses noon correctly', () => {
        expect(parse24hTime('12:00')).toEqual({ hour12: 12, minutes: 0, isPM: true });
        expect(parse24hTime('12:30')).toEqual({ hour12: 12, minutes: 30, isPM: true });
      });
    });
  });

  describe('getTimeOfDay', () => {
    it('returns morning for times between 5:00 and 11:59', () => {
      expect(getTimeOfDay('05:00')).toBe('morning');
      expect(getTimeOfDay('08:00')).toBe('morning');
      expect(getTimeOfDay('11:59')).toBe('morning');
    });

    it('returns noon for times between 12:00 and 16:59', () => {
      expect(getTimeOfDay('12:00')).toBe('noon');
      expect(getTimeOfDay('14:30')).toBe('noon');
      expect(getTimeOfDay('16:59')).toBe('noon');
    });

    it('returns evening for times from 17:00 to 4:59', () => {
      expect(getTimeOfDay('17:00')).toBe('evening');
      expect(getTimeOfDay('20:00')).toBe('evening');
      expect(getTimeOfDay('23:59')).toBe('evening');
      expect(getTimeOfDay('00:00')).toBe('evening');
      expect(getTimeOfDay('04:59')).toBe('evening');
    });
  });

  describe('round-trip conversion', () => {
    it('converts 12h to 24h and back correctly', () => {
      const testCases = [
        { hour12: 1, minutes: 0, isPM: false },
        { hour12: 12, minutes: 0, isPM: false }, // midnight
        { hour12: 12, minutes: 0, isPM: true },  // noon
        { hour12: 8, minutes: 30, isPM: false },
        { hour12: 8, minutes: 30, isPM: true },
        { hour12: 11, minutes: 45, isPM: true },
      ];

      testCases.forEach(({ hour12, minutes, isPM }) => {
        const time24h = convert12hTo24h(hour12, minutes, isPM);
        const parsed = parse24hTime(time24h);
        expect(parsed).toEqual({ hour12, minutes, isPM });
      });
    });
  });
});
