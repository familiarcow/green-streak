# Animation Rules

*Created: January 3, 2026*  
*Last Modified: January 5, 2026*

This document defines the standard animation patterns and timing for consistent user experience throughout the Green Streak application, now using React Native Reanimated 2 for enhanced performance.

## Modal Animations

### Two-Stage Animation Pattern

All modal presentations should use a two-stage animation sequence for a polished, premium feel:

#### Opening Sequence:
1. **Background Fade In** (200ms) - Overlay dims quickly to establish context
2. **Content Animation** (300ms) - Modal content animates in after background is set

#### Closing Sequence:
1. **Content Animation** (300ms) - Modal content animates out first
2. **Background Fade Out** (200ms) - Overlay fades after content has exited

### Implementation Pattern:

```typescript
// Animation refs
const backgroundOpacity = useRef(new Animated.Value(0)).current;
const contentAnim = useRef(new Animated.Value(0)).current;

// Opening handler
const handleOpen = () => {
  openModal();
  // Stage 1: Background fade in (200ms)
  Animated.timing(backgroundOpacity, {
    toValue: 1,
    duration: 200,
    useNativeDriver: true,
  }).start(() => {
    // Stage 2: Content animation (300ms)
    Animated.timing(contentAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  });
};

// Closing handler
const handleClose = () => {
  // Stage 1: Content animation out (300ms)
  Animated.timing(contentAnim, {
    toValue: 0,
    duration: 300,
    useNativeDriver: true,
  }).start(() => {
    // Stage 2: Background fade out (200ms)
    Animated.timing(backgroundOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      closeModal();
      // Reset for next time
      backgroundOpacity.setValue(0);
      contentAnim.setValue(0);
    });
  });
};
```

### JSX Structure:

```tsx
<Modal transparent visible={isVisible} animationType="none">
  <Animated.View 
    style={{
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      opacity: backgroundOpacity,
    }}
  >
    <Animated.View 
      style={{
        // Modal content styles
        transform: [{
          translateY: contentAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [400, 0], // Slide up from bottom
          }),
        }],
      }}
    >
      {/* Modal content */}
    </Animated.View>
  </Animated.View>
</Modal>
```

## Standard Durations

### Quick Actions (< 250ms)
- Button press feedback
- Icon state changes
- Background dimming

**Duration: 200ms**

### Content Transitions (250-400ms)
- Modal slide animations
- Screen transitions
- Content reveals

**Duration: 300ms**

### Complex Animations (400ms+)
- Multi-stage sequences
- Loading states
- Onboarding flows

**Duration: Variable, typically 500-800ms**

## Animation Principles

### 1. **Sequential Over Simultaneous**
- Break complex animations into stages
- Each stage should have clear purpose
- Wait for completion before starting next stage

### 2. **Background First**
- Always establish context (background dim) before content
- Reverse order on exit (content first, then background)

### 3. **Native Driver Priority**
- Use `useNativeDriver: true` whenever possible
- Exceptions: Layout properties (width, height, padding)

### 4. **Reset After Completion**
- Always reset animation values after modal close
- Ensures consistent behavior on re-open

### 5. **Disable Default Animations**
- Use `animationType="none"` on Modal components
- Implement custom animations for full control

## Common Patterns

### Slide Up Modal (Bottom Sheet)
```typescript
outputRange: [400, 0] // Slide up from 400px below
```

### Slide Down Modal (Top Sheet)
```typescript
outputRange: [-400, 0] // Slide down from 400px above
```

### Scale Modal (Center)
```typescript
transform: [{ 
  scale: contentAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1]
  })
}]
```

### Fade Modal
```typescript
opacity: contentAnim
```

## Examples in Codebase

### DailyLog Modal (HomeScreen.tsx)
- **Pattern**: Two-stage slide up
- **Timing**: 200ms fade → 300ms slide
- **Exit**: 300ms slide → 200ms fade

### Add Task Modal (HomeScreen.tsx)
- **Pattern**: Standard slide up
- **Implementation**: Should follow two-stage pattern

## Testing Animations

### Visual Testing
1. Open and close modals multiple times
2. Verify smooth transitions
3. Check for jarring simultaneous animations
4. Test on different devices/orientations

### Performance Testing
1. Monitor for dropped frames
2. Verify native driver usage
3. Test with React Native performance profiler

## React Native Reanimated 2 Patterns

### Golden Highlight Slider (TimePeriodSelector)

The time period selector uses a sliding golden highlight with spring physics:

