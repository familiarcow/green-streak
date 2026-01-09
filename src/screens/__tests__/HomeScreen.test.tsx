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
    const { getByText, getByTestId } = renderWithProviders(<HomeScreen />);
    
    fireEvent.press(getByText('Add Your First Habit'));
    
    await waitFor(() => {
      expect(getByTestId('add-task-screen')).toBeTruthy();
    });
  });

  it('opens daily log modal when log button pressed', async () => {
    const { getByText, getByTestId } = renderWithProviders(<HomeScreen />);
    
    fireEvent.press(getByText("Log Today's Tasks"));
    
    await waitFor(() => {
      expect(getByTestId('daily-log-screen')).toBeTruthy();
    });
  });

  it('opens settings modal when settings button pressed', async () => {
    const { getByLabelText, getByTestId } = renderWithProviders(<HomeScreen />);
    
    fireEvent.press(getByLabelText('Settings'));
    
    await waitFor(() => {
      expect(getByTestId('settings-screen')).toBeTruthy();
    });
  });

  it('refreshes data after task is added', async () => {
    const mockLoadTasks = jest.fn();
    const mockLoadContributionData = jest.fn();
    
    useTasksStore.mockReturnValue({
      ...mockTasksStoreState,
      loadTasks: mockLoadTasks,
    });
    
    useLogsStore.mockReturnValue({
      ...mockLogsStoreState,
      loadContributionData: mockLoadContributionData,
    });

    const { getByText, getByTestId } = renderWithProviders(<HomeScreen />);
    
    // Open add task modal
    fireEvent.press(getByText('Add Your First Habit'));
    
    await waitFor(() => {
      expect(getByTestId('add-task-screen')).toBeTruthy();
    });

    // Simulate adding a task (mock component calls onTaskAdded then onClose)
    fireEvent.press(getByTestId('add-task-screen'));
    
    await waitFor(() => {
      expect(mockLoadTasks).toHaveBeenCalled();
      expect(mockLoadContributionData).toHaveBeenCalledWith(true);
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
    
    useTasksStore.mockReturnValue({
      ...mockTasksStoreState,
      tasks: mockTasks,
    });

    // Mock AnimatedTaskList to simulate task press
    jest.mock('../../components/AnimatedTaskList', () => {
      return function MockAnimatedTaskList({ onTaskPress }: any) {
        const { TouchableOpacity, Text } = require('react-native');
        return (
          <TouchableOpacity 
            testID="task-item"
            onPress={() => onTaskPress(mockTask)}
          >
            <Text>{mockTask.name}</Text>
          </TouchableOpacity>
        );
      };
    });

    const { getByTestId } = renderWithProviders(<HomeScreen />);
    
    fireEvent.press(getByTestId('task-item'));
    
    await waitFor(() => {
      expect(getByTestId('task-analytics-screen')).toBeTruthy();
    });
  });
});