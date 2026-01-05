# Green Streak Design System & Style Guide

## Overview
Green Streak is a React Native habit tracking app built with Expo, featuring a GitHub-style contribution graph interface. This document defines our design system, component patterns, and UX standards to ensure consistency and quality across the application.

## Design Philosophy

### Core Principles
1. **Simplicity First** - Clean, uncluttered interfaces that focus on the essential user tasks
2. **Visual Consistency** - Unified spacing, typography, and color usage throughout the app
3. **Accessibility** - WCAG AA compliance with proper contrast, touch targets, and semantic markup
4. **Purposeful Animation** - Smooth, meaningful animations that enhance user understanding
5. **GitHub-Inspired** - Drawing visual inspiration from GitHub's contribution graph and clean interface design

### Visual Identity
- **Primary Color**: `#22c55e` (GitHub-style green)
- **Background**: `#F9F7F4` (US Graphics inspired warm eggshell)
- **Accent**: `#F8EAC7` (Warm cream for special elements)
- **Typography**: System fonts (SF Pro on iOS, Roboto on Android) for optimal readability
- **Icons**: Lucide React Native for consistent, modern iconography

---

## Color System

### Primary Palette
```typescript
colors: {
  // Backgrounds
  background: '#F9F7F4',     // Primary app background (warm eggshell)
  surface: '#FFFFFF',        // Card and content backgrounds
  
  // Accents
  accent: {
    warm: '#F8EAC7',         // Warm cream accent
    light: '#FDF8F0',        // Very light warm tint
  },
  
  // Text hierarchy
  text: {
    primary: '#1F2937',      // Main text content
    secondary: '#6B7280',    // Secondary information
    tertiary: '#9CA3AF',     // Disabled/placeholder text
    inverse: '#FFFFFF',      // Text on dark backgrounds
  },
  
  // UI States
  primary: '#22c55e',        // Primary actions, GitHub green
  success: '#10b981',        // Success states
  warning: '#f59e0b',        // Warning states
  error: '#ef4444',          // Error states
  info: '#3b82f6',          // Informational states
}
```

### GitHub Contribution Colors
```typescript
contribution: {
  empty: '#EBEDF0',         // No activity
  level1: '#C6E48B',        // Light activity
  level2: '#7BC96F',        // Moderate activity
  level3: '#239A3B',        // High activity
  level4: '#196127',        // Very high activity
}
```

### Color Usage Guidelines
- **Background**: Use `background` for main app areas, `surface` for cards and elevated content
- **Text**: Follow hierarchy - primary for headings/important content, secondary for supporting text
- **Interactive Elements**: Use `primary` for main actions, `interactive.default` for secondary actions
- **Contribution Graph**: Only use the defined contribution color scale
- **Accessibility**: All color combinations maintain WCAG AA contrast ratios (4.5:1 minimum)

---

## Typography System

### Font Families
```typescript
fontFamily: {
  system: {
    ios: '-apple-system',
    android: 'Roboto', 
    default: 'system-ui',
  },
  mono: {
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  },
}
```

### Type Scale
```typescript
textStyles: {
  h1: {
    fontSize: 30,           // 3xl
    lineHeight: 42,         // 3xl
    fontWeight: '700',      // bold
    letterSpacing: -0.5,    // tight
  },
  h2: {
    fontSize: 24,           // 2xl
    lineHeight: 36,         // 2xl
    fontWeight: '700',      // bold
    letterSpacing: -0.5,    // tight
  },
  h3: {
    fontSize: 20,           // xl
    lineHeight: 32,         // xl
    fontWeight: '600',      // semibold
    letterSpacing: 0,       // normal
  },
  body: {
    fontSize: 16,           // base
    lineHeight: 24,         // base
    fontWeight: '400',      // normal
    letterSpacing: 0,       // normal
  },
  bodySmall: {
    fontSize: 14,           // sm
    lineHeight: 20,         // sm
    fontWeight: '400',      // normal
    letterSpacing: 0,       // normal
  },
  caption: {
    fontSize: 12,           // xs
    lineHeight: 16,         // xs
    fontWeight: '400',      // normal
    letterSpacing: 0.5,     // wide
  },
  button: {
    fontSize: 16,           // base
    lineHeight: 24,         // base
    fontWeight: '500',      // medium
    letterSpacing: 0.5,     // wide
  },
  buttonSmall: {
    fontSize: 14,           // sm
    lineHeight: 20,         // sm
    fontWeight: '500',      // medium
    letterSpacing: 0.5,     // wide
  },
}
```

