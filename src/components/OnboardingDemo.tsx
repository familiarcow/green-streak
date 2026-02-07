import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { colors, textStyles, spacing, shadows } from '../theme';
import { radiusValues, fontSizes } from '../theme/utils';

const ROWS = 5;
const COLS = 7;
const TOTAL_CELLS = ROWS * COLS;
const TODAY_INDEX = TOTAL_CELLS - 1;
const GAP = 4;

// Color levels matching the app's contribution colors
const LEVEL_COLORS = [
  '#EBEDF0', // empty
  '#C6E48B', // level 1
  '#7BC96F', // level 2
  '#239A3B', // level 3
  '#196127', // level 4
];

const DAY_NAMES = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// Timing constants (ms)
const TASK_COMPLETE_INTERVAL = 2500;
const DAY_TRANSITION_DELAY = 2000;
const ANIMATION_DURATION = 300;

// Generate initial grid data once
const generateInitialGrid = (): number[] => {
  const data = new Array(TOTAL_CELLS).fill(0);
  // Pre-fill last 7 days with activity (except today which starts at 0)
  data[TOTAL_CELLS - 2] = 3; // yesterday
  data[TOTAL_CELLS - 3] = 2;
  data[TOTAL_CELLS - 4] = 3;
  data[TOTAL_CELLS - 5] = 2;
  data[TOTAL_CELLS - 6] = 1;
  data[TOTAL_CELLS - 7] = 3;
  data[TOTAL_CELLS - 8] = 2;
  // Older history
  data[TOTAL_CELLS - 9] = 1;
  data[TOTAL_CELLS - 10] = 2;
  data[TOTAL_CELLS - 14] = 3;
  data[TOTAL_CELLS - 15] = 2;
  data[TOTAL_CELLS - 16] = 1;
  data[TOTAL_CELLS - 21] = 2;
  data[TOTAL_CELLS - 22] = 3;
  data[TOTAL_CELLS - 23] = 1;
  data[TOTAL_CELLS - 28] = 2;
  data[TOTAL_CELLS - 29] = 1;
  data[TOTAL_CELLS - 30] = 3;
  return data;
};

