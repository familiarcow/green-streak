import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTasksStore } from '../store/tasksStore';
import { useLogsStore } from '../store/logsStore';
import { colors, textStyles, spacing, shadows, typography } from '../theme';
import { radiusValues } from '../theme/utils';
import { formatDisplayDate, getWeekDayName, formatDateString, parseDateString } from '../utils/dateHelpers';
import { DailyLogScreenProps } from '../types';
import { Icon } from '../components/common/Icon';
import { useSounds } from '../hooks';
import logger from '../utils/logger';

interface TaskCompletion {
  taskId: string;
  count: number;
}

export const DailyLogScreen: React.FC<DailyLogScreenProps> = ({ date, onClose, onDateChange }) => {
  const { tasks, loading: tasksLoading } = useTasksStore();
  const { logTaskCompletion, contributionData, loadContributionData } = useLogsStore();
  const { play, playToggle, playRandomType, playCaution } = useSounds();
  const [completions, setCompletions] = useState<Record<string, number>>({});
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Find the selected date's data from contributionData (same pattern as TodayCard)
  const selectedDateData = contributionData.find(d => d.date === date);

  // Load contribution data if navigating to a date outside current range
  useEffect(() => {
    if (date && !selectedDateData) {
      // Date is not in current contribution data, need to load it
      loadContributionData(true, date);
    }
  }, [date, selectedDateData, loadContributionData]);

  useEffect(() => {
    try {
      // Initialize completions with existing log data
      const initialCompletions: Record<string, number> = {};
      if (tasks && tasks.length > 0) {
        tasks.forEach(task => {
          // Use contributionData pattern like TodayCard
          const taskData = selectedDateData?.tasks.find(t => t.taskId === task.id);
          initialCompletions[task.id] = taskData?.count || 0;
        });
        setCompletions(initialCompletions);
      }
      setIsInitializing(false);
    } catch (error) {
      console.error('Error initializing completions:', error);
      logger.error('UI', 'Failed to initialize completions', { error, date });
      setIsInitializing(false);
    }
  }, [tasks, date, selectedDateData]);

  const updateCompletion = async (taskId: string, newCount: number) => {
    const clampedCount = Math.max(0, newCount);
    
    try {
      await logTaskCompletion(taskId, date, clampedCount);
      setCompletions(prev => ({
        ...prev,
        [taskId]: clampedCount,
      }));
      
      // Refresh contribution data to keep in sync (this is what updates the store)
      await loadContributionData(true, date);
      
      logger.debug('UI', 'Task completion updated', { taskId, date, count: clampedCount });
    } catch (error) {
      logger.error('UI', 'Failed to update task completion', { error, taskId, date });
      playCaution();
    }
  };

  const incrementTask = (taskId: string) => {
    const currentCount = completions[taskId] || 0;
    playToggle(true);
    updateCompletion(taskId, currentCount + 1);
  };

  const decrementTask = (taskId: string) => {
    const currentCount = completions[taskId] || 0;
    if (currentCount > 0) {
      playToggle(false);
      updateCompletion(taskId, currentCount - 1);
    }
  };

  const toggleTask = (taskId: string) => {
    const currentCount = completions[taskId] || 0;
    updateCompletion(taskId, currentCount > 0 ? 0 : 1);
  };
  
  const navigateDate = (direction: 'prev' | 'next') => {
    if (onDateChange) {
      playRandomType();
      const currentDate = parseDateString(date);
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
      const newDateString = formatDateString(newDate);
      onDateChange(newDateString);
    }
  };

  const totalCompletions = Object.values(completions).reduce((sum, count) => sum + count, 0);
  const completedTasks = Object.values(completions).filter(count => count > 0).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.dateNavigation}>
            <TouchableOpacity 
              onPress={() => navigateDate('prev')}
              style={styles.navButton}
              accessibilityRole="button"
              accessibilityLabel="Previous day"
            >
              <Icon name="chevron-left" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => navigateDate('next')}
              style={styles.navButton}
              accessibilityRole="button"
              accessibilityLabel="Next day"
            >
              <Icon name="chevron-right" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.headerInfo}>
          <View style={styles.dateRow}>
            <Text style={styles.dayOfWeek}>{date ? getWeekDayName(parseDateString(date)).toUpperCase() : ''}</Text>
            <Text style={styles.dateTitle}>{date ? formatDisplayDate(parseDateString(date)) : 'No date'}</Text>
          </View>
          <Text style={styles.summaryText}>
            {completedTasks} tasks, {totalCompletions} completions
          </Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => {
              playRandomType();
              onClose();
            }}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close daily log"
          >
            <Icon name="x" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No habits to track yet. Add some habits to get started!
            </Text>
          </View>
        ) : (
          <View style={styles.tasksList}>
            {tasks.map(task => {
              const count = completions[task.id] || 0;
              const isCompleted = count > 0;

              return (
                <View key={task.id} style={styles.taskCard}>
                  <View style={styles.taskInfo}>
                    <View style={styles.taskHeader}>
                      {task.icon && (
                        <View style={styles.taskIconContainer}>
                          <Icon name={task.icon as import('../components/common/Icon').IconName} size={20} color={colors.text.secondary} />
                        </View>
                      )}
                      <View 
                        style={[
                          styles.taskColorDot, 
                          { backgroundColor: task.color }
                        ]} 
                      />
                      <Text style={styles.taskName}>{task.name}</Text>
                    </View>
                    
                    {task.description && (
                      <Text style={styles.taskDescription}>{task.description}</Text>
                    )}
                  </View>

                  <View style={styles.taskControls}>
                    {/* Quick +/- buttons */}
                    <View style={styles.quickControls}>
                      <TouchableOpacity
                        style={[styles.quickButton, count === 0 && styles.quickButtonDisabled]}
                        onPress={() => decrementTask(task.id)}
                        disabled={count === 0}
                        accessibilityRole="button"
                        accessibilityLabel={`Decrease ${task.name}`}
                      >
                        <Icon name="minus" size={16} color={count === 0 ? colors.text.tertiary : colors.text.primary} />
                      </TouchableOpacity>
                      
                      <Text style={styles.quickCount}>{count}</Text>
                      
                      <TouchableOpacity
                        style={styles.quickButton}
                        onPress={() => incrementTask(task.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Increase ${task.name}`}
                      >
                        <Icon name="plus" size={16} color={colors.text.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

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
  
  headerLeft: {
    width: 80,
  },
  
  dateNavigation: {
    flexDirection: 'row',
    gap: spacing[1],
  },
  
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.interactive.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  headerRight: {
    width: 80,
    alignItems: 'flex-end',
  },
  
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.interactive.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  headerInfo: {
    alignItems: 'center',
  },
  
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  
  dayOfWeek: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    fontWeight: '600',
    fontSize: 12,
  },
  
  dateTitle: {
    ...textStyles.h2,
    color: colors.text.primary,
  },
  
  summaryText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  
  headerSpacer: {
    width: 60, // Balance the close button
  },
  
  scrollView: {
    flex: 1,
    padding: spacing[4],
  },
  
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
  },
  
  emptyStateText: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
  },
  
  loadingText: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  
  tasksList: {
    gap: spacing[3],
  },
  
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    ...shadows.sm,
  },
  
  taskInfo: {
    flex: 1,
  },
  
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  taskColorDot: {
    width: 12,
    height: 12,
    borderRadius: 2,
    marginRight: spacing[3],
  },
  
  taskName: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  
  taskIconContainer: {
    marginRight: spacing[2],
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  
  taskDescription: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[1],
    marginLeft: spacing[6], // Align with task name
  },
  
  counterControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  
  counterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  disabledButton: {
    backgroundColor: colors.interactive.disabled,
  },
  
  counterButtonText: {
    ...textStyles.button,
    color: colors.text.inverse,
    fontSize: typography.fontSizes.lg,
  },
  
  disabledButtonText: {
    color: colors.text.tertiary,
  },
  
  countDisplay: {
    ...textStyles.h3,
    color: colors.text.primary,
    minWidth: 24,
    textAlign: 'center',
  },
  
  checkButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  checkButtonCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  
  taskControls: {
    alignItems: 'center',
  },
  
  quickControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[1],
  },
  
  quickButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.interactive.default,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  
  quickButtonDisabled: {
    backgroundColor: colors.interactive.disabled,
    borderColor: colors.border,
  },
  
  quickCount: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'center',
  },
});

export default DailyLogScreen;