### Typography Usage Rules
1. **Hierarchy**: Use h1 for page titles, h2 for section titles, h3 for subsections
2. **Line Height**: Maintain consistent line-height ratios for readability
3. **Font Weights**: Avoid using more than 3 font weights per screen
4. **Letter Spacing**: Use tight spacing for headings, wide for buttons/labels
5. **Platform Fonts**: Always use system fonts for optimal native performance

---

## Spacing & Layout

### Spacing Scale (4px base unit)
```typescript
spacing: {
  0: 0,      1: 4,      2: 8,      3: 12,     4: 16,
  5: 20,     6: 24,     7: 28,     8: 32,     9: 36,
  10: 40,    11: 44,    12: 48,    16: 64,    20: 80,
  24: 96,    32: 128,   40: 160,   48: 192,   56: 224,
  64: 256,
}
```

### Border Radius
```typescript
borderRadius: {
  none: 0,    sm: 2,     base: 4,    md: 6,     lg: 8,
  xl: 12,     '2xl': 16, '3xl': 24,  full: 9999,
}
```

### Layout Guidelines
1. **Grid System**: Use 8px (spacing[2]) as the base grid unit
2. **Component Padding**: Standard padding is spacing[4] (16px)
3. **Card Spacing**: Use spacing[3] (12px) radius for cards
4. **Section Margins**: spacing[6] (24px) between major sections
5. **Touch Targets**: Minimum 44x44px for interactive elements
6. **Content Width**: Maximum 400px for reading comfort on larger screens

---

## Component Patterns

### Buttons (AnimatedButton)

#### Variants
- **Primary**: `backgroundColor: colors.primary`, white text
- **Secondary**: Light background with border, primary text color
- **Destructive**: `backgroundColor: colors.error`, white text

#### Sizes
- **Small**: `paddingVertical: spacing[2], paddingHorizontal: spacing[3]`
- **Medium**: `paddingVertical: spacing[3], paddingHorizontal: spacing[4]` (default)
- **Large**: `paddingVertical: spacing[4], paddingHorizontal: spacing[6]`

#### Animation Standards
```typescript
// Press animations
scale: withSpring(0.95, { damping: 15 })     // On press down
opacity: withTiming(0.7, { duration: 150 })  // On press down
scale: withSpring(1, { damping: 15 })        // On release
opacity: withTiming(1, { duration: 150 })    // On release

// Haptic-like feedback
scale: withSequence(
  withSpring(0.9, { damping: 15 }),
  withSpring(1, { damping: 15 })
)
```

### Cards
```typescript
cardStyle: {
  backgroundColor: colors.surface,
  borderRadius: spacing[3],
  padding: spacing[4],
  ...shadows.sm,
}
```

### Form Elements
- **Text Inputs**: `backgroundColor: colors.surface`, 1px border, shadows.sm
- **Toggles**: Custom toggle component, 44x24px, 12px border radius
- **Selections**: Primary color background when selected, white text

### Icons
- **Source**: Lucide React Native exclusively
- **Sizes**: 16px (small), 20px (medium), 24px (large), 64px (hero)
- **Colors**: Use text color hierarchy, primary color for active states
- **Usage**: Always provide accessible labels

---

## Animation Guidelines

### Timing & Easing
```typescript
// Standard timing curves
spring: { damping: 15 }                    // UI feedback animations
timing: { duration: 150-300 }              // State transitions
delay: 100-200ms                           // Staggered animations
```

### Animation Patterns

