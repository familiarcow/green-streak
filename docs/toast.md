# Toast Notification System - Complete Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Installation & Setup](#installation--setup)
4. [Basic Usage](#basic-usage)
5. [Advanced Features](#advanced-features)
6. [Service Registry Integration](#service-registry-integration)
7. [Components Reference](#components-reference)
8. [Configuration](#configuration)
9. [Troubleshooting](#troubleshooting)
10. [API Reference](#api-reference)

## Overview

The Green Streak toast notification system provides a comprehensive, production-ready solution for in-app notifications with animations, sound effects, and visual celebrations. The system is built with performance, scalability, and user experience as top priorities.

### Key Features
- 🎯 **Priority-based queue management** with deduplication and rate limiting
- 🎨 **Multiple toast variants** (success, error, warning, info, celebration)
- 🎵 **Sound effects** with lazy loading (expo-av integration)
- 🎊 **Confetti animations** for celebrations
- 📱 **Swipe-to-dismiss** gesture support
- 🔄 **Automatic cleanup** and memory management
- 🏗️ **Service-oriented architecture** with dependency injection
- ⚡ **Performance optimized** with React.memo and memoization
- 🛡️ **Error boundaries** for resilience

## Architecture

### System Overview
```
┌─────────────────────────────────────────────────────────┐
│                     App Component                        │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │               ToastProvider (Context)             │  │
│  │                                                   │  │
│  │  ┌───────────────┐    ┌────────────────────┐    │  │
│  │  │  ToastContext │───▶│ ToastNotification  │    │  │
│  │  │   (State)     │    │     Service         │    │  │
│  │  └───────────────┘    └────────────────────┘    │  │
│  │                               │                   │  │
│  │                               ▼                   │  │
│  │                    ┌─────────────────────┐       │  │
│  │                    │    ToastQueue       │       │  │
│  │                    │  (Priority, Dedup,  │       │  │
│  │                    │   Rate Limiting)    │       │  │
│  │                    └─────────────────────┘       │  │
│  │                                                   │  │
│  │  ┌───────────────┐    ┌────────────────────┐    │  │
│  │  │SoundEffects   │◀───│  ConfettiService  │    │  │
│  │  │   Service     │    └────────────────────┘    │  │
│  │  └───────────────┘                               │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │            ToastContainer (UI Layer)              │  │
│  │                                                   │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │  │
│  │  │  Toast   │  │  Toast   │  │  Toast   │      │  │
│  │  │Component │  │Component │  │Component │      │  │
│  │  └──────────┘  └──────────┘  └──────────┘      │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Service Registry
All toast services are registered in the central ServiceRegistry for dependency injection:
- `toast` - ToastNotificationService
- `sound` - SoundEffectsService  
- `confetti` - ConfettiService
- `orchestrator` - NotificationOrchestrator

## Installation & Setup

### 1. Basic Setup

The toast system is automatically initialized when the app starts. Services are registered in `ServiceRegistry`:

```typescript
// src/services/ServiceRegistry.ts
const soundService = new SoundEffectsService();
const confettiService = new ConfettiService();
const toastService = new ToastNotificationService(soundService, confettiService);
const orchestrator = createNotificationOrchestrator(notificationService, toastService);
```

### 2. Provider Setup

Wrap your app with the ToastProvider:

```tsx
// App.tsx
import { ToastProvider } from './src/contexts/ToastContext';
import { ToastContainer } from './src/components/Toast';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ToastProvider>
          <YourAppContent />
          <ToastContainer />
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

## Basic Usage

### Simple Toast

```typescript
import { useToast } from '../contexts/ToastContext';

function MyComponent() {
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast({
      message: 'Task completed!',
      variant: 'success',
      icon: '✅'
    });
  };

  return <Button onPress={handleSuccess} title="Complete Task" />;
}
```

### Using NotificationOrchestrator (Recommended)

```typescript
import { getOrchestrator } from '../services';

async function showNotification() {
  const orchestrator = getOrchestrator();
  
  // Simple success toast
  await orchestrator.success('Task completed!');
  
  // Celebration with effects
  await orchestrator.celebration('100 day streak! 🎉');
  
  // Error notification
  await orchestrator.error('Failed to save');
  
  // Info with custom options
  await orchestrator.info('Reminder: Complete your daily goals', {
    priority: 'low',
    icon: '💡'
  });
}
```

## Advanced Features

### Priority Queue System

The ToastQueue manages notifications with priority levels:

```typescript
export type ToastPriority = 'low' | 'medium' | 'high' | 'critical';

// High priority toasts appear before low priority
await orchestrator.notify({
  type: 'toast',
  message: 'Critical update!',
  priority: 'critical',
  variant: 'error'
});
```

### Deduplication

Prevents the same message from appearing multiple times within 2 seconds:

```typescript
// Only the first call will show a toast
showToast({ message: 'Saved!' });
showToast({ message: 'Saved!' }); // Deduplicated
```

### Rate Limiting

Maximum 5 toasts per 10 seconds to prevent spam:

```typescript
// After 5 toasts, additional ones are rejected
for (let i = 0; i < 10; i++) {
  showToast({ message: `Toast ${i}` }); // Only first 5 show
}
```

### Custom Effects

```typescript
showToast({
  message: 'Achievement Unlocked!',
  variant: 'celebration',
  icon: '🏆',
  effects: {
    sound: 'milestone',      // 'success' | 'milestone' | 'streak' | 'error'
    confetti: 'fireworks',   // true | 'burst' | 'fireworks' | 'rain'
    haptic: true            // Vibration feedback (future)
  },
  duration: 5000,           // Custom duration (ms)
  action: {                 // Action button
    label: 'View',
    onPress: () => console.log('Viewed!')
  }
});
```

## Service Registry Integration

### Getting Services

```typescript
import { 
  getToastService,
  getSoundService,
  getConfettiService,
  getOrchestrator 
} from '../services';

// Get individual services
const toastService = getToastService();
const soundService = getSoundService();
const confettiService = getConfettiService();

// Get orchestrator for unified interface
const orchestrator = getOrchestrator();
```

### Service Lifecycle Management

```typescript
// Clean up all services on app teardown
import { serviceRegistry } from '../services';

// Destroy all services with cleanup
serviceRegistry.destroyAll();
```

## Components Reference

### ToastProvider

Context provider that manages toast state:

```typescript
interface ToastContextValue {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;
  toasts: Toast[];
  config: ToastConfig;
  updateConfig: (config: Partial<ToastConfig>) => void;
}
```

### ToastContainer

Renders visible toasts with animations:
- Automatically positions toasts
- Handles stacking with offset
- Manages enter/exit animations

### Toast Component

Individual toast with:
- Spring-based animations (Reanimated v3)
- Swipe-to-dismiss gestures
- Auto-dismiss timer
- Action button support

## Configuration

### Default Configuration

```typescript
const defaultConfig: ToastConfig = {
  duration: 3000,           // Auto-dismiss after 3 seconds
  position: 'bottom',       // 'top' | 'bottom'
  offset: 100,             // Distance from edge
  maxVisible: 3,           // Max toasts shown at once
  animationDuration: 300,  // Animation speed (ms)
  swipeToDismiss: true,   // Enable swipe gestures
  sounds: true,           // Enable sound effects
  haptics: true,          // Enable haptic feedback
};
```

### Updating Configuration

```typescript
const { updateConfig } = useToast();

// Disable sounds
updateConfig({ sounds: false });

// Show toasts at top
updateConfig({ position: 'top' });

// Show more toasts
updateConfig({ maxVisible: 5 });
```

## Streak Integration

Toasts appear for streak progress to keep you motivated:

### When Toasts Appear

**Every Day You Continue Your Streak:**
- Shows encouraging messages when you complete a task for the first time that day
- Different messages based on streak length:
  - **Days 1-6**: "Keep it up! 🔥", "You're on fire!", "LFG! 🚀"
  - **Day 7, 14, 21, 28**: "One week strong! 💪" (with confetti)
  - **Day 30, 60, 90**: "Month milestone! 🏆" (with confetti)
  - **Day 100+**: "LEGENDARY STREAK! 🏆" (with fireworks)

**Special Cases:**
- **Starting Fresh** (Day 1 from 0): "Let's go! Starting fresh!"
- **Recovering** (Day 1 after break): "Back on track! Let's rebuild!"
- **Milestones**: Extra celebration with confetti/fireworks

### When Toasts DON'T Appear

1. **Multiple Completions Same Day**
   - Only the first completion shows a toast
   - Additional completions on the same day are silent

2. **Backfilling Previous Days**
   - Completing tasks for yesterday or earlier dates
   - No toast shown (only for TODAY's completions)

3. **No Streak Progress**
   - If the streak count doesn't increase
   - Prevents duplicate toasts

### Examples

✅ **Shows Toast:**
- First completion today that continues streak
- Completing task on current date
- Starting a new streak

❌ **No Toast:**
- Second/third completion of same task today
- Marking yesterday's task as complete
- Backfilling missed days

This ensures toasts are motivating without being annoying or repetitive.

### Implementation in useTaskActions

```typescript
// Automatic toast on task completion
const handleQuickAdd = useCallback(async (taskId: string, date?: string) => {
  // ... log completion ...
  
  if (updatedStreak && targetDate === getTodayString()) {
    const message = getStreakMessage(currentStreak, previousStreak);
    const isMilestone = isStreakMilestone(currentStreak);
    
    showToast({
      message,
      variant: isMilestone ? 'celebration' : 'success',
      icon: currentStreak >= 100 ? '💯' : currentStreak >= 30 ? '🌟' : '🔥',
      effects: {
        sound: isMilestone ? 'milestone' : 'streak',
        confetti: isMilestone ? 'burst' : false,
        haptic: true,
      },
    });
  }
}, [...]);
```

## Troubleshooting

### Toasts Not Appearing

1. **Check Provider Setup**
   - Ensure `ToastProvider` wraps your app
   - Ensure `ToastContainer` is rendered

2. **Check Service Registration**
   ```typescript
   import { serviceRegistry } from '../services';
   
   // Verify services are registered
   console.log(serviceRegistry.getRegisteredServices());
   // Should include: ['toast', 'sound', 'confetti', 'orchestrator']
   ```

3. **Check for Errors**
   - Toast system has error boundaries that prevent crashes
   - Check console for error logs with category `TOAST`

### Memory Leaks

All services have proper cleanup:

```typescript
// ToastQueue
const queue = new ToastQueue();
queue.destroy(); // Cleans up interval timer

// NotificationOrchestrator
const orchestrator = getOrchestrator();
orchestrator.destroy(); // Cleans up timeouts and queue

// ServiceRegistry cleanup
serviceRegistry.destroyAll(); // Destroys all services
```

### Performance Issues

1. **Reduce Max Visible**
   ```typescript
   updateConfig({ maxVisible: 2 }); // Show fewer toasts
   ```

2. **Disable Effects**
   ```typescript
   updateConfig({ sounds: false }); // Disable sounds
   ```

3. **Check Queue Stats**
   ```typescript
   const stats = orchestrator.getQueueStats();
   console.log(stats);
   // { queueSize: 0, rateLimitRemaining: 5, ... }
   ```

## API Reference

### Toast Interface

```typescript
interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
  icon?: string;
  effects?: ToastEffects;
  action?: {
    label: string;
    onPress: () => void;
  };
  onDismiss?: () => void;
}

type ToastVariant = 'success' | 'warning' | 'info' | 'celebration' | 'error';

interface ToastEffects {
  confetti?: boolean | 'burst' | 'fireworks' | 'rain';
  sound?: 'success' | 'milestone' | 'streak' | 'error' | 'none';
  haptic?: boolean;
}
```

### ToastQueue Methods

```typescript
class ToastQueue {
  enqueue(toast: any, priority?: ToastPriority): QueuedToast | null;
  dequeue(): QueuedToast | null;
  dequeueMultiple(limit: number): QueuedToast[];
  peek(): QueuedToast | null;
  size(): number;
  clear(): void;
  destroy(): void;
  getStats(): QueueStats;
}
```

### NotificationOrchestrator Methods

```typescript
class NotificationOrchestrator {
  // Main notification method
  notify(notification: UnifiedNotification): Promise<void>;
  
  // Convenience methods
  success(message: string, options?: Partial<UnifiedNotification>): Promise<void>;
  error(message: string, options?: Partial<UnifiedNotification>): Promise<void>;
  warning(message: string, options?: Partial<UnifiedNotification>): Promise<void>;
  info(message: string, options?: Partial<UnifiedNotification>): Promise<void>;
  celebration(message: string, options?: Partial<UnifiedNotification>): Promise<void>;
  
  // Queue management
  getQueueStats(): QueueStats;
  clearToastQueue(): void;
  
  // Lifecycle
  destroy(): void;
}
```

## Best Practices

1. **Use the Orchestrator** for all notifications to benefit from queue management
2. **Set appropriate priorities** - Reserve 'critical' for important errors
3. **Keep messages concise** - Toast messages should be short and actionable
4. **Use icons consistently** - Help users quickly identify notification types
5. **Test rate limiting** - Ensure your app doesn't spam users with toasts
6. **Clean up on unmount** - Call destroy methods when components unmount
7. **Handle errors gracefully** - The system won't crash, but log errors for debugging

## Migration Guide

If upgrading from a previous notification system:

1. Replace direct toast calls with orchestrator
2. Update import paths to use centralized exports
3. Remove any manual timer management (now handled automatically)
4. Update tests to mock the orchestrator

## Testing

```typescript
// Mock the orchestrator for testing
jest.mock('../services', () => ({
  getOrchestrator: () => ({
    success: jest.fn(),
    error: jest.fn(),
    celebration: jest.fn(),
    destroy: jest.fn(),
  })
}));

// Test toast display
const orchestrator = getOrchestrator();
await orchestrator.success('Test message');
expect(orchestrator.success).toHaveBeenCalledWith('Test message');
```

## Performance Considerations

- **Lazy Loading**: Sounds load on first use, not at startup
- **Memoization**: Context values and visible toasts are memoized
- **React.memo**: Toast components only re-render when their data changes
- **Queue Limits**: Maximum 50 toasts in queue, old ones are dropped
- **Cleanup**: All timers and resources properly cleaned on unmount

## Future Enhancements

- [ ] Haptic feedback with expo-haptics
- [ ] Actual sound files (currently placeholders)
- [ ] Persistence for notification history
- [ ] Analytics tracking for engagement
- [ ] A/B testing support for messages
- [ ] Custom animation curves
- [ ] Theme customization
- [ ] Accessibility improvements

## Support

For issues or questions:
1. Check the console for debug logs (categories: TOAST, TOAST_CONTEXT, TOAST_QUEUE)
2. Verify service registration with `serviceRegistry.getHealthStatus()`
3. Review the architecture diagram above
4. Check the troubleshooting section

---

*Last updated: January 2024*
*Version: 1.0.0*