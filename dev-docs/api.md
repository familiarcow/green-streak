# API Reference

*Created: January 3, 2026*  
*Last Modified: January 5, 2026*

## Table of Contents

1. [Components API](#components-api)
2. [Custom Hooks API](#custom-hooks-api)
3. [Service Layer API](#service-layer-api)
4. [Store API](#store-api)
5. [Repository API](#repository-api)
6. [Utility Functions](#utility-functions)
7. [Type Definitions](#type-definitions)
8. [Constants and Enums](#constants-and-enums)

## Components API

### ContributionGraph

GitHub-style contribution graph with adaptive scaling and interactive day selection.

**Location**: `/src/components/ContributionGraph/ContributionGraph.tsx`

#### Props

```typescript
interface ContributionGraphProps {
  data: ContributionData[];           // Array of daily contribution data
  onDayPress: (date: string) => void; // Callback when a day is selected
  selectedDate?: string;              // Currently selected date (YYYY-MM-DD)
}
```

#### Usage

```typescript
<ContributionGraph
  data={contributionData}
  onDayPress={(date) => setSelectedDate(date)}
  selectedDate={selectedDate}
/>
```

#### Features
- **Adaptive Layout**: Automatically adjusts day size based on screen width and data volume
- **Color Intensity**: Uses contribution count to determine visual intensity
- **Scrollable**: Horizontal scrolling for large datasets
- **Month Labels**: Automatic month headers
- **Week Day Labels**: S M T W T F S labels
- **Statistics**: Shows total completions and active days

#### Constants

```typescript
const MIN_DAY_SIZE = 12;    // Minimum size for day squares
const MAX_DAY_SIZE = 24;    // Maximum size for day squares
const DAYS_PER_WEEK = 7;    // Days per week for grid layout
```

---

### ContributionDay

Individual day representation within the contribution graph.

**Location**: `/src/components/ContributionGraph/ContributionDay.tsx`

#### Props

```typescript
interface ContributionDayProps {
  data: ContributionData;             // Day's contribution data
  maxCount: number;                   // Maximum count for color scaling
  size: number;                       // Square size in pixels
  onPress: (date: string) => void;    // Tap callback
  isSelected: boolean;                // Whether this day is selected
}
```

#### Usage

```typescript
<ContributionDay
  data={dayData}
  maxCount={10}
  size={16}
  onPress={handleDayPress}
  isSelected={dayData.date === selectedDate}
/>
```

#### Features
- **Touch Feedback**: Visual feedback on press
- **Accessibility**: VoiceOver support with descriptive labels
- **Dynamic Colors**: Intensity based on completion count
- **Selection State**: Visual indication of selected day

---

### LiveCalendar

Enhanced calendar component with multiple time period views and responsive grid layout.

**Location**: `/src/components/ContributionGraph/LiveCalendar.tsx`

#### Props

```typescript
interface LiveCalendarProps {
  data: ContributionData[];           // Array of daily contribution data
  onDayPress: (date: string) => void; // Callback when a day is selected
  selectedDate?: string;              // Currently selected date (YYYY-MM-DD)
  viewType?: ViewType;                // Current view: 'live' | '2m' | '4m' | '6m' | '1y' | 'all'
  onViewTypeChange?: (viewType: ViewType) => void; // View change callback
}
```

#### Usage

```typescript
<LiveCalendar
  data={contributionData}
  onDayPress={handleDayPress}
  selectedDate={selectedDate}
  viewType={currentView}
  onViewTypeChange={setCurrentView}
/>
```

#### Features
- **Multiple Time Periods**: Live (35 days), 2M, 4M, 6M, 1Y, All time views
- **Responsive Grid**: Consistent box sizing across all views
- **Month Markers**: Visual month indicators for longer time periods
- **Golden Highlights**: Today indicator with golden border and glow
- **Staggered Animations**: Smooth entry animations with cascading delays
- **Complete Weeks**: Always shows complete weeks for clean layout

---

### TimePeriodSelector

Animated period selector with sliding golden highlight.

**Location**: `/src/components/ContributionGraph/TimePeriodSelector.tsx`

#### Props

```typescript
interface TimePeriodSelectorProps {
  selected: ViewType;                 // Currently selected period
  onSelect: (viewType: ViewType) => void; // Selection callback
}

type ViewType = 'live' | '2m' | '4m' | '6m' | '1y' | 'all';
```

#### Usage

```typescript
<TimePeriodSelector
  selected={viewType}
  onSelect={handleViewTypeChange}
/>
```

#### Features
- **Golden Highlight**: Animated background that slides to selected option
- **Spring Physics**: Natural spring animations with custom damping
- **Accessibility**: Full VoiceOver support with descriptive labels
- **Touch Feedback**: Visual feedback on press

---

### TodayCard

Date navigation and quick-add interface component.

**Location**: `/src/components/HomeScreen/TodayCard.tsx`

#### Props

```typescript
interface TodayCardProps {
  selectedDate: string;               // Currently selected date
  selectedDateData?: ContributionData; // Data for selected date
  tasks: Task[];                      // Available tasks
  onQuickAdd: (taskId: string, date?: string) => void; // Quick add callback
  onViewMore: () => void;            // View more callback
  onDateChange: (date: string) => void; // Date change callback
}
```

#### Features
- **Date Navigation**: Previous/next day navigation
- **Quick Add**: Add completions for any selected date
- **Task Preview**: Shows tasks with completion counts
- **Responsive Layout**: Adapts to screen size

---

### MonthMarker

Overlay component for displaying month labels on calendar grid.

**Location**: `/src/components/ContributionGraph/MonthMarker.tsx`

#### Props

```typescript
interface MonthMarkerProps {
  date: string;                       // Date string for month
  boxSize: number;                    // Size of calendar box
  contributionColor: string;          // Background color of day
}
```

#### Features
- **Overlay Design**: Positioned absolutely over calendar day
- **Contrast Text**: Automatically adjusts text color for readability
- **Abbreviated Months**: Shows 3-letter month abbreviations

---

### HomeScreen

Main application screen with contribution graph, task overview, and navigation.

**Location**: `/src/screens/HomeScreen.tsx`

#### Features
- **Data Loading**: Automatic initialization of tasks and contribution data
- **Modal Navigation**: Add task and daily log modals
- **Empty States**: Welcome message for new users
- **Task Preview**: Overview of current habits
- **Date Selection**: Interactive graph with date-specific views

#### State Management

```typescript
const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
const [showAddTask, setShowAddTask] = useState(false);
const [showDailyLog, setShowDailyLog] = useState(false);
```

#### Store Integration

```typescript
const { tasks, loadTasks, loading: tasksLoading } = useTasksStore();
const { contributionData, loadContributionData, loading: logsLoading } = useLogsStore();
```

---

### EditTaskModal

Task creation and editing interface with form validation and customization options.

**Location**: `/src/screens/EditTaskModal.tsx`

#### Props

```typescript
interface EditTaskModalProps {
  onClose: () => void;                    // Close modal callback
  onTaskAdded: () => void;                // Task creation success callback
  existingTask?: Task;                    // Optional task to edit (vs create)
}
```

#### Features
- **Form Validation**: Required fields and input validation
- **Color Selection**: Choose from predefined color palette
- **Icon Selection**: Emoji icon picker
- **Multi-completion Toggle**: Enable multiple completions per day
- **Reminder Settings**: Optional reminder configuration

---

### DailyLogScreen

Interface for logging daily task completions with quick ticker controls.

**Location**: `/src/screens/DailyLogScreen.tsx`

#### Props

```typescript
interface DailyLogScreenProps {
  date: string;                           // Date to log (YYYY-MM-DD format)
  onClose: () => void;                    // Close modal callback
}
```

#### Features
- **Quick Logging**: Ticker-style +/- controls for each task
- **Multi-completion**: Support for tasks that can be done multiple times
- **Visual Feedback**: Immediate updates to counts
- **Persistence**: Automatic saving of changes

## Store API

### useTasksStore

Zustand store for task management with CRUD operations.

**Location**: `/src/store/tasksStore.ts`

#### State

```typescript
interface TasksState {
  tasks: Task[];                          // Array of all active tasks
  loading: boolean;                       // Loading state for async operations
  error: string | null;                   // Error message if operation fails
}
```

#### Actions

```typescript
// Load all tasks from database
loadTasks: () => Promise<void>

// Create a new task
createTask: (taskData: Omit<Task, 'id' | 'createdAt'>) => Promise<Task>

// Update existing task
updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<Task>

// Archive task (soft delete)
archiveTask: (id: string) => Promise<void>

// Permanently delete task
deleteTask: (id: string) => Promise<void>

// Get task by ID
getTaskById: (id: string) => Task | undefined
```

#### Usage

```typescript
const { tasks, loadTasks, createTask } = useTasksStore();

// Load tasks on component mount
useEffect(() => {
  loadTasks();
}, []);

// Create new task
const handleCreateTask = async (data) => {
  try {
    await createTask(data);
  } catch (error) {
    console.error('Failed to create task:', error);
  }
};
```

## Custom Hooks API

### useTaskActions

Provides task-related operations with service layer integration.

**Location**: `/src/hooks/useTaskActions.ts`

#### Return Type

```typescript
interface UseTaskActionsReturn {
  handleQuickAdd: (taskId: string, date?: string) => Promise<void>;
  handleQuickRemove: (taskId: string, date?: string) => Promise<void>;
  refreshAllData: () => Promise<void>;
  refreshContributionData: () => Promise<void>;
}
```

#### Usage

```typescript
const { handleQuickAdd, refreshAllData } = useTaskActions();

// Add completion for specific date
await handleQuickAdd(taskId, '2026-01-05');

// Add completion for today (date optional)
await handleQuickAdd(taskId);

// Refresh all application data
await refreshAllData();
```

#### Features
- **Date Support**: Quick add works with any selected date
- **Service Integration**: Uses DataService for business logic
- **Validation**: Validates data before operations
- **Error Handling**: Comprehensive error logging and re-throwing
- **Data Refresh**: Automatically refreshes contribution data with expanded date range

---

### useModalState

Centralized modal state management hook.

**Location**: `/src/hooks/useModalState.ts`

#### Return Type

```typescript
interface UseModalStateReturn {
  // State
  showAddTask: boolean;
  editingTask: Task | null;
  showDailyLog: boolean;
  showSettings: boolean;
  showTaskAnalytics: boolean;
  
  // Actions
  openAddTask: () => void;
  openEditTask: (task: Task) => void;
  closeAddTask: () => void;
  openDailyLog: () => void;
  closeDailyLog: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  openTaskAnalytics: () => void;
  closeTaskAnalytics: () => void;
  closeAllModals: () => void;
}
```

#### Usage

```typescript
const { 
  showAddTask, 
  openAddTask, 
  closeAddTask,
  closeAllModals 
} = useModalState();

// Open add task modal
openAddTask();

// Open edit task modal with task data
openEditTask(selectedTask);

// Close all modals at once
closeAllModals();
```

---

### useDateNavigation

Date selection and navigation logic.

**Location**: `/src/hooks/useDateNavigation.ts`

#### Return Type

```typescript
interface UseDateNavigationReturn {
  selectedDate: string;
  handleDayPress: (date: string) => void;
  handleDateChange: (date: string) => void;
  navigateToToday: () => void;
  navigateDate: (direction: 'prev' | 'next') => string;
  isToday: (date?: string) => boolean;
  setSelectedDate: (date: string) => void;
}
```

#### Usage

```typescript
const { 
  selectedDate,
  navigateDate,
  navigateToToday,
  isToday 
} = useDateNavigation();

// Navigate to previous/next day
const newDate = navigateDate('next');

// Check if date is today
if (isToday(selectedDate)) {
  // Show today-specific UI
}

// Return to current date
navigateToToday();
```

---

### useContributionData

Manages contribution graph data loading and caching.

**Location**: `/src/hooks/useContributionData.ts`

#### Features
- **Smart Loading**: Only loads data when needed
- **Date Range Management**: Handles expanding date ranges
- **Performance Optimized**: Caches data to minimize database queries
- **Error Resilience**: Graceful error handling

## Service Layer API

### DataService

High-level data operations service with business logic.

**Location**: `/src/services/DataService.ts`

#### Key Methods

```typescript
class DataService {
  // Task operations
  async getAllTasks(): Promise<Task[]>
  async getTaskById(id: string): Promise<Task | null>
  async createTask(taskData: Omit<Task, 'id' | 'createdAt'>): Promise<Task>
  async updateTask(id: string, updates: Partial<Task>): Promise<Task>
  async archiveTask(id: string): Promise<void>
  async deleteTask(id: string): Promise<void>
  
  // Log operations
  async logTaskCompletion(taskId: string, date: string, count: number): Promise<TaskLog>
  async getTaskLogs(taskId: string): Promise<TaskLog[]>
  async getLogForTaskAndDate(taskId: string, date: string): Promise<TaskLog | null>
  async getContributionData(dates: string[]): Promise<ContributionData[]>
  async getLogsInDateRange(startDate: string, endDate: string): Promise<TaskLog[]>
  
  // Combined operations
  async getTasksWithRecentActivity(days?: number): Promise<Array<Task & { recentCompletions: number }>>
  
  // Streak calculations
  async calculateCurrentStreak(): Promise<number>
  async calculateBestStreak(): Promise<number>
}
```

#### Usage

```typescript
import { getDataService } from '../services';

const dataService = getDataService();

// Get tasks with recent activity
const activeTasks = await dataService.getTasksWithRecentActivity(30);

// Calculate streaks
const currentStreak = await dataService.calculateCurrentStreak();
const bestStreak = await dataService.calculateBestStreak();

// Log task completion with validation
await dataService.logTaskCompletion(taskId, date, count);
```

---

### ValidationService

Business rule validation service.

**Location**: `/src/services/ValidationService.ts`

#### Key Methods

```typescript
class ValidationService {
  validateTask(task: Partial<Task>): ValidationResult
  validateTaskLog(log: { taskId: string; date: string; count: number }): ValidationResult
  validateDateRange(startDate: string, endDate: string): ValidationResult
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
```

#### Usage

```typescript
import { getValidationService } from '../services';

const validationService = getValidationService();

// Validate task log
const validation = validationService.validateTaskLog({
  taskId: 'task-123',
  date: '2026-01-05',
  count: 3
});

if (!validation.isValid) {
  throw new Error(validation.errors.join(', '));
}
```

---

### ServiceRegistry

Service dependency injection and management.

**Location**: `/src/services/ServiceRegistry.ts`

#### Pattern

```typescript
// Get service instances
import { getDataService, getValidationService } from '../services';

const dataService = getDataService();
const validationService = getValidationService();
```

---

### useLogsStore

Zustand store for completion logs and contribution data.

**Location**: `/src/store/logsStore.ts`

#### State

```typescript
interface LogsState {
  contributionData: ContributionData[];   // Graph visualization data
  loading: boolean;                       // Loading state
  error: string | null;                   // Error state
}
```

#### Actions

```typescript
// Load contribution data for graph
loadContributionData: (forceRefresh?: boolean) => Promise<void>

// Update task completion count for specific date
updateTaskLog: (taskId: string, date: string, count: number) => Promise<void>

// Get completion data for specific date
getLogsForDate: (date: string) => ContributionData | undefined
```

#### Usage

```typescript
const { contributionData, loadContributionData, updateTaskLog } = useLogsStore();

// Load contribution data
useEffect(() => {
  loadContributionData();
}, []);

// Log task completion
const handleLogCompletion = async (taskId: string, date: string, count: number) => {
  await updateTaskLog(taskId, date, count);
  loadContributionData(true); // Refresh graph
};
```

## Repository API

### Repository Interfaces

#### ITaskRepository

**Location**: `/src/database/repositories/interfaces/ITaskRepository.ts`

```typescript
export interface ITaskRepository {
  getAll(): Promise<Task[]>;
  getById(id: string): Promise<Task | null>;
  create(data: Omit<Task, 'id' | 'createdAt'>): Promise<Task>;
  update(id: string, data: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task>;
  archive(id: string): Promise<void>;
  delete(id: string): Promise<void>;
}
```

#### ILogRepository

**Location**: `/src/database/repositories/interfaces/ILogRepository.ts`

```typescript
export interface ILogRepository {
  createOrUpdate(taskId: string, date: string, count: number): Promise<TaskLog>;
  getByTaskAndDate(taskId: string, date: string): Promise<TaskLog | null>;
  findByTask(taskId: string): Promise<TaskLog[]>;
  findByDateRange(startDate: string, endDate: string): Promise<TaskLog[]>;
  getContributionData(dates: string[]): Promise<ContributionData[]>;
  deleteByTask(taskId: string): Promise<void>;
}
```

---

### RepositoryFactory

Factory pattern for repository dependency injection.

**Location**: `/src/database/repositories/RepositoryFactory.ts`

#### Methods

```typescript
class RepositoryFactory {
  static getInstance(): RepositoryFactory
  getTaskRepository(): ITaskRepository
  getLogRepository(): ILogRepository
  setTaskRepository(repository: ITaskRepository): void
  setLogRepository(repository: ILogRepository): void
  resetToDefaults(): void
}
```

#### Usage

```typescript
import { repositoryFactory } from '../database/repositories/RepositoryFactory';

// Get repository instances
const taskRepo = repositoryFactory.getTaskRepository();
const logRepo = repositoryFactory.getLogRepository();

// For testing - inject mocks
import { MockTaskRepository } from '../database/repositories/mocks';
repositoryFactory.setTaskRepository(new MockTaskRepository());

// Reset after tests
repositoryFactory.resetToDefaults();
```

---

### TaskRepository

Concrete implementation of ITaskRepository.

**Location**: `/src/database/repositories/TaskRepository.ts`

#### Methods

```typescript
// Create new task
async create(taskData: Omit<Task, 'id' | 'createdAt'>): Promise<Task>

// Find task by ID
async findById(id: string): Promise<Task | null>

// Get all active (non-archived) tasks
async findAll(): Promise<Task[]>

// Update existing task
async update(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task>

// Archive task (soft delete)
async archive(id: string): Promise<void>

// Permanently delete task
async delete(id: string): Promise<void>
```

#### Example Usage

```typescript
import TaskRepository from '../database/repositories/TaskRepository';

// Create a new exercise habit
const task = await TaskRepository.create({
  name: 'Morning Exercise',
  description: 'Daily workout routine',
  icon: '💪',
  color: '#22c55e',
  isMultiCompletion: false,
  reminderEnabled: true,
  reminderTime: '07:00',
  reminderFrequency: 'daily'
});

// Update task color
await TaskRepository.update(task.id, { color: '#3b82f6' });

// Archive task
await TaskRepository.archive(task.id);
```

---

### LogRepository

Database access layer for completion logs and contribution data.

**Location**: `/src/database/repositories/LogRepository.ts`

#### Methods

```typescript
// Create or update completion log
async createOrUpdate(taskId: string, date: string, count: number): Promise<TaskLog>

// Find log by task and date
async findByTaskAndDate(taskId: string, date: string): Promise<TaskLog | null>

// Get all logs for a task
async findByTask(taskId: string): Promise<TaskLog[]>

// Get logs within date range
async findByDateRange(startDate: string, endDate: string): Promise<TaskLog[]>

// Get contribution graph data
async getContributionData(dates: string[]): Promise<ContributionData[]>

// Delete all logs for a task
async deleteByTask(taskId: string): Promise<void>
```

#### Example Usage

```typescript
import LogRepository from '../database/repositories/LogRepository';

// Log task completion
await LogRepository.createOrUpdate('task-123', '2026-01-03', 2);

// Get contribution data for last 30 days
const dates = getLast30Days(); // Helper function
const contributionData = await LogRepository.getContributionData(dates);

// Get task history
const taskLogs = await LogRepository.findByTask('task-123');
```

## Utility Functions

### dateHelpers

Date manipulation and formatting utilities.

**Location**: `/src/utils/dateHelpers.ts`

#### Functions

```typescript
// Format date as YYYY-MM-DD
formatDate(date: Date): string

// Format date for display (e.g., "Jan 3, 2026")
formatDisplayDate(date: Date): string

// Format time for display (e.g., "7:00 AM")
formatDisplayTime(date: Date): string

// Get start of today
getToday(): Date

// Get today as YYYY-MM-DD string
getTodayString(): string

// Get date range between two dates
getDateRange(startDate: Date, endDate: Date): Date[]

// Get adaptive date range based on data volume
getAdaptiveRange(dataPointCount: number, latestDate?: Date): Date[]

// Check if date is today
isDateToday(date: Date): boolean

// Compare if two dates are the same day
areDatesEqual(date1: Date, date2: Date): boolean

// Get abbreviated weekday name
getWeekDayName(date: Date): string

// Get abbreviated month name
getMonthName(date: Date): string
```

#### Example Usage

```typescript
import { formatDate, getAdaptiveRange, getTodayString } from '../utils/dateHelpers';

// Get today's date string
const today = getTodayString(); // "2026-01-03"

// Format a date for display
const displayDate = formatDisplayDate(new Date()); // "Jan 3, 2026"

// Get adaptive date range for contribution graph
const dates = getAdaptiveRange(tasks.length);
```

---

### logger

Structured logging system with categories and levels.

**Location**: `/src/utils/logger.ts`

#### Methods

```typescript
// Log at different levels
debug(category: LogCategory, message: string, data?: any): void
info(category: LogCategory, message: string, data?: any): void
warn(category: LogCategory, message: string, data?: any): void
error(category: LogCategory, message: string, data?: any): void
fatal(category: LogCategory, message: string, data?: any): void

// Configuration
setLogLevel(level: LogLevel): void
getLogs(): LogEntry[]
clearLogs(): void
exportLogs(): string
```

#### Example Usage

```typescript
import logger from '../utils/logger';

// Log user interaction
logger.info('UI', 'Task creation started', { taskName: 'Exercise' });

// Log data operation
logger.debug('DATA', 'Database query executed', { table: 'tasks', duration: 15 });

// Log error with context
logger.error('STATE', 'Failed to update task', { 
  error: error.message, 
  taskId: 'task-123' 
});
```

---

### devSeed

Development data seeding utility for testing and development.

**Location**: `/src/utils/devSeed.ts`

#### Main Function

```typescript
async runSeed(config: SeedConfig): Promise<void>
```

#### SeedConfig Interface

```typescript
interface SeedConfig {
  tasks: number;      // Number of tasks to create (1-15)
  days: number;       // Days of historical data (1-365)
  reset?: boolean;    // Clear existing data first
  seed?: number;      // Random seed for reproducible data
  verbose?: boolean;  // Enable debug logging
}
```

#### Example Usage

```typescript
import { runSeed } from '../utils/devSeed';

// Generate test data
await runSeed({
  tasks: 8,
  days: 60,
  reset: true,
  verbose: true
});
```

## Type Definitions

### Core Types

**Location**: `/src/types/index.ts`

#### Task

```typescript
interface Task {
  id: string;                           // Unique identifier
  name: string;                         // Display name
  description?: string;                 // Optional description
  icon?: string;                        // Emoji icon
  color: string;                        // Hex color code
  isMultiCompletion: boolean;           // Can be completed multiple times per day
  createdAt: string;                    // ISO timestamp
  archivedAt?: string;                  // ISO timestamp if archived
  reminderEnabled: boolean;             // Whether reminders are enabled
  reminderTime?: string;                // Time in HH:MM format
  reminderFrequency?: 'daily' | 'weekly'; // Reminder frequency
}
```

#### TaskLog

```typescript
interface TaskLog {
  id: string;                           // Unique identifier
  taskId: string;                       // Foreign key to task
  date: string;                         // YYYY-MM-DD format
  count: number;                        // Number of completions
  updatedAt: string;                    // ISO timestamp
}
```

#### ContributionData

```typescript
interface ContributionData {
  date: string;                         // YYYY-MM-DD format
  count: number;                        // Total completions for day
  tasks: Array<{                        // Individual task contributions
    taskId: string;
    name: string;
    count: number;
    color: string;
  }>;
}
```

### Configuration Types

#### SeedConfig

```typescript
interface SeedConfig {
  tasks: number;                        // Number of sample tasks (1-15)
  days: number;                         // Historical data days (1-365)
  reset?: boolean;                      // Clear data before seeding
  seed?: number;                        // Random seed for reproducible data
  verbose?: boolean;                    // Enable debug logging
}
```

#### AppSettings

```typescript
interface AppSettings {
  globalReminderEnabled: boolean;       // Global reminder toggle
  globalReminderTime?: string;          // Default reminder time
  debugLoggingEnabled: boolean;         // Debug logging toggle
  currentLogLevel: LogLevel;            // Current logging level
}
```

### Logging Types

#### LogLevel and LogCategory

```typescript
type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

type LogCategory = 
  | 'DATA'      // Database operations
  | 'UI'        // User interface events
  | 'NOTIF'     // Notifications
  | 'STATE'     // State management
  | 'PERF'      // Performance monitoring
  | 'DEV'       // Development tools
  | 'ERROR';    // Error handling
```

## Constants and Enums

### Database Schema

**Location**: `/src/database/schema.ts`

#### Sample Data

```typescript
const SAMPLE_TASK_NAMES = [
  'Exercise', 'Read', 'Meditate', 'Journal', 'Water intake',
  'Learn something new', 'Call family', 'Clean room',
  'Practice instrument', 'Stretch', 'Plan tomorrow',
  'Gratitude practice', 'Take vitamins', 'Walk outdoors', 'Healthy meal'
];

const COLOR_PALETTE = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6b7280',
  '#14b8a6', '#a855f7'
];
```

### Theme Constants

**Location**: `/src/theme/`

#### Spacing Scale

```typescript
const spacing = {
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

#### Color Contribution Levels

```typescript
const contribution = {
  none: '#f3f4f6',      // No activity
  low: '#c6e6c3',       // 1-2 completions
  medium: '#7bc96f',    // 3-4 completions  
  high: '#239a3b',      // 5-7 completions
  highest: '#196127',   // 8+ completions
};
```

---

This API reference provides comprehensive documentation for all public interfaces in the Green Streak application. Use these APIs to understand component behavior, integrate with stores, perform data operations, and extend functionality while maintaining consistency with the existing codebase.