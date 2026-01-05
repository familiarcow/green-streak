import logger from '../../src/utils/logger';

describe('Logger', () => {
  describe('log methods exist', () => {
    it('should have debug method', () => {
      expect(typeof logger.debug).toBe('function');
    });

    it('should have info method', () => {
      expect(typeof logger.info).toBe('function');
    });

    it('should have warn method', () => {
      expect(typeof logger.warn).toBe('function');
    });

    it('should have error method', () => {
      expect(typeof logger.error).toBe('function');
    });

    it('should have setLogLevel method', () => {
      expect(typeof logger.setLogLevel).toBe('function');
    });

    it('should have getLogs method', () => {
      expect(typeof logger.getLogs).toBe('function');
    });

    it('should have exportLogs method', () => {
      expect(typeof logger.exportLogs).toBe('function');
    });
  });

  describe('log export format', () => {
    it('should export logs as valid JSON', () => {
      const exported = logger.exportLogs();
      expect(() => JSON.parse(exported)).not.toThrow();
    });
  });
});