# Testing Guide

## Overview

Green Streak uses Jest and React Native Testing Library for comprehensive testing coverage including unit tests, component tests, and end-to-end tests.

## Testing Framework

- **Jest**: Test runner and assertion library
- **React Native Testing Library**: Component testing utilities
- **React Test Renderer**: Component rendering for tests
- **Custom Test Utilities**: Helper functions and mock data

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test categories
npm run test:unit        # Utils and store tests
npm run test:components  # Component and screen tests  
npm run test:e2e        # End-to-end integration tests
```

### Advanced Test Options

```bash
# Run specific test files
npm test -- --testNamePattern="Button"

# Run tests matching a pattern
npm test -- --testPathPatterns="components"

# Run tests without coverage
npm test -- --no-coverage

# Run tests with verbose output
npm test -- --verbose
```

## Test Structure

```
src/
├── components/
│   └── __tests__/          # Component tests
├── screens/
│   └── __tests__/          # Screen tests  
├── store/
│   └── __tests__/          # Store/state tests
├── utils/
│   └── __tests__/          # Utility function tests
└── test/
    ├── setup.ts            # Test configuration
    ├── utils.tsx           # Test helpers
    └── __tests__/
        └── e2e.test.tsx    # End-to-end tests
```

## Writing Tests

### Component Tests

```typescript
import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../test/utils';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const { getByText } = renderWithProviders(
      <MyComponent title="Test" />
    );
    
    expect(getByText('Test')).toBeTruthy();
  });

  it('handles user interaction', () => {
    const mockOnPress = jest.fn();
    const { getByText } = renderWithProviders(
      <MyComponent title="Button" onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText('Button'));
    expect(mockOnPress).toHaveBeenCalled();
  });
});
```

### Store Tests

```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useMyStore } from '../myStore';

describe('myStore', () => {
  beforeEach(() => {
    // Reset store state
    useMyStore.setState(initialState);
  });

  it('updates state correctly', () => {
    const { result } = renderHook(() => useMyStore());
    
    act(() => {
      result.current.updateValue('new value');
    });
    
    expect(result.current.value).toBe('new value');
  });
});
```

### Utility Function Tests

```typescript
import { myUtilFunction } from '../utils';

describe('myUtilFunction', () => {
  it('returns expected result', () => {
    const result = myUtilFunction('input');
    expect(result).toBe('expected output');
  });

  it('handles edge cases', () => {
    expect(myUtilFunction('')).toBe('default');
    expect(myUtilFunction(null)).toBe('default');
  });
});
```

## Test Utilities

### Mock Data Factories

```typescript
import { createMockTask, createMockContributionData } from '../test/utils';

const mockTask = createMockTask({
  name: 'Custom Task',
  color: '#ff0000',
});

const mockData = createMockContributionDataRange(30);
```

### Custom Render Function

```typescript
import { renderWithProviders } from '../test/utils';

// Automatically wraps components with necessary providers
const { getByText } = renderWithProviders(<MyComponent />);
```

### Mock Store States

```typescript
import { mockTasksStoreState } from '../test/utils';

// Use predefined mock store states
jest.mock('../store/tasksStore', () => ({
  useTasksStore: () => mockTasksStoreState,
}));
```

## Mocked Dependencies

The test setup automatically mocks:

- **expo-sqlite**: Database operations
- **expo-notifications**: Notification services  
- **react-native-reanimated**: Animation library
- **@react-native-async-storage/async-storage**: Local storage
- **react-native-uuid**: UUID generation
- **Console methods**: Reduced test noise

## Coverage Reports

Coverage reports are generated in the `coverage/` directory:

- **HTML Report**: `coverage/lcov-report/index.html`
- **Text Summary**: Displayed in terminal
- **LCOV Format**: `coverage/lcov.info`

## Continuous Integration

Tests should pass before merging code:

```bash
# Run full test suite with coverage
npm run test:coverage

# Ensure TypeScript compilation
npm run typecheck

# Check for linting issues (when ESLint is configured)
npm run lint
```

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how it does it
2. **Use Descriptive Test Names**: Clearly describe what is being tested
3. **Follow AAA Pattern**: Arrange, Act, Assert
4. **Mock External Dependencies**: Keep tests isolated and fast
5. **Test Edge Cases**: Include error conditions and boundary values
6. **Keep Tests Simple**: One concept per test
7. **Use Test Utilities**: Leverage helper functions for common patterns

## Debugging Tests

```bash
# Run specific test with debug info
npm test -- --testNamePattern="MyComponent" --verbose

# Use Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Add console.log statements (mocked by default)
console.log = jest.fn(); // Restore if needed for debugging
```

## Test Configuration

Test configuration is in `jest.config.js`:

- **Preset**: `react-native`
- **Setup Files**: `src/test/setup.ts`
- **Test Environment**: Node.js with React Native extensions
- **Transform Patterns**: Handle TypeScript, JavaScript, and React Native modules
- **Coverage**: Excludes test files, type definitions, and mock directories

## Performance

- Tests run in parallel by default
- Mock heavy dependencies to improve speed
- Use `--runInBand` for debugging serial execution
- Consider test file organization for better performance