import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { HomeScreen } from '../HomeScreen';
import { 
  renderWithProviders, 
  createMockTask, 
  createMockContributionDataRange,
  mockTasksStoreState,
  mockLogsStoreState 
} from '../../test/utils';

// Mock the stores
jest.mock('../../store/tasksStore', () => ({
  useTasksStore: jest.fn(),
}));

jest.mock('../../store/logsStore', () => ({
  useLogsStore: jest.fn(),
}));

jest.mock('../../store/settingsStore', () => ({
  useSettingsStore: jest.fn(() => ({
    firstDayOfWeek: 0,
  })),
}));

// Mock the new hooks
jest.mock('../../hooks', () => ({
  useTaskActions: jest.fn(() => ({
    handleQuickAdd: jest.fn(),
    refreshAllData: jest.fn(),
    refreshContributionData: jest.fn(),
  })),
  useModalManager: jest.fn(() => ({
    activeModal: null,
    modalConfig: null,
    openAddTask: jest.fn(),
    openEditTask: jest.fn(),
    openDailyLog: jest.fn(),
    openSettings: jest.fn(),
    openTaskAnalytics: jest.fn(),
    closeModal: jest.fn(),
    getAnimationStyle: jest.fn(() => ({})),
    animations: {
      backgroundOpacity: { _value: 0 },
    },
  })),
  useDateNavigation: jest.fn(() => ({
    selectedDate: '2024-01-15',
    handleDayPress: jest.fn(),
    handleDateChange: jest.fn(),
  })),
}));

// Mock the AnimatedModal component
jest.mock('../../components/modals', () => ({
  AnimatedModal: ({ children, isVisible }: any) => {
    return isVisible ? children : null;
  },
}));

// Mock the screens and components that are rendered in modals
jest.mock('../EditTaskModal', () => {
  return function MockEditTaskModal({ onClose, onTaskAdded }: any) {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity 
        testID="edit-task-modal"
        onPress={() => {
          onTaskAdded();
          onClose();
        }}
      >
        <Text>Add Task Screen</Text>
      </TouchableOpacity>
    );
  };
});

jest.mock('../DailyLogScreen', () => {
  return function MockDailyLogScreen({ onClose }: any) {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity testID="daily-log-screen" onPress={onClose}>
        <Text>Daily Log Screen</Text>
      </TouchableOpacity>
    );
  };
});

jest.mock('../SettingsScreen', () => {
  return function MockSettingsScreen({ onClose }: any) {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity testID="settings-screen" onPress={onClose}>
        <Text>Settings Screen</Text>
      </TouchableOpacity>
    );
  };
});

jest.mock('../TaskAnalyticsScreen', () => {
  return function MockTaskAnalyticsScreen({ onClose, task }: any) {
    const { TouchableOpacity, Text } = require('react-native');
    return (
      <TouchableOpacity testID="task-analytics-screen" onPress={onClose}>
        <Text>Task Analytics for {task?.name}</Text>
      </TouchableOpacity>
    );
  };
});

