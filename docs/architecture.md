# Architecture Documentation

*Created: January 3, 2026*  
*Last Modified: January 9, 2026*

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Layered Architecture](#layered-architecture)
3. [Repository Pattern](#repository-pattern)
4. [Service Layer](#service-layer)
5. [Custom Hooks Architecture](#custom-hooks-architecture)
6. [Component Architecture](#component-architecture)
7. [Data Flow](#data-flow)
8. [Database Design](#database-design)
9. [State Management](#state-management)
10. [Design System](#design-system)
11. [Animation System](#animation-system)
12. [Development Infrastructure](#development-infrastructure)
13. [Performance Considerations](#performance-considerations)
14. [Error Handling Architecture](#error-handling-architecture)

## System Architecture Overview

Green Streak follows a layered architecture pattern designed for maintainability, testability, and scalability within a React Native environment.

```
┌─────────────────────────────────────────────────────┐
│                 UI Layer                            │
│         (Screens & Components)                      │
├─────────────────────────────────────────────────────┤
│              Custom Hooks Layer                     │
│   (useTaskActions, useModalState, etc.)            │
├─────────────────────────────────────────────────────┤
│              State Management                       │
│           (Zustand Stores)                         │
├─────────────────────────────────────────────────────┤
│              Service Layer                         │
│    (DataService, ValidationService, etc.)          │
├─────────────────────────────────────────────────────┤
│            Repository Layer                        │
│      (Interfaces & Implementations)                │
├─────────────────────────────────────────────────────┤
│             Database Layer                         │
│         (SQLite with Expo SQLite)                  │
├─────────────────────────────────────────────────────┤
│         Cross-Cutting Concerns                     │
│   (Logging, Error Boundaries, Utils)               │
└─────────────────────────────────────────────────────┘
```

### Architecture Principles

1. **Separation of Concerns**: Clear boundaries between presentation, business logic, and data
2. **Single Responsibility**: Each module has one clearly defined purpose
3. **Dependency Injection**: Factory pattern for repository injection enabling easy testing and mocking
4. **Interface-Based Design**: Repository pattern with interfaces for loose coupling
5. **Type Safety**: TypeScript throughout with strict mode enabled
6. **Testability**: Architecture supports unit, integration, and UI testing
7. **Error Resilience**: Multiple layers of error boundaries and graceful degradation
8. **Performance First**: Optimistic updates, caching strategies, and efficient re-renders

## Layered Architecture

### Overview

Green Streak implements a robust layered architecture that enforces clean separation of concerns and promotes maintainability, testability, and scalability.

### Layer Responsibilities

#### 1. UI Layer
- **Location**: `/src/screens/`, `/src/components/`
- **Responsibilities**:
  - Render visual components
  - Handle user interactions
  - Delegate business logic to hooks
  - Display data from stores
  - Manage local UI state only

#### 2. Custom Hooks Layer
- **Location**: `/src/hooks/`
- **Responsibilities**:
  - Encapsulate reusable UI logic
  - Coordinate between UI and services
  - Manage complex state interactions
  - Provide clean APIs to components
  - Handle side effects

#### 3. State Management Layer
- **Location**: `/src/store/`
- **Responsibilities**:
  - Centralized application state
  - State synchronization across components
  - Caching strategies
  - Optimistic updates
  - State persistence coordination

#### 4. Service Layer
- **Location**: `/src/services/`
- **Responsibilities**:
  - Business logic implementation
  - Data validation
  - Complex calculations (streaks, analytics)
  - Orchestration of multiple repositories
  - Error handling and recovery

#### 5. Repository Layer
- **Location**: `/src/database/repositories/`
- **Responsibilities**:
  - Data access abstraction
  - CRUD operations
  - Query optimization
  - Database transaction management
  - Data transformation

#### 6. Database Layer
- **Location**: `/src/database/`
- **Responsibilities**:
  - Schema definition
  - Migration management
  - Direct database operations
  - Connection pooling
  - Query execution

### Data Flow Example with TaskService

```typescript
// Example 1: Creating a New Task
// 1. User fills form and clicks "Save" in EditTaskModal
<TouchableOpacity onPress={() => handleSave(formData)}>

// 2. Store action delegates to TaskService
const { createTask } = useTasksStore();
await createTask(formData);

// 3. Store calls TaskService
const taskService = getTaskService();
const task = await taskService.createTask(taskData);

// 4. TaskService validates via ValidationService
const validation = validationService.validateTask(taskData);
if (!validation.isValid) throw new Error(validation.errors);

// 5. TaskService creates task via Repository
const task = await this.taskRepository.create(taskData);

// 6. TaskService schedules notifications if enabled
if (task.reminderEnabled) {
  await notificationService.scheduleTaskReminder(task);
}

// 7. Store updates state and UI re-renders
set(state => ({ 
  tasks: [task, ...state.tasks]
}));

// Example 2: Quick Add Completion
// 1. User clicks "Quick Add" in UI
<TouchableOpacity onPress={() => handleQuickAdd(task.id)}>

// 2. Custom Hook handles the action
const { handleQuickAdd } = useTaskActions();

// 3. Hook uses DataService for log operations
const dataService = getDataService();
await dataService.logTaskCompletion(taskId, date, count);

// 4. DataService validates and uses Repository
const validation = validationService.validateTaskLog(data);
await this.logRepository.createOrUpdate(taskId, date, count);

// 5. Repository executes database operation
const result = await db.runAsync(
  'INSERT OR REPLACE INTO logs...', 
  [taskId, date, count]
);

// 6. Store updates and notifies UI
set({ contributionData: updatedData });
```

## Repository Pattern

### Overview

The repository pattern provides an abstraction layer between the business logic and data access logic, enabling:
- Easy testing with mock implementations
- Database technology independence
- Centralized query logic
- Consistent data access patterns

### Interface Design

```typescript
// Interface definition
export interface ITaskRepository {
  getAll(): Promise<Task[]>;
  getById(id: string): Promise<Task | null>;
  create(data: Omit<Task, 'id' | 'createdAt'>): Promise<Task>;
  update(id: string, data: Partial<Task>): Promise<Task>;
  archive(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}

// Concrete implementation
export class TaskRepository implements ITaskRepository {
  async getAll(): Promise<Task[]> {
    // SQLite implementation
  }
}

// Mock for testing
export class MockTaskRepository implements ITaskRepository {
  private tasks: Task[] = [];
  
  async getAll(): Promise<Task[]> {
    return [...this.tasks];
  }
}
```

### Repository Factory Pattern

```typescript
export class RepositoryFactory {
  private static _instance: RepositoryFactory;
  
  public static getInstance(): RepositoryFactory {
    if (!RepositoryFactory._instance) {
      RepositoryFactory._instance = new RepositoryFactory();
    }
    return RepositoryFactory._instance;
  }
  
  public getTaskRepository(): ITaskRepository {
    return this._taskRepository;
  }
  
  // For testing - inject mocks
  public setTaskRepository(repo: ITaskRepository): void {
    this._taskRepository = repo;
  }
}
```

### Benefits

1. **Testability**: Easily swap implementations for testing
2. **Flexibility**: Change database without affecting business logic
3. **Consistency**: Standardized data access patterns
4. **Maintainability**: Centralized query logic
5. **Type Safety**: Interfaces ensure contract compliance

## Service Layer

### Overview

The service layer encapsulates business logic and orchestrates operations across multiple repositories. With the introduction of TaskService, the architecture now provides a cleaner separation between state management (stores) and data access (repositories).

### Key Services

#### TaskService
- **Purpose**: Centralized task management with business logic encapsulation
- **Location**: `/src/services/TaskService.ts`
- **Key Methods**:
  - `getAllTasks()`: Retrieves active (non-archived) tasks
  - `createTask()`: Creates tasks with validation and notification scheduling
  - `updateTask()`: Updates tasks with validation and notification sync
  - `archiveTask()`: Soft delete with notification cleanup
  - `deleteTask()`: Permanent deletion with full cleanup
  - `restoreTask()`: Unarchive tasks and restore notifications
  - `validateTask()`: Delegate validation to ValidationService
  - `getTasksWithRecentActivity()`: Analyze task activity patterns
- **Factory Pattern**: Uses `createTaskService()` for dependency injection
- **Key Features**:
  - Integrated validation via ValidationService
  - Automatic notification scheduling/cancellation
  - Comprehensive error handling and logging
  - Non-throwing notification failures (graceful degradation)

#### DataService
- **Purpose**: High-level data operations across multiple entities
- **Location**: `/src/services/DataService.ts`
- **Key Methods**:
  - `getTasksWithRecentActivity()`: Combines task and log data
  - `calculateCurrentStreak()`: Complex streak calculations
  - `logTaskCompletion()`: Validates and logs completions

#### ValidationService
- **Purpose**: Business rule validation
- **Location**: `/src/services/ValidationService.ts`
- **Key Methods**:
  - `validateTask()`: Task creation/update validation
  - `validateTaskLog()`: Log entry validation
  - `validateDateRange()`: Date range validation

#### ServiceRegistry
- **Purpose**: Service dependency injection and lifecycle management
- **Location**: `/src/services/ServiceRegistry.ts`
- **Pattern**: Singleton with lazy initialization
- **Key Features**:
  - Centralized service registration
  - Health check monitoring
  - Dependency injection for all services
  - Service discovery and retrieval

### Service Registry Implementation

```typescript
// ServiceRegistry registers and manages all services
export class ServiceRegistry {
  private services: Map<string, any> = new Map();
  
  // Register TaskService with dependencies
  private registerDefaultServices(): void {
    const taskRepository = repositoryFactory.getTaskRepository();
    const taskService = createTaskService(taskRepository, validationService);
    
    this.register('task', taskService);
    this.register('data', dataService);
    this.register('validation', validationService);
    this.register('notification', notificationService);
  }
  
  // Get services with type safety
  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) throw new Error(`Service '${name}' not found`);
    return service as T;
  }
  
  // Health monitoring
  getHealthStatus(): ServiceHealthStatus {
    // Check each service's health
    for (const serviceName of this.getRegisteredServices()) {
      try {
        const service = this.get(serviceName);
        healthStatus.services[serviceName] = { status: 'healthy' };
      } catch (error) {
        healthStatus.services[serviceName] = { status: 'unhealthy', error };
      }
    }
    return healthStatus;
  }
}

// Convenient service getters
export const getTaskService = () => serviceRegistry.get('task');
export const getDataService = () => serviceRegistry.get('data');
```

### Service Abstraction Layer Pattern

The introduction of TaskService establishes a robust Service Abstraction Layer that decouples the presentation/state layer from the data layer:

#### Architecture Evolution

**Before TaskService (Direct Repository Access):**
```
Store → Repository → Database
```

**After TaskService (Service Abstraction):**
```
Store → TaskService → Repository → Database
         ↓
   ValidationService
         ↓
   NotificationService
```

#### Key Benefits of Service Abstraction

1. **Separation of Concerns**: 
   - Stores focus solely on state management
   - Services handle all business logic
   - Repositories manage data persistence

2. **Orchestration**: 
   - TaskService coordinates multiple services (validation, notifications)
   - Complex operations are atomic and consistent

3. **Testability**: 
   - Services can be mocked independently
   - Business logic testing separated from UI/state testing

4. **Maintainability**: 
   - Changes to business rules only affect service layer
   - Repository changes don't impact stores directly

### Service Layer Benefits

1. **Business Logic Centralization**: All business rules in one layer
2. **Repository Coordination**: Orchestrate multiple data sources
3. **Validation**: Consistent validation across the app
4. **Error Handling**: Centralized error recovery
5. **Performance**: Caching and optimization strategies
6. **Notification Management**: Automated scheduling and cleanup
7. **Health Monitoring**: Service-level health checks

### TaskService: Benefits and Limitations

#### Benefits

1. **Encapsulation of Business Logic**
   - All task-related business rules centralized in one service
   - Validation integrated seamlessly
   - Notification lifecycle managed automatically

2. **Improved Error Handling**
   - Consistent error messages and logging
   - Graceful degradation for non-critical failures (notifications)
   - Comprehensive validation before operations

3. **Simplified Store Implementation**
   - Stores delegate complex logic to TaskService
   - Cleaner, more focused state management code
   - Reduced coupling between UI state and business logic

4. **Enhanced Testability**
   - Mock TaskService for store testing
   - Test business logic independently
   - Clear separation of concerns

5. **Notification Coordination**
   - Automatic scheduling on task creation
   - Sync notifications on task updates
   - Clean up notifications on archive/delete

#### Current Limitations

1. **Incomplete Activity Tracking**
   - `getTasksWithRecentActivity()` is a placeholder
   - Needs integration with LogRepository for actual activity data
   - Currently returns all active tasks regardless of activity

2. **Limited Batch Operations**
   - No bulk create/update/delete methods
   - Each operation is atomic, no transaction support across multiple tasks
   
3. **Missing Advanced Features**
   - No task templates or presets
   - No task dependencies or relationships
   - No recurring task patterns beyond basic reminders

#### Future Enhancements

1. **Activity Analytics Integration**
   ```typescript
   async getTasksWithRecentActivity(days: number): Promise<TaskWithActivity[]> {
     const tasks = await this.getAllTasks();
     const logs = await this.logRepository.getRecentLogs(days);
     return this.mergeTasksWithActivity(tasks, logs);
   }
   ```

2. **Batch Operations Support**
   ```typescript
   async bulkUpdate(updates: Array<{id: string, data: UpdateTaskData}>): Promise<Task[]> {
     return await this.taskRepository.transaction(async () => {
       return Promise.all(updates.map(u => this.updateTask(u.id, u.data)));
     });
   }
   ```

3. **Task Templates**
   ```typescript
   async createFromTemplate(templateId: string, overrides?: Partial<Task>): Promise<Task> {
     const template = await this.getTemplate(templateId);
     return this.createTask({ ...template, ...overrides });
   }
   ```

## Custom Hooks Architecture

### Overview

Custom hooks provide reusable logic that bridges the gap between UI components and the service/state layers.

### Core Hooks

#### useTaskActions
- **Purpose**: Task-related operations
- **Key Functions**:
  - `handleQuickAdd(taskId, date?)`: Add completion with date support
  - `handleQuickRemove(taskId, date?)`: Remove completion
  - `refreshAllData()`: Refresh tasks and contributions

#### useModalState
- **Purpose**: Modal state management
- **Key Functions**:
  - `openAddTask()`, `closeAddTask()`
  - `openEditTask(task)`, `closeAllModals()`
  - Centralized modal state

#### useDateNavigation
- **Purpose**: Date selection and navigation
- **Key Functions**:
  - `handleDateChange(date)`: Update selected date
  - `navigateDate(direction)`: Navigate prev/next
  - `navigateToToday()`: Return to current date

#### useContributionData
- **Purpose**: Contribution graph data management
- **Key Functions**:
  - Data loading and caching
  - Date range management
  - Performance optimizations

### Hook Design Patterns

```typescript
// Encapsulate complex logic
export const useTaskActions = (): UseTaskActionsReturn => {
  const { loadTasks } = useTasksStore();
  const { logTaskCompletion } = useLogsStore();
  
  const handleQuickAdd = useCallback(async (taskId: string, date?: string) => {
    const targetDate = date || getTodayString();
    
    // Use service layer
    const dataService = getDataService();
    const currentLog = await dataService.getLogForTaskAndDate(taskId, targetDate);
    
    // Validate
    const validationService = getValidationService();
    const validation = validationService.validateTaskLog({...});
    
    // Execute
    await logTaskCompletion(taskId, targetDate, newCount);
    
    // Refresh with expanded date range
    await loadContributionData(true, targetDate);
  }, [logTaskCompletion, loadContributionData]);
  
  return { handleQuickAdd, ... };
};
```

## Component Architecture

### Component Hierarchy

```
App
├── HomeScreen
│   ├── ContributionGraph
│   │   └── ContributionDay (multiple)
│   ├── TaskPreview (multiple)
│   └── Modal Components
│       ├── EditTaskModal
│       └── DailyLogScreen
└── StatusBar
```

### Component Categories

#### 1. Screen Components
**Location**: `/src/screens/`
- **HomeScreen.tsx**: Main dashboard with contribution graph and task overview
- **EditTaskModal.tsx**: Task creation and editing interface
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

## Modal Architecture

### Overview

Modal components in Green Streak follow a consistent architecture pattern that ensures proper scrolling behavior, accessibility, and performance. This architecture was refined during the EditTaskModal implementation to resolve scrolling issues.

### Modal Structure Pattern

#### The One Proven Modal Implementation

After extensive debugging, there is exactly ONE pattern that works reliably for all modals. **The key insight: backdrop and content must be siblings, not parent-child.**

```typescript
// HomeScreen.tsx - Modal Container (Works for ALL modal types)
<Modal transparent visible={showModal} animationType="slide" statusBarTranslucent>
  <View 
    style={{
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end'
    }}
  >
    {/* Backdrop as sibling - only handles backdrop clicks */}
    <Pressable 
      style={{ flex: 1 }} 
      onPress={closeModal} 
    />
    
    {/* Content as sibling - receives all touch events freely */}
    <Animated.View 
      style={{
        backgroundColor: colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '85%',
        minHeight: 400
        /* Add transform animations here if needed */
      }}
    >
      {/* Swipe handle */}
      <View style={styles.handle} />
      
      <ModalScreen onClose={closeModal} />
    </Animated.View>
  </View>
</Modal>

// Modal Screen Component (same for all)
const ModalScreen = ({ onClose }) => (
  <SafeAreaView style={styles.container}>
    {/* Fixed header outside ScrollView */}
    <View style={styles.header}>
      <TouchableOpacity onPress={onClose}>
        <Text>Cancel</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Modal Title</Text>
      <TouchableOpacity onPress={handleSave}>
        <Text>Save</Text>
      </TouchableOpacity>
    </View>
    
    {/* Scrollable content */}
    <ScrollView 
      style={styles.scrollView} 
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Modal content */}
    </ScrollView>
  </SafeAreaView>
);
```

### Architecture Principles

#### 1. Touch Event Handling
- **Backdrop and content must be siblings** - this is the fundamental requirement  
- **Use `Pressable` for the backdrop** to close modal when clicking outside
- **Use `Animated.View` for content** to preserve touch event handling
- **ScrollView must receive touch events from any area** for proper scrolling

#### 🚫 NEVER Do These Things (Hard-Learned Lessons)

**NEVER make backdrop the parent of content:**
- Wrapping content in `<Pressable onPress={closeModal}>` breaks scrolling
- Touch events bubble up from child to parent, closing the modal unexpectedly

**NEVER add unnecessary Pressable wrappers:**
- Adding `<Pressable onPress={() => {}}>` inside working modals breaks touch handling
- If a modal scrolls properly, don't add "fixes" that break it

**NEVER use stopPropagation on modal content:**
- `onTouchStart={(e) => e.stopPropagation()}` interferes with ScrollView
- The sibling structure eliminates the need for event stopping

**NEVER change working modal structure without testing:**
- If Settings modal works perfectly, use the exact same pattern
- Don't "improve" working code without verification

#### 2. Layout Structure
- **SafeAreaView** as the root container for proper safe area handling
- **Fixed header outside ScrollView** to prevent header from scrolling away
- **ScrollView with `contentContainerStyle`** for proper content padding and layout

#### 3. Performance Considerations
- Use `React.memo()` for modal screens to prevent unnecessary re-renders
- Implement proper cleanup in `useEffect` hooks
- Use `useCallback` for event handlers to prevent recreation

### Common Pitfalls and Solutions

#### ❌ Problem: Scrolling Only Works from Interactive Elements

```typescript
// This pattern blocks scrolling from background areas
<Pressable onPress={(e) => e.stopPropagation()}>
  <ScrollView>
    {/* Content - scrolling will only work when dragging from buttons/inputs */}
  </ScrollView>
</Pressable>
```

**Root Cause**: Without event propagation prevention, touches inside modal content bubble up to the backdrop `Pressable`, causing unwanted modal closure.

**✅ Solution**: Use `Pressable` with empty handler for content containers:

```typescript
<Pressable onPress={() => {}}>
  <ScrollView>
    {/* Content - scrolling works from any touch area, but doesn't close modal */}
  </ScrollView>
</Pressable>
```

#### ❌ Problem: Header Disappears When Scrolling

```typescript
// Header inside ScrollView causes it to scroll away
<ScrollView>
  <View style={styles.header}>
    {/* Header content */}
  </View>
  {/* Body content */}
</ScrollView>
```

**✅ Solution**: Keep header outside ScrollView:

```typescript
<SafeAreaView>
  <View style={styles.header}>
    {/* Fixed header */}
  </View>
  <ScrollView>
    {/* Body content */}
  </ScrollView>
</SafeAreaView>
```

### Modal State Management

Modal state is managed through the `useModalState` hook, providing centralized control:

```typescript
export const useModalState = (): UseModalStateReturn => {
  const [showAddTask, setShowAddTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  const openAddTask = useCallback(() => {
    setEditingTask(null);
    setShowAddTask(true);
  }, []);
  
  const openEditTask = useCallback((task: Task) => {
    setEditingTask(task);
    setShowAddTask(true);
  }, []);
  
  const closeAddTask = useCallback(() => {
    setShowAddTask(false);
    setEditingTask(null);
  }, []);
  
  return {
    showAddTask,
    editingTask,
    openAddTask,
    openEditTask,
    closeAddTask,
  };
};
```

### Animation Integration

Modals integrate with React Native Reanimated for smooth transitions:

```typescript
// Custom animated modal opening
const handleModalOpen = useCallback(() => {
  openModal();
  
  // Background fade in
  Animated.timing(backgroundOpacity, {
    toValue: 1,
    duration: 200,
    useNativeDriver: true,
  }).start(() => {
    // Content slide up
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  });
}, []);
```

### Accessibility Support

All modals include proper accessibility support:

```typescript
<Modal
  transparent
  visible={showModal}
  animationType="slide"
  statusBarTranslucent
  accessibilityViewIsModal={true}
>
  <View
    accessibilityRole="dialog"
    accessibilityLabel="Task creation modal"
  >
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel="Close modal"
      accessibilityHint="Closes the task creation screen"
      onPress={onClose}
    >
      <Text>Cancel</Text>
    </TouchableOpacity>
  </View>
</Modal>
```

### Error Boundaries

Each modal includes error boundary protection:

```typescript
<ScreenErrorBoundary 
  screenName="Add Task"
  onClose={closeModal}
  onRetry={() => {
    closeModal();
    setTimeout(() => openModal(), 100);
  }}
>
  <EditTaskModal onClose={closeModal} />
</ScreenErrorBoundary>
```

### Testing Strategies

Modal testing focuses on behavior and accessibility:

```typescript
describe('EditTaskModal', () => {
  it('should scroll from any touch area', () => {
    // Test scrolling from background areas
  });
  
  it('should maintain fixed header during scroll', () => {
    // Test header position during scroll
  });
  
  it('should handle keyboard interactions properly', () => {
    // Test form interactions with virtual keyboard
  });
});
```

This modal architecture ensures consistent behavior, accessibility compliance, and maintainable code across all modal implementations in Green Streak.

## Data Flow

### Unidirectional Data Flow

```
User Interaction → Store Action → Repository → Database → Store Update → Component Re-render
```

### Example: Creating a New Task

1. **User**: Presses "Add Task" button in HomeScreen
2. **UI**: EditTaskModal modal opens
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

## Animation System

### Overview

Green Streak uses React Native Reanimated 2 for performant, native-driven animations that run on the UI thread.

### Key Animation Components

#### TimePeriodSelector
- **Golden Highlight Slider**: Animated background that slides behind selected period
- **Spring Animations**: Smooth transitions with customizable physics
- **Implementation**:
  ```typescript
  const highlightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: highlightPosition.value }],
    width: highlightWidth.value,
  }));
  
  // Spring configuration
  withSpring(layout.x, {
    damping: 15,
    stiffness: 200,
  });
  ```

#### LiveCalendar
- **Staggered Entry Animations**: Days fade in with cascading delays
- **View Transitions**: Smooth transitions between time periods
- **Implementation**:
  ```typescript
  entering={FadeInDown.delay(weekIndex * 50).springify()}
  ```

### Animation Patterns

1. **Shared Values**: Use `useSharedValue` for values that drive animations
2. **Animated Styles**: Use `useAnimatedStyle` for dynamic style updates
3. **Spring Physics**: Consistent spring configuration across the app
4. **Performance**: Animations run on UI thread, not blocking JS thread

### Animation Guidelines

1. **Duration**: Keep animations under 300ms for responsive feel
2. **Easing**: Use spring animations for natural movement
3. **Staggering**: Use delays for complex multi-element animations
4. **Feedback**: Provide immediate visual feedback for user actions
5. **Accessibility**: Respect reduced motion preferences

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
2. **Service Tests**: Business logic and service orchestration  
3. **Integration Tests**: Store and repository interactions
4. **Component Tests**: React Native component behavior
5. **End-to-End Tests**: Complete user workflows (planned)

#### TaskService Testing Pattern

```typescript
// Mock dependencies for isolated testing
const createMockTaskRepository = (): jest.Mocked<ITaskRepository> => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  archive: jest.fn(),
  delete: jest.fn(),
});

const createMockValidationService = (): jest.Mocked<ValidationService> => ({
  validateTask: jest.fn(),
  validateTaskLog: jest.fn(),
});

// Test TaskService in isolation
describe('TaskService', () => {
  let taskService: TaskService;
  let mockTaskRepository: jest.Mocked<ITaskRepository>;
  let mockValidationService: jest.Mocked<ValidationService>;
  
  beforeEach(() => {
    mockTaskRepository = createMockTaskRepository();
    mockValidationService = createMockValidationService();
    taskService = new TaskService(mockTaskRepository, mockValidationService);
  });
  
  it('should create task with validation and notifications', async () => {
    // Setup mocks
    mockValidationService.validateTask.mockReturnValue({
      isValid: true,
      errors: [],
      warnings: []
    });
    
    mockTaskRepository.create.mockResolvedValue(mockTask);
    
    // Execute
    const result = await taskService.createTask(taskData);
    
    // Verify
    expect(mockValidationService.validateTask).toHaveBeenCalledWith(taskData);
    expect(mockTaskRepository.create).toHaveBeenCalledWith(taskData);
    expect(notificationService.scheduleTaskReminder).toHaveBeenCalled();
    expect(result).toEqual(mockTask);
  });
  
  it('should handle validation failures gracefully', async () => {
    mockValidationService.validateTask.mockReturnValue({
      isValid: false,
      errors: ['Name is required'],
      warnings: []
    });
    
    await expect(taskService.createTask(taskData))
      .rejects.toThrow('Task validation failed: Name is required');
      
    expect(mockTaskRepository.create).not.toHaveBeenCalled();
  });
});
```

#### Store Testing with TaskService

```typescript
// Mock TaskService for store testing
jest.mock('../services', () => ({
  getTaskService: jest.fn(() => ({
    getAllTasks: jest.fn(),
    createTask: jest.fn(),
    updateTask: jest.fn(),
    archiveTask: jest.fn(),
  }))
}));

describe('TasksStore', () => {
  it('should delegate task creation to TaskService', async () => {
    const mockTaskService = getTaskService();
    mockTaskService.createTask.mockResolvedValue(mockTask);
    
    const { createTask } = useTasksStore.getState();
    const result = await createTask(taskData);
    
    expect(mockTaskService.createTask).toHaveBeenCalledWith(taskData);
    expect(useTasksStore.getState().tasks).toContain(mockTask);
  });
});
```

#### Coverage Requirements
- Utilities: 90%+ coverage required
- Services: 85%+ coverage required (including TaskService)
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

## Error Handling Architecture

### Overview

Multi-layered error handling ensures application resilience and user experience continuity.

### Error Boundary Hierarchy

```
App
├── AppErrorBoundary (Global)
│   └── ScreenErrorBoundary (Per Screen)
│       └── Component Error Boundaries (Feature-specific)
```

### Error Handling Layers

#### 1. Component Level
```typescript
try {
  await handleQuickAdd(taskId);
} catch (error) {
  showErrorToast('Failed to add completion');
  logger.error('UI', 'Quick add failed', { error });
}
```

#### 2. Hook Level
```typescript
const handleQuickAdd = useCallback(async (taskId: string) => {
  try {
    // Operation logic
  } catch (error) {
    logger.error('UI', 'Failed to quick add task', { error });
    throw error; // Re-throw for UI handling
  }
}, []);
```

#### 3. Service Level (TaskService Pattern)
```typescript
// TaskService provides comprehensive error handling
async createTask(taskData: CreateTaskData): Promise<Task> {
  try {
    logger.debug('SERVICES', 'Creating new task', { name: taskData.name });
    
    // Validate with detailed error messages
    const validation = this.validationService.validateTask(taskData);
    if (!validation.isValid) {
      const error = new Error(`Task validation failed: ${validation.errors.join(', ')}`);
      logger.error('SERVICES', 'Task validation failed', { 
        errors: validation.errors,
        warnings: validation.warnings 
      });
      throw error;
    }
    
    // Log warnings without failing
    if (validation.warnings.length > 0) {
      logger.warn('SERVICES', 'Task validation warnings', { 
        warnings: validation.warnings 
      });
    }
    
    // Create task
    const task = await this.taskRepository.create(taskData);
    
    // Non-critical operations don't throw
    if (task.reminderEnabled) {
      try {
        await this.scheduleTaskNotification(task);
      } catch (notifError) {
        // Log but don't fail task creation
        logger.error('SERVICES', 'Failed to schedule notification', { 
          error: notifError,
          taskId: task.id 
        });
      }
    }
    
    return task;
  } catch (error) {
    logger.error('SERVICES', 'Failed to create task', { error });
    throw error; // Re-throw for store handling
  }
}

// Graceful degradation for non-critical features
private async cancelTaskNotifications(taskId: string): Promise<void> {
  try {
    await notificationService.cancelTaskReminder(taskId);
    logger.debug('SERVICES', 'Task notifications cancelled', { taskId });
  } catch (error) {
    // Log but don't throw - notification failure shouldn't fail task operations
    logger.error('SERVICES', 'Failed to cancel notifications', { error, taskId });
  }
}
```

#### 4. Repository Level
```typescript
async create(data: TaskData): Promise<Task> {
  try {
    const result = await db.runAsync(...);
    return this.mapToTask(result);
  } catch (error) {
    logger.error('DATA', 'Database operation failed', { error });
    throw new DatabaseError('Failed to create task', error);
  }
}
```

### Error Recovery Strategies

1. **Retry Logic**: Automatic retry for transient failures
2. **Fallback Data**: Show cached data when fresh data unavailable
3. **Graceful Degradation**: Disable features rather than crash
4. **User Feedback**: Clear error messages and recovery actions
5. **Error Reporting**: Centralized logging for debugging

### Error Types

```typescript
class ValidationError extends Error {
  constructor(message: string, public errors: string[]) {
    super(message);
  }
}

class DatabaseError extends Error {
  constructor(message: string, public originalError: Error) {
    super(message);
  }
}

class NetworkError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
  }
}
```

---

This architecture supports a scalable, maintainable habit tracking application while providing excellent developer experience and user performance. The layered design with repository pattern, service layer, and custom hooks allows for easy testing, modification, and extension as requirements evolve. The comprehensive error handling and animation systems ensure a robust and delightful user experience.