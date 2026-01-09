import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContributionGraph } from '../components/ContributionGraph';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ScreenErrorBoundary } from '../components/ScreenErrorBoundary';
import { Icon } from '../components/common/Icon';
import { TodayCard, HistorySection, EmptyStateSection, TasksSection } from '../components/HomeScreen';
import { useTasksStore } from '../store/tasksStore';
import { useLogsStore } from '../store/logsStore';
import { useSettingsStore } from '../store/settingsStore';
import { useTaskActions, useModalState, useDateNavigation } from '../hooks';
import { colors, textStyles, spacing } from '../theme';
import { getTodayString } from '../utils/dateHelpers';
import EditTaskModal from './EditTaskModal';
import DailyLogScreen from './DailyLogScreen';
import SettingsScreen from './SettingsScreen';
import TaskAnalyticsScreen from './TaskAnalyticsScreen';
import { Task } from '../types';
import logger from '../utils/logger';

export const HomeScreen: React.FC = () => {
  // Custom hooks for business logic
  const { handleQuickAdd, refreshAllData, refreshContributionData } = useTaskActions();
  const {
    showAddTask, editingTask, showDailyLog, showSettings, showTaskAnalytics,
    openAddTask, openEditTask, closeAddTask, openDailyLog, closeDailyLog,
    openSettings, closeSettings, openTaskAnalytics, closeTaskAnalytics
  } = useModalState();
  const { selectedDate, handleDayPress, handleDateChange } = useDateNavigation();
  
  // Animation refs for custom modal animations
  const dailyLogBackgroundOpacity = useRef(new Animated.Value(0)).current;
  const dailyLogSlideAnim = useRef(new Animated.Value(0)).current;
  const settingsBackgroundOpacity = useRef(new Animated.Value(0)).current;
  const settingsSlideAnim = useRef(new Animated.Value(0)).current;
  
  // Component-specific state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyDays, setHistoryDays] = useState<string[]>([]);
  
  // Store hooks
  const { tasks, loading: tasksLoading } = useTasksStore();
  const { contributionData, loading: logsLoading } = useLogsStore();
  const { firstDayOfWeek } = useSettingsStore();

  
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
      days.push(date.toISOString().split('T')[0]);
    }
    setHistoryDays(days);
  }, []);
  
  const loadMoreHistory = useCallback(() => {
    // Load 30 more days
    const lastDate = historyDays[historyDays.length - 1];
    if (!lastDate) return;
    
    const newDays: string[] = [];
    const startDate = new Date(lastDate);
    for (let i = 1; i <= 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() - i);
      newDays.push(date.toISOString().split('T')[0]);
    }
    setHistoryDays([...historyDays, ...newDays]);
  }, [historyDays]);
  
  const handleHistoryDayPress = useCallback((date: string) => {
    handleDayPress(date);
    openDailyLog();
  }, [handleDayPress, openDailyLog]);

  const handleTaskAdded = useCallback(async () => {
    try {
      await refreshAllData();
      closeAddTask();
    } catch (error) {
      logger.error('UI', 'Failed to refresh after task added', { error });
    }
  }, [refreshAllData, closeAddTask]);

  const handleDailyLogClose = async () => {
    // Animate slide down first
    Animated.timing(dailyLogSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Then fade out background
      Animated.timing(dailyLogBackgroundOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(async () => {
        try {
          await refreshContributionData();
          closeDailyLog();
        } catch (error) {
          logger.error('UI', 'Failed to refresh after daily log close', { error });
        }
        
        // Reset animation values for next time
        dailyLogBackgroundOpacity.setValue(0);
        dailyLogSlideAnim.setValue(0);
      });
    });
  };
  
  const handleDailyLogPress = useCallback(() => {
    openDailyLog();
    // Start background fade in immediately
    Animated.timing(dailyLogBackgroundOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Then slide up the content
      Animated.timing(dailyLogSlideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  }, [openDailyLog, dailyLogBackgroundOpacity, dailyLogSlideAnim]);

  const handleSettingsPress = useCallback(() => {
    openSettings();
    // Start background fade in immediately
    Animated.timing(settingsBackgroundOpacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Then slide up the content
      Animated.timing(settingsSlideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  }, [openSettings, settingsBackgroundOpacity, settingsSlideAnim]);

  const handleSettingsClose = async () => {
    // Animate slide down first
    Animated.timing(settingsSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Then fade out background
      Animated.timing(settingsBackgroundOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        closeSettings();
        
        // Reset animation values for next time
        settingsBackgroundOpacity.setValue(0);
        settingsSlideAnim.setValue(0);
      });
    });
  };

  const handleTaskPress = useCallback((task: Task) => {
    logger.debug('UI', 'Task pressed for editing', { taskId: task.id, taskName: task.name });
    openEditTask(task);
  }, [openEditTask]);

  const handleTaskAnalytics = useCallback((task: Task) => {
    logger.debug('UI', 'Task analytics requested', { taskId: task.id, taskName: task.name });
    setSelectedTask(task);
    openTaskAnalytics();
  }, [openTaskAnalytics]);

  const handleTaskAnalyticsClose = useCallback(() => {
    setSelectedTask(null);
    closeTaskAnalytics();
  }, [closeTaskAnalytics]);

  // Memoized computed values
  const selectedDateData = useMemo(() => 
    contributionData.find(d => d.date === selectedDate), 
    [contributionData, selectedDate]
  );
  
  const isLoading = useMemo(() => 
    tasksLoading || logsLoading, 
    [tasksLoading, logsLoading]
  );

  // Memoized toggle function
  const handleToggleHistory = useCallback(() => {
    setShowHistory(prev => !prev);
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Green Streak</Text>
            </View>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={handleSettingsPress}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <Icon name="settings" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

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

          {tasks.length === 0 && (
            <ErrorBoundary>
              <EmptyStateSection onAddTask={openAddTask} />
            </ErrorBoundary>
          )}

          <ErrorBoundary>
            <TasksSection
              tasks={tasks}
              onTaskPress={handleTaskPress}
              onAddTask={openAddTask}
            />
          </ErrorBoundary>
        </ScrollView>

      {/* Only render one modal at a time to avoid conflicts */}
      {showAddTask && (
        <Modal
          transparent
          visible={showAddTask}
          animationType="slide"
          statusBarTranslucent
        >
          <View 
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: 'flex-end'
            }}
          >
            <Pressable 
              style={{ flex: 1 }}
              onPress={closeAddTask}
            />
            
            <Animated.View
              style={{
                backgroundColor: colors.background,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                height: '85%',
                minHeight: 400
              }}
            >
              <View style={{
                width: 40,
                height: 4,
                backgroundColor: colors.border,
                borderRadius: 2,
                alignSelf: 'center',
                marginTop: 8,
                marginBottom: 4
              }} />
              
              <ScreenErrorBoundary 
                screenName="Edit Task"
                onClose={closeAddTask}
                onRetry={() => {
                  // Reset the modal by closing and reopening
                  closeAddTask();
                  setTimeout(() => openAddTask(), 100);
                }}
              >
                <EditTaskModal
                  onClose={closeAddTask}
                  onTaskAdded={handleTaskAdded}
                  existingTask={editingTask || undefined}
                />
              </ScreenErrorBoundary>
            </Animated.View>
          </View>
        </Modal>
      )}

      {showDailyLog && (
        <Modal
          transparent
          visible={showDailyLog}
          animationType="none"
          statusBarTranslucent
        >
          <Animated.View 
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: 'flex-end',
              opacity: dailyLogBackgroundOpacity,
            }}
          >
            <Pressable 
              style={{ flex: 1 }}
              onPress={handleDailyLogClose}
            />
            
            <Animated.View 
              style={{
                backgroundColor: colors.background,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                maxHeight: '90%',
                minHeight: 400,
                transform: [{
                  translateY: dailyLogSlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [400, 0], // Slide up from 400px below
                  }),
                }],
              }}
            >
              {/* Swipe down handle */}
              <View style={{
                width: 40,
                height: 4,
                backgroundColor: colors.border,
                borderRadius: 2,
                alignSelf: 'center',
                marginTop: 8,
                marginBottom: 4
              }} />
              
              <ScreenErrorBoundary 
                screenName="Daily Log"
                onClose={handleDailyLogClose}
                onRetry={() => {
                  // Reset the modal by closing and reopening
                  handleDailyLogClose();
                  setTimeout(() => handleDailyLogPress(), 100);
                }}
              >
                <DailyLogScreen
                  date={selectedDate}
                  onClose={handleDailyLogClose}
                  onDateChange={handleDateChange}
                />
              </ScreenErrorBoundary>
            </Animated.View>
          </Animated.View>
        </Modal>
      )}

      {showSettings && (
        <Modal
          transparent
          visible={showSettings}
          animationType="none"
          statusBarTranslucent
        >
          <Animated.View 
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: 'flex-end',
              opacity: settingsBackgroundOpacity,
            }}
          >
            <Pressable 
              style={{ flex: 1 }}
              onPress={handleSettingsClose}
            />
            
            <Animated.View 
              style={{
                backgroundColor: colors.background,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                height: '85%',
                transform: [{
                  translateY: settingsSlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [400, 0], // Slide up from 400px below
                  }),
                }],
              }}
            >
                <View style={{
                  width: 40,
                  height: 4,
                  backgroundColor: colors.border,
                  borderRadius: 2,
                  alignSelf: 'center',
                  marginTop: 8,
                  marginBottom: 4
                }} />
                
                <ScreenErrorBoundary 
                  screenName="Settings"
                  onClose={handleSettingsClose}
                  onRetry={() => {
                    // Reset the modal by closing and reopening
                    handleSettingsClose();
                    setTimeout(() => handleSettingsPress(), 100);
                  }}
                >
                  <SettingsScreen
                    onClose={handleSettingsClose}
                  />
                </ScreenErrorBoundary>
            </Animated.View>
          </Animated.View>
        </Modal>
      )}

      {showTaskAnalytics && selectedTask && (
        <Modal
          transparent
          visible={showTaskAnalytics}
          animationType="slide"
          statusBarTranslucent
        >
          <View style={{ flex: 1 }}>
            <Pressable 
              style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.6)',
                justifyContent: 'flex-end'
              }}
              onPress={handleTaskAnalyticsClose}
            />
            
            <Pressable 
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: colors.background,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                maxHeight: '90%',
              }}
              onPress={() => {}}
            >
                <View style={{
                  width: 40,
                  height: 4,
                  backgroundColor: colors.border,
                  borderRadius: 2,
                  alignSelf: 'center',
                  marginTop: 8,
                  marginBottom: 4
                }} />
                
                <ScreenErrorBoundary 
                  screenName="Task Analytics"
                  onClose={handleTaskAnalyticsClose}
                  onRetry={() => {
                    handleTaskAnalyticsClose();
                    setTimeout(() => openTaskAnalytics(), 100);
                  }}
                >
                  <TaskAnalyticsScreen
                    task={selectedTask}
                    onClose={handleTaskAnalyticsClose}
                  />
                </ScreenErrorBoundary>
            </Pressable>
          </View>
        </Modal>
      )}

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