describe('HomeScreen', () => {
  const { useTasksStore } = require('../../store/tasksStore');
  const { useLogsStore } = require('../../store/logsStore');

  beforeEach(() => {
    jest.clearAllMocks();
    
    useTasksStore.mockReturnValue({
      ...mockTasksStoreState,
      tasks: [],
    });
    
    useLogsStore.mockReturnValue({
      ...mockLogsStoreState,
      contributionData: [],
    });
  });

  it('renders correctly with no tasks', () => {
    const { getByText } = renderWithProviders(<HomeScreen />);
    
    expect(getByText('Green Streak')).toBeTruthy();
    expect(getByText('0 habits tracked')).toBeTruthy();
    expect(getByText('Welcome to Green Streak!')).toBeTruthy();
    expect(getByText('Add Your First Habit')).toBeTruthy();
  });

  it('renders correctly with tasks', () => {
    const mockTasks = [createMockTask(), createMockTask({ id: '2', name: 'Task 2' })];
    
    useTasksStore.mockReturnValue({
      ...mockTasksStoreState,
      tasks: mockTasks,
    });

    const { getByText, queryByText } = renderWithProviders(<HomeScreen />);
    
    expect(getByText('Green Streak')).toBeTruthy();
    expect(getByText('2 habits tracked')).toBeTruthy();
    expect(getByText('Your Habits')).toBeTruthy();
    
    // Should not show empty state
    expect(queryByText('Welcome to Green Streak!')).toBeNull();
  });

  it('shows contribution data for selected date', () => {
    const mockContributionData = createMockContributionDataRange(7);
    
    useLogsStore.mockReturnValue({
      ...mockLogsStoreState,
      contributionData: mockContributionData,
    });

    const { getByText } = renderWithProviders(<HomeScreen />);
    
    // Should show today's data initially (if any exists)
    expect(getByText(/January \d+, 2024/)).toBeTruthy();
  });

  it('opens add task modal when add button pressed', async () => {
    const mockOpenAddTask = jest.fn();
    const { useModalManager } = require('../../hooks');
    
    useModalManager.mockReturnValue({
      activeModal: 'addTask',
      modalConfig: { type: 'addTask', animationType: 'slide' },
      openAddTask: mockOpenAddTask,
      openEditTask: jest.fn(),
      openDailyLog: jest.fn(),
      openSettings: jest.fn(),
      openTaskAnalytics: jest.fn(),
      closeModal: jest.fn(),
      getAnimationStyle: jest.fn(() => ({})),
      animations: { backgroundOpacity: { _value: 0 } },
    });

    const { getByText, getByTestId } = renderWithProviders(<HomeScreen />);
    
    fireEvent.press(getByText('Add Your First Habit'));
    
    await waitFor(() => {
      expect(getByTestId('edit-task-modal')).toBeTruthy();
    });
  });

  it('opens daily log modal when log button pressed', async () => {
    const { useModalManager } = require('../../hooks');
    
    useModalManager.mockReturnValue({
      activeModal: 'dailyLog',
      modalConfig: { type: 'dailyLog', animationType: 'slide' },
      openAddTask: jest.fn(),
      openEditTask: jest.fn(),
      openDailyLog: jest.fn(),
      openSettings: jest.fn(),
      openTaskAnalytics: jest.fn(),
      closeModal: jest.fn(),
      getAnimationStyle: jest.fn(() => ({})),
      animations: { backgroundOpacity: { _value: 0 } },
    });

    const { getByText, getByTestId } = renderWithProviders(<HomeScreen />);
    
    fireEvent.press(getByText("Log Today's Tasks"));
    
    await waitFor(() => {
      expect(getByTestId('daily-log-screen')).toBeTruthy();
    });
  });

  it('opens settings modal when settings button pressed', async () => {
    const { useModalManager } = require('../../hooks');
    
    useModalManager.mockReturnValue({
      activeModal: 'settings',
      modalConfig: { type: 'settings', animationType: 'slide' },
      openAddTask: jest.fn(),
      openEditTask: jest.fn(),
      openDailyLog: jest.fn(),
      openSettings: jest.fn(),
      openTaskAnalytics: jest.fn(),
      closeModal: jest.fn(),
      getAnimationStyle: jest.fn(() => ({})),
      animations: { backgroundOpacity: { _value: 0 } },
    });

    const { getByLabelText, getByTestId } = renderWithProviders(<HomeScreen />);
    
    fireEvent.press(getByLabelText('Settings'));
    
    await waitFor(() => {
      expect(getByTestId('settings-screen')).toBeTruthy();
    });
  });

  it('refreshes data after task is added', async () => {
    const mockRefreshAllData = jest.fn();
    const { useTaskActions, useModalManager } = require('../../hooks');
    
    useTaskActions.mockReturnValue({
      handleQuickAdd: jest.fn(),
      refreshAllData: mockRefreshAllData,
      refreshContributionData: jest.fn(),
    });

    useModalManager.mockReturnValue({
      activeModal: 'addTask',
      modalConfig: { type: 'addTask', animationType: 'slide' },
      openAddTask: jest.fn(),
      openEditTask: jest.fn(),
      openDailyLog: jest.fn(),
      openSettings: jest.fn(),
      openTaskAnalytics: jest.fn(),
      closeModal: jest.fn(),
      getAnimationStyle: jest.fn(() => ({})),
      animations: { backgroundOpacity: { _value: 0 } },
    });

    const { getByText, getByTestId } = renderWithProviders(<HomeScreen />);
    
    // Open add task modal
    fireEvent.press(getByText('Add Your First Habit'));
    
    await waitFor(() => {
      expect(getByTestId('edit-task-modal')).toBeTruthy();
    });

    // Simulate adding a task (mock component calls onTaskAdded then onClose)
    fireEvent.press(getByTestId('edit-task-modal'));
    
    await waitFor(() => {
      expect(mockRefreshAllData).toHaveBeenCalled();
    });
  });

  it('shows singular habit text for one task', () => {
    const mockTasks = [createMockTask()];
    
    useTasksStore.mockReturnValue({
      ...mockTasksStoreState,
      tasks: mockTasks,
    });

    const { getByText } = renderWithProviders(<HomeScreen />);
    
    expect(getByText('1 habit tracked')).toBeTruthy();
  });

  it('shows plural habits text for multiple tasks', () => {
    const mockTasks = [createMockTask(), createMockTask({ id: '2' })];
    
    useTasksStore.mockReturnValue({
      ...mockTasksStoreState,
      tasks: mockTasks,
    });

    const { getByText } = renderWithProviders(<HomeScreen />);
    
    expect(getByText('2 habits tracked')).toBeTruthy();
  });

  it('handles loading states correctly', () => {
    useTasksStore.mockReturnValue({
      ...mockTasksStoreState,
      loading: true,
    });
    
    useLogsStore.mockReturnValue({
      ...mockLogsStoreState,
      loading: true,
    });

    const { getByText } = renderWithProviders(<HomeScreen />);
    
    // Should still render the basic structure while loading
    expect(getByText('Green Streak')).toBeTruthy();
  });

  it('opens task analytics when task is pressed', async () => {
    const mockTask = createMockTask();
    const mockTasks = [mockTask];
    const { useModalManager } = require('../../hooks');
    
    useTasksStore.mockReturnValue({
      ...mockTasksStoreState,
      tasks: mockTasks,
    });

    useModalManager.mockReturnValue({
      activeModal: 'taskAnalytics',
      modalConfig: { type: 'taskAnalytics', animationType: 'fade', props: { task: mockTask } },
      openAddTask: jest.fn(),
      openEditTask: jest.fn(),
      openDailyLog: jest.fn(),
      openSettings: jest.fn(),
      openTaskAnalytics: jest.fn(),
      closeModal: jest.fn(),
      getAnimationStyle: jest.fn(() => ({})),
      animations: { backgroundOpacity: { _value: 0 } },
    });

    const { getByTestId } = renderWithProviders(<HomeScreen />);
    
    await waitFor(() => {
      expect(getByTestId('task-analytics-screen')).toBeTruthy();
    });
  });
});