#### Entrance Animations
- **FadeInUp**: Content appearing from bottom
- **SlideInRight**: Panels sliding from right
- **Spring scale**: 0.8 → 1.0 for appearing elements

#### Feedback Animations
- **Scale**: 0.95 → 1.0 for button presses
- **Opacity**: 1.0 → 0.7 → 1.0 for selections
- **Color transitions**: 200ms for state changes

#### Exit Animations
- **FadeOutDown**: Content disappearing downward
- **SlideOutLeft**: Panels sliding to left

### Animation Rules
1. **Duration**: Keep under 300ms for UI feedback, 400ms max for transitions
2. **Easing**: Use spring animations for organic feel, timing for precise movements
3. **Performance**: Avoid animating layout properties, prefer transforms and opacity
4. **Accessibility**: Provide `prefers-reduced-motion` support
5. **Purpose**: Every animation should serve a functional purpose

---

## Component Standards

### Screen Structure Template
```typescript
const Screen: React.FC = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.header}>
      {/* Header content */}
    </View>
    <ScrollView style={styles.scrollView}>
      {/* Main content */}
    </ScrollView>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  scrollView: {
    flex: 1,
    padding: spacing[4],
  },
});
```

### Modal Pattern
```typescript
<AnimatedModal
  visible={showModal}
  onClose={() => setShowModal(false)}
  animationType="slide"
>
  <ScreenContent onClose={() => setShowModal(false)} />
</AnimatedModal>
```

### Section Pattern
```typescript
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Section Title</Text>
  {/* Section content */}
</View>

// Styles
section: {
  marginBottom: spacing[6],
},
sectionTitle: {
  ...textStyles.h3,
  color: colors.text.primary,
  marginBottom: spacing[3],
},
```

---

## Accessibility Standards

### Minimum Requirements
1. **Color Contrast**: WCAG AA (4.5:1 for normal text, 3:1 for large text)
2. **Touch Targets**: Minimum 44x44px interactive areas
3. **Screen Reader Support**: Proper `accessibilityLabel`, `accessibilityHint`, `accessibilityRole`
4. **Keyboard Navigation**: Full app navigation without touch
5. **Focus Management**: Clear focus indicators, logical tab order

### Implementation Guidelines
```typescript
// Example accessible button
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Add new habit"
  accessibilityHint="Opens the habit creation form"
  style={styles.button}
  onPress={handlePress}
>
  <Text>{title}</Text>
</TouchableOpacity>
```

### Testing Requirements
- Test with VoiceOver (iOS) and TalkBack (Android)
- Verify all interactive elements are discoverable
- Ensure logical reading order
- Test without color (grayscale mode)
- Verify touch target sizes on real devices

---

## Code Style Guidelines

### File Organization
```
src/
├── components/           # Reusable UI components
│   ├── common/          # Basic components (Icon, Button, etc.)
│   ├── ComponentName/   # Complex components with their own folder
│   │   ├── index.ts
│   │   ├── ComponentName.tsx
│   │   └── __tests__/
├── screens/             # Screen components
├── theme/               # Design tokens
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── index.ts
└── types/               # TypeScript definitions
```

### Component Structure
```typescript
// ComponentName.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textStyles, spacing, shadows } from '../theme';

interface ComponentProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary';
}

export const ComponentName: React.FC<ComponentProps> = ({
  title,
  onPress,
  variant = 'primary',
}) => {
  return (
    <View style={[styles.container, styles[variant]]}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing[4],
    borderRadius: spacing[2],
    alignItems: 'center',
    ...shadows.sm,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    ...textStyles.button,
    color: colors.text.primary,
  },
});

export default ComponentName;
```

### Style Guidelines
1. **Theme Usage**: Always import and use theme tokens, never hardcode values
2. **StyleSheet**: Use `StyleSheet.create()` for performance optimization
3. **Conditional Styles**: Use arrays for conditional styling: `[baseStyle, conditionalStyle]`
4. **Platform Styles**: Use `Platform.select()` for platform-specific differences
5. **Naming**: Use descriptive, semantic names (not visual descriptions)

