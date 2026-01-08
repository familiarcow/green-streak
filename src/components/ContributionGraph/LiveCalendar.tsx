import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { ContributionData } from '../../types';
import { colors, textStyles, spacing, shadows } from '../../theme';
import { radiusValues, fontSizes } from '../../theme/utils';
import { getTodayString } from '../../utils/dateHelpers';
import { TimePeriodSelector, ViewType } from './TimePeriodSelector';
import { MonthMarker } from './MonthMarker';
import Icon from '../common/Icon';

export type { ViewType };

interface LiveCalendarProps {
  data: ContributionData[];
  onDayPress: (date: string) => void;
  selectedDate?: string;
  viewType?: ViewType;
  onViewTypeChange?: (viewType: ViewType) => void;
}

const DAYS_PER_WEEK = 7;
const WEEKS_TO_SHOW = 5;
const TOTAL_DAYS = DAYS_PER_WEEK * WEEKS_TO_SHOW;
const GAP = 4; // Gap between boxes

// GitHub-style color palette
const getHabitColor = (count: number, maxCount: number): string => {
  if (count === 0) return '#ebedf0'; // Empty gray
  const intensity = Math.min(count / Math.max(maxCount, 1), 1);
  
  if (intensity <= 0.25) return '#9be9a8';  // Light green
  if (intensity <= 0.5) return '#40c463';   // Medium green
  if (intensity <= 0.75) return '#30a14e';  // Dark green
  return '#216e39'; // Darkest green
};

// Use consistent box sizing for all view types (like Live view)
const getBoxSizeMultiplier = (viewType: ViewType): number => {
  // All views use the same box size as Live for consistency
  return 1.0;
};

// Get number of days for each view type
const getDaysForViewType = (viewType: ViewType, data: ContributionData[]): number => {
  switch (viewType) {
    case 'live': return 35;
    case '2m': return 60;
    case '4m': return 120;
    case '6m': return 180;
    case '1y': return 365;
    case 'all': return data.length || 365;
    default: return 35;
  }
};

export const LiveCalendar: React.FC<LiveCalendarProps> = ({
  data,
  onDayPress,
  selectedDate,
  viewType = 'live',
  onViewTypeChange,
}) => {
  const todayString = getTodayString();
  const [containerWidth, setContainerWidth] = useState(0);
  const [dateOffset, setDateOffset] = useState(0); // 0 = current period, 1 = one period back, etc.

  // Calculate box size based on container width and view type
  const boxSize = useMemo(() => {
    if (containerWidth === 0) return 30; // Default size
    // Subtract gaps: 6 gaps between 7 boxes
    const availableWidth = containerWidth - (GAP * (DAYS_PER_WEEK - 1));
    const baseSize = Math.floor(availableWidth / DAYS_PER_WEEK);
    const multiplier = getBoxSizeMultiplier(viewType);
    return Math.floor(baseSize * multiplier);
  }, [containerWidth, viewType]);

  // Generate data array structured as weeks for proper layout
  const calendarData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const baseDays = getDaysForViewType(viewType, data);
    const weeks: ContributionData[][] = [];
    
    // Calculate the end date based on the navigation offset
    const endDate = new Date(today);
    endDate.setDate(today.getDate() - (dateOffset * baseDays));
    
    // Calculate how many days we need to go back to fill complete weeks
    const totalWeeksNeeded = Math.ceil(baseDays / DAYS_PER_WEEK);
    const totalDaysNeeded = totalWeeksNeeded * DAYS_PER_WEEK;
    
    // Generate all days needed for complete weeks, ending with the calculated end date
    const allDays: ContributionData[] = [];
    for (let i = 0; i < totalDaysNeeded; i++) {
      const daysAgo = totalDaysNeeded - 1 - i; // Count backwards from end date
      const targetDate = new Date(endDate);
      targetDate.setDate(endDate.getDate() - daysAgo);
      
      const dateString = targetDate.toISOString().split('T')[0];
      const existingData = data.find(d => d.date === dateString);
      
      allDays.push(existingData || {
        date: dateString,
        count: 0,
        tasks: [],
      });
    }
    
    // Group into weeks of exactly 7 days
    for (let i = 0; i < allDays.length; i += DAYS_PER_WEEK) {
      const week = allDays.slice(i, i + DAYS_PER_WEEK);
      if (week.length === DAYS_PER_WEEK) {
        weeks.push(week);
      }
    }
    
    return weeks;
  }, [data, viewType, dateOffset]);

  // Calculate maximum count for color scaling
  const maxCount = useMemo(() => {
    const allCounts = calendarData.flat().map(d => d.count).filter(count => count >= 0);
    return Math.max(...allCounts, 1);
  }, [calendarData]);

  // Check if a date is the first day of a new month
  const isFirstDayOfMonth = useCallback((dateString: string, weekIndex: number, dayIndex: number): boolean => {
    if (weekIndex === 0 && dayIndex === 0) return true; // First day in data set
    
    const currentDate = new Date(dateString);
    
    // Get previous day
    let prevDate: Date | null = null;
    if (dayIndex > 0) {
      // Previous day in same week
      const prevDay = calendarData[weekIndex][dayIndex - 1];
      prevDate = new Date(prevDay.date);
    } else if (weekIndex > 0) {
      // Last day of previous week
      const prevWeek = calendarData[weekIndex - 1];
      const lastDay = prevWeek[prevWeek.length - 1];
      prevDate = new Date(lastDay.date);
    }
    
    if (!prevDate) return true;
    
    return currentDate.getMonth() !== prevDate.getMonth() || 
           currentDate.getFullYear() !== prevDate.getFullYear();
  }, [calendarData]);

  // Check if view should show month markers
  const shouldShowMonthMarkers = viewType !== 'live';

  const handleDayPress = useCallback((date: string) => {
    onDayPress(date);
  }, [onDayPress]);

  const handleViewTypeChange = useCallback((newViewType: ViewType) => {
    onViewTypeChange?.(newViewType);
  }, [onViewTypeChange]);

  // Reset date offset when view type changes
  useEffect(() => {
    setDateOffset(0);
  }, [viewType]);

  // Navigation handlers
  const handleNavigateBackward = useCallback(() => {
    setDateOffset(prev => prev + 1);
  }, []);

  const handleNavigateForward = useCallback(() => {
    if (dateOffset > 0) {
      setDateOffset(prev => prev - 1);
    }
  }, [dateOffset]);

  // Check if forward navigation is available (not at current period)
  const canNavigateForward = dateOffset > 0;
  const canNavigateBackward = true; // Always allow going back in time

  // Add animation values for smooth transitions
  const fadeInValue = useSharedValue(0);
  
  useEffect(() => {
    // Animate in when view type or date offset changes
    fadeInValue.value = 0;
    fadeInValue.value = withDelay(50, withSpring(1, {
      damping: 15,
      stiffness: 200,
    }));
  }, [viewType, dateOffset]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: fadeInValue.value,
  }));

  return (
    <View style={styles.container}>
      {/* Week day labels */}
      <View style={styles.weekDayLabels}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, index) => (
          <View key={index} style={[styles.weekDayLabel, { width: boxSize }]}>
            <Text style={styles.weekDayText}>{label}</Text>
          </View>
        ))}
      </View>
      
      {/* Calendar Grid */}
      <Animated.View 
        style={[styles.calendarGrid, animatedContainerStyle]}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          setContainerWidth(width);
        }}
      >
        <View style={styles.gridWrapper}>
          {calendarData.map((weekData, weekIndex) => (
            <Animated.View 
              key={`week-${weekIndex}-${viewType}`} 
              style={styles.weekRow}
              entering={FadeInDown.delay(weekIndex * 50).springify()}
            >
              {weekData.map((dayData, dayIndex) => {
                const isToday = dayData.date === todayString;
                const isSelected = dayData.date === selectedDate;
                const backgroundColor = getHabitColor(dayData.count, maxCount);
                const showMonthMarker = shouldShowMonthMarkers && isFirstDayOfMonth(dayData.date, weekIndex, dayIndex);
                
                // Calculate margins - no right margin for last column
                const isLastInRow = dayIndex === DAYS_PER_WEEK - 1;
                const animationDelay = weekIndex * 50 + dayIndex * 10;
                
                return (
                  <Animated.View 
                    key={`${dayData.date}-${viewType}`} 
                    style={{ position: 'relative' }}
                    entering={FadeIn.delay(animationDelay).springify()}
                  >
                    <TouchableOpacity
                      style={[
                        styles.dayBox,
                        { 
                          width: boxSize,
                          height: boxSize,
                          backgroundColor,
                          marginRight: isLastInRow ? 0 : GAP,
                        },
                        isToday && styles.todayBox,
                        isSelected && styles.selectedBox,
                      ]}
                      onPress={() => handleDayPress(dayData.date)}
                      activeOpacity={0.8}
                    />
                    
                    {/* Month Marker Overlay */}
                    {showMonthMarker && (
                      <MonthMarker
                        date={dayData.date}
                        boxSize={boxSize}
                        contributionColor={backgroundColor}
                      />
                    )}
                  </Animated.View>
                );
              })}
            </Animated.View>
          ))}
        </View>
      </Animated.View>
      
      {/* Navigation Controls */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={handleNavigateBackward}
          activeOpacity={0.7}
        >
          <Icon 
            name="chevron-left" 
            size={20} 
            color={colors.text.primary} 
          />
          <Text style={styles.navButtonText}>
            Previous
          </Text>
        </TouchableOpacity>
        
        {canNavigateForward && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={handleNavigateForward}
            activeOpacity={0.7}
          >
            <Text style={styles.navButtonText}>
              Next
            </Text>
            <Icon 
              name="chevron-right" 
              size={20} 
              color={colors.text.primary} 
            />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Time Period Selector */}
      {onViewTypeChange && (
        <TimePeriodSelector
          selected={viewType}
          onSelect={handleViewTypeChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing[4],
    borderRadius: radiusValues.xl,
    marginHorizontal: spacing[4],
    marginBottom: spacing[6],
    ...shadows.md,
  },

  weekDayLabels: {
    flexDirection: 'row',
    marginBottom: spacing[2],
    justifyContent: 'space-between',
  },

  weekDayLabel: {
    alignItems: 'center',
  },

  weekDayText: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    fontSize: fontSizes.micro - 1,
    fontWeight: '500',
  },

  calendarGrid: {
    // Container expands to fit all content
  },

  gridWrapper: {
    gap: GAP, // Vertical gap between weeks
  },

  weekRow: {
    flexDirection: 'row',
  },

  dayBox: {
    borderRadius: 3,
  },

  todayBox: {
    borderWidth: 2,
    borderColor: '#FFD700', // Golden border
    shadowColor: '#FFD700',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8, // Android shadow
  },

  selectedBox: {
    borderWidth: 1,
    borderColor: colors.primary,
  },

  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[4],
    marginHorizontal: spacing[2],
  },

  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radiusValues.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 40,
    minWidth: 80,
    justifyContent: 'center',
    gap: spacing[1],
  },

  navButtonText: {
    ...textStyles.caption,
    color: colors.text.primary,
    fontSize: fontSizes.small,
    fontWeight: '500',
  },
});

export default LiveCalendar;