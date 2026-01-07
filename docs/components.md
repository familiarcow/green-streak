# Component Library

*Created: January 5, 2026*  
*Last Modified: January 5, 2026*

## Table of Contents

1. [Overview](#overview)
2. [Core Components](#core-components)
3. [Calendar Components](#calendar-components)
4. [Task Components](#task-components)
5. [Home Screen Components](#home-screen-components)
6. [Modal Components](#modal-components)
7. [Common Components](#common-components)
8. [Animation Components](#animation-components)
9. [Error Boundary Components](#error-boundary-components)
10. [Component Patterns](#component-patterns)

## Overview

The Green Streak component library provides a comprehensive set of reusable React Native components built with TypeScript, React Native Reanimated, and a consistent design system.

### Design Principles

1. **Composability**: Components can be combined to create complex interfaces
2. **Accessibility**: All interactive components include proper accessibility support
3. **Performance**: Optimized rendering with React.memo and proper key usage
4. **Type Safety**: Full TypeScript support with strict typing
5. **Consistency**: Unified styling through theme system

## Core Components

### LiveCalendar

**Purpose**: Multi-period calendar view with responsive grid layout

**Location**: `/src/components/ContributionGraph/LiveCalendar.tsx`

```typescript
interface LiveCalendarProps {
  data: ContributionData[];
  onDayPress: (date: string) => void;
  selectedDate?: string;
  viewType?: ViewType;
  onViewTypeChange?: (viewType: ViewType) => void;
}
```

**Features**:
- Multiple time period views (Live, 2M, 4M, 6M, 1Y, All)
- Responsive grid that maintains consistent box sizing
- Month markers for longer time periods
- Golden highlight for today with glow effect
- Staggered entry animations
- Complete week alignment

**Usage Example**:
```tsx
<LiveCalendar
  data={contributionData}
  onDayPress={handleDayPress}
  selectedDate={selectedDate}
  viewType="2m"
  onViewTypeChange={setViewType}
/>
```

**Styling**:
- Uses GitHub-style color gradients
- Consistent gap spacing between boxes
- Adaptive to container width
- Golden border for today indicator

---

### ContributionGraph

**Purpose**: Original contribution graph visualization

**Location**: `/src/components/ContributionGraph/ContributionGraph.tsx`

```typescript
interface ContributionGraphProps {
  data: ContributionData[];
  onDayPress: (date: string) => void;
  selectedDate?: string;
}
```

**Features**:
- Adaptive layout based on data volume
- Horizontal scrolling for large datasets
- Month and weekday labels
- Statistics display

**Usage Example**:
```tsx
<ContributionGraph
  data={last30DaysData}
  onDayPress={setSelectedDate}
  selectedDate={selectedDate}
/>
```

## Calendar Components

### TimePeriodSelector

**Purpose**: Animated period selector with sliding golden highlight

**Location**: `/src/components/ContributionGraph/TimePeriodSelector.tsx`

```typescript
interface TimePeriodSelectorProps {
  selected: ViewType;
  onSelect: (viewType: ViewType) => void;
}

type ViewType = 'live' | '2m' | '4m' | '6m' | '1y' | 'all';
```

**Features**:
- Golden sliding highlight animation
- Spring physics for natural movement
- Dynamic width adjustment
- Touch feedback
- Accessibility support

**Animation Details**:
```typescript
// Spring configuration
withSpring(position, {
  damping: 15,
  stiffness: 200,
})
```

**Usage Example**:
```tsx
<TimePeriodSelector
  selected={currentPeriod}
  onSelect={handlePeriodChange}
/>
```

---

### MonthMarker

**Purpose**: Overlay component for month labels on calendar grid

**Location**: `/src/components/ContributionGraph/MonthMarker.tsx`

```typescript
interface MonthMarkerProps {
  date: string;
  boxSize: number;
  contributionColor: string;
}
```

**Features**:
- Absolute positioning over calendar day
- Automatic text color contrast
- 3-letter month abbreviations
- Subtle styling to not interfere with data

**Usage Example**:
```tsx
<MonthMarker
  date="2026-01-01"
  boxSize={30}
  contributionColor="#9be9a8"
/>
```

---

### LiveCalendarDay

**Purpose**: Individual day component for LiveCalendar

**Location**: `/src/components/ContributionGraph/LiveCalendarDay.tsx`

**Features**:
- Touch handling
- Color intensity based on count
- Border highlights for selection/today
- Animated entry

## Task Components

### TaskCard

**Purpose**: Display individual task with actions

**Location**: `/src/components/TaskCard/TaskCard.tsx`

```typescript
interface TaskCardProps {
  task: Task;
  onPress?: (task: Task) => void;
  onQuickAdd?: (taskId: string) => void;
  completionCount?: number;
}
```

**Features**:
- Icon and color display
- Completion count badge
- Quick add button
- Press handling for details

**Usage Example**:
```tsx
<TaskCard
  task={task}
  onPress={openTaskDetails}
  onQuickAdd={handleQuickAdd}
  completionCount={3}
/>
```

---

### AnimatedTaskList

**Purpose**: Animated list of tasks with staggered entry

**Location**: `/src/components/AnimatedTaskList.tsx`

```typescript
interface AnimatedTaskListProps {
  tasks: Task[];
  onTaskPress: (task: Task) => void;
  onQuickAdd: (taskId: string) => void;
}
```

**Features**:
- Staggered fade-in animations
- Smooth layout transitions
- Empty state handling
- Performance optimized with FlatList

## Home Screen Components

### TodayCard

**Purpose**: Date navigation and quick-add interface

**Location**: `/src/components/HomeScreen/TodayCard.tsx`

```typescript
interface TodayCardProps {
  selectedDate: string;
  selectedDateData?: ContributionData;
  tasks: Task[];
  onQuickAdd: (taskId: string, date?: string) => void;
  onViewMore: () => void;
  onDateChange: (date: string) => void;
}
```

**Features**:
- Date navigation (prev/next)
- Quick add for any selected date
- Task preview with counts
- "Today" indicator
- Responsive layout

**Usage Example**:
```tsx
<TodayCard
  selectedDate={selectedDate}
  selectedDateData={dayData}
  tasks={activeTasks}
  onQuickAdd={handleQuickAdd}
  onViewMore={openDailyLog}
  onDateChange={setSelectedDate}
/>
```

---

### TasksSection

**Purpose**: Display list of tasks with add button

**Location**: `/src/components/HomeScreen/TasksSection.tsx`

```typescript
interface TasksSectionProps {
  tasks: Task[];
  onTaskPress: (task: Task) => void;
  onAddTask: () => void;
}
```

**Features**:
- Task list display
- Add task button
- Empty state handling
- Section header

---

### HistorySection

**Purpose**: Historical view of contribution data

**Location**: `/src/components/HomeScreen/HistorySection.tsx`

```typescript
interface HistorySectionProps {
  showHistory: boolean;
  historyDays: string[];
  contributionData: ContributionData[];
  onToggleHistory: () => void;
  onHistoryDayPress: (date: string) => void;
  onLoadMore: () => void;
}
```

**Features**:
- Expandable history view
- Load more functionality
- Day selection from history
- Performance optimized

---

### EmptyStateSection

**Purpose**: Welcome screen for new users

**Location**: `/src/components/HomeScreen/EmptyStateSection.tsx`

```typescript
interface EmptyStateSectionProps {
  onAddTask: () => void;
}
```

**Features**:
- Welcoming message
- Call-to-action button
- Animated entry
- Helpful instructions

## Modal Components

### AnimatedModal

**Purpose**: Reusable modal with animations

**Location**: `/src/components/AnimatedModal.tsx`

```typescript
interface AnimatedModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}
```

**Features**:
- Slide and fade animations
- Backdrop handling
- Swipe-to-dismiss
- Header with close button

**Usage Example**:
```tsx
<AnimatedModal
  visible={showModal}
  onClose={closeModal}
  title="Task Details"
>
  <TaskDetailsContent />
</AnimatedModal>
```

## Common Components

### Icon

**Purpose**: Consistent icon component

**Location**: `/src/components/common/Icon.tsx`

```typescript
interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}
```

**Features**:
- Emoji or icon font support
- Consistent sizing
- Theme color integration
- Accessibility labels

**Usage Example**:
```tsx
<Icon
  name="✅"
  size={24}
  color={colors.primary}
/>
```

---

### AnimatedButton

**Purpose**: Button with press animations

**Location**: `/src/components/AnimatedButton.tsx`

```typescript
interface AnimatedButtonProps {
  onPress: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
}
```

**Features**:
- Scale animation on press
- Multiple variants
- Disabled state
- Haptic feedback

**Usage Example**:
```tsx
<AnimatedButton
  onPress={handleSubmit}
  variant="primary"
  size="medium"
>
  Save Changes
</AnimatedButton>
```

## Animation Components

### AnimatedLoader

**Purpose**: Loading indicator with animations

**Location**: `/src/components/AnimatedLoader.tsx`

```typescript
interface AnimatedLoaderProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}
```

**Features**:
- Rotating animation
- Pulsing effect
- Customizable size and color
- Smooth transitions

---

### CelebrationEffect

**Purpose**: Celebration animation for achievements

**Location**: `/src/components/ContributionGraph/CelebrationEffect.tsx`

```typescript
interface CelebrationEffectProps {
  visible: boolean;
  onComplete?: () => void;
}
```

**Features**:
- Confetti animation
- Sound effects (optional)
- Auto-dismiss
- Performance optimized

## Error Boundary Components

### AppErrorBoundary

**Purpose**: Global error boundary

**Location**: `/src/components/AppErrorBoundary.tsx`

```typescript
interface AppErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error }>;
}
```

**Features**:
- Global error catching
- Error reporting
- Recovery actions
- Development vs production modes

---

### ScreenErrorBoundary

**Purpose**: Screen-level error boundary

**Location**: `/src/components/ScreenErrorBoundary.tsx`

**Features**:
- Screen-specific error handling
- Navigation recovery
- Retry functionality
- User-friendly error messages

## Component Patterns

### Composition Pattern

```tsx
// Compound components for complex UI
<TaskList>
  <TaskList.Header title="Today's Tasks" />
  <TaskList.Items tasks={tasks} />
  <TaskList.Footer>
    <AddTaskButton />
  </TaskList.Footer>
</TaskList>
```

### Render Props Pattern

```tsx
// Flexible data rendering
<DataProvider
  render={(data, loading, error) => {
    if (loading) return <Loader />;
    if (error) return <ErrorMessage />;
    return <DataDisplay data={data} />;
  }}
/>
```

### Hook-Based Pattern

```tsx
// Logic extraction with hooks
const TaskComponent = () => {
  const { tasks, loading, error, refresh } = useTasks();
  const { handleQuickAdd } = useTaskActions();
  
  return (
    <TaskList
      tasks={tasks}
      onRefresh={refresh}
      onQuickAdd={handleQuickAdd}
    />
  );
};
```

### Animation Pattern

```tsx
// Consistent animation usage
const AnimatedComponent = ({ visible }) => {
  const fadeAnim = useSharedValue(0);
  
  useEffect(() => {
    fadeAnim.value = withSpring(visible ? 1 : 0, {
      damping: 15,
      stiffness: 200,
    });
  }, [visible]);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));
  
  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};
```

### Accessibility Pattern

```tsx
// Proper accessibility support
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Add new task"
  accessibilityHint="Opens the task creation screen"
  accessibilityState={{ disabled: isDisabled }}
  onPress={handlePress}
>
  <Text>Add Task</Text>
</TouchableOpacity>
```

### Theme Integration Pattern

```tsx
// Consistent theme usage
const styles = StyleSheet.create({
  container: {
    padding: spacing[4],
    backgroundColor: colors.surface,
    borderRadius: radiusValues.lg,
    ...shadows.sm,
  },
  text: {
    ...textStyles.body,
    color: colors.text.primary,
  },
  button: {
    height: 44, // Minimum touch target
    paddingHorizontal: spacing[4],
    backgroundColor: colors.primary,
  },
});
```

### Performance Pattern

```tsx
// Optimized component rendering
const OptimizedComponent = React.memo(
  ({ data, onPress }) => {
    const processedData = useMemo(
      () => expensiveProcessing(data),
      [data]
    );
    
    const handlePress = useCallback(
      () => onPress(processedData),
      [processedData, onPress]
    );
    
    return <ExpensiveView data={processedData} onPress={handlePress} />;
  },
  (prevProps, nextProps) => {
    // Custom comparison for re-render optimization
    return prevProps.data.id === nextProps.data.id;
  }
);
```

---

This component library documentation provides a comprehensive reference for all reusable components in the Green Streak application. Each component follows consistent patterns for styling, accessibility, and performance, ensuring a cohesive and maintainable codebase.