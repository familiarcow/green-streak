# Testing Guide

*Created: January 3, 2026*  
*Last Modified: January 5, 2026*

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Setup](#testing-setup)
3. [Test Types](#test-types)
4. [Running Tests](#running-tests)
5. [Writing Tests](#writing-tests)
6. [Testing Architectural Patterns](#testing-architectural-patterns)
7. [Test Data and Mocking](#test-data-and-mocking)
8. [Coverage Requirements](#coverage-requirements)
9. [Debugging Tests](#debugging-tests)
10. [Continuous Integration](#continuous-integration)

## Testing Philosophy

Green Streak follows a comprehensive testing strategy focused on:

1. **Reliability**: Ensure core functionality works consistently
2. **Regression Prevention**: Catch breaking changes early
3. **Documentation**: Tests serve as living documentation
4. **Confidence**: Enable safe refactoring and feature development

### Testing Pyramid

```
                    E2E Tests
                (Coming Soon)
               /              \
          Integration Tests     \
         /                      \
    Unit Tests                   \
   (Utilities, Logic)             \
  /                               \
Static Analysis                   Manual Testing
(TypeScript, Linting)            (Development, QA)
```

## Testing Setup

### Jest Configuration

**Location**: `/jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: [
    '<rootDir>/tests/**/*.test.{js,ts,tsx}',
    '<rootDir>/src/**/__tests__/**/*.{js,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,ts,tsx}',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/types/*.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
```

### Test Setup

**Location**: `/tests/setup.js`

```javascript
// Global test setup and configuration
// Add any global mocks or setup here
```

### Dependencies

Current testing stack:
- **Jest 30.2.0**: Core testing framework
- **ts-jest 29.4.6**: TypeScript support for Jest
- **@types/jest 30.0.0**: TypeScript definitions

## Test Types

### 1. Unit Tests

Test individual functions and utilities in isolation.

**Location**: `/tests/utils/`

**Example**: Date helpers testing

```typescript
// tests/utils/dateHelpers.test.ts
import { formatDate, getTodayString, getAdaptiveRange } from '../../src/utils/dateHelpers';

describe('dateHelpers', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2025-01-03T12:00:00Z');
      expect(formatDate(date)).toBe('2025-01-03');
    });
  });

  describe('getAdaptiveRange', () => {
    it('should return 5 days for small data counts', () => {
      const range = getAdaptiveRange(3);
      expect(range).toHaveLength(5);
    });
  });
});
```

### 2. Integration Tests

Test interactions between components and stores.

**Location**: `/tests/integration/`

**Example**: Store and repository integration

```typescript
// tests/integration/taskStore.test.ts
import { useTasksStore } from '../../src/store/tasksStore';
import TaskRepository from '../../src/database/repositories/TaskRepository';

describe('TasksStore Integration', () => {
  beforeEach(async () => {
    // Setup test database
    await setupTestDatabase();
  });

  afterEach(async () => {
    // Clean up test data
    await cleanupTestDatabase();
  });

  it('should create and load tasks', async () => {
    const store = useTasksStore.getState();
    
    // Create task
    const task = await store.createTask({
      name: 'Test Task',
      color: '#22c55e',
      isMultiCompletion: false,
      reminderEnabled: false,
    });

    expect(task).toBeDefined();
    expect(task.name).toBe('Test Task');

    // Verify it was saved
    const savedTask = await TaskRepository.findById(task.id);
    expect(savedTask).toEqual(task);
  });
});
```

### 3. Component Tests (Planned)

Test React Native components in isolation.

**Example**: Contribution graph testing

```typescript
// tests/components/ContributionGraph.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ContributionGraph } from '../../src/components/ContributionGraph';

const mockContributionData = [
  {
    date: '2026-01-01',
    count: 3,
    tasks: [
      { taskId: '1', name: 'Exercise', count: 2, color: '#22c55e' },
      { taskId: '2', name: 'Read', count: 1, color: '#3b82f6' },
    ],
  },
];

describe('ContributionGraph', () => {
  it('should render contribution data', () => {
    const onDayPress = jest.fn();
    const { getByTestId } = render(
      <ContributionGraph
        data={mockContributionData}
        onDayPress={onDayPress}
      />
    );

    expect(getByTestId('contribution-graph')).toBeTruthy();
  });

  it('should handle day press events', () => {
    const onDayPress = jest.fn();
    const { getByTestId } = render(
      <ContributionGraph
        data={mockContributionData}
        onDayPress={onDayPress}
      />
    );

    fireEvent.press(getByTestId('contribution-day-2026-01-01'));
    expect(onDayPress).toHaveBeenCalledWith('2026-01-01');
  });
});
```

### 4. End-to-End Tests (Future)

Test complete user workflows across the entire application.

**Planned Tools**:
- **Detox**: React Native E2E testing
- **Maestro**: Mobile UI testing

**Example Scenarios**:
- Create new habit and log completions
- View contribution graph and navigate to daily log
- Edit existing habits and update completion data

## Running Tests

### Basic Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run specific test file
npm test -- dateHelpers.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="formatDate"

# Run tests with verbose output
npm test -- --verbose
```

### Coverage Commands

```bash
# Generate and view coverage
npm run test:coverage

# Coverage with specific thresholds
npm test -- --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'

# View coverage report in browser
open coverage/lcov-report/index.html
```

### Development Testing Workflow

```bash
# Terminal 1: Development server with test data
npm run dev -- --tasks 5 --days 30

# Terminal 2: Tests in watch mode
npm run test:watch

# Terminal 3: TypeScript checking
npm run typecheck --watch
```

### Debug Mode

```bash
# Run tests with Node.js debugging
node --inspect-brk node_modules/.bin/jest --runInBand

# Run specific test in debug mode
npm test -- --runInBand --detectOpenHandles dateHelpers.test.ts
```

## Writing Tests

### Test Structure

Follow the **Arrange, Act, Assert** pattern:

```typescript
describe('Component or Function Name', () => {
  describe('specific functionality', () => {
    it('should do something specific', () => {
      // Arrange: Set up test data and mocks
      const input = 'test input';
      const expectedOutput = 'expected result';

      // Act: Execute the function being tested
      const result = functionUnderTest(input);

      // Assert: Verify the result
      expect(result).toBe(expectedOutput);
    });
  });
});
```

### Test Naming Conventions

1. **Describe blocks**: Use the function/component name
2. **Nested describe**: Use the specific feature or method
3. **Test names**: Use "should [expected behavior] when [condition]"

```typescript
describe('TaskRepository', () => {
  describe('create', () => {
    it('should create task with generated ID when valid data provided', () => {
      // Test implementation
    });

    it('should throw error when required fields are missing', () => {
      // Test implementation
    });
  });
});
```

### Testing Utilities

Create test utilities for common operations:

```typescript
// tests/utils/testHelpers.ts
import { Task } from '../../src/types';

export const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'test-id',
  name: 'Test Task',
  color: '#22c55e',
  isMultiCompletion: false,
  createdAt: '2026-01-03T00:00:00.000Z',
  reminderEnabled: false,
  ...overrides,
});

export const createMockContributionData = (date: string, count: number) => ({
  date,
  count,
  tasks: [
    {
      taskId: 'task-1',
      name: 'Exercise',
      count,
      color: '#22c55e',
    },
  ],
});
```

### Testing Async Operations

```typescript
describe('async operations', () => {
  it('should handle async task creation', async () => {
    const taskData = {
      name: 'New Task',
      color: '#22c55e',
      isMultiCompletion: false,
      reminderEnabled: false,
    };

    const result = await TaskRepository.create(taskData);

    expect(result.id).toBeDefined();
    expect(result.name).toBe(taskData.name);
  });

  it('should handle async errors', async () => {
    const invalidData = {}; // Missing required fields

    await expect(TaskRepository.create(invalidData)).rejects.toThrow();
  });
});
```

### Testing Error Handling

```typescript
describe('error scenarios', () => {
  it('should handle database connection errors', async () => {
    // Mock database failure
    jest.spyOn(database, 'runAsync').mockRejectedValue(new Error('Connection failed'));

    await expect(TaskRepository.create(validTaskData)).rejects.toThrow('Connection failed');
  });

  it('should handle validation errors gracefully', () => {
    const invalidDate = 'invalid-date';
    
    expect(() => formatDate(invalidDate)).toThrow();
  });
});
```

## Testing Architectural Patterns

### Testing Repositories with Interfaces

The repository pattern with interfaces enables easy testing through dependency injection:

```typescript
// Test with mock repository
import { MockTaskRepository } from '../../src/database/repositories/mocks';
import { repositoryFactory } from '../../src/database/repositories/RepositoryFactory';
import { DataService } from '../../src/services/DataService';

describe('DataService', () => {
  let mockTaskRepo: MockTaskRepository;
  let dataService: DataService;
  
  beforeEach(() => {
    // Inject mock repository
    mockTaskRepo = new MockTaskRepository();
    repositoryFactory.setTaskRepository(mockTaskRepo);
    
    // Create service with mocked dependency
    dataService = new DataService();
  });
  
  afterEach(() => {
    // Reset to real implementations
    repositoryFactory.resetToDefaults();
  });
  
  it('should create task with validation', async () => {
    const taskData = {
      name: 'Test Task',
      color: '#22c55e',
      isMultiCompletion: false,
      reminderEnabled: false,
    };
    
    const result = await dataService.createTask(taskData);
    
    expect(result.id).toBeDefined();
    expect(mockTaskRepo.tasks).toHaveLength(1);
  });
});
```

### Testing Services

Services contain business logic and should be tested with mocked repositories:

```typescript
// Test ValidationService
import { ValidationService } from '../../src/services/ValidationService';

describe('ValidationService', () => {
  let validationService: ValidationService;
  
  beforeEach(() => {
    validationService = new ValidationService();
  });
  
  describe('validateTaskLog', () => {
    it('should validate valid task log', () => {
      const result = validationService.validateTaskLog({
        taskId: 'task-123',
        date: '2026-01-05',
        count: 3,
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject invalid date format', () => {
      const result = validationService.validateTaskLog({
        taskId: 'task-123',
        date: '01/05/2026', // Wrong format
        count: 3,
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid date format');
    });
    
    it('should reject negative counts', () => {
      const result = validationService.validateTaskLog({
        taskId: 'task-123',
        date: '2026-01-05',
        count: -1,
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Count must be non-negative');
    });
  });
});
```

### Testing Custom Hooks

Custom hooks require special testing utilities:

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useTaskActions } from '../../src/hooks/useTaskActions';
import { repositoryFactory } from '../../src/database/repositories/RepositoryFactory';
import { MockTaskRepository, MockLogRepository } from '../../src/database/repositories/mocks';

describe('useTaskActions', () => {
  let mockTaskRepo: MockTaskRepository;
  let mockLogRepo: MockLogRepository;
  
  beforeEach(() => {
    mockTaskRepo = new MockTaskRepository();
    mockLogRepo = new MockLogRepository();
    repositoryFactory.setTaskRepository(mockTaskRepo);
    repositoryFactory.setLogRepository(mockLogRepo);
  });
  
  afterEach(() => {
    repositoryFactory.resetToDefaults();
  });
  
  it('should handle quick add with date', async () => {
    const { result } = renderHook(() => useTaskActions());
    
    // Add test task
    await mockTaskRepo.create({
      name: 'Test Task',
      color: '#22c55e',
      isMultiCompletion: false,
      reminderEnabled: false,
    });
    
    // Perform quick add
    await act(async () => {
      await result.current.handleQuickAdd('task-1', '2026-01-05');
    });
    
    // Verify log was created
    const log = await mockLogRepo.getByTaskAndDate('task-1', '2026-01-05');
    expect(log?.count).toBe(1);
  });
  
  it('should handle quick add for today when no date provided', async () => {
    const { result } = renderHook(() => useTaskActions());
    
    await act(async () => {
      await result.current.handleQuickAdd('task-1');
    });
    
    const today = new Date().toISOString().split('T')[0];
    const log = await mockLogRepo.getByTaskAndDate('task-1', today);
    expect(log).toBeDefined();
  });
});
```

### Testing Components with Animations

Test components with React Native Reanimated:

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { TimePeriodSelector } from '../../src/components/ContributionGraph/TimePeriodSelector';

// Mock Reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

describe('TimePeriodSelector', () => {
  it('should render all time periods', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <TimePeriodSelector selected="live" onSelect={onSelect} />
    );
    
    expect(getByText('Live')).toBeTruthy();
    expect(getByText('2M')).toBeTruthy();
    expect(getByText('4M')).toBeTruthy();
    expect(getByText('6M')).toBeTruthy();
    expect(getByText('1Y')).toBeTruthy();
    expect(getByText('All')).toBeTruthy();
  });
  
  it('should call onSelect when period is pressed', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <TimePeriodSelector selected="live" onSelect={onSelect} />
    );
    
    fireEvent.press(getByText('2M'));
    expect(onSelect).toHaveBeenCalledWith('2m');
  });
  
  it('should highlight selected period', async () => {
    const { getByText, rerender } = render(
      <TimePeriodSelector selected="live" onSelect={jest.fn()} />
    );
    
    // Initially Live is selected
    const liveButton = getByText('Live');
    expect(liveButton.parent.props.accessibilityState.selected).toBe(true);
    
    // Change selection
    rerender(<TimePeriodSelector selected="2m" onSelect={jest.fn()} />);
    
    await waitFor(() => {
      const twoMonthButton = getByText('2M');
      expect(twoMonthButton.parent.props.accessibilityState.selected).toBe(true);
    });
  });
});
```

### Testing Store Operations

Test Zustand stores with proper isolation:

```typescript
import { act, renderHook } from '@testing-library/react-hooks';
import { useTasksStore } from '../../src/store/tasksStore';
import { MockTaskRepository } from '../../src/database/repositories/mocks';
import { repositoryFactory } from '../../src/database/repositories/RepositoryFactory';

describe('useTasksStore', () => {
  let mockRepo: MockTaskRepository;
  
  beforeEach(() => {
    mockRepo = new MockTaskRepository();
    repositoryFactory.setTaskRepository(mockRepo);
    
    // Reset store state
    useTasksStore.setState({ 
      tasks: [], 
      loading: false, 
      error: null 
    });
  });
  
  afterEach(() => {
    repositoryFactory.resetToDefaults();
  });
  
  it('should load tasks from repository', async () => {
    // Add test tasks to mock repository
    await mockRepo.create({ name: 'Task 1', color: '#22c55e', isMultiCompletion: false, reminderEnabled: false });
    await mockRepo.create({ name: 'Task 2', color: '#3b82f6', isMultiCompletion: true, reminderEnabled: false });
    
    const { result } = renderHook(() => useTasksStore());
    
    // Load tasks
    await act(async () => {
      await result.current.loadTasks();
    });
    
    expect(result.current.tasks).toHaveLength(2);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });
  
  it('should handle errors gracefully', async () => {
    // Make repository throw error
    mockRepo.getAll = jest.fn().mockRejectedValue(new Error('Database error'));
    
    const { result } = renderHook(() => useTasksStore());
    
    await act(async () => {
      await result.current.loadTasks();
    });
    
    expect(result.current.tasks).toHaveLength(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Failed to load tasks');
  });
});
```

### Testing Error Boundaries

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import { AppErrorBoundary } from '../../src/components/AppErrorBoundary';

// Component that throws error
const ThrowError = () => {
  throw new Error('Test error');
};

describe('AppErrorBoundary', () => {
  it('should catch errors and display fallback', () => {
    const { getByText } = render(
      <AppErrorBoundary>
        <ThrowError />
      </AppErrorBoundary>
    );
    
    expect(getByText(/Something went wrong/)).toBeTruthy();
  });
  
  it('should render children when no error', () => {
    const { getByText } = render(
      <AppErrorBoundary>
        <Text>Normal content</Text>
      </AppErrorBoundary>
    );
    
    expect(getByText('Normal content')).toBeTruthy();
  });
});
```

## Test Data and Mocking

### Using Development Seeding for Tests

```typescript
// Use the development seeding system for integration tests
import { runSeed } from '../../src/utils/devSeed';

describe('Integration with seeded data', () => {
  beforeEach(async () => {
    await runSeed({
      tasks: 3,
      days: 7,
      reset: true,
      seed: 12345, // Reproducible data
      verbose: false,
    });
  });

  it('should work with realistic data', async () => {
    const tasks = await TaskRepository.findAll();
    expect(tasks).toHaveLength(3);
    
    const contributionData = await LogRepository.getContributionData(['2026-01-03']);
    expect(contributionData).toBeDefined();
  });
});
```

### Mocking External Dependencies

```typescript
// Mock logger for testing
jest.mock('../../src/utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  fatal: jest.fn(),
}));

// Mock date functions
jest.mock('../../src/utils/dateHelpers', () => ({
  ...jest.requireActual('../../src/utils/dateHelpers'),
  getTodayString: () => '2026-01-03',
}));
```

### Database Testing

```typescript
// Create test database utilities
export const setupTestDatabase = async () => {
  const db = getDatabase();
  await db.execAsync(CREATE_TABLES);
};

export const cleanupTestDatabase = async () => {
  const db = getDatabase();
  await db.execAsync(DROP_TABLES);
};

export const seedTestData = async () => {
  await runSeed({
    tasks: 2,
    days: 5,
    reset: false,
    seed: 123,
    verbose: false,
  });
};
```

## Coverage Requirements

### Current Coverage Targets

- **Utilities**: 90%+ coverage (critical business logic)
- **Repositories**: 85%+ coverage (data access layer)
- **Stores**: 80%+ coverage (state management)
- **Components**: 70%+ coverage (UI components)

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Coverage files locations
coverage/
├── lcov-report/          # HTML report (open index.html)
├── text-summary/         # Terminal output
└── lcov.info            # LCOV format for CI tools
```

### Coverage Analysis

```javascript
// jest.config.js coverage settings
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/**/*.d.ts',          // Exclude type definitions
    '!src/**/index.ts',        // Exclude barrel exports
    '!src/types/*.ts',         // Exclude type-only files
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/utils/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
};
```

## Debugging Tests

### Common Issues and Solutions

#### 1. Async Test Timeouts

```typescript
// Increase timeout for slow operations
describe('slow operations', () => {
  it('should handle large data processing', async () => {
    // Test implementation
  }, 10000); // 10 second timeout
});
```

#### 2. Database State Issues

```typescript
// Ensure clean state between tests
describe('database tests', () => {
  beforeEach(async () => {
    await cleanupTestDatabase();
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });
});
```

#### 3. Mock Issues

```typescript
// Clear mocks between tests
describe('mocked functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
});
```

### Debug Test Output

```typescript
// Add debug output to failing tests
it('should process data correctly', () => {
  const input = generateTestData();
  console.log('Test input:', JSON.stringify(input, null, 2));
  
  const result = processData(input);
  console.log('Test result:', JSON.stringify(result, null, 2));
  
  expect(result).toMatchExpectedStructure();
});
```

### VS Code Debugging

Configure VS Code for test debugging:

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Jest Tests",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "--detectOpenHandles"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen",
      "disableOptimisticBPs": true
    }
  ]
}
```

## Continuous Integration

### GitHub Actions (Future)

Example CI configuration:

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run type checking
      run: npm run typecheck
    
    - name: Run tests
      run: npm run test:coverage
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

### Pre-commit Hooks

Setup automatic testing before commits:

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run typecheck && npm test",
      "pre-push": "npm run test:coverage"
    }
  }
}
```

## Testing Best Practices

### 1. Test Structure
- Keep tests focused and independent
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Group related tests with describe blocks

### 2. Test Data
- Use the development seeding system for realistic data
- Create factory functions for test objects
- Use deterministic data (fixed seeds) for reproducible tests

### 3. Mocking Strategy
- Mock external dependencies, not internal logic
- Mock at the boundary of your system
- Prefer real implementations when possible

### 4. Assertions
- Use specific assertions (toBe vs toEqual)
- Test behavior, not implementation details
- Include edge cases and error scenarios

### 5. Maintenance
- Update tests when requirements change
- Remove or refactor obsolete tests
- Keep test code clean and readable

---

This testing guide provides comprehensive coverage of testing strategies, tools, and best practices for the Green Streak application. Follow these guidelines to maintain high code quality and confidence in the codebase.