import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withDelay,
  FadeIn,
} from 'react-native-reanimated';
import { ContributionData, Task } from '../../types';
import { TaskContributionDay } from './TaskContributionDay';
import { Icon, IconName } from '../common/Icon';
import { colors, textStyles, spacing, shadows } from '../../theme';
import { radiusValues } from '../../theme/utils';
import { getMonthName, formatDisplayDate } from '../../utils/dateHelpers';
import { getTaskColorWithOpacity } from '../../theme/colors';

interface TaskContributionGraphProps {
  data: ContributionData[];
  task: Task;
  showStats?: boolean;
  compact?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const GRAPH_PADDING = spacing[4];
const MIN_DAY_SIZE = 14;
const MAX_DAY_SIZE = 26;
const DAYS_PER_WEEK = 7;

export const TaskContributionGraph: React.FC<TaskContributionGraphProps> = ({
  data,
  task,
  showStats = true,
  compact = false,
}) => {
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const fadeInValue = useSharedValue(0);
  const slideUpValue = useSharedValue(20);

  const { weeks, daySize, maxCount, monthLabels } = useMemo(() => {
    if (data.length === 0) {
      return { weeks: [], daySize: MIN_DAY_SIZE, maxCount: 0, monthLabels: [] };
    }

    // Calculate optimal day size based on screen width
    const availableWidth = screenWidth - (GRAPH_PADDING * 2);
    const weeksCount = Math.ceil(data.length / DAYS_PER_WEEK);
    const calculatedDaySize = Math.max(
      MIN_DAY_SIZE,
      Math.min(MAX_DAY_SIZE, (availableWidth - spacing[2] * (weeksCount - 1)) / weeksCount / DAYS_PER_WEEK)
    );

    // Find maximum count for this specific task
    const maxCount = Math.max(...data.map(d => d.count), 1);

    // Group days into weeks
    const weeks: ContributionData[][] = [];
    for (let i = 0; i < data.length; i += DAYS_PER_WEEK) {
      const week = data.slice(i, i + DAYS_PER_WEEK);
      weeks.push(week);
    }

    // Generate month labels
    const monthLabels: Array<{ month: string; weekIndex: number }> = [];
    let currentMonth = '';
    
    weeks.forEach((week, weekIndex) => {
      const firstDay = week[0];
      if (firstDay) {
        const month = getMonthName(new Date(firstDay.date));
        if (month !== currentMonth) {
          currentMonth = month;
          monthLabels.push({ month, weekIndex });
        }
      }
    });

    return { weeks, daySize: calculatedDaySize, maxCount, monthLabels };
  }, [data]);

  useEffect(() => {
    fadeInValue.value = withDelay(200, withSpring(1));
    slideUpValue.value = withDelay(200, withSpring(0));
  }, [data]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: fadeInValue.value,
    transform: [{ translateY: slideUpValue.value }],
  }));

  const handleDayPress = (date: string) => {
    setSelectedDate(selectedDate === date ? undefined : date);
  };

  const renderWeekDayLabels = () => {
    if (weeks.length === 0) return null;
    
    const labels = compact ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : 
                            ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <View style={styles.weekDayLabels}>
        {labels.map((label, index) => (
          <View
            key={index}
            style={[
              styles.weekDayLabel,
              { width: daySize, height: daySize }
            ]}
          >
            <Text style={[styles.weekDayText, compact && styles.weekDayTextCompact]}>
              {label}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderMonthLabels = () => {
    if (weeks.length === 0) return null;

    return (
      <View style={[styles.monthLabels, compact && styles.monthLabelsCompact]}>
        {monthLabels.map(({ month, weekIndex }) => (
          <Text
            key={`${month}-${weekIndex}`}
            style={[
              styles.monthText,
              compact && styles.monthTextCompact,
              {
                left: weekIndex * (daySize + spacing[1]) + spacing[1],
                color: task.color,
              }
            ]}
          >
            {compact ? month.slice(0, 3) : month}
          </Text>
        ))}
      </View>
    );
  };

  const selectedDateData = data.find(d => d.date === selectedDate);
  const totalCompletions = data.reduce((sum, day) => sum + day.count, 0);
  const activeDays = data.filter(day => day.count > 0).length;

  if (weeks.length === 0) {
    return (
      <Animated.View style={[styles.container, animatedContainerStyle]}>
        <View style={styles.emptyState}>
          <View style={{ marginBottom: spacing[3] }}>
            {task.icon ? (
              <Icon name={task.icon as IconName} size={32} color={task.color} />
            ) : (
              <Icon name="barChart" size={32} color={task.color} />
            )}
          </View>
          <Text style={styles.emptyText}>No activity data yet</Text>
          <Text style={styles.emptySubtext}>Start logging this habit to see your progress!</Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      {showStats && (
        <View style={[styles.statsContainer, { borderColor: getTaskColorWithOpacity(task.color, 0.3) }]}>
          <Text style={styles.statsText}>
            {totalCompletions} completions across {activeDays} active days
          </Text>
          <View style={styles.statsDetails}>
            <Text style={[styles.statsBadge, { backgroundColor: getTaskColorWithOpacity(task.color, 0.1), color: task.color }]}>
              {task.isMultiCompletion ? 'Multi-completion' : 'Single completion'}
            </Text>
          </View>
        </View>
      )}
      
      {renderMonthLabels()}
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.graphContainer}
      >
        {renderWeekDayLabels()}
        
        <View style={styles.weeksContainer}>
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.week}>
              {week.map((day, dayIndex) => (
                <TaskContributionDay
                  key={`${day.date}-${dayIndex}`}
                  data={day}
                  task={task}
                  maxCount={maxCount}
                  size={daySize}
                  onPress={handleDayPress}
                  isSelected={day.date === selectedDate}
                  animationDelay={weekIndex * 50 + dayIndex * 10}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Selected date details */}
      {selectedDate && selectedDateData && (
        <Animated.View 
          entering={FadeIn.springify()}
          style={[styles.selectedDatePanel, { borderColor: task.color }]}
        >
          <View style={styles.selectedDateHeader}>
            <Text style={styles.selectedDateTitle}>
              {formatDisplayDate(new Date(selectedDate))}
            </Text>
            <Text style={[styles.selectedDateCount, { color: task.color }]}>
              {selectedDateData.count} {selectedDateData.count === 1 ? 'completion' : 'completions'}
            </Text>
          </View>
          {selectedDateData.count > 0 && (
            <Text style={styles.selectedDateNote}>
              Great progress on {task.name}! 🎉
            </Text>
          )}
        </Animated.View>
      )}

      {/* Color legend */}
      <View style={styles.legend}>
        <Text style={styles.legendLabel}>Less</Text>
        <View style={styles.legendColors}>
          {[0, 0.25, 0.5, 0.75, 1].map((intensity, index) => (
            <View
              key={index}
              style={[
                styles.legendColor,
                { 
                  backgroundColor: intensity === 0 
                    ? colors.contribution.empty 
                    : getTaskColorWithOpacity(task.color, 0.2 + intensity * 0.8)
                }
              ]}
            />
          ))}
        </View>
        <Text style={styles.legendLabel}>More</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: spacing[4],
    borderRadius: radiusValues.box,
    ...shadows.sm,
  },
  
  emptyState: {
    alignItems: 'center',
    padding: spacing[8],
  },
  
  
  emptyText: {
    ...textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  
  emptySubtext: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  
  statsContainer: {
    marginBottom: spacing[4],
    padding: spacing[3],
    borderWidth: 1,
    borderRadius: radiusValues.box,
    backgroundColor: colors.interactive.default,
  },
  
  statsText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  
  statsDetails: {
    alignItems: 'center',
  },
  
  statsBadge: {
    ...textStyles.caption,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: spacing[1],
    fontWeight: '600',
  },
  
  monthLabels: {
    position: 'relative',
    height: 24,
    marginBottom: spacing[2],
  },
  
  monthLabelsCompact: {
    height: 20,
  },
  
  monthText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    position: 'absolute',
    fontWeight: '600',
  },
  
  monthTextCompact: {
    ...textStyles.caption,
  },
  
  graphContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  
  weekDayLabels: {
    marginRight: spacing[2],
    paddingTop: 25,
  },
  
  weekDayLabel: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing[1] / 2,
  },
  
  weekDayText: {
    ...textStyles.caption,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  
  weekDayTextCompact: {
    fontSize: 10,
  },
  
  weeksContainer: {
    flexDirection: 'row',
    paddingTop: 25,
  },
  
  week: {
    marginRight: spacing[2],
  },
  
  selectedDatePanel: {
    marginTop: spacing[4],
    padding: spacing[3],
    borderWidth: 1,
    borderRadius: radiusValues.box,
    backgroundColor: colors.background,
  },
  
  selectedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  selectedDateTitle: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  
  selectedDateCount: {
    ...textStyles.body,
    fontWeight: '600',
  },
  
  selectedDateNote: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[2],
    fontStyle: 'italic',
  },
  
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  
  legendLabel: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },
  
  legendColors: {
    flexDirection: 'row',
    marginHorizontal: spacing[2],
    gap: spacing[1] / 2,
  },
  
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
});

export default TaskContributionGraph;