# Development Setup Guide

*Created: January 3, 2026*  
*Last Modified: January 5, 2026*

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Development Environment](#development-environment)
4. [Development Tools](#development-tools)
5. [Code Organization](#code-organization)
6. [Adding New Features](#adding-new-features)
7. [Development Workflow](#development-workflow)
8. [Debugging](#debugging)
9. [Best Practices](#best-practices)
10. [Common Development Patterns](#common-development-patterns)

## Prerequisites

### Required Software

#### Node.js and npm
- **Node.js**: Version 18.x LTS or higher
- **npm**: Version 8.x or higher (comes with Node.js)

```bash
# Check versions
node --version    # Should be v18.x.x or higher
npm --version     # Should be 8.x.x or higher

# Install/update Node.js
# Visit https://nodejs.org/ for the latest LTS version
# Or use a version manager like nvm
```

#### Expo CLI
```bash
# Install Expo CLI globally
npm install -g @expo/cli

# Verify installation
expo --version
```

#### React Native Development Environment

**For iOS Development (macOS only):**
- Xcode 12.0 or later
- iOS Simulator
- Command Line Tools for Xcode

**For Android Development:**
- Android Studio
- Android SDK (API level 21 or higher)
- Android Emulator or physical device

**For Web Development:**
- Modern web browser (Chrome, Firefox, Safari)

### Optional Tools

#### Development Utilities
- **Git**: Version control
- **VS Code**: Recommended editor with React Native extensions
- **React DevTools**: Browser extension for debugging
- **Flipper**: Advanced debugging platform

#### VS Code Extensions
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.npm-intellisense"
  ]
}
```

## Installation

### 1. Clone and Setup

```bash
# Clone the repository
cd green-streak

# Install dependencies
npm install

# Verify installation
npm run typecheck
npm test
```

### 2. Environment Configuration

The app uses local SQLite storage and doesn't require external API keys. All configuration is handled through the development CLI and app settings.

### 3. Platform Setup

#### iOS Setup (macOS only)
```bash
# Install CocoaPods (if using React Native CLI)
sudo gem install cocoapods

# For Expo managed workflow, no additional setup needed
npx expo run:ios
```

#### Android Setup
```bash
# Ensure Android SDK is installed via Android Studio
# Create and start an Android emulator, or connect a physical device

# For Expo managed workflow
npx expo run:android
```

#### Web Setup
```bash
# No additional setup required
npx expo start --web
```

## Development Environment

### Development Scripts

```bash
# Start development server with realistic data
npm run dev                          # Default: 5 tasks, 30 days
npm run dev -- --tasks 10 --days 90 # Custom data volume
npm run dev -- --reset --verbose    # Clear data, debug logging

# Standard Expo commands
npm start                            # Start Expo development server
npm run ios                          # Start iOS simulator
npm run android                      # Start Android emulator
npm run web                          # Start web version

# Development tools
npm test                             # Run test suite
npm run test:watch                   # Watch mode for tests
npm run test:coverage                # Generate test coverage
npm run typecheck                    # TypeScript validation
npm run lint                         # ESLint analysis
```

### Development CLI

The custom development CLI (`/scripts/dev.js`) provides powerful data seeding capabilities:

#### CLI Options

```bash
# Basic usage
npm run dev                           # 5 tasks, 30 days (default)

# Custom configuration
npm run dev -- --tasks <number>      # Number of sample tasks (1-15)
npm run dev -- --days <number>       # Days of historical data (1-365)
npm run dev -- --reset               # Clear existing data first
npm run dev -- --seed <number>       # Random seed for reproducible data
npm run dev -- --verbose             # Enable debug logging

# Examples
npm run dev -- --tasks 3 --days 7    # Minimal data for quick testing
npm run dev -- --tasks 10 --days 90  # Extended testing scenario
npm run dev -- --reset --verbose     # Clean slate with detailed logging
npm run dev -- --seed 42             # Reproducible data generation
```

#### CLI Features

1. **Realistic Data Generation**: Creates habits with natural completion patterns
2. **Configurable Volume**: Adjust data size based on testing needs
3. **Reproducible Seeds**: Use fixed seeds for consistent test scenarios
4. **Automatic Cleanup**: Temporary files are cleaned up on exit
5. **Verbose Logging**: Detailed output for debugging data generation

### Environment Variables

While the app doesn't require external APIs, you can configure development behavior:

```bash
# .env.local (create if needed)
EXPO_PUBLIC_DEV_MODE=true          # Enable development features
EXPO_PUBLIC_LOG_LEVEL=DEBUG        # Set logging level
```

## Development Tools

### Logging System

The app includes a comprehensive logging system for debugging:

#### Log Categories
- **DATA**: Database operations, repository actions
- **UI**: User interactions, component lifecycle
- **STATE**: Store updates, state changes
- **NOTIF**: Notification system
- **PERF**: Performance monitoring
- **DEV**: Development tools, seeding
- **ERROR**: Error handling and recovery

#### Using the Logger

```typescript
import logger from '../utils/logger';

// Log with different levels and categories
logger.debug('UI', 'Component mounted', { componentName: 'HomeScreen' });
logger.info('DATA', 'Task created', { taskId: 'abc123', name: 'Exercise' });
logger.warn('STATE', 'Deprecated method used', { method: 'oldFunction' });
logger.error('DATA', 'Database query failed', { error: error.message });

// Configure logging level
logger.setLogLevel('DEBUG');  // Show all logs in development
```

### Development Seeding

Generate realistic test data for development and testing:

```typescript
import { runSeed } from '../utils/devSeed';

// Generate test data programmatically
await runSeed({
  tasks: 8,           // Create 8 different habits
  days: 60,           // 2 months of historical data
  reset: true,        // Clear existing data first
  seed: 12345,        // Reproducible data generation
  verbose: true       // Enable debug logging
});
```

#### Seeding Features

1. **Realistic Patterns**: Completion rates vary by task consistency and recency
2. **Multi-completion Support**: Some tasks can be completed multiple times per day
3. **Natural Variations**: Daily motivation affects completion probability
4. **Habit Diversity**: Different types of habits with appropriate completion patterns

### Database Inspection

During development, you can inspect the SQLite database:

```typescript
import { getDatabase } from '../database';

// Direct database access for debugging
const db = getDatabase();
const tasks = await db.getAllAsync('SELECT * FROM tasks ORDER BY created_at DESC');
const logs = await db.getAllAsync('SELECT * FROM logs WHERE date >= ? ORDER BY date DESC', '2026-01-01');
```

### Hot Reloading

The development server supports hot reloading for immediate feedback:

1. **Fast Refresh**: React components reload automatically on save
2. **State Preservation**: Component state is maintained during reloads when possible
3. **Error Recovery**: Development errors are displayed with clear stack traces
4. **Asset Reloading**: Images and other assets update without full reload

## Code Organization

### Project Structure

```
green-streak/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ContributionGraph/   # Main visualization
│   │   │   ├── LiveCalendar.tsx    # Enhanced calendar with views
│   │   │   ├── TimePeriodSelector.tsx # Animated selector
│   │   │   └── MonthMarker.tsx     # Month overlays
│   │   ├── HomeScreen/         # Home screen components
│   │   │   ├── TodayCard.tsx       # Date nav & quick add
│   │   │   └── TasksSection.tsx    # Task list
│   │   └── common/             # Shared primitives
│   ├── screens/             # Full-screen components
│   ├── hooks/               # Custom React hooks
│   │   ├── useTaskActions.ts       # Task operations
│   │   ├── useModalState.ts        # Modal management
│   │   └── useDateNavigation.ts    # Date handling
│   ├── services/            # Business logic layer
│   │   ├── DataService.ts          # Data operations
│   │   ├── ValidationService.ts    # Validation rules
│   │   └── ServiceRegistry.ts      # DI container
│   ├── store/               # Zustand state management
│   ├── database/            # SQLite and repositories
│   │   └── repositories/
│   │       ├── interfaces/         # Repository interfaces
│   │       ├── mocks/              # Mock implementations
│   │       └── RepositoryFactory.ts # DI factory
│   ├── utils/               # Helper functions
│   ├── theme/               # Design system
│   └── types/               # TypeScript definitions
├── tests/                   # Test files and utilities
├── docs/                    # Documentation
├── scripts/                 # Development scripts
└── assets/                  # Static assets
```

### File Naming Conventions

- **Components**: PascalCase with `.tsx` extension (`ContributionGraph.tsx`)
- **Utilities**: camelCase with `.ts` extension (`dateHelpers.ts`)
- **Constants**: UPPER_SNAKE_CASE (`SAMPLE_TASK_NAMES`)
- **Types**: PascalCase interfaces (`Task`, `ContributionData`)
- **Store files**: camelCase with descriptive suffix (`tasksStore.ts`)

### Import Organization

```typescript
// 1. External libraries
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// 2. Internal components and utilities
import { ContributionGraph } from '../components/ContributionGraph';
import { useTasksStore } from '../store/tasksStore';
import { colors, spacing } from '../theme';
import logger from '../utils/logger';

// 3. Types (if not inline)
import { Task, ContributionData } from '../types';
```

## Adding New Features

### Following Established Patterns

When adding new features, follow the layered architecture:

### 1. Adding a New Repository

```typescript
// 1. Define the interface
// src/database/repositories/interfaces/IAnalyticsRepository.ts
export interface IAnalyticsRepository {
  getTaskAnalytics(taskId: string, period: string): Promise<Analytics>;
  getOverallStats(): Promise<OverallStats>;
}

// 2. Implement the repository
// src/database/repositories/AnalyticsRepository.ts
import { IAnalyticsRepository } from './interfaces';
import { getDatabase } from '../';

export class AnalyticsRepository implements IAnalyticsRepository {
  async getTaskAnalytics(taskId: string, period: string) {
    const db = getDatabase();
    // Implementation
  }
}

// 3. Add to RepositoryFactory
// src/database/repositories/RepositoryFactory.ts
private _analyticsRepository: IAnalyticsRepository;

public getAnalyticsRepository(): IAnalyticsRepository {
  return this._analyticsRepository;
}

// 4. Create mock for testing
// src/database/repositories/mocks/MockAnalyticsRepository.ts
export class MockAnalyticsRepository implements IAnalyticsRepository {
  // Mock implementation
}
```

### 2. Adding a New Service

```typescript
// src/services/AnalyticsService.ts
import { repositoryFactory } from '../database/repositories/RepositoryFactory';
import logger from '../utils/logger';

export class AnalyticsService {
  private analyticsRepo = repositoryFactory.getAnalyticsRepository();
  
  async calculateStreakStats(taskId: string) {
    try {
      logger.debug('SERVICE', 'Calculating streak stats', { taskId });
      // Business logic here
      const data = await this.analyticsRepo.getTaskAnalytics(taskId, '30d');
      // Process and return
      return processedData;
    } catch (error) {
      logger.error('SERVICE', 'Failed to calculate streak', { error });
      throw error;
    }
  }
}

// Add to service registry
export const analyticsService = new AnalyticsService();
```

### 3. Adding a New Custom Hook

```typescript
// src/hooks/useAnalytics.ts
import { useCallback, useState, useEffect } from 'react';
import { getAnalyticsService } from '../services';
import logger from '../utils/logger';

export const useAnalytics = (taskId: string) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const service = getAnalyticsService();
      const data = await service.calculateStreakStats(taskId);
      setAnalytics(data);
    } catch (err) {
      logger.error('UI', 'Failed to load analytics', { error: err });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [taskId]);
  
  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);
  
  return { analytics, loading, error, refresh: loadAnalytics };
};
```

### 4. Adding a New Component

```typescript
// src/components/Analytics/StreakChart.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useAnalytics } from '../../hooks/useAnalytics';
import { colors, spacing } from '../../theme';

interface StreakChartProps {
  taskId: string;
  onClose: () => void;
}

export const StreakChart: React.FC<StreakChartProps> = ({ taskId }) => {
  const { analytics, loading, error } = useAnalytics(taskId);
  
  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  
  return (
    <Animated.View 
      entering={FadeIn}
      style={styles.container}
    >
      {/* Chart implementation */}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing[4],
    backgroundColor: colors.surface,
  },
});
```

### 5. Adding Store State

```typescript
// src/store/analyticsStore.ts
import { create } from 'zustand';
import { getAnalyticsService } from '../services';
import logger from '../utils/logger';

interface AnalyticsState {
  // State
  streakData: Map<string, StreakData>;
  loading: boolean;
  
  // Actions
  loadStreakData: (taskId: string) => Promise<void>;
  clearCache: () => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  streakData: new Map(),
  loading: false,
  
  loadStreakData: async (taskId: string) => {
    try {
      set({ loading: true });
      const service = getAnalyticsService();
      const data = await service.calculateStreakStats(taskId);
      
      const currentData = get().streakData;
      currentData.set(taskId, data);
      
      set({ streakData: new Map(currentData), loading: false });
      logger.info('STATE', 'Streak data loaded', { taskId });
    } catch (error) {
      logger.error('STATE', 'Failed to load streak data', { error });
      set({ loading: false });
      throw error;
    }
  },
  
  clearCache: () => {
    set({ streakData: new Map() });
    logger.debug('STATE', 'Analytics cache cleared');
  },
}));
```

### Component Creation Guidelines

1. **Props Interface First**: Define clear prop types
2. **Error Boundaries**: Wrap complex components
3. **Accessibility**: Include proper labels and roles
4. **Animation**: Use React Native Reanimated for smooth animations
5. **Styling**: Use theme constants for consistency

### State Management Patterns

1. **Store for Shared State**: Use Zustand stores for data shared across components
2. **Hooks for Logic**: Encapsulate complex logic in custom hooks
3. **Local State for UI**: Use useState for component-specific UI state
4. **Services for Business Logic**: Keep business rules in service layer

### Error Handling Patterns

```typescript
// At component level
try {
  await someOperation();
} catch (error) {
  // User-friendly feedback
  showToast('Operation failed. Please try again.');
  // Log for debugging
  logger.error('UI', 'Operation failed', { error });
}

