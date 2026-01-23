# iOS Widgets

This document describes the iOS widget system for Green Streak, including architecture, data flow, and implementation details.

## Overview

Green Streak provides three iOS widgets:

| Widget | Description | Sizes | iOS Version |
|--------|-------------|-------|-------------|
| **LiveCalendarWidget** | GitHub-style contribution grid | Small | iOS 14+ |
| **QuickAddWidget** | One-tap task completion (single task) | Small | iOS 17+ |
| **QuickAddGridWidget** | 2x2 grid for 4 tasks | Small | iOS 17+ |

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  React Native App (TypeScript)                      │
│  - WidgetDataService (sync orchestration)           │
│  - useWidgetSync hook (lifecycle management)        │
├─────────────────────────────────────────────────────┤
│  WidgetBridge (Native Module)                       │
│  - syncWidgetData()    - reloadWidgets()            │
│  - getPendingActions() - markActionsProcessed()     │
├─────────────────────────────────────────────────────┤
│  App Groups Shared Storage (UserDefaults)           │
│  Suite: "group.com.greenstreak.shared"              │
├─────────────────────────────────────────────────────┤
│  iOS Widget Extension (Swift)                       │
│  - SharedDataStore (reads App Groups)               │
│  - LiveCalendarWidget / QuickAddWidget / GridWidget │
└─────────────────────────────────────────────────────┘
```

## Widgets

### LiveCalendarWidget

A GitHub-style contribution calendar showing task completion history.

**Features:**
- Displays 5 weeks of contribution history
- Color-coded cells (0-4 intensity levels) based on daily completions
- Today highlighted with gold border and shadow
- Syncs automatically when quick adds are performed
- Deep links to app: `greenstreak://calendar?date=YYYY-MM-DD`

**Refresh Strategy:**
- Active hours (6 AM - 10 PM): every 15 minutes
- Inactive hours: every hour
- Immediate refresh on any QuickAdd widget tap

**Files:**
- `ios/GreenStreakWidgets/Widgets/LiveCalendar/LiveCalendarWidget.swift`
- `ios/GreenStreakWidgets/Widgets/LiveCalendar/LiveCalendarProvider.swift`
- `ios/GreenStreakWidgets/Widgets/LiveCalendar/LiveCalendarView.swift`

### QuickAddWidget

A single-tap button for quick task completion without opening the app.

**Features:**
- Configure which task to track via long-press edit
- Shows task icon and today's completion count
- Filled color when completed, empty when not
- Optimistic UI updates (shows pending actions immediately)
- No app launch required for completion

**States:**
1. **Not Configured:** "Tap to setup" prompt
2. **Configured (not completed):** Gray background, task icon
3. **Configured (completed today):** Task color background, white icon/count

**Files:**
- `ios/GreenStreakWidgets/Widgets/QuickAdd/QuickAddWidget.swift`
- `ios/GreenStreakWidgets/Widgets/QuickAdd/QuickAddProvider.swift`
- `ios/GreenStreakWidgets/Widgets/QuickAdd/QuickAddView.swift`
- `ios/GreenStreakWidgets/Intents/QuickAddIntent.swift`
- `ios/GreenStreakWidgets/Intents/QuickAddConfigIntent.swift`

### QuickAddGridWidget

A 2x2 grid of tappable task cells for quick completion of up to 4 tasks.

**Features:**
- 2x2 grid layout matching the calendar cell style
- Configure up to 4 different tasks
- Each cell shows task icon and today's completion count
- Cells are individually tappable for quick adds
- Defaults to first 4 tasks when not explicitly configured
- Optimistic UI updates (shows pending actions immediately)
- Syncs all QuickAdd widgets and calendar widget on tap

**States (per cell):**
1. **Not Configured:** Empty gray cell
2. **Configured (not completed):** Gray background, task icon
3. **Configured (completed today):** Task color background, white icon/count

**Files:**
- `ios/GreenStreakWidgets/Widgets/QuickAddGrid/QuickAddGridWidget.swift`
- `ios/GreenStreakWidgets/Widgets/QuickAddGrid/QuickAddGridProvider.swift`
- `ios/GreenStreakWidgets/Widgets/QuickAddGrid/QuickAddGridView.swift`
- `ios/GreenStreakWidgets/Intents/QuickAddGridConfigIntent.swift`

