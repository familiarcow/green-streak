// Simple test to verify Jest setup is working
describe('Jest Setup', () => {
  it('should be able to run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should be able to test async functions', async () => {
    const asyncFunc = async () => Promise.resolve(42);
    const result = await asyncFunc();
    expect(result).toBe(42);
  });

  it('should be able to use mock functions', () => {
    const mockFn = jest.fn();
    mockFn('test');
    expect(mockFn).toHaveBeenCalledWith('test');
  });

  it('should be able to mock modules', () => {
    // Test that our setup file mocks are working
    expect(jest.isMockFunction(global.console.log)).toBe(true);
  });
});