```typescript
import {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const highlightPosition = useSharedValue(0);
const highlightWidth = useSharedValue(0);

// Spring configuration
const springConfig = {
  damping: 15,
  stiffness: 200,
};

// Animate position and width
useEffect(() => {
  highlightPosition.value = withSpring(layout.x, springConfig);
  highlightWidth.value = withSpring(layout.width, springConfig);
}, [selected]);

// Animated style
const highlightStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: highlightPosition.value }],
  width: highlightWidth.value,
}));
```

### Staggered Entry Animations (LiveCalendar)

Calendar days fade in with cascading delays for visual appeal:

```typescript
import { FadeIn, FadeInDown } from 'react-native-reanimated';

// Week rows with staggered entry
<Animated.View
  entering={FadeInDown.delay(weekIndex * 50).springify()}
  style={styles.weekRow}
>
  {weekData.map((day, dayIndex) => {
    const animationDelay = weekIndex * 50 + dayIndex * 10;
    return (
      <Animated.View
        key={day.date}
        entering={FadeIn.delay(animationDelay).springify()}
      >
        {/* Day content */}
      </Animated.View>
    );
  })}
</Animated.View>
```

### View Transitions

Smooth transitions between calendar view types:

```typescript
const fadeInValue = useSharedValue(0);

useEffect(() => {
  // Reset and animate
  fadeInValue.value = 0;
  fadeInValue.value = withDelay(100, withSpring(1, {
    damping: 15,
    stiffness: 200,
  }));
}, [viewType]);

const animatedContainerStyle = useAnimatedStyle(() => ({
  opacity: fadeInValue.value,
}));
```

## Animation Guidelines

### Performance Best Practices

1. **UI Thread Animations**: Use Reanimated 2 for animations that run on the UI thread
2. **Shared Values**: Use `useSharedValue` for values that drive animations
3. **Worklets**: Keep animation logic in worklets for performance
4. **Spring Physics**: Prefer spring animations over timing for natural movement

### Accessibility

```typescript
import { useReducedMotion } from 'react-native-reanimated';

const reducedMotion = useReducedMotion();

// Disable or simplify animations when reduced motion is enabled
const animatedStyle = useAnimatedStyle(() => {
  if (reducedMotion) {
    return { opacity: visible ? 1 : 0 }; // Simple fade
  }
  // Complex animation for normal motion
  return {
    opacity: fadeValue.value,
    transform: [{ scale: scaleValue.value }],
  };
});
```

## Standard Spring Configurations

### Quick Response (UI Feedback)
```typescript
const quickSpring = {
  damping: 20,
  stiffness: 300,
};
```

### Smooth Transition (Content Changes)
```typescript
const smoothSpring = {
  damping: 15,
  stiffness: 200,
};
```

### Gentle Animation (Large Elements)
```typescript
const gentleSpring = {
  damping: 18,
  stiffness: 100,
};
```

## Component-Specific Animations

### LiveCalendar
- **Entry**: Staggered FadeIn with 50ms/week, 10ms/day delays
- **View Change**: Fade transition with 100ms delay
- **Today Highlight**: Golden border with shadow glow

### TimePeriodSelector
- **Highlight Movement**: Spring animation (damping: 15, stiffness: 200)
- **Width Adjustment**: Dynamic spring to match button width
- **Color**: Golden (#FFD700) with shadow

### TodayCard
- **Date Navigation**: Instant updates (no animation for clarity)
- **Quick Add**: Scale feedback on press
- **Task Count Updates**: Fade transition

### AnimatedButton
- **Press**: Scale to 0.95 with quick spring
- **Release**: Return to 1.0 scale
- **Disabled**: Reduced opacity (0.5)

## Testing Animations

### Development Tools

1. **React Native Debugger**: Monitor performance
2. **Flipper**: Analyze frame rates
3. **Chrome DevTools**: Profile JavaScript thread

### Performance Metrics

- **Target FPS**: 60fps for all animations
- **Frame Drop Threshold**: < 5% dropped frames
- **UI Thread Usage**: Keep animations on UI thread

### Testing Checklist

- [ ] Animations run at 60fps
- [ ] No janky transitions
- [ ] Reduced motion respected
- [ ] Touch feedback immediate
- [ ] Memory usage stable
- [ ] Works on low-end devices

## Future Considerations

- Implement gesture-based dismissal animations
- Add micro-interactions for task completion
- Consider haptic feedback integration
- Explore Lottie for complex celebration animations
- Add particle effects for achievements