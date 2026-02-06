import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { Task, ContributionData } from '../types';
import { TaskContributionGraph } from '../components/ContributionGraph/TaskContributionGraph';
import { AnimatedButton } from '../components/AnimatedButton';
import { AnimatedLoader } from '../components/AnimatedLoader';
import { useLogsStore } from '../store/logsStore';
import { colors, textStyles, spacing, shadows } from '../theme';
import { useSounds } from '../hooks/useSounds';
import { radiusValues } from '../theme/utils';
import { formatDisplayDate, getTodayString } from '../utils/dateHelpers';
import logger from '../utils/logger';

interface TaskAnalyticsScreenProps {
  task: Task;
  onClose: () => void;
  onEdit?: () => void;
}

export const TaskAnalyticsScreen: React.FC<TaskAnalyticsScreenProps> = ({
  task,
  onClose,
  onEdit,
}) => {
  const [loading, setLoading] = useState(true);
  const [taskContributionData, setTaskContributionData] = useState<ContributionData[]>([]);
  const { getTaskContributionData } = useLogsStore();
  const { play } = useSounds();

  const handleClose = () => {
    play('close');
    onClose();
  };

  useEffect(() => {
    const loadTaskData = async () => {
      try {
        setLoading(true);
        logger.debug('UI', 'Loading task analytics', { taskId: task.id, taskName: task.name });
        
        // Get last 365 days of data for this specific task
        const data = await getTaskContributionData(task.id);
        setTaskContributionData(data);
        
        logger.info('UI', 'Task analytics loaded', { 
          taskId: task.id, 
          dataPoints: data.length,
          activeDays: data.filter(d => d.count > 0).length
        });
      } catch (error) {
        logger.error('UI', 'Failed to load task analytics', { error, taskId: task.id });
      } finally {
        setLoading(false);
      }
    };

    loadTaskData();
  }, [task.id]);

  const analytics = useMemo(() => {
    if (taskContributionData.length === 0) {
      return {
        totalCompletions: 0,
        activeDays: 0,
        currentStreak: 0,
        longestStreak: 0,
        averagePerDay: 0,
        completionRate: 0,
        thisWeekTotal: 0,
        thisMonthTotal: 0,
      };
    }

    const totalCompletions = taskContributionData.reduce((sum, day) => sum + day.count, 0);
    const activeDays = taskContributionData.filter(day => day.count > 0).length;

    // Calculate current streak (consecutive days from today backwards)
    let currentStreak = 0;
    const today = getTodayString();
    const todayIndex = taskContributionData.findIndex(day => day.date === today);
    
    if (todayIndex !== -1) {
      for (let i = todayIndex; i >= 0; i--) {
        if (taskContributionData[i].count > 0) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let currentTemp = 0;
    
    taskContributionData.forEach(day => {
      if (day.count > 0) {
        currentTemp++;
        longestStreak = Math.max(longestStreak, currentTemp);
      } else {
        currentTemp = 0;
      }
    });

    const averagePerDay = activeDays > 0 ? totalCompletions / activeDays : 0;
    const completionRate = taskContributionData.length > 0 ? (activeDays / taskContributionData.length) * 100 : 0;

    // This week and this month calculations
    const today_date = new Date();
    const weekAgo = new Date(today_date);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today_date);
    monthAgo.setDate(monthAgo.getDate() - 30);

    const thisWeekTotal = taskContributionData
      .filter(day => {
        const dayDate = new Date(day.date);
        return dayDate >= weekAgo;
      })
      .reduce((sum, day) => sum + day.count, 0);

    const thisMonthTotal = taskContributionData
      .filter(day => {
        const dayDate = new Date(day.date);
        return dayDate >= monthAgo;
      })
      .reduce((sum, day) => sum + day.count, 0);

    return {
      totalCompletions,
      activeDays,
      currentStreak,
      longestStreak,
      averagePerDay,
      completionRate,
      thisWeekTotal,
      thisMonthTotal,
    };
  }, [taskContributionData]);

  const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    subtitle?: string;
    color?: string;
    delay?: number;
  }> = ({ title, value, subtitle, color = colors.primary, delay = 0 }) => (
    <Animated.View 
      entering={SlideInRight.delay(delay).springify()}
      style={[styles.statCard, { borderLeftColor: color }]}
    >
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </Animated.View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <AnimatedLoader text="Loading analytics..." color={task.color} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
        <View style={styles.taskHeader}>
          <View style={[styles.taskColorDot, { backgroundColor: task.color }]} />
          <View style={styles.taskInfo}>
            <Text style={styles.taskName}>{task.name}</Text>
            {task.description && (
              <Text style={styles.taskDescription}>{task.description}</Text>
            )}
          </View>
          {task.icon && <Text style={styles.taskIcon}>{task.icon}</Text>}
        </View>
        {onEdit && (
          <AnimatedButton
            title="Edit"
            onPress={onEdit}
            variant="secondary"
            size="small"
          />
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Contribution Graph */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.graphSection}>
          <Text style={styles.sectionTitle}>Activity Pattern</Text>
          <TaskContributionGraph
            data={taskContributionData}
            task={task}
          />
        </Animated.View>

        {/* Statistics Grid */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Completions"
              value={analytics.totalCompletions}
              delay={100}
              color={task.color}
            />
            <StatCard
              title="Active Days"
              value={analytics.activeDays}
              delay={150}
              color={task.color}
            />
            <StatCard
              title="Current Streak"
              value={analytics.currentStreak}
              subtitle="days in a row"
              delay={200}
              color={analytics.currentStreak > 0 ? colors.success : colors.text.secondary}
            />
            <StatCard
              title="Longest Streak"
              value={analytics.longestStreak}
              subtitle="days total"
              delay={250}
              color={colors.info}
            />
            <StatCard
              title="Completion Rate"
              value={`${Math.round(analytics.completionRate)}%`}
              subtitle="of all days"
              delay={300}
              color={analytics.completionRate >= 50 ? colors.success : colors.warning}
            />
            <StatCard
              title="Average Per Day"
              value={analytics.averagePerDay.toFixed(1)}
              subtitle="when active"
              delay={350}
              color={task.color}
            />
          </View>
        </View>

        {/* Recent Activity */}
        <Animated.View entering={FadeIn.delay(400)} style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          
          <View style={styles.recentStats}>
            <View style={styles.recentItem}>
              <Text style={styles.recentLabel}>This Week</Text>
              <Text style={[styles.recentValue, { color: task.color }]}>
                {analytics.thisWeekTotal} completions
              </Text>
            </View>
            <View style={styles.recentItem}>
              <Text style={styles.recentLabel}>This Month</Text>
              <Text style={[styles.recentValue, { color: task.color }]}>
                {analytics.thisMonthTotal} completions
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Task Details */}
        <Animated.View entering={FadeIn.delay(500)} style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Task Details</Text>
          
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Created</Text>
              <Text style={styles.detailValue}>
                {formatDisplayDate(new Date(task.createdAt))}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>
                {task.isMultiCompletion ? 'Multi-completion' : 'Single completion'}
              </Text>
            </View>
            {task.reminderEnabled && (
              <>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Reminder</Text>
                  <Text style={styles.detailValue}>
                    {task.reminderTime} {task.reminderFrequency}
                  </Text>
                </View>
              </>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  
  closeButton: {
    padding: spacing[2],
  },
  
  closeButtonText: {
    ...textStyles.button,
    color: colors.text.secondary,
  },
  
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing[4],
  },
  
  taskColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: spacing[3],
  },
  
  taskInfo: {
    flex: 1,
  },
  
  taskName: {
    ...textStyles.h3,
    color: colors.text.primary,
  },
  
  taskDescription: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  
  taskIcon: {
    fontSize: 24,
    marginLeft: spacing[2],
  },
  
  scrollView: {
    flex: 1,
  },
  
  graphSection: {
    margin: spacing[4],
  },
  
  sectionTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  
  statsSection: {
    margin: spacing[4],
  },
  
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    padding: spacing[4],
    borderRadius: radiusValues.box,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...shadows.sm,
  },
  
  statValue: {
    ...textStyles.h1,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  
  statTitle: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  
  statSubtitle: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    marginTop: spacing[1],
  },
  
  recentSection: {
    margin: spacing[4],
  },
  
  recentStats: {
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    padding: spacing[4],
    ...shadows.sm,
  },
  
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  
  recentLabel: {
    ...textStyles.body,
    color: colors.text.secondary,
  },
  
  recentValue: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  
  detailsSection: {
    margin: spacing[4],
    marginBottom: spacing[8],
  },
  
  detailsGrid: {
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    padding: spacing[4],
    ...shadows.sm,
  },
  
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  
  detailLabel: {
    ...textStyles.body,
    color: colors.text.secondary,
  },
  
  detailValue: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
});

export default TaskAnalyticsScreen;