// At service level
try {
  // Validate first
  if (!isValid(data)) {
    throw new ValidationError('Invalid data', ['field1', 'field2']);
  }
  // Perform operation
  return await repository.create(data);
} catch (error) {
  logger.error('SERVICE', 'Operation failed', { error, data });
  // Re-throw with context
  throw new ServiceError('Failed to create resource', error);
}
```

## Development Workflow

### 1. Feature Development

```bash
# Start development environment
npm run dev -- --tasks 5 --days 30

# Run tests in watch mode (in separate terminal)
npm run test:watch

# Monitor TypeScript (in separate terminal)
npm run typecheck --watch
```

### 2. Making Changes

1. **Plan**: Document the change in comments or documentation
2. **Implement**: Write the feature following existing patterns
3. **Test**: Add tests for new functionality
4. **Validate**: Run TypeScript checks and linting
5. **Document**: Update relevant documentation

### 3. Testing Changes

```bash
# Run full test suite
npm test

# Run specific test file
npm test -- dateHelpers.test.ts

# Generate coverage report
npm run test:coverage

# Test different data scenarios
npm run dev -- --tasks 15 --days 365  # Maximum data
npm run dev -- --tasks 1 --days 1     # Minimum data
```

### 4. Code Quality

```bash
# TypeScript validation
npm run typecheck

