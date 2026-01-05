# Animation Rules

This document defines the standard animation patterns and timing for consistent user experience throughout the Green Streak application.

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

## Future Considerations

- Consider adding easing curves (e.g., `Easing.bezier`)
- Implement gesture-based dismissal animations
- Add accessibility considerations for reduced motion
- Consider haptic feedback integration