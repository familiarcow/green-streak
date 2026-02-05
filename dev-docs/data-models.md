# Data Models Documentation

*Created: January 5, 2026*  
*Last Modified: January 5, 2026*

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [TypeScript Interfaces](#typescript-interfaces)
4. [Data Relationships](#data-relationships)
5. [Data Flow Patterns](#data-flow-patterns)
6. [Contribution Data Calculation](#contribution-data-calculation)
7. [Data Validation Rules](#data-validation-rules)
8. [Data Migration Strategy](#data-migration-strategy)
9. [Performance Optimizations](#performance-optimizations)

## Overview

Green Streak uses SQLite for local data persistence with a well-defined schema and TypeScript interfaces for type safety. The data model supports habit tracking with daily completions, contribution visualization, and flexible task configuration.

### Data Architecture Principles

1. **Local-First**: All data stored locally on device
2. **Type Safety**: Full TypeScript coverage for all data structures
3. **Normalization**: Properly normalized database schema
4. **Performance**: Indexed for common query patterns
5. **Flexibility**: Supports various habit tracking patterns

## Database Schema

### Tasks Table

Stores habit definitions and configuration.

```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,                    -- UUID v4
  name TEXT NOT NULL,                     -- Display name
  description TEXT,                        -- Optional description
  icon TEXT,                              -- Emoji or icon identifier
  color TEXT DEFAULT '#22c55e',          -- Hex color code
  is_multi_completion BOOLEAN DEFAULT FALSE, -- Can complete multiple times per day
  created_at TEXT NOT NULL,              -- ISO 8601 timestamp
  archived_at TEXT,                       -- ISO 8601 timestamp if archived
  reminder_enabled BOOLEAN DEFAULT FALSE, -- Enable reminders
  reminder_time TEXT,                     -- HH:MM format
  reminder_frequency TEXT                 -- 'daily' or 'weekly'
);

-- Indexes for common queries
CREATE INDEX idx_tasks_created ON tasks(created_at);
CREATE INDEX idx_tasks_archived ON tasks(archived_at);
```

### Logs Table

Stores daily completion records.

```sql
CREATE TABLE logs (
  id TEXT PRIMARY KEY,                    -- UUID v4
  task_id TEXT NOT NULL,                  -- Foreign key to tasks
  date TEXT NOT NULL,                     -- YYYY-MM-DD format
  count INTEGER DEFAULT 0,                -- Number of completions
  updated_at TEXT NOT NULL,               -- ISO 8601 timestamp
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  UNIQUE(task_id, date)                   -- One record per task per day
);

-- Indexes for performance
CREATE INDEX idx_logs_date ON logs(date);
CREATE INDEX idx_logs_task_date ON logs(task_id, date);
CREATE INDEX idx_logs_updated ON logs(updated_at);
```

### Settings Table

Stores application configuration.

```sql
CREATE TABLE settings (
  key TEXT PRIMARY KEY,                   -- Setting identifier
  value TEXT NOT NULL                     -- JSON-encoded value
);

-- Default settings
INSERT INTO settings (key, value) VALUES 
  ('globalReminderEnabled', 'false'),
  ('globalReminderTime', 'null'),
  ('debugLoggingEnabled', 'false'),
  ('currentLogLevel', '"INFO"'),
  ('firstDayOfWeek', '"sunday"');
```

## TypeScript Interfaces

### Core Domain Models

```typescript
// Task entity
export interface Task {
  id: string;                           // UUID v4
  name: string;                         // Display name (required)
  description?: string;                 // Optional description
  icon?: string;                        // Emoji or icon identifier
  color: string;                        // Hex color code
  isMultiCompletion: boolean;           // Multiple completions per day
  createdAt: string;                    // ISO 8601 timestamp
  archivedAt?: string;                  // ISO 8601 timestamp if archived
  reminderEnabled: boolean;             // Reminder toggle
  reminderTime?: string;                // HH:MM format
  reminderFrequency?: 'daily' | 'weekly'; // Reminder frequency
}

// Task completion log
export interface TaskLog {
  id: string;                           // UUID v4
  taskId: string;                       // Foreign key to task
  date: string;                         // YYYY-MM-DD format
  count: number;                        // Number of completions (>= 0)
  updatedAt: string;                    // ISO 8601 timestamp
}

// Contribution graph data point
export interface ContributionData {
  date: string;                         // YYYY-MM-DD format
  count: number;                        // Total completions for day
  tasks: Array<{                        // Breakdown by task
    taskId: string;                    // Task identifier
    name: string;                      // Task name
    count: number;                     // Completions for this task
    color: string;                     // Task color
  }>;
}
```

### Application Settings

```typescript
export interface AppSettings {
  globalReminderEnabled: boolean;       // Master reminder toggle
  globalReminderTime?: string;          // Default reminder time (HH:MM)
  debugLoggingEnabled: boolean;         // Debug logging toggle
  currentLogLevel: LogLevel;            // Current log level
  firstDayOfWeek: 'sunday' | 'monday';  // Calendar week start
}

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
```

### View Models

```typescript
// Task with completion status
export interface TaskWithStatus extends Task {
  todayCount: number;                   // Today's completion count
  weekCount: number;                    // This week's total
  monthCount: number;                   // This month's total
  currentStreak: number;                // Current consecutive days
  bestStreak: number;                   // Best consecutive days
}

// Analytics data
export interface TaskAnalytics {
  taskId: string;
  totalCompletions: number;
  averagePerDay: number;
  averagePerWeek: number;
  consistencyRate: number;              // Percentage of days with completion
  mostProductiveDay: string;            // Day of week
  mostProductiveHour: number;           // Hour of day (0-23)
}
```

## Data Relationships

### Entity Relationship Diagram

```
┌─────────────┐         ┌─────────────┐
│   Tasks     │         │    Logs     │
├─────────────┤         ├─────────────┤
│ id (PK)     │───────┬─│ id (PK)     │
│ name        │       │ │ task_id (FK)│
│ description │       └─│ date        │
│ icon        │         │ count       │
│ color       │         │ updated_at  │
│ ...         │         └─────────────┘
└─────────────┘         UNIQUE(task_id, date)

┌─────────────┐
│  Settings   │
├─────────────┤
│ key (PK)    │
│ value       │
└─────────────┘
```

### Relationship Rules

1. **Tasks to Logs**: One-to-many relationship
2. **Cascade Delete**: Deleting a task removes all its logs
3. **Unique Constraint**: One log per task per day
4. **Referential Integrity**: Logs must reference existing tasks

## Data Flow Patterns

### Creating a Task

```typescript
// 1. UI Layer - User input
const taskData = {
  name: "Morning Exercise",
  icon: "💪",
  color: "#22c55e",
  isMultiCompletion: false,
  reminderEnabled: true,
  reminderTime: "07:00"
};

// 2. Hook Layer - Coordinate action
const { handleCreateTask } = useTaskActions();
await handleCreateTask(taskData);

// 3. Service Layer - Business logic
const validationResult = validationService.validateTask(taskData);
if (!validationResult.isValid) {
  throw new ValidationError(validationResult.errors);
}

// 4. Repository Layer - Data persistence
const task = await taskRepository.create({
  ...taskData,
  id: uuid.v4(),
  createdAt: new Date().toISOString()
});

// 5. Store Update - UI synchronization
set(state => ({
  tasks: [...state.tasks, task]
}));
```

### Logging a Completion

```typescript
// 1. Quick Add Button Press
onQuickAdd(taskId, selectedDate);

// 2. Load existing log
const currentLog = await logRepository.getByTaskAndDate(taskId, date);

// 3. Calculate new count
const newCount = (currentLog?.count || 0) + 1;

// 4. Validate multi-completion rules
if (!task.isMultiCompletion && newCount > 1) {
  return; // Single completion tasks max at 1
}

// 5. Create or update log
await logRepository.createOrUpdate(taskId, date, newCount);

// 6. Refresh contribution data
await loadContributionData(true, date);
```

## Contribution Data Calculation

### Algorithm Overview

The contribution graph aggregates completion data across all tasks for each day.

```typescript
async getContributionData(dates: string[]): Promise<ContributionData[]> {
  // 1. Fetch all logs for date range
  const logs = await db.getAllAsync(
    `SELECT l.*, t.name, t.color 
     FROM logs l 
     JOIN tasks t ON l.task_id = t.id 
     WHERE l.date IN (${dates.map(() => '?').join(',')})
     ORDER BY l.date DESC`,
    dates
  );
  
  // 2. Group by date
  const dataByDate = new Map<string, ContributionData>();
  
  for (const log of logs) {
    let dayData = dataByDate.get(log.date);
    if (!dayData) {
      dayData = {
        date: log.date,
        count: 0,
        tasks: []
      };
      dataByDate.set(log.date, dayData);
    }
    
    // 3. Aggregate counts
    dayData.count += log.count;
    dayData.tasks.push({
      taskId: log.task_id,
      name: log.name,
      count: log.count,
      color: log.color
    });
  }
  
  // 4. Fill missing dates with zero counts
  return dates.map(date => 
    dataByDate.get(date) || {
      date,
      count: 0,
      tasks: []
    }
  );
}
```

### Color Intensity Calculation

```typescript
// GitHub-style color gradients based on completion count
const getHabitColor = (count: number, maxCount: number): string => {
  if (count === 0) return '#ebedf0';     // Empty gray
  
  const intensity = Math.min(count / Math.max(maxCount, 1), 1);
  
  if (intensity <= 0.25) return '#9be9a8';  // Light green (1-25%)
  if (intensity <= 0.5) return '#40c463';   // Medium green (26-50%)
  if (intensity <= 0.75) return '#30a14e';  // Dark green (51-75%)
  return '#216e39';                        // Darkest green (76-100%)
};
```

## Data Validation Rules

### Task Validation

```typescript
class ValidationService {
  validateTask(task: Partial<Task>): ValidationResult {
    const errors: string[] = [];
    
    // Required fields
    if (!task.name?.trim()) {
      errors.push('Task name is required');
    }
    
    // Name length
    if (task.name && task.name.length > 100) {
      errors.push('Task name must be 100 characters or less');
    }
    
    // Color format
    if (task.color && !/#[0-9A-Fa-f]{6}/.test(task.color)) {
      errors.push('Color must be a valid hex code');
    }
    
    // Reminder time format
    if (task.reminderTime && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(task.reminderTime)) {
      errors.push('Reminder time must be in HH:MM format');
    }
    
    // Reminder frequency
    if (task.reminderFrequency && !['daily', 'weekly'].includes(task.reminderFrequency)) {
      errors.push('Reminder frequency must be daily or weekly');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
```

### Log Validation

```typescript
validateTaskLog(log: { taskId: string; date: string; count: number }): ValidationResult {
  const errors: string[] = [];
  
  // Task ID format
  if (!log.taskId || !this.isValidUUID(log.taskId)) {
    errors.push('Invalid task ID');
  }
  
  // Date format
  if (!log.date || !/^\d{4}-\d{2}-\d{2}$/.test(log.date)) {
    errors.push('Date must be in YYYY-MM-DD format');
  }
  
  // Date range
  const logDate = new Date(log.date);
  const today = new Date();
  if (logDate > today) {
    errors.push('Cannot log completions for future dates');
  }
  
  // Count validation
  if (log.count < 0) {
    errors.push('Count must be non-negative');
  }
  
  if (log.count > 999) {
    errors.push('Count exceeds maximum allowed value');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

## Data Migration Strategy

### Migration System

```typescript
// Database migration system
export class MigrationRunner {
  private migrations: Migration[] = [
    { version: 1, up: createInitialSchema },
    { version: 2, up: addReminderFields },
    { version: 3, up: addIndexes },
  ];
  
  async run(db: SQLiteDatabase) {
    const currentVersion = await this.getCurrentVersion(db);
    
    for (const migration of this.migrations) {
      if (migration.version > currentVersion) {
        await migration.up(db);
        await this.updateVersion(db, migration.version);
      }
    }
  }
}
```

### Migration Examples

```typescript
// Migration 1: Initial schema
async function createInitialSchema(db: SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE tasks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#22c55e',
      created_at TEXT NOT NULL
    );
    
    CREATE TABLE logs (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      date TEXT NOT NULL,
      count INTEGER DEFAULT 0,
      FOREIGN KEY (task_id) REFERENCES tasks(id),
      UNIQUE(task_id, date)
    );
  `);
}

// Migration 2: Add reminder fields
async function addReminderFields(db: SQLiteDatabase) {
  await db.execAsync(`
    ALTER TABLE tasks ADD COLUMN reminder_enabled BOOLEAN DEFAULT FALSE;
    ALTER TABLE tasks ADD COLUMN reminder_time TEXT;
    ALTER TABLE tasks ADD COLUMN reminder_frequency TEXT;
  `);
}
```

## Performance Optimizations

### Indexing Strategy

```sql
-- Most common queries and their indexes

-- 1. Get active tasks (ordered by creation)
-- Query: SELECT * FROM tasks WHERE archived_at IS NULL ORDER BY created_at DESC
CREATE INDEX idx_tasks_archived_created ON tasks(archived_at, created_at DESC);

-- 2. Get logs for date range
-- Query: SELECT * FROM logs WHERE date BETWEEN ? AND ? ORDER BY date DESC
CREATE INDEX idx_logs_date_desc ON logs(date DESC);

-- 3. Get logs for specific task
-- Query: SELECT * FROM logs WHERE task_id = ? ORDER BY date DESC
CREATE INDEX idx_logs_task_date_desc ON logs(task_id, date DESC);

-- 4. Get contribution data (join query)
-- Query: SELECT l.*, t.name, t.color FROM logs l JOIN tasks t ON l.task_id = t.id WHERE l.date IN (...)
-- Already covered by idx_logs_date and primary key indexes
```

### Query Optimization

```typescript
// Batch operations to reduce database round trips
async function batchCreateLogs(logs: LogData[]) {
  const db = getDatabase();
  
  await db.runAsync('BEGIN TRANSACTION');
  
  try {
    const stmt = await db.prepareAsync(
      'INSERT OR REPLACE INTO logs (id, task_id, date, count, updated_at) VALUES (?, ?, ?, ?, ?)'
    );
    
    for (const log of logs) {
      await stmt.executeAsync([
        log.id,
        log.taskId,
        log.date,
        log.count,
        log.updatedAt
      ]);
    }
    
    await stmt.finalizeAsync();
    await db.runAsync('COMMIT');
  } catch (error) {
    await db.runAsync('ROLLBACK');
    throw error;
  }
}
```

### Caching Strategy

```typescript
// Store-level caching for frequently accessed data
export const useLogsStore = create<LogsState>((set, get) => ({
  contributionData: [],
  contributionDataCache: new Map<string, ContributionData[]>(),
  lastFetch: null,
  
  loadContributionData: async (forceRefresh = false, expandToDate?: string) => {
    const cacheKey = expandToDate || 'default';
    const cached = get().contributionDataCache.get(cacheKey);
    
    // Use cache if available and not forcing refresh
    if (!forceRefresh && cached && get().lastFetch) {
      const cacheAge = Date.now() - get().lastFetch.getTime();
      if (cacheAge < 5 * 60 * 1000) { // 5 minute cache
        set({ contributionData: cached });
        return;
      }
    }
    
    // Fetch fresh data
    const dates = calculateDateRange(expandToDate);
    const data = await logRepository.getContributionData(dates);
    
    // Update cache
    const newCache = new Map(get().contributionDataCache);
    newCache.set(cacheKey, data);
    
    set({
      contributionData: data,
      contributionDataCache: newCache,
      lastFetch: new Date()
    });
  }
}));
```

### Memory Management

```typescript
// Limit cache size to prevent memory issues
const MAX_CACHE_SIZE = 100;

function limitCacheSize<K, V>(cache: Map<K, V>, maxSize: number) {
  if (cache.size > maxSize) {
    // Remove oldest entries (first in map)
    const entriesToRemove = cache.size - maxSize;
    const keys = Array.from(cache.keys());
    
    for (let i = 0; i < entriesToRemove; i++) {
      cache.delete(keys[i]);
    }
  }
}
```

---

This data models documentation provides a comprehensive reference for the data structures, relationships, and patterns used in the Green Streak application. The schema is optimized for local storage, performance, and flexibility while maintaining data integrity and type safety throughout the application.