# Linting
npm run lint

# Fix auto-fixable issues
npm run lint --fix
```

## Debugging

### React Native Debugger

1. **Console Logging**: Use the logger utility for structured logging
2. **React DevTools**: Inspect component hierarchy and state
3. **Network Inspector**: Monitor network requests (if added)
4. **Performance Monitor**: Track rendering performance

### Debugging Database Issues

```typescript
// Enable verbose database logging
logger.setLogLevel('DEBUG');

// Inspect database state
import { getDatabase } from '../database';
const db = getDatabase();
const result = await db.getAllAsync('SELECT * FROM tasks');
console.log('Current tasks:', result);
```

### Debugging State Management

```typescript
// Zustand devtools (add to store configuration)
import { devtools } from 'zustand/middleware';

const useTasksStore = create(
  devtools(
    (set, get) => ({
      // store implementation
    }),
    { name: 'tasks-store' }
  )
);
```

### Common Debugging Scenarios

#### 1. Data Not Loading
```typescript
// Check store state
const { tasks, loading, error } = useTasksStore();
console.log({ tasks, loading, error });

// Check database directly
const allTasks = await TaskRepository.findAll();
console.log('Database tasks:', allTasks);
```

#### 2. Contribution Graph Issues
```typescript
// Inspect contribution data
const { contributionData } = useLogsStore();
console.log('Contribution data:', contributionData);