### TypeScript Standards
```typescript
// Prop interfaces
interface ComponentProps {
  title: string;                    // Required props first
  subtitle?: string;                // Optional props after
  onPress: () => void;              // Functions with clear return types
  variant?: 'primary' | 'secondary'; // Union types for variants
}

// Event handlers
const handlePress = useCallback(() => {
  // Handler implementation
}, [dependencies]);

// State typing
const [loading, setLoading] = useState<boolean>(false);
const [data, setData] = useState<DataType[]>([]);
```

---

## Quality Assurance Checklist

### Design Review Checklist
- [ ] Uses only approved colors from design system
- [ ] Typography follows defined hierarchy and scale
- [ ] Spacing uses grid system (multiples of 4px)
- [ ] Icons are from Lucide React Native library
- [ ] Touch targets meet minimum 44x44px requirement
- [ ] Color contrast meets WCAG AA standards
- [ ] Animations follow timing and easing guidelines
- [ ] Components match defined patterns

### Code Review Checklist
- [ ] Imports theme tokens instead of hardcoded values
- [ ] Uses StyleSheet.create() for performance
- [ ] Follows file and folder naming conventions
- [ ] Includes proper TypeScript interfaces
- [ ] Implements accessibility attributes
- [ ] Follows component structure template
- [ ] Has appropriate error handling
- [ ] Includes loading states where applicable

### Testing Requirements
- [ ] Component renders without errors
- [ ] Interactive elements respond properly
- [ ] Accessibility labels are meaningful
- [ ] Works on both iOS and Android
- [ ] Performs well on various screen sizes
- [ ] Animations don't cause performance issues
- [ ] Error states display appropriately
- [ ] Loading states provide feedback

---

## Component Library Reference

### Available Components

#### Core UI
- `AnimatedButton` - Primary interactive element with press animations
- `Icon` - Lucide icon wrapper with size variants
- `AnimatedModal` - Full-screen modal with slide animations

#### Specialized
- `ContributionGraph` - GitHub-style contribution calendar
- `ContributionDay` - Individual day cell with activity visualization
- `AnimatedTaskList` - Animated list of tasks with expand/collapse
- `TaskCard` - Individual task display component

#### Layout
- Standard screen structure with SafeAreaView, header, and ScrollView
- Section pattern with title and content area
- Card pattern with surface styling and shadows

### Future Component Needs
- `Toast` - Temporary notification component
- `ActionSheet` - Bottom sheet for contextual actions
- `ProgressBar` - Linear progress indicator
- `Switch` - Consistent toggle component
- `DatePicker` - Platform-appropriate date selection
- `SearchInput` - Dedicated search input component

---

## Platform Considerations

### iOS Specific
- Use iOS-appropriate navigation patterns
- Respect safe area insets
- Follow iOS Human Interface Guidelines for gestures
- Use SF Symbols when available through Lucide

### Android Specific  
- Implement Material Design principles where appropriate
- Handle Android back button behavior
- Respect status bar styling
- Use appropriate elevation/shadows

### Cross-Platform
- Test gesture handling on both platforms
- Verify animation performance across devices
- Ensure consistent spacing and sizing
- Handle keyboard avoidance uniformly

---

## Performance Guidelines

### Optimization Standards
1. **FlatList**: Use for large lists instead of ScrollView with many items
2. **Image Optimization**: Use appropriate formats and sizes
3. **Animation**: Use native driver when possible
4. **Memory**: Implement proper cleanup in useEffect
5. **Bundle Size**: Import only needed parts of libraries

### Monitoring
- Track app launch time
- Monitor memory usage during scrolling
- Check animation frame rates
- Measure time to interactive
- Test on older devices

---

This design system is a living document that should evolve with the app. All changes to design tokens, components, or patterns should be reflected here and communicated to the development team.

**Version**: 1.0.0  
**Last Updated**: January 2026  
**Next Review**: February 2026