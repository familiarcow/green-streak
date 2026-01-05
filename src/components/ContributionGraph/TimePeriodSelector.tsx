import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  useAnimatedRef,
  measure,
  runOnJS,
} from 'react-native-reanimated';
import { colors, textStyles, spacing } from '../../theme';
import { fontSizes, radiusValues } from '../../theme/utils';

export type ViewType = 'live' | '2m' | '4m' | '6m' | '1y' | 'all';

interface TimePeriod {
  label: string;
  value: ViewType;
  description: string;
}

interface TimePeriodSelectorProps {
  selected: ViewType;
  onSelect: (viewType: ViewType) => void;
}

const TIME_PERIODS: TimePeriod[] = [
  { label: 'Live', value: 'live', description: 'Last 35 days' },
  { label: '2M', value: '2m', description: '2 months' },
  { label: '4M', value: '4m', description: '4 months' },
  { label: '6M', value: '6m', description: '6 months' },
  { label: '1Y', value: '1y', description: '1 year' },
  { label: 'All', value: 'all', description: 'All time' },
];

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const TimePeriodSelector: React.FC<TimePeriodSelectorProps> = ({
  selected,
  onSelect,
}) => {
  const highlightPosition = useSharedValue(0);
  const highlightWidth = useSharedValue(0);
  const buttonLayoutsRef = useRef<Array<{ x: number; width: number } | null>>(
    new Array(TIME_PERIODS.length).fill(null)
  );

  // Update highlight position when selection changes
  useEffect(() => {
    const selectedIndex = TIME_PERIODS.findIndex(period => period.value === selected);
    if (selectedIndex >= 0) {
      const layout = buttonLayoutsRef.current[selectedIndex];
      if (layout) {
        highlightPosition.value = withSpring(layout.x, {
          damping: 15,
          stiffness: 200,
        });
        highlightWidth.value = withSpring(layout.width, {
          damping: 15,
          stiffness: 200,
        });
      }
    }
  }, [selected, highlightPosition, highlightWidth]);

  const onLayout = (index: number) => (event: any) => {
    const { x, width } = event.nativeEvent.layout;
    buttonLayoutsRef.current[index] = { x, width };
    
    // If this is the selected button and we haven't set initial position yet
    if (TIME_PERIODS[index].value === selected && highlightPosition.value === 0) {
      highlightPosition.value = x;
      highlightWidth.value = width;
    }
  };

  const handlePress = (viewType: ViewType, index: number) => {
    onSelect(viewType);
  };

  const highlightStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: highlightPosition.value }],
      width: highlightWidth.value,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.selectorContainer}>
        {/* Animated highlight background */}
        <Animated.View style={[styles.highlight, highlightStyle]} />
        
        {/* Period buttons */}
        {TIME_PERIODS.map((period, index) => {
          const isActive = period.value === selected;
          
          return (
            <AnimatedTouchableOpacity
              key={period.value}
              style={[styles.periodButton, isActive && styles.periodButtonActive]}
              onPress={() => handlePress(period.value, index)}
              onLayout={onLayout(index)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Show ${period.description}`}
              accessibilityState={{ selected: isActive }}
            >
              <Animated.Text
                style={[
                  styles.periodText,
                  isActive && styles.periodTextActive,
                ]}
              >
                {period.label}
              </Animated.Text>
            </AnimatedTouchableOpacity>
          );
        })}
      </View>
      
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginTop: spacing[4],
    marginBottom: spacing[4],
  },

  selectorContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: radiusValues.xl,
    padding: 4,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
  },

  highlight: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    backgroundColor: '#FFD700', // Golden highlight
    borderRadius: radiusValues.lg,
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },

  periodButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: radiusValues.lg,
    minWidth: 44, // Minimum touch target
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1, // Above highlight
  },

  periodButtonActive: {
    // Active styles handled by highlight
  },

  periodText: {
    ...textStyles.caption,
    color: colors.text.secondary,
    fontSize: fontSizes.tiny,
    fontWeight: '600',
    textAlign: 'center',
  },

  periodTextActive: {
    color: colors.text.primary, // Dark text on golden background
  },
});

export default TimePeriodSelector;