## Data Flow

### App → Widget (Sync)

When app data changes, it syncs to widgets:

```
Store change (tasks/logs/streaks/settings)
        ↓
WidgetDataService.scheduleSync() [500ms debounce]
        ↓
buildSyncData() → JSON.stringify()
        ↓
WidgetBridge.syncWidgetData(json)
        ↓
App Groups UserDefaults.set("widgetData", json)
        ↓
WidgetBridge.reloadWidgets()
        ↓
WidgetKit reloads all timelines
        ↓
Widgets re-render with new data
```

### Widget → App (Quick Add Processing)

When user taps QuickAddWidget:

```
User taps widget
        ↓
QuickAddIntent.perform()
        ↓
Create PendingWidgetAction {
  id: UUID
  type: "quick_add"
  taskId: configured task
  date: today
  timestamp: ISO8601
  processed: false
}
        ↓
SharedDataStore.savePendingAction()
        ↓
App Groups UserDefaults.append("pendingWidgetActions")
        ↓
WidgetCenter.reloadTimelines() [optimistic UI]
        ↓
App foregrounds (or initializes)
        ↓
useWidgetSync → processPendingWidgetActions()
        ↓
WidgetDataService.getPendingActions()
        ↓
For each action: handleQuickAdd(taskId, date)
        ↓
Database updated (source of truth)
        ↓
markActionsProcessed(actionIds)
        ↓
forceSync() → Widget shows real count
```

## Data Models

### WidgetSyncData

Primary data structure synced from app to widgets.

```typescript
interface WidgetSyncData {
  version: number;           // Schema version (1)
  lastUpdated: string;       // ISO8601 timestamp

  contributionData: {
    dates: ContributionDate[];
    maxCount: number;
    palette: ColorPalette;
  };

  tasks: TaskData[];

  quickAddConfig: {
    singleTaskId: string | null;
    multiTaskIds: string[];
  };

  pendingActions: PendingWidgetAction[];
}
```

### ContributionDate

```typescript
interface ContributionDate {
  date: string;              // "YYYY-MM-DD"
  count: number;             // Completions that day
  level: 0 | 1 | 2 | 3 | 4;  // Intensity level
}
```

### ColorPalette

```typescript
interface ColorPalette {
  empty: string;   // "#EBEDF0" (light gray)
  level1: string;  // "#9BE9A8" (25% intensity)
  level2: string;  // "#40C463" (50% intensity)
  level3: string;  // "#30A14E" (75% intensity)
  level4: string;  // "#216E39" (100% intensity)
}
```

### TaskData

```typescript
interface TaskData {
  id: string;
  name: string;
  icon: string;              // SF Symbol name
  color: string;             // Hex color
  todayCount: number;
  currentStreak: number;
  bestStreak: number;
  isMultiCompletion: boolean;
  isArchived: boolean;
  sortOrder: number;
  streakEnabled: boolean;
}
```

### PendingWidgetAction

```typescript
interface PendingWidgetAction {
  id: string;
  type: 'quick_add' | 'quick_remove';
  taskId: string;
  date: string;      // YYYY-MM-DD
  timestamp: string; // ISO8601
  processed: boolean;
}
```

## Key Files

### React Native Side

| File | Purpose |
|------|---------|
| `src/services/WidgetDataService.ts` | Orchestrates sync, processes pending actions |
| `src/hooks/useWidgetSync.ts` | Lifecycle management, foreground detection |

### Native Bridge

| File | Purpose |
|------|---------|
| `ios/WidgetBridge.swift` | Native methods for App Groups access |
| `ios/WidgetBridge.m` | Objective-C bridge declarations |

### Widget Extension

| File | Purpose |
|------|---------|
| `ios/GreenStreakWidgets/GreenStreakWidgetsBundle.swift` | Widget bundle entry point |
| `ios/GreenStreakWidgets/Core/Models/WidgetData.swift` | Data model definitions |
| `ios/GreenStreakWidgets/Core/Services/SharedDataStore.swift` | App Groups data access |

## WidgetBridge API

### Data Sync Methods