export const OnboardingDemo: React.FC = () => {
  // Use refs for simulation state to avoid re-renders breaking the loop
  const gridDataRef = useRef<number[]>(generateInitialGrid());
  const currentDayRef = useRef(8);
  const currentDayOfWeekRef = useRef(6); // Start on Saturday
  const todayCompletionsRef = useRef(0);
  const isRunningRef = useRef(false);

  // State for triggering re-renders
  const [, forceUpdate] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [pulseTodayKey, setPulseTodayKey] = useState(0);

  const gridOpacity = useSharedValue(1);
  const dayCounterScale = useSharedValue(1);
  const todayCellScale = useSharedValue(1);

  // Calculate box size based on container width
  const boxSize = containerWidth > 0
    ? Math.floor((containerWidth - GAP * (COLS - 1)) / COLS)
    : 30;

  // Get day labels based on current day of week
  const getDayLabels = () => {
    const labels: string[] = [];
    for (let i = 0; i < 7; i++) {
      const dayIndex = (currentDayOfWeekRef.current + i + 1) % 7;
      labels.push(DAY_NAMES[dayIndex]);
    }
    return labels;
  };

  // Complete a task - just increment today's level and pulse
  const completeTask = () => {
    todayCompletionsRef.current += 1;
    const newLevel = Math.min(todayCompletionsRef.current, 4);
    gridDataRef.current[TODAY_INDEX] = newLevel;

    // Trigger pulse animation
    todayCellScale.value = withSequence(
      withTiming(1.25, { duration: 150 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );

    // Force re-render to show new level
    forceUpdate(n => n + 1);
  };

  // Perform the actual day advance (called after fade out)
  const performDayAdvance = () => {
    // Shift grid: remove first element, add 0 at end
    gridDataRef.current.shift();
    gridDataRef.current.push(0);

    // Reset today's completions
    todayCompletionsRef.current = 0;

    // Increment day
    currentDayRef.current += 1;
    currentDayOfWeekRef.current = (currentDayOfWeekRef.current + 1) % 7;

    // Animate day counter
    dayCounterScale.value = withSequence(
      withTiming(1.2, { duration: 150 }),
      withSpring(1, { damping: 10 })
    );

    // Fade back in
    gridOpacity.value = withTiming(1, { duration: ANIMATION_DURATION });

    // Force re-render
    forceUpdate(n => n + 1);
  };

  // Advance to next day with fade animation
  const advanceDay = () => {
    gridOpacity.value = withTiming(0, { duration: ANIMATION_DURATION }, () => {
      runOnJS(performDayAdvance)();
    });
  };

  // Sleep helper
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Main simulation loop
  useEffect(() => {
    if (isRunningRef.current) return;
    isRunningRef.current = true;

    const runSimulation = async () => {
      while (isRunningRef.current) {
        // Complete 1-3 tasks this "day"
        const tasksToComplete = Math.floor(Math.random() * 3) + 1;

        for (let i = 0; i < tasksToComplete; i++) {
          await sleep(TASK_COMPLETE_INTERVAL);
          if (!isRunningRef.current) return;
          completeTask();
        }

        // Wait then advance day
        await sleep(DAY_TRANSITION_DELAY);
        if (!isRunningRef.current) return;
        advanceDay();

        // Wait for animation to complete
        await sleep(ANIMATION_DURATION * 2 + 500);
      }
    };

    // Start after initial delay
    const startTimeout = setTimeout(() => {
      runSimulation();
    }, 1500);

    return () => {
      isRunningRef.current = false;
      clearTimeout(startTimeout);
    };
  }, []);

  const gridAnimatedStyle = useAnimatedStyle(() => ({
    opacity: gridOpacity.value,
  }));

  const dayCounterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dayCounterScale.value }],
  }));

  const todayCellAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: todayCellScale.value }],
  }));

  const dayLabels = getDayLabels();
  const gridData = gridDataRef.current;

  return (
    <View style={styles.container}>
      {/* Day counter */}
      <View style={styles.dayCounterContainer}>
        <Text style={styles.dayCounterLabel}>Day </Text>
        <Animated.Text style={[styles.dayCounterValue, dayCounterAnimatedStyle]}>
          {currentDayRef.current}
        </Animated.Text>
      </View>

      {/* Day labels */}
      <Animated.View style={[styles.dayLabelsRow, gridAnimatedStyle]}>
        {dayLabels.map((label, index) => (
          <View key={index} style={[styles.dayLabelCell, { width: boxSize }]}>
            <Text style={styles.dayLabelText}>{label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Contribution grid */}
      <Animated.View
        style={[styles.gridContainer, gridAnimatedStyle]}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        {Array.from({ length: ROWS }).map((_, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {Array.from({ length: COLS }).map((_, colIndex) => {
              const cellIndex = rowIndex * COLS + colIndex;
              const isToday = cellIndex === TODAY_INDEX;
              const isLastInRow = colIndex === COLS - 1;
              const level = gridData[cellIndex];

              return (
                <View
                  key={colIndex}
                  style={[
                    { width: boxSize, height: boxSize, marginRight: isLastInRow ? 0 : GAP },
                  ]}
                >
                  {isToday ? (
                    <Animated.View
                      style={[
                        styles.cell,
                        { backgroundColor: LEVEL_COLORS[level] },
                        styles.todayCell,
                        todayCellAnimatedStyle,
                      ]}
                    />
                  ) : (
                    <View
                      style={[
                        styles.cell,
                        { backgroundColor: LEVEL_COLORS[level] },
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </Animated.View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radiusValues.xl,
    padding: spacing[3],
    ...shadows.md,
  },

  dayCounterContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },

  dayCounterLabel: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    fontSize: fontSizes.small,
  },

  dayCounterValue: {
    ...textStyles.caption,
    color: colors.primary,
    fontSize: fontSizes.small,
    fontWeight: '600',
  },

  dayLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },

  dayLabelCell: {
    alignItems: 'center',
  },

  dayLabelText: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    fontSize: fontSizes.micro - 1,
    fontWeight: '500',
  },

  gridContainer: {
    gap: GAP,
  },

  row: {
    flexDirection: 'row',
  },

  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 3,
  },

  todayCell: {
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },

});

export default OnboardingDemo;
