import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContributionGraph } from '../components/ContributionGraph';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ScreenErrorBoundary } from '../components/ScreenErrorBoundary';
import { Icon } from '../components/common/Icon';
import { TodayCard, EmptyStateSection, TasksSection } from '../components/HomeScreen';
import { BaseModal } from '../components/modals';
import { useTasksStore } from '../store/tasksStore';
import { useLogsStore } from '../store/logsStore';
import { useTaskActions, useModalManager, useDateNavigation, useAccentColor, useColorName, useDeepLinks, useWidgetSync } from '../hooks';
import { useDateRefresh } from '../hooks/useDateRefresh';
import { useDynamicIconLifecycle } from '../hooks/useDynamicIconLifecycle';
import { colors, textStyles, spacing } from '../theme';
import { radiusValues } from '../theme/utils';
import { getTodayString } from '../utils/dateHelpers';
import EditTaskModal from './EditTaskModal';
import DailyLogScreen from './DailyLogScreen';
import SettingsScreen from './SettingsScreen';
import TaskAnalyticsScreen from './TaskAnalyticsScreen';
import AchievementLibraryScreen from './AchievementLibraryScreen';
import { Task } from '../types';
import logger from '../utils/logger';

export const HomeScreen: React.FC = () => {
  // Business logic hooks
  const { handleQuickAdd, refreshAllData, refreshContributionData } = useTaskActions();
  const { selectedDate, handleDayPress, handleDateChange } = useDateNavigation();

  // Widget sync (processes pending widget actions, syncs data to widgets)
  useWidgetSync();
  const {
    activeModal,
    modalConfig,
    openAddTask,
    openEditTask,
    openDailyLog,
    openSettings,
    openTaskAnalytics,
    openAchievementLibrary,
    closeModal,
    getAnimationStyle,
    animations,
  } = useModalManager();

  // Store hooks
  const { tasks, loading: tasksLoading, reorderTasks } = useTasksStore();
  const { contributionData, loading: logsLoading } = useLogsStore();

  // Accent color hooks for dynamic header
  const accentColor = useAccentColor();
  const colorName = useColorName();

  // Dynamic icon lifecycle management
  useDynamicIconLifecycle();

  // Handle deep links from widgets
  useDeepLinks({
    onCalendarLink: (date) => {
      logger.info('UI', 'Deep link: navigating to calendar date', { date });
      handleDateChange(date);
    },
    onTaskLink: (taskId) => {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        logger.info('UI', 'Deep link: opening task analytics', { taskId });
        openTaskAnalytics(task);
      }
    },
    onAppOpen: () => {
      logger.info('UI', 'Deep link: app opened');
    },
  });

  // Handle date changes (midnight, app resume, etc)
  // Now using centralized DateService through the hook
  const currentToday = useDateRefresh((newToday) => {
    logger.info('UI', 'Date refresh triggered in HomeScreen', { newToday });
    
    // If we were on "today" and the date changed, update to new today
    if (selectedDate === newToday || selectedDate < newToday) {
      handleDateChange(newToday);
    }
    
    // Refresh data to ensure everything is up to date
    refreshAllData();
  });

  // Initialize data on mount
  useEffect(() => {
    const initializeData = async () => {
      try {
        logger.info('UI', 'Initializing HomeScreen');
        await refreshAllData();
      } catch (error) {
        logger.error('UI', 'Failed to initialize HomeScreen', { error });
      }
    };

    initializeData();
  }, [refreshAllData]);

  // Memoized computed values
  const selectedDateData = useMemo(() => 
    contributionData.find(d => d.date === selectedDate), 
    [contributionData, selectedDate]
  );

  const isLoading = useMemo(() => 
    tasksLoading || logsLoading, 
    [tasksLoading, logsLoading]
  );

  // Event handlers
  const handleTaskAdded = useCallback(async () => {
    try {
      await refreshAllData();
      closeModal();
    } catch (error) {
      logger.error('UI', 'Failed to refresh after task added', { error });
    }
  }, [refreshAllData, closeModal]);

  const handleDailyLogClose = useCallback(async () => {
    try {
      await refreshContributionData();
      closeModal();
    } catch (error) {
      logger.error('UI', 'Failed to refresh after daily log close', { error });
    }
  }, [refreshContributionData, closeModal]);

  const handleTaskPress = useCallback((task: Task) => {
    logger.debug('UI', 'Task pressed for editing', { taskId: task.id, taskName: task.name });
    openEditTask(task);
  }, [openEditTask]);

  const handleTaskAnalytics = useCallback((task: Task) => {
    logger.debug('UI', 'Task analytics requested', { taskId: task.id, taskName: task.name });
    openTaskAnalytics(task);
  }, [openTaskAnalytics]);

  const handleDailyLogPress = useCallback(() => {
    openDailyLog(selectedDate);
  }, [openDailyLog, selectedDate]);

  const handleReorderTasks = useCallback(async (taskIds: string[]) => {
    try {
      logger.debug('UI', 'Reordering tasks', { count: taskIds.length });
      await reorderTasks(taskIds);
    } catch (error) {
      logger.error('UI', 'Failed to reorder tasks', { error });
    }
  }, [reorderTasks]);

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <View style={[styles.greenBox, { backgroundColor: accentColor }]} />
              <Text style={styles.title}>{colorName} Streak</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={openAchievementLibrary}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Achievements"
              >
                <Icon name="trophy" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={openSettings}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Settings"
              >
                <Icon name="settings" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Contribution Graph */}
          <ErrorBoundary>
            <View style={styles.graphSection}>
              <ContributionGraph
                data={contributionData}
                tasks={tasks}
                onDayPress={handleDayPress}
                selectedDate={selectedDate}
              />
            </View>
          </ErrorBoundary>

          {/* Today Card */}
          <ErrorBoundary>
            <TodayCard
              selectedDate={selectedDate}
              selectedDateData={selectedDateData}
              tasks={tasks}
              onQuickAdd={handleQuickAdd}
              onViewMore={handleDailyLogPress}
              onDateChange={handleDateChange}
            />
          </ErrorBoundary>

          {/* Empty State */}
          {tasks.length === 0 && (
            <ErrorBoundary>
              <EmptyStateSection onAddTask={openAddTask} />
            </ErrorBoundary>
          )}

          {/* Tasks Section */}
          <ErrorBoundary>
            <TasksSection
              tasks={tasks}
              onTaskPress={handleTaskPress}
              onAddTask={openAddTask}
              onReorder={handleReorderTasks}
            />
          </ErrorBoundary>
        </ScrollView>

        {/* Add Task / Edit Task Modal */}
        <BaseModal
          isVisible={activeModal === 'addTask' || activeModal === 'editTask'}
          onClose={closeModal}
        >
          <ScreenErrorBoundary 
            screenName={activeModal === 'addTask' ? 'Add Task' : 'Edit Task'}
            onClose={closeModal}
            onRetry={() => {
              closeModal();
              setTimeout(() => {
                if (activeModal === 'addTask') {
                  openAddTask();
                } else if (activeModal === 'editTask' && modalConfig?.props?.task) {
                  openEditTask(modalConfig.props.task);
                }
              }, 100);
            }}
          >
            <EditTaskModal
              onClose={closeModal}
              onTaskAdded={handleTaskAdded}
              existingTask={modalConfig?.props?.task}
            />
          </ScreenErrorBoundary>
        </BaseModal>

        {/* Daily Log Modal */}
        <BaseModal
          isVisible={activeModal === 'dailyLog'}
          onClose={closeModal}
        >
          <ScreenErrorBoundary 
            screenName="Daily Log"
            onClose={handleDailyLogClose}
            onRetry={() => {
              handleDailyLogClose();
              setTimeout(() => openDailyLog(selectedDate), 100);
            }}
          >
            <DailyLogScreen
              date={selectedDate}
              onClose={handleDailyLogClose}
              onDateChange={handleDateChange}
            />
          </ScreenErrorBoundary>
        </BaseModal>

        {/* Settings Modal */}
        <BaseModal
          isVisible={activeModal === 'settings'}
          onClose={closeModal}
        >
          <ScreenErrorBoundary 
            screenName="Settings"
            onClose={closeModal}
            onRetry={() => {
              closeModal();
              setTimeout(() => openSettings(), 100);
            }}
          >
            <SettingsScreen onClose={closeModal} />
          </ScreenErrorBoundary>
        </BaseModal>

        {/* Task Analytics Modal */}
        <BaseModal
          isVisible={activeModal === 'taskAnalytics'}
          onClose={closeModal}
        >
          <ScreenErrorBoundary
            screenName="Task Analytics"
            onClose={closeModal}
            onRetry={() => {
              closeModal();
              setTimeout(() => {
                if (modalConfig?.props?.task) {
                  openTaskAnalytics(modalConfig.props.task);
                }
              }, 100);
            }}
          >
            {modalConfig?.props?.task && (
              <TaskAnalyticsScreen
                task={modalConfig.props.task}
                onClose={closeModal}
              />
            )}
          </ScreenErrorBoundary>
        </BaseModal>

        {/* Achievement Library Modal */}
        <BaseModal
          isVisible={activeModal === 'achievementLibrary'}
          onClose={closeModal}
        >
          <ScreenErrorBoundary
            screenName="Achievements"
            onClose={closeModal}
            onRetry={() => {
              closeModal();
              setTimeout(() => openAchievementLibrary(), 100);
            }}
          >
            <AchievementLibraryScreen onClose={closeModal} />
          </ScreenErrorBoundary>
        </BaseModal>
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  scrollView: {
    flex: 1,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[4],
    marginHorizontal: spacing[6],
  },

  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  greenBox: {
    width: 22,
    height: 22,
    borderRadius: radiusValues.box,
  },

  title: {
    ...textStyles.h1,
    color: colors.text.primary,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radiusValues.box,
  },
  
  graphSection: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[6],
  },
});

export default HomeScreen;