# API Reference

*Created: January 3, 2026*  
*Last Modified: January 3, 2026*

## Table of Contents

1. [Components API](#components-api)
2. [Store API](#store-api)
3. [Repository API](#repository-api)
4. [Utility Functions](#utility-functions)
5. [Type Definitions](#type-definitions)
6. [Constants and Enums](#constants-and-enums)

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

### AddTaskScreen

Task creation and editing interface with form validation and customization options.

**Location**: `/src/screens/AddTaskScreen.tsx`

#### Props

```typescript
interface AddTaskScreenProps {
  onClose: () => void;                    // Close modal callback
  onTaskAdded: () => void;                // Task creation success callback
  editTask?: Task;                        // Optional task to edit (vs create)
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

### TaskRepository

Database access layer for task-related operations.

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