```typescript
// Sync data to App Groups and reload widgets
syncWidgetData(jsonString: string): Promise<{success: boolean}>

// Force reload all widget timelines
reloadWidgets(): Promise<{success: boolean}>

// Reload specific widget by kind
reloadWidget(kind: string): Promise<{success: boolean}>

// Get current widget data from storage
getWidgetData(): Promise<string | null>
```

### Pending Actions Methods

```typescript
// Get pending widget actions as JSON
getPendingActions(): Promise<string>

// Mark actions as processed (also cleans up old actions)
markActionsProcessed(actionIds: string[]): Promise<{success: boolean, processed: number}>
```

## WidgetDataService API

```typescript
class WidgetDataService {
  // Check if widgets supported (iOS only)
  isSupported(): boolean

  // Initialize service, subscribe to stores
  initialize(): void

  // Clean up subscriptions
  destroy(): void

  // Schedule debounced sync (500ms)
  scheduleSync(): void

  // Force immediate sync
  async forceSync(): Promise<void>

  // Get unprocessed pending actions
  async getPendingActions(): Promise<PendingWidgetAction[]>

  // Process all pending actions with handlers
  async processPendingActions(handlers: {
    onQuickAdd: (taskId: string, date: string) => Promise<void>;
    onQuickRemove: (taskId: string, date: string) => Promise<void>;
  }): Promise<{processed: string[], failed: string[]}>

  // Mark actions as processed
  async markActionsProcessed(actionIds: string[]): Promise<void>
}
```

## useWidgetSync Hook

```typescript
const { syncWidgetData } = useWidgetSync();

// Manual sync when needed
await syncWidgetData();
```

The hook automatically:
- Initializes WidgetDataService on mount
- Processes pending widget actions on mount and foreground
- Syncs data after processing
- Handles date rollover (midnight sync)

## Icon Mapping

QuickAdd widgets map Lucide icon names (used by the React Native app) to SF Symbols (used by iOS). The mapping is defined in `QuickAddView.swift` and `QuickAddGridView.swift`.

Common mappings:
- `droplet` → `drop.fill`
- `dumbbell` → `dumbbell.fill`
- `book` → `book.fill`
- `heart` → `heart.fill`
- `brain` → `brain.head.profile`
- `coffee` → `cup.and.saucer.fill`
- `sun` → `sun.max.fill`
- `moon` → `moon.fill`
- Default fallback: `checkmark.circle.fill`

See the full mapping in the Swift files for all supported icons.

## Configuration

### App Groups

Both the main app and widget extension must be configured with the same App Group:

```
group.com.greenstreak.shared
```

### Storage Keys

| Key | Content |
|-----|---------|
| `widgetData` | JSON string of WidgetSyncData |
| `quickAddConfig` | JSON string of QuickAddConfig |
| `pendingWidgetActions` | JSON array of pending actions |

## Performance Optimizations

1. **Debouncing:** 500ms debounce batches rapid store changes
2. **Change Detection:** JSON comparison skips redundant syncs
3. **Smart Refresh:** Different intervals for active/inactive hours
4. **Auto-cleanup:** Processed actions older than 1 hour are purged
5. **Concurrent Processing Guard:** `isProcessingRef` prevents duplicate processing

## Error Handling

- Platform detection prevents iOS calls on Android
- Graceful fallbacks to placeholder data
- Failed action processing continues with remaining actions
- All errors logged for debugging

## Testing the Widgets

1. Build and run the app on iOS simulator or device
2. Long-press home screen → tap "+" to add widgets
3. Search "Green Streak"
4. Add LiveCalendarWidget (Green Streak)
5. Add QuickAddWidget (Quick Add) - configure a single task
6. Add QuickAddGridWidget (Quick Add Grid) - configure up to 4 tasks
7. Tap any QuickAdd widget to test quick add
8. Verify all widgets sync together:
   - QuickAdd count updates
   - QuickAddGrid counts update
   - LiveCalendar contribution grid updates
9. Open the app and verify the completion was recorded

## Related Documentation

- [Widget Setup Guide](./widget-setup.md) - Xcode project configuration
- [Architecture](./architecture.md) - Overall app architecture
- [Data Models](./data-models.md) - Core data structures
