# Architecture Documentation

*Created: January 3, 2026*  
*Last Modified: January 3, 2026*

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow](#data-flow)
4. [Database Design](#database-design)
5. [State Management](#state-management)
6. [Design System](#design-system)
7. [Development Infrastructure](#development-infrastructure)
8. [Performance Considerations](#performance-considerations)

## System Architecture Overview

Green Streak follows a layered architecture pattern designed for maintainability, testability, and scalability within a React Native environment.

```
┌─────────────────────────────────────┐
│             Presentation            │
│     (Screens & Components)          │
├─────────────────────────────────────┤
│          State Management           │
│        (Zustand Stores)             │
├─────────────────────────────────────┤
│           Business Logic            │
│         (Repositories)              │
├─────────────────────────────────────┤
│            Data Layer               │
│         (SQLite Database)           │
├─────────────────────────────────────┤
│             Utilities               │
│   (Logging, DateHelpers, DevSeed)   │
└─────────────────────────────────────┘
```

### Architecture Principles

1. **Separation of Concerns**: Clear boundaries between presentation, business logic, and data
2. **Single Responsibility**: Each module has one clearly defined purpose
3. **Dependency Injection**: Repositories and utilities are injected rather than directly instantiated
4. **Type Safety**: TypeScript throughout with strict mode enabled
5. **Testability**: Architecture supports unit, integration, and UI testing

## Component Architecture

### Component Hierarchy

```
App
├── HomeScreen
│   ├── ContributionGraph
│   │   └── ContributionDay (multiple)
│   ├── TaskPreview (multiple)
│   └── Modal Components
│       ├── AddTaskScreen
│       └── DailyLogScreen
└── StatusBar
```

### Component Categories

#### 1. Screen Components
**Location**: `/src/screens/`
- **HomeScreen.tsx**: Main dashboard with contribution graph and task overview
- **AddTaskScreen.tsx**: Task creation and editing interface
- **DailyLogScreen.tsx**: Daily completion logging interface

**Responsibilities**:
- Orchestrate child components
- Manage screen-level state
- Handle navigation between modals
- Connect to Zustand stores for data

#### 2. Feature Components
**Location**: `/src/components/ContributionGraph/`
- **ContributionGraph.tsx**: Main graph visualization with adaptive scaling
- **ContributionDay.tsx**: Individual day representation with touch interactions

**Responsibilities**:
- Implement core habit tracking visualization
- Handle user interactions (day selection, scrolling)
- Adaptive layout based on data volume
- Performance optimization for large datasets

#### 3. Common Components
**Location**: `/src/components/common/`
- Reusable UI primitives (buttons, inputs, cards)
- Consistent styling through theme system
- Accessibility support

**Design Patterns**:
- **Compound Components**: For complex interactions like task cards
- **Render Props**: For flexible data presentation
- **Higher-Order Components**: For common behaviors like loading states

### Component Props Pattern

All components follow a consistent props interface:

```typescript
interface ComponentProps {
  // Required data
  data: DataType;
  
  // Event handlers
  onAction: (params: ActionParams) => void;
  
  // Optional configuration
  config?: ConfigOptions;
  
  // Styling overrides
  style?: StyleProp<ViewStyle>;
  
  // Accessibility
  accessible?: boolean;
  accessibilityLabel?: string;
}
```

## Data Flow

### Unidirectional Data Flow

```
User Interaction → Store Action → Repository → Database → Store Update → Component Re-render
```

### Example: Creating a New Task

1. **User**: Presses "Add Task" button in HomeScreen
2. **UI**: AddTaskScreen modal opens
3. **User**: Fills form and presses "Save"
4. **Store**: `tasksStore.createTask()` called with form data
5. **Repository**: `TaskRepository.create()` validates and inserts to database
6. **Database**: SQLite stores new task record
7. **Store**: Updates tasks array with new task
8. **UI**: HomeScreen re-renders with new task visible

### Store-to-Component Flow

```typescript
// Store updates trigger component re-renders
const { tasks, loadTasks } = useTasksStore();

// Effects handle data loading
useEffect(() => {
  loadTasks();
}, []);

// Components react to store changes
tasks.map(task => <TaskPreview key={task.id} task={task} />);
```

## Database Design

### Schema Overview

```sql
-- Core habit definitions
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#22c55e',
  is_multi_completion BOOLEAN DEFAULT FALSE,
  created_at TEXT NOT NULL,
  archived_at TEXT,
  reminder_enabled BOOLEAN DEFAULT FALSE,
  reminder_time TEXT,
  reminder_frequency TEXT
);

-- Daily completion tracking
CREATE TABLE logs (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  date TEXT NOT NULL,             -- YYYY-MM-DD format
  count INTEGER DEFAULT 0,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id),
  UNIQUE(task_id, date)           -- One log per task per day
);

-- Application settings
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

### Indexing Strategy

```sql
-- Performance optimizations for common queries
CREATE INDEX idx_logs_date ON logs(date);
CREATE INDEX idx_logs_task_date ON logs(task_id, date);
CREATE INDEX idx_tasks_created ON tasks(created_at);
```

### Data Access Patterns

1. **Task Queries**: Primarily by creation date (newest first) and archive status
2. **Log Queries**: Date range queries for contribution graph data
3. **Settings**: Key-value lookups for app configuration

## State Management

### Zustand Store Design

Green Streak uses Zustand for lightweight, performant state management without boilerplate.

#### Tasks Store (`/src/store/tasksStore.ts`)

```typescript
interface TasksState {
  // State
  tasks: Task[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadTasks: () => Promise<void>;
  createTask: (data: TaskData) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task>;
  archiveTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  getTaskById: (id: string) => Task | undefined;
}
```

#### Logs Store (`/src/store/logsStore.ts`)

```typescript
interface LogsState {
  // Contribution graph data
  contributionData: ContributionData[];
  
  // Actions
  loadContributionData: (forceRefresh?: boolean) => Promise<void>;
  updateTaskLog: (taskId: string, date: string, count: number) => Promise<void>;
  getLogsForDate: (date: string) => ContributionData | undefined;
}
```

### State Update Patterns

1. **Optimistic Updates**: UI updates immediately, reverts on error
2. **Loading States**: Clear feedback during async operations
3. **Error Handling**: Graceful degradation with user-friendly messages
4. **Cache Invalidation**: Smart refresh strategies to minimize database queries

## Design System

### Theme Architecture

The design system is inspired by US Graphics aesthetics with a focus on clean, minimal design.

#### Color System (`/src/theme/colors.ts`)

```typescript
export const colors = {
  // Base palette
  primary: '#22c55e',      // GitHub green
  background: '#fefefe',    // Warm white (eggshell)
  surface: '#f8f8f8',     // Subtle background
  
  // Semantic colors
  text: {
    primary: '#1f2937',     // Near black
    secondary: '#6b7280',   // Medium gray
    inverse: '#ffffff',     // White on colored backgrounds
  },
  
  // Interactive states
  interactive: {
    default: '#f3f4f6',     // Light gray
    hover: '#e5e7eb',       // Darker gray
    active: '#d1d5db',      // Active state
  },
  
  // Status colors
  success: '#10b981',       // Green
  warning: '#f59e0b',       // Amber
  error: '#ef4444',         // Red
  info: '#3b82f6',         // Blue
  
  // Contribution graph gradients
  contribution: {
    none: '#f3f4f6',        // No activity
    low: '#c6e6c3',         // Light green
    medium: '#7bc96f',      // Medium green
    high: '#239a3b',        // Dark green
    highest: '#196127',     // Darkest green
  },
};
```

#### Typography System (`/src/theme/typography.ts`)

```typescript
export const textStyles = {
  h1: { fontSize: 32, fontWeight: '700', lineHeight: 40 },
  h2: { fontSize: 24, fontWeight: '600', lineHeight: 32 },
  h3: { fontSize: 20, fontWeight: '600', lineHeight: 28 },
  body: { fontSize: 16, fontWeight: '400', lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: '400', lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '600', lineHeight: 24 },
  buttonSmall: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
};
```

#### Spacing System (`/src/theme/spacing.ts`)

```typescript
export const spacing = {
  1: 4,    // 0.25rem
  2: 8,    // 0.5rem
  3: 12,   // 0.75rem
  4: 16,   // 1rem
  5: 20,   // 1.25rem
  6: 24,   // 1.5rem
  8: 32,   // 2rem
  10: 40,  // 2.5rem
  12: 48,  // 3rem
  16: 64,  // 4rem
};
```

## Development Infrastructure

### Logging System

Comprehensive logging system for debugging and monitoring (`/src/utils/logger.ts`):

#### Log Categories
- **DATA**: Database operations, repository actions
- **UI**: User interactions, component lifecycle
- **STATE**: Store updates, state changes
- **NOTIF**: Notification system
- **PERF**: Performance monitoring
- **DEV**: Development tools, seeding
- **ERROR**: Error handling and recovery

#### Log Levels
- **DEBUG**: Detailed development information
- **INFO**: General application flow
- **WARN**: Potential issues that don't break functionality
- **ERROR**: Errors that affect functionality
- **FATAL**: Critical errors that may crash the app

### Development Seeding

Realistic test data generation system (`/src/utils/devSeed.ts`):

#### Features
- **Configurable Parameters**: Tasks count, historical days, random seed
- **Realistic Patterns**: Completion rates vary by recency and task consistency
- **Reproducible Data**: Seeded random generation for consistent testing
- **CLI Integration**: Command-line interface for easy configuration

#### Usage Patterns
```bash
# Basic development with realistic data
npm run dev -- --tasks 5 --days 30

# Extended testing with more data
npm run dev -- --tasks 10 --days 90

# Reproducible testing scenarios
npm run dev -- --seed 12345 --reset
```

### Testing Infrastructure

Jest-based testing with TypeScript support:

#### Test Categories
1. **Unit Tests**: Individual functions and utilities
2. **Integration Tests**: Store and repository interactions
3. **Component Tests**: React Native component behavior
4. **End-to-End Tests**: Complete user workflows (planned)

#### Coverage Requirements
- Utilities: 90%+ coverage required
- Repositories: 85%+ coverage required
- Components: 70%+ coverage required
- Stores: 80%+ coverage required

## Performance Considerations

### Database Optimization

1. **Indexes**: Strategic indexing on commonly queried columns
2. **Query Patterns**: Efficient date range queries for contribution data
3. **Batch Operations**: Minimize database round trips
4. **Connection Management**: Proper SQLite connection handling

### UI Performance

1. **FlatList Usage**: Virtualized lists for large datasets
2. **Memoization**: React.memo() for expensive components
3. **Lazy Loading**: Load data as needed
4. **Image Optimization**: Proper asset loading and caching

### State Management Performance

1. **Selective Subscriptions**: Components subscribe only to needed state slices
2. **Computed Values**: Memoized derived state
3. **Update Batching**: Group related updates together
4. **Memory Management**: Proper cleanup of subscriptions

### Bundle Size Management

1. **Tree Shaking**: Remove unused code from production builds
2. **Code Splitting**: Lazy load screens and features
3. **Dependency Analysis**: Monitor third-party package impact
4. **Asset Optimization**: Compress images and minimize assets

---

This architecture supports a scalable, maintainable habit tracking application while providing excellent developer experience and user performance. The layered design allows for easy testing, modification, and extension as requirements evolve.