// Check date range
const dates = getAdaptiveRange(tasks.length);
console.log('Date range:', dates.length, 'days');
```

#### 3. Development Seeding Problems
```bash
# Clear data and reseed with verbose logging
npm run dev -- --reset --verbose --tasks 3 --days 7
```

## Best Practices

### Code Style

1. **TypeScript Strict Mode**: All code must pass strict type checking
2. **Functional Components**: Use function components with hooks
3. **Custom Hooks**: Extract complex logic into reusable hooks
4. **Error Boundaries**: Handle errors gracefully in UI components
5. **Interface-Based Design**: Define interfaces for all public contracts
6. **Repository Pattern**: All data access through repository interfaces

### Component Development

1. **Single Responsibility**: Each component has one clear purpose
2. **Props Interface**: Define clear, typed interfaces for all props
3. **Accessibility**: Include proper accessibility props and labels
4. **Performance**: Use React.memo() for expensive components

### State Management

1. **Zustand Stores**: Use stores for shared state across components
2. **Local State**: Use useState for component-specific state
3. **Derived State**: Use useMemo for computed values
4. **Side Effects**: Use useEffect for data fetching and subscriptions

### Database Operations

1. **Repository Pattern**: All database access through repository classes
2. **Error Handling**: Comprehensive error handling with logging
3. **Transactions**: Use transactions for multi-step operations
4. **Performance**: Proper indexing and efficient queries

### Testing

1. **Unit Tests**: Test individual functions and utilities
2. **Integration Tests**: Test component-store interactions
3. **Test Data**: Use the seeding system for consistent test data
4. **Coverage**: Maintain good test coverage for critical paths

### Documentation

1. **Code Comments**: Explain complex logic and business rules
2. **Type Definitions**: Use descriptive interface names and properties
3. **README Updates**: Keep documentation current with changes
4. **API Documentation**: Document public interfaces and their usage

### Git Workflow

1. **Commit Messages**: Clear, descriptive commit messages
2. **Branch Naming**: Use descriptive branch names
3. **Small Commits**: Make focused, atomic commits
4. **Code Review**: Review changes before merging

### Performance

1. **Bundle Analysis**: Monitor bundle size impact of new dependencies
2. **Image Optimization**: Optimize images and assets
3. **Lazy Loading**: Load components and data as needed
4. **Memory Management**: Proper cleanup of subscriptions and timers

## Common Development Patterns

### Repository Pattern Implementation

```typescript
// Define interface
interface IRepository<T> {
  getAll(): Promise<T[]>;
  getById(id: string): Promise<T | null>;
  create(data: Omit<T, 'id'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

// Implement repository
class ConcreteRepository implements IRepository<Entity> {
  // Implementation
}

// Use through factory
const repo = repositoryFactory.getRepository();
```

### Service Layer Pattern

```typescript
// Service orchestrates multiple repositories
class BusinessService {
  private repo1 = repositoryFactory.getRepo1();
  private repo2 = repositoryFactory.getRepo2();
  
  async complexOperation(params: Params): Promise<Result> {
    // Validate
    const validation = this.validate(params);
    if (!validation.isValid) throw new ValidationError(validation.errors);
    
    // Orchestrate
    const data1 = await this.repo1.getData();
    const data2 = await this.repo2.getData();
    
    // Business logic
    const result = this.processBusinessRules(data1, data2);
    
    // Return processed result
    return result;
  }
}
```

### Hook Composition Pattern

```typescript
// Compose multiple hooks for complex features
const useFeature = () => {
  const { data, loading } = useDataHook();
  const { modal, open, close } = useModalHook();
  const { validate, errors } = useValidationHook();
  
  const handleAction = useCallback(async () => {
    if (!validate(data)) return;
    // Perform action
    close();
  }, [data, validate, close]);
  
  return {
    data,
    loading,
    modal,
    errors,
    handleAction,
    openModal: open,
  };
};
```

### Animation Pattern with Reanimated

```typescript
// Consistent animation patterns
const useSlideAnimation = (isVisible: boolean) => {
  const translateX = useSharedValue(isVisible ? 0 : 100);
  
  useEffect(() => {
    translateX.value = withSpring(isVisible ? 0 : 100, {
      damping: 15,
      stiffness: 200,
    });
  }, [isVisible]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));
  
  return animatedStyle;
};
```

### Date Handling Pattern

```typescript
// Always work with standardized date formats
const handleDateOperation = (date?: string) => {
  // Default to today if not provided
  const targetDate = date || getTodayString();
  
  // Validate date format
  if (!isValidDateString(targetDate)) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD');
  }
  
  // Perform operation
  return processDate(targetDate);
};
```

### Testing Pattern

```typescript
// Test with dependency injection
describe('Feature', () => {
  let mockRepo: MockRepository;
  
  beforeEach(() => {
    mockRepo = new MockRepository();
    repositoryFactory.setRepository(mockRepo);
  });
  
  afterEach(() => {
    repositoryFactory.resetToDefaults();
  });
  
  it('should perform operation', async () => {
    // Arrange
    mockRepo.setData(testData);
    
    // Act
    const result = await service.operation();
    
    // Assert
    expect(result).toEqual(expectedResult);
  });
});
```

---

This development guide provides everything needed to set up, develop, and maintain the Green Streak application. Follow the established architectural patterns (repository pattern, service layer, custom hooks) to ensure consistent code quality and maintainability. The layered architecture enables easy testing, clear separation of concerns, and scalable feature development.