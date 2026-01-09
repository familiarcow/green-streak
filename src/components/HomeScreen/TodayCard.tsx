import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, textStyles, spacing, shadows, borderRadius } from '../../theme';
import { sizes, gaps, radiusValues } from '../../theme/utils';
import { TodayCardProps, Task, TaskStreak } from '../../types';
import { formatDisplayDate, getTodayString } from '../../utils/dateHelpers';
import { Icon } from '../common/Icon';
import { DatePickerModal } from '../common/DatePickerModal';
import { useStreaksStore } from '../../store/streaksStore';
import logger from '../../utils/logger';

export const TodayCard: React.FC<TodayCardProps> = React.memo(({
  selectedDate,
  selectedDateData,
  tasks,
  onQuickAdd,
  onViewMore,
  onDateChange,
}) => {
  // State for date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Streaks store
  const { streaks, loadStreaks, loadStreaksForDate, getStreakForTaskOnDate } = useStreaksStore();
  
  // Load streaks on mount
  useEffect(() => {
    loadStreaks();
  }, [loadStreaks]);
  
  // Load date-specific streaks when selected date changes
  useEffect(() => {
    loadStreaksForDate(selectedDate);
  }, [loadStreaksForDate, selectedDate]);

  // Memoized computed values
  const isToday = useMemo(() => selectedDate === getTodayString(), [selectedDate]);
  const hasCompletions = useMemo(() => selectedDateData && selectedDateData.count > 0, [selectedDateData]);
  const totalCompletions = useMemo(() => selectedDateData?.count || 0, [selectedDateData]);
  const canGoForward = useMemo(() => selectedDate < getTodayString(), [selectedDate]);

  // Memoized completion count lookup function
  const getTaskCompletionCount = useCallback((taskId: string): number => {
    if (!selectedDateData) return 0;
    const taskData = selectedDateData.tasks.find(t => t.taskId === taskId);
    return taskData?.count || 0;
  }, [selectedDateData]);

  // Memoized navigation functions
  const handlePreviousDay = useCallback(() => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    const previousDate = currentDate.toISOString().split('T')[0];
    onDateChange(previousDate);
  }, [selectedDate, onDateChange]);

  const handleNextDay = useCallback(() => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + 1);
    const nextDate = currentDate.toISOString().split('T')[0];
    onDateChange(nextDate);
  }, [selectedDate, onDateChange]);

  // Date picker handlers
  const handleOpenDatePicker = useCallback(() => {
    setShowDatePicker(true);
  }, []);

  const handleCloseDatePicker = useCallback(() => {
    setShowDatePicker(false);
  }, []);

  const handleDateSelect = useCallback((date: string) => {
    onDateChange(date);
    setShowDatePicker(false);
  }, [onDateChange]);




  // Memoized task render function
  const renderTaskQuickAdd = useCallback((task: Task) => {
    const completionCount = getTaskCompletionCount(task.id);
    const hasCompletions = completionCount > 0;
    
    // Get date-specific streak for this task
    const dateStreak = getStreakForTaskOnDate(task.id, selectedDate);
    const streakCount = dateStreak?.streakCount || 0;
    
    // For debugging
    logger.debug('UI', 'Task streak display', {
      taskId: task.id,
      taskName: task.name,
      selectedDate,
      streakCount,
      hasCompletedToday: dateStreak?.hasCompletedToday,
      isActiveStreak: dateStreak?.isActiveStreak
    });

    const handleQuickAddPress = () => {
      console.log('Quick add button pressed for task:', task.id, 'selectedDate:', selectedDate);
      onQuickAdd(task.id, selectedDate);
    };

    return (
      <View key={task.id} style={styles.taskRow}>
        <View style={styles.taskInfo}>
          <View style={[styles.taskIconContainer, { backgroundColor: task.color }]}>
            {task.icon ? (
              <Icon 
                name={task.icon as import('../common/Icon').IconName} 
                size={18} 
                color={colors.text.inverse} 
              />
            ) : (
              <Text style={styles.taskInitials}>
                {task.name.substring(0, 2).toUpperCase()}
              </Text>
            )}
            {hasCompletions && (
              <View style={styles.completionOverlay}>
                <Icon name="check" size={10} color={colors.text.inverse} />
              </View>
            )}
          </View>
          
          <View style={styles.taskDetails}>
            <View style={styles.taskNameRow}>
              <Text style={styles.taskName} numberOfLines={1}>{task.name}</Text>
              {hasCompletions && (
                <View style={styles.progressDots}>
                  {Array.from({ length: Math.min(completionCount, 5) }).map((_, index) => (
                    <View key={index} style={styles.progressDot} />
                  ))}
                  {completionCount > 5 && (
                    <Text style={styles.extraCount}>+{completionCount - 5}</Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
        
        {task.streakEnabled && streakCount > 0 && (
          <View style={styles.streakContainer}>
            <Icon name="flame" size={14} color={colors.accent.warm} />
            <Text style={styles.streakText}>
              {streakCount}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.quickAddButton,
            hasCompletions && styles.quickAddButtonCompleted
          ]}
          onPress={handleQuickAddPress}
          accessibilityRole="button"
          accessibilityLabel={`Add completion for ${task.name}`}
          accessibilityHint={`Currently completed ${completionCount} times today`}
        >
          {hasCompletions ? (
            <Icon name="checkCircle" size={20} color={colors.text.inverse} />
          ) : (
            <Icon name="plus" size={20} color={colors.text.secondary} />
          )}
        </TouchableOpacity>
      </View>
    );
  }, [getTaskCompletionCount, onQuickAdd, selectedDate, getStreakForTaskOnDate]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={handlePreviousDay}
            accessibilityRole="button"
            accessibilityLabel="Go to previous day"
          >
            <Icon name="chevron-left" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={handleOpenDatePicker}
            style={styles.dateTitleButton}
            accessibilityRole="button"
            accessibilityLabel="Open date picker"
            accessibilityHint="Tap to select any date"
          >
            <Text style={styles.dateTitle}>
              {isToday ? 'Today' : formatDisplayDate(new Date(selectedDate))}
            </Text>
          </TouchableOpacity>
          
          {canGoForward && (
            <TouchableOpacity
              style={styles.navButton}
              onPress={handleNextDay}
              accessibilityRole="button"
              accessibilityLabel="Go to next day"
            >
              <Icon name="chevron-right" size={16} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={onViewMore}
            accessibilityRole="button"
            accessibilityLabel={isToday ? "View detailed log for today" : "Edit this day"}
          >
            <Icon name="edit" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
          
          <View style={styles.totalBadge}>
            <Text style={styles.totalText}>{totalCompletions}</Text>
          </View>
        </View>
      </View>

      {/* Tasks Section */}
      {tasks.length > 0 ? (
        <View style={styles.tasksContainer}>
          <View style={styles.tasksList}>
            {tasks.map(renderTaskQuickAdd)}
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Icon name="target" size={24} color={colors.text.tertiary} />
          <Text style={styles.emptyText}>No habits to track yet</Text>
        </View>
      )}

      {/* Date Picker Modal */}
      <DatePickerModal
        visible={showDatePicker}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        onClose={handleCloseDatePicker}
        maximumDate={new Date()}
        minimumDate={new Date('2020-01-01')}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[6],
    padding: spacing[4],
    backgroundColor: colors.surface,
    borderRadius: spacing[3],
    ...shadows.sm,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
  },

  navButton: {
    width: sizes.touchTarget.small,
    height: sizes.touchTarget.small,
    borderRadius: radiusValues.md,
    backgroundColor: colors.interactive.default,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  editButton: {
    width: sizes.touchTarget.small,
    height: sizes.touchTarget.small,
    borderRadius: radiusValues.md,
    backgroundColor: colors.interactive.default,
    alignItems: 'center',
    justifyContent: 'center',
  },

  dateTitleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radiusValues.md,
  },

  dateTitle: {
    ...textStyles.h2,
    color: colors.text.primary,
    fontWeight: '700',
  },

  totalBadge: {
    backgroundColor: colors.primary,
    borderRadius: radiusValues.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    minWidth: sizes.touchTarget.small,
    alignItems: 'center',
    justifyContent: 'center',
  },

  totalText: {
    ...textStyles.bodySmall,
    color: colors.text.inverse,
    fontWeight: '700',
  },

  emptyBadge: {
    backgroundColor: colors.interactive.default,
    borderRadius: radiusValues.md,
    padding: spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
  },

  tasksContainer: {
    marginBottom: spacing[4],
  },


  tasksList: {
    gap: spacing[3],
  },

  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
  },

  taskInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[3],
  },

  taskIconContainer: {
    width: sizes.iconContainer.medium,
    height: sizes.iconContainer.medium,
    borderRadius: radiusValues.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...shadows.sm,
  },

  completionOverlay: {
    position: 'absolute',
    top: -spacing[1] / 2,
    right: -spacing[1] / 2,
    backgroundColor: colors.success,
    borderRadius: radiusValues.sm,
    width: sizes.badge.width,
    height: sizes.badge.height,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },

  taskInitials: {
    ...textStyles.bodySmall,
    color: colors.text.inverse,
    fontWeight: '700',
  },

  taskDetails: {
    flex: 1,
    marginLeft: spacing[3],
  },

  taskNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  taskName: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },

  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },

  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginRight: spacing[2],
  },

  streakBadge: {
    backgroundColor: colors.accent.warm,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1] / 2,
    borderRadius: spacing[2],
  },

  streakText: {
    ...textStyles.caption,
    color: colors.text.secondary,
    fontWeight: '500',
    fontSize: 11,
  },

  progressDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: gaps.xxs,
  },

  progressDot: {
    width: sizes.progressDot,
    height: sizes.progressDot,
    borderRadius: radiusValues.xs,
    backgroundColor: colors.success,
  },

  extraCount: {
    ...textStyles.caption,
    color: colors.success,
    fontWeight: '600',
    marginLeft: gaps.xxs,
  },

  quickAddButton: {
    width: sizes.touchTarget.medium,
    height: sizes.touchTarget.medium,
    borderRadius: radiusValues.lg,
    backgroundColor: colors.interactive.default,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },

  quickAddButtonCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },


  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[4],
    gap: spacing[2],
  },

  emptyText: {
    ...textStyles.body,
    color: colors.text.tertiary,
    textAlign: 'center',
  },

});

export default TodayCard;