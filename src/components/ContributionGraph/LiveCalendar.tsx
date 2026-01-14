import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  FadeIn,
  FadeInDown,
  FadeOut,
} from 'react-native-reanimated';
import { ContributionData, Task } from '../../types';
import { colors, textStyles, spacing, shadows } from '../../theme';
import { radiusValues, fontSizes } from '../../theme/utils';
import { getTodayString, formatDateString } from '../../utils/dateHelpers';
import { getContributionColor } from '../../utils/colorUtils';
import { useDynamicToday, useCalendarColors } from '../../hooks';
import { TimePeriodSelector, ViewType } from './TimePeriodSelector';
import { MonthMarker } from './MonthMarker';
import Icon, { IconName, ICON_MAP } from '../common/Icon';

export type { ViewType };

interface LiveCalendarProps {
  data: ContributionData[];
  tasks: Task[];
  onDayPress: (date: string) => void;
  selectedDate?: string;
  viewType?: ViewType;
  onViewTypeChange?: (viewType: ViewType) => void;
  selectedTaskIds?: string[];
  onTaskSelectionChange?: (selectedTaskIds: string[]) => void;
  dateOffset?: number;
  onDateOffsetChange?: (offset: number) => void;
}

const DAYS_PER_WEEK = 7;
const WEEKS_TO_SHOW = 5;
const TOTAL_DAYS = DAYS_PER_WEEK * WEEKS_TO_SHOW;
const GAP = 4; // Gap between boxes

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
  tasks,
  onDayPress,
  selectedDate,
  viewType = 'live',
  onViewTypeChange,
  selectedTaskIds = [],
  onTaskSelectionChange,
  dateOffset = 0,
  onDateOffsetChange,
}) => {
  // Use dynamic today that updates at midnight
  const todayString = useDynamicToday();
  const [containerWidth, setContainerWidth] = useState(0);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Get calendar color palette from settings
  const calendarPalette = useCalendarColors();
  

  // Calculate box size based on container width and view type
  const boxSize = useMemo(() => {
    if (containerWidth === 0) return 30; // Default size
    // Subtract gaps: 6 gaps between 7 boxes
    const availableWidth = containerWidth - (GAP * (DAYS_PER_WEEK - 1));
    const baseSize = Math.floor(availableWidth / DAYS_PER_WEEK);
    const multiplier = getBoxSizeMultiplier(viewType);
    return Math.floor(baseSize * multiplier);
  }, [containerWidth, viewType]);

  // Filter contribution data based on selected tasks
  const filteredData = useMemo(() => {
    if (selectedTaskIds.length === 0) {
      // "ALL" selected - return original data
      return data;
    }

    // Filter and sum counts for selected tasks only
    return data.map(dayData => {
      const filteredTasks = dayData.tasks.filter(task => selectedTaskIds.includes(task.taskId));
      const totalCount = filteredTasks.reduce((sum, task) => sum + task.count, 0);
      
      return {
        ...dayData,
        count: totalCount,
        tasks: filteredTasks,
      };
    });
  }, [data, selectedTaskIds]);

  // Generate data array structured as weeks for proper layout
  const calendarData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const baseDays = getDaysForViewType(viewType, filteredData);
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
      
      const dateString = formatDateString(targetDate);
      const existingData = filteredData.find(d => d.date === dateString);
      
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
  }, [filteredData, viewType, dateOffset]);

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
    onDateOffsetChange?.(0);
  }, [viewType, onDateOffsetChange]);

  // Filter and navigation handlers
  const handleToggleFilter = useCallback(() => {
    setIsFilterExpanded(prev => !prev);
  }, []);

  const handleNavigateBackward = useCallback(() => {
    onDateOffsetChange?.(dateOffset + 1);
  }, [dateOffset, onDateOffsetChange]);

  const handleNavigateForward = useCallback(() => {
    if (dateOffset > 0) {
      onDateOffsetChange?.(dateOffset - 1);
    }
  }, [dateOffset, onDateOffsetChange]);

  const handleTaskToggle = useCallback((taskId: string) => {
    if (!onTaskSelectionChange) return;
    
    if (selectedTaskIds.includes(taskId)) {
      // Remove task from selection
      onTaskSelectionChange(selectedTaskIds.filter(id => id !== taskId));
    } else {
      // Add task to selection
      onTaskSelectionChange([...selectedTaskIds, taskId]);
    }
  }, [selectedTaskIds, onTaskSelectionChange]);

  const handleSelectAll = useCallback(() => {
    onTaskSelectionChange?.([]);
  }, [onTaskSelectionChange]);

  // Helper functions
  const isAllSelected = selectedTaskIds.length === 0;
  const isTaskSelected = useCallback((taskId: string) => {
    return selectedTaskIds.includes(taskId);
  }, [selectedTaskIds]);

  const canNavigateForward = dateOffset > 0;

  // Helper function to render task icon
  const renderTaskIcon = useCallback((task: Task) => {
    const isSelected = isTaskSelected(task.id);
    const showAsSelected = isSelected || isAllSelected;
    
    if (!task.icon) {
      return <Text style={styles.filterPillIcon}>📋</Text>;
    }
    
    // Check if it's a known icon name from the Icon component
    if (task.icon in ICON_MAP) {
      return (
        <Icon 
          name={task.icon as IconName} 
          size={16} 
          color={showAsSelected ? colors.background : colors.text.primary}
        />
      );
    }
    
    // Otherwise treat it as an emoji
    return <Text style={styles.filterPillIcon}>{task.icon}</Text>;
  }, [isTaskSelected, isAllSelected]);

  // Add animation values for smooth transitions
  const fadeInValue = useSharedValue(0);
  
  useEffect(() => {
    // Animate in when view type, date offset, or task selection changes
    fadeInValue.value = 0;
    fadeInValue.value = withDelay(50, withSpring(1, {
      damping: 15,
      stiffness: 200,
    }));
  }, [viewType, dateOffset, selectedTaskIds]);

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
                const backgroundColor = getContributionColor(dayData.count, maxCount, calendarPalette);
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
      
      {/* Time Period Selector */}
      {onViewTypeChange && (
        <TimePeriodSelector
          selected={viewType}
          onSelect={handleViewTypeChange}
        />
      )}
      
      {/* Filter Toggle Bump */}
      <View style={styles.filterBumpContainer}>
        <TouchableOpacity 
          style={styles.filterBump}
          onPress={handleToggleFilter}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${isFilterExpanded ? 'Collapse' : 'Expand'} habit filters`}
          accessibilityHint="Double tap to show filtering and navigation options"
          accessibilityState={{ expanded: isFilterExpanded }}
        >
          <Animated.View
            style={{
              transform: [{ rotate: isFilterExpanded ? '180deg' : '0deg' }]
            }}
          >
            <Icon 
              name="chevron-down" 
              size={14} 
              color={colors.text.tertiary} 
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
      
      {/* Collapsible Filter Section */}
      {isFilterExpanded && (
        <Animated.View 
          style={styles.filterSection}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
        >
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={styles.navArrow}
              onPress={handleNavigateBackward}
              activeOpacity={0.7}
            >
              <Icon 
                name="chevron-left" 
                size={20} 
                color={colors.text.primary} 
              />
            </TouchableOpacity>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScrollContainer}
              contentContainerStyle={styles.filterScrollContent}
            >
              {/* ALL pill */}
              <TouchableOpacity
                style={[
                  styles.filterPill,
                  isAllSelected && {
                    backgroundColor: colors.primary,
                    borderColor: colors.primary,
                  }
                ]}
                onPress={handleSelectAll}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterPillText, isAllSelected && styles.filterPillTextSelected]}>
                  ALL
                </Text>
              </TouchableOpacity>
              
              {/* Individual habit pills */}
              {tasks.map((task) => {
                const isSelected = isTaskSelected(task.id);
                const showAsSelected = isSelected || isAllSelected;
                
                return (
                  <TouchableOpacity
                    key={task.id}
                    style={[
                      styles.filterPill,
                      showAsSelected && {
                        backgroundColor: task.color,
                        borderColor: task.color,
                      }
                    ]}
                    onPress={() => handleTaskToggle(task.id)}
                    activeOpacity={0.7}
                  >
                    {renderTaskIcon(task)}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            {canNavigateForward && (
              <TouchableOpacity
                style={styles.navArrow}
                onPress={handleNavigateForward}
                activeOpacity={0.7}
              >
                <Icon 
                  name="chevron-right" 
                  size={20} 
                  color={colors.text.primary} 
                />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
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
    position: 'relative',
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

  filterBumpContainer: {
    position: 'absolute',
    bottom: -20,
    alignSelf: 'center',
    zIndex: 10,
  },

  filterBump: {
    width: 30,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  filterSection: {
    marginTop: spacing[1],
  },

  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing[2],
    paddingBottom: spacing[3],
  },

  navArrow: {
    padding: spacing[2],
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    minHeight: 40,
  },

  filterScrollContainer: {
    flex: 1,
    marginHorizontal: spacing[2],
  },

  filterScrollContent: {
    paddingVertical: spacing[1],
    gap: spacing[2],
    alignItems: 'center',
  },

  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[2],
    borderRadius: radiusValues.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 32,
    minWidth: 32,
    gap: spacing[1],
  },

  filterPillIcon: {
    fontSize: fontSizes.medium,
    lineHeight: fontSizes.medium * 1.2,
  },

  filterPillText: {
    ...textStyles.caption,
    color: colors.text.secondary,
    fontSize: fontSizes.tiny,
    fontWeight: '500',
  },

  filterPillTextSelected: {
    color: colors.background,
  },
});

export default LiveCalendar;