import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContributionGraph } from '../components/ContributionGraph';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ScreenErrorBoundary } from '../components/ScreenErrorBoundary';
import { Icon } from '../components/common/Icon';
import { TodayCard, EmptyStateSection, TasksSection, AppFeedbackCard } from '../components/HomeScreen';
import { GoalCard } from '../components/goals';
import { BaseModal, GoalDetailModal, AddGoalsModal, AddMilestoneModal } from '../components/modals';
import { CustomGoalDefinition } from '../types/goals';
import { useTasksStore } from '../store/tasksStore';
import { useLogsStore } from '../store/logsStore';
import { useAchievementsStore } from '../store/achievementsStore';
import { useGoalsStore } from '../store/goalsStore';
import { useTaskActions, useModalManager, useDateNavigation, useAccentColor, useColorName, useDeepLinks, useWidgetSync, useSounds, useGoalModalFlow } from '../hooks';
import { useDateRefresh } from '../hooks/useDateRefresh';
import { colors, textStyles, spacing } from '../theme';
import { radiusValues } from '../theme/utils';
import { getTodayString } from '../utils/dateHelpers';
import EditTaskModal from './EditTaskModal';
import { EditGoalModal } from '../components/modals';
import DailyLogScreen from './DailyLogScreen';
import SettingsScreen from './SettingsScreen';
import TaskAnalyticsScreen from './TaskAnalyticsScreen';
import AchievementGridScreen from './AchievementGridScreen';
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
    openGoalDetail,
    closeModal,
    getAnimationStyle,
    animations,
  } = useModalManager();

  // Store hooks
  const { tasks, loading: tasksLoading, reorderTasks } = useTasksStore();
  const { contributionData, loading: logsLoading } = useLogsStore();
  const { pendingUnlocks } = useAchievementsStore();
  const { goals, primaryGoal, goalProgress, loadGoals, setCanShowModal } = useGoalsStore();

  // Goal modal flow (handles sequencing for AddGoalsModal and EditGoalModal)
  const goalModalFlow = useGoalModalFlow({
    onCloseGoalDetail: closeModal,
    setCanShowModal,
    loadGoals,
  });

  // Accent color hooks for dynamic header
  const accentColor = useAccentColor();
  const colorName = useColorName();

  // Sound effects
  const { playRandomTap } = useSounds();

  // ScrollView ref for programmatic scrolling
  const scrollViewRef = useRef<ScrollView>(null);
  const graphSectionRef = useRef<View>(null);
  const currentScrollY = useRef(0);
  const viewportHeight = useRef(Dimensions.get('window').height);

  // Track scroll position
  const handleScroll = useCallback((event: any) => {
    currentScrollY.current = event.nativeEvent.contentOffset.y;
  }, []);

  // Track viewport height
  const handleScrollViewLayout = useCallback((event: any) => {
    viewportHeight.current = event.nativeEvent.layout.height;
  }, []);

  // Callback when calendar view type changes - scroll to keep time period selector visible
  // Only scrolls DOWN if the calendar bottom would be out of view
  const handleCalendarHeightChange = useCallback((height: number) => {
    if (!scrollViewRef.current || !graphSectionRef.current) return;

    // Small delay to ensure layout has settled after height change
    setTimeout(() => {
      if (!graphSectionRef.current) return;

      // Get the graph section's position in the window
      graphSectionRef.current.measureInWindow((x, y, width, measuredHeight) => {
        // Use measured viewport or fall back to window dimensions
        const screenHeight = viewportHeight.current > 0
          ? viewportHeight.current
          : Dimensions.get('window').height;

        // Calculate where the calendar bottom is on screen
        // y is the top of the graph section on screen, height is the new calendar height
        const calendarBottomOnScreen = y + height;

        // If the calendar bottom is below the screen bottom, we need to scroll
        if (calendarBottomOnScreen > screenHeight) {
          // Calculate how much we need to scroll down
          const scrollAmount = calendarBottomOnScreen - screenHeight + 24; // 24px padding

          // New scroll position
          const targetScroll = currentScrollY.current + scrollAmount;

          // Only scroll DOWN (this check is inherent since scrollAmount > 0)
          scrollViewRef.current?.scrollTo({ y: targetScroll, animated: true });
        }
      });
    }, 50);
  }, []);

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
        await Promise.all([
          refreshAllData(),
          loadGoals(),
        ]);
      } catch (error) {
        logger.error('UI', 'Failed to initialize HomeScreen', { error });
      }
    };

    initializeData();
  }, [refreshAllData, loadGoals]);

  // iOS modal sequencing: block secondary modals when primary modal is open
  useEffect(() => {
    if (activeModal !== null) {
      setCanShowModal(false);
    }
  }, [activeModal, setCanShowModal]);

  // Auto-open achievement grid when new achievements unlock
  const prevPendingCountRef = useRef(0);
  useEffect(() => {
    // Only auto-open if:
    // 1. There are pending unlocks
    // 2. The count increased (new unlock, not just existing queue)
    // 3. No modal is currently open
    if (
      pendingUnlocks.length > 0 &&
      pendingUnlocks.length > prevPendingCountRef.current &&
      activeModal === null
    ) {
      logger.info('UI', 'Auto-opening achievement grid for new unlock', {
        achievementId: pendingUnlocks[0].achievement.id,
      });
      // Small delay to let any current transitions complete
      setTimeout(() => {
        openAchievementLibrary();
      }, 300);
    }
    prevPendingCountRef.current = pendingUnlocks.length;
  }, [pendingUnlocks, activeModal, openAchievementLibrary]);

  // Memoized computed values
  const selectedDateData = useMemo(() => 
    contributionData.find(d => d.date === selectedDate), 
    [contributionData, selectedDate]
  );

  const isLoading = useMemo(() =>
    tasksLoading || logsLoading,
    [tasksLoading, logsLoading]
  );

  // Count days with activity for rating prompt
  const activeDaysCount = useMemo(() =>
    contributionData.filter(d => d.count > 0).length,
    [contributionData]
  );

  // Event handlers
  const handleTaskAdded = useCallback(() => {
    closeModal();

    // Refresh data in the background after modal starts closing
    refreshAllData().catch((error) => {
      logger.error('UI', 'Failed to refresh after task added', { error });
    });
  }, [refreshAllData, closeModal]);

  const handleDailyLogClose = useCallback(() => {
    // Close modal first for consistency with handleTaskAdded
    closeModal();

    // Refresh data in the background
    refreshContributionData().catch((error) => {
      logger.error('UI', 'Failed to refresh after daily log close', { error });
    });
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
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          onLayout={handleScrollViewLayout}
          scrollEventThrottle={16}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <View style={[styles.greenBox, { backgroundColor: accentColor }]} />
              <Text style={styles.title}>{colorName} Streak</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => {
                  playRandomTap();
                  openAchievementLibrary();
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Achievements"
              >
                <Icon name="trophy" size={20} color={colors.text.secondary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => {
                  playRandomTap();
                  openSettings();
                }}
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
            <View ref={graphSectionRef} style={styles.graphSection}>
              <ContributionGraph
                data={contributionData}
                tasks={tasks}
                onDayPress={handleDayPress}
                selectedDate={selectedDate}
                onHeightChange={handleCalendarHeightChange}
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

          {/* App Feedback Card - shown after 3+ days of activity */}
          <ErrorBoundary>
            <AppFeedbackCard activeDaysCount={activeDaysCount} />
          </ErrorBoundary>

          {/* Goal Card - shows primary goal with progress */}
          {goals.length > 0 && (
            <ErrorBoundary>
              <GoalCard
                primaryGoalProgress={goalProgress.find(p => p.goal.isPrimary) ?? null}
                secondaryGoalProgress={goalProgress.filter(p => !p.goal.isPrimary)}
                onPress={openGoalDetail}
                onAddMilestone={goalModalFlow.handleOpenAddMilestone}
              />
            </ErrorBoundary>
          )}

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
          onCloseComplete={() => {
            // 100ms delay lets native iOS animation fully complete
            setTimeout(() => setCanShowModal(true), 100);
          }}
        >
          <ScreenErrorBoundary
            screenName="Achievements"
            onClose={closeModal}
            onRetry={() => {
              closeModal();
              setTimeout(() => openAchievementLibrary(), 100);
            }}
          >
            <AchievementGridScreen onClose={closeModal} />
          </ScreenErrorBoundary>
        </BaseModal>

        {/* Goal Detail Modal */}
        <GoalDetailModal
          visible={activeModal === 'goalDetail'}
          onClose={closeModal}
          onCloseComplete={goalModalFlow.handleGoalDetailCloseComplete}
          onOpenAddGoals={goalModalFlow.handleOpenAddGoalsFromGoalDetail}
          onOpenAddMilestone={goalModalFlow.handleOpenAddMilestoneFromGoalDetail}
        />

        {/* Add Goals Modal */}
        <AddGoalsModal
          visible={goalModalFlow.showAddGoalsModal}
          onClose={goalModalFlow.handleAddGoalsClose}
          onCloseComplete={goalModalFlow.handleAddGoalsCloseComplete}
          onCreateCustom={goalModalFlow.handleCreateCustomGoal}
          onEditCustom={goalModalFlow.handleEditCustomGoal}
        />

        {/* Edit Goal Modal for creating/editing custom goals */}
        {goalModalFlow.showEditGoalModal && (
          <View style={StyleSheet.absoluteFill}>
            <EditGoalModal
              onClose={goalModalFlow.handleEditGoalClose}
              onSave={goalModalFlow.handleGoalSaved}
              existingGoal={goalModalFlow.editingGoal}
            />
          </View>
        )}

        {/* Add Milestone Modal */}
        <AddMilestoneModal
          visible={goalModalFlow.showAddMilestoneModal}
          onClose={goalModalFlow.handleAddMilestoneClose}
          onCloseComplete={goalModalFlow.handleAddMilestoneCloseComplete}
          defaultGoalId={goalModalFlow.selectedGoalForMilestone}
        />
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