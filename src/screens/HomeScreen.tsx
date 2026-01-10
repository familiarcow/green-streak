import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContributionGraph } from '../components/ContributionGraph';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ScreenErrorBoundary } from '../components/ScreenErrorBoundary';
import { Icon } from '../components/common/Icon';
import { TodayCard, HistorySection, EmptyStateSection, TasksSection } from '../components/HomeScreen';
import { BaseModal } from '../components/modals';
import { useTasksStore } from '../store/tasksStore';
import { useLogsStore } from '../store/logsStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTaskActions, useModalManager, useDateNavigation } from '../hooks';
import { useDateRefresh } from '../hooks/useDateRefresh';
import { colors, textStyles, spacing } from '../theme';
import { formatDateString, getTodayString } from '../utils/dateHelpers';
import EditTaskModal from './EditTaskModal';
import DailyLogScreen from './DailyLogScreen';
import SettingsScreen from './SettingsScreen';
import TaskAnalyticsScreen from './TaskAnalyticsScreen';
import { Task } from '../types';
import logger from '../utils/logger';

export const HomeScreen: React.FC = () => {
  // Business logic hooks
  const { handleQuickAdd, refreshAllData, refreshContributionData } = useTaskActions();
  const { selectedDate, handleDayPress, handleDateChange } = useDateNavigation();
  const {
    activeModal,
    modalConfig,
    openAddTask,
    openEditTask,
    openDailyLog,
    openSettings,
    openTaskAnalytics,
    closeModal,
    getAnimationStyle,
    animations,
  } = useModalManager();

  // Store hooks
  const { tasks, loading: tasksLoading } = useTasksStore();
  const { contributionData, loading: logsLoading } = useLogsStore();
  const { firstDayOfWeek } = useSettingsStore();

  // Local component state
  const [showHistory, setShowHistory] = useState(false);
  const [historyDays, setHistoryDays] = useState<string[]>([]);

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
    
    // Initialize history with past 30 days
    const days: string[] = [];
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(formatDateString(date));
    }
    setHistoryDays(days);
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
  const loadMoreHistory = useCallback(() => {
    const lastDate = historyDays[historyDays.length - 1];
    if (!lastDate) return;
    
    const newDays: string[] = [];
    const startDate = new Date(lastDate);
    for (let i = 1; i <= 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() - i);
      newDays.push(formatDateString(date));
    }
    setHistoryDays([...historyDays, ...newDays]);
  }, [historyDays]);

  const handleHistoryDayPress = useCallback((date: string) => {
    handleDayPress(date);
    openDailyLog(date);
  }, [handleDayPress, openDailyLog]);

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

  const handleToggleHistory = useCallback(() => {
    setShowHistory(prev => !prev);
  }, []);

  const handleDailyLogPress = useCallback(() => {
    openDailyLog(selectedDate);
  }, [openDailyLog, selectedDate]);


  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Green Streak</Text>
            </View>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={openSettings}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <Icon name="settings" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Contribution Graph */}
          <ErrorBoundary>
            <View style={styles.graphSection}>
              <ContributionGraph
                data={contributionData}
                tasks={tasks}
                onDayPress={handleDayPress}
                selectedDate={selectedDate}
                firstDayOfWeek={firstDayOfWeek}
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
          
          {/* History Section */}
          <ErrorBoundary>
            <HistorySection
              showHistory={showHistory}
              historyDays={historyDays}
              contributionData={contributionData}
              onToggleHistory={handleToggleHistory}
              onHistoryDayPress={handleHistoryDayPress}
              onLoadMore={loadMoreHistory}
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
              setTimeout(() => openDailyLog(modalConfig?.props?.date), 100);
            }}
          >
            <DailyLogScreen
              date={modalConfig?.props?.date || selectedDate}
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
    padding: spacing[4],
  },
  
  headerContent: {
    alignItems: 'center',
    flex: 1,
  },
  
  title: {
    ...textStyles.h1,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  
  subtitle: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
  
  settingsButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: spacing[2],
    backgroundColor: colors.accent.warm,
  },
  
  graphSection: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[6],
  },
});

export default HomeScreen;