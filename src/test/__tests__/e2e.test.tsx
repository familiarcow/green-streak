import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import App from '../../../App';
import { renderWithProviders } from '../utils';

// Mock all the external dependencies for E2E testing
jest.mock('../../database', () => ({
  initializeDatabase: jest.fn().mockResolvedValue(undefined),
  getDatabase: jest.fn(() => ({
    runAsync: jest.fn().mockResolvedValue(undefined),
    getFirstAsync: jest.fn().mockResolvedValue(null),
    getAllAsync: jest.fn().mockResolvedValue([]),
  })),
}));

jest.mock('../../store/settingsStore', () => ({
  initializeSettings: jest.fn().mockResolvedValue(undefined),
  useSettingsStore: jest.fn(() => ({
    globalReminderEnabled: false,
    globalReminderTime: '20:00',
    debugLoggingEnabled: false,
    currentLogLevel: 'INFO',
    updateGlobalReminder: jest.fn(),
    setDebugLogging: jest.fn(),
    setLogLevel: jest.fn(),
    exportSettings: jest.fn(),
    resetSettings: jest.fn(),
  })),
}));

jest.mock('../../utils/devSeed', () => ({
  runSeed: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../utils/devConfig', () => ({
  setupDevEnvironment: jest.fn(),
  getDevConfig: jest.fn(() => ({
    shouldSeed: false,
    seedConfig: null,
  })),
}));

jest.mock('../../store/tasksStore', () => ({
  useTasksStore: jest.fn(() => ({
    tasks: [],
    loading: false,
    error: null,
    loadTasks: jest.fn().mockResolvedValue(undefined),
    createTask: jest.fn().mockResolvedValue(undefined),
    updateTask: jest.fn().mockResolvedValue(undefined),
    deleteTask: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../../store/logsStore', () => ({
  useLogsStore: jest.fn(() => ({
    contributionData: [],
    loading: false,
    error: null,
    loadContributionData: jest.fn().mockResolvedValue(undefined),
    createLog: jest.fn().mockResolvedValue(undefined),
    updateLog: jest.fn().mockResolvedValue(undefined),
    deleteLog: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('../../store/onboardingStore', () => ({
  useOnboardingStore: jest.fn(() => ({
    hasCompletedOnboarding: true, // Skip onboarding for most E2E tests
    onboardingVersion: '1.0.0',
    completeOnboarding: jest.fn(),
    resetOnboarding: jest.fn(),
  })),
}));

describe('E2E: Full App Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders app successfully after initialization', async () => {
    const { getByText } = renderWithProviders(<App />);

    // Should show loading initially
    expect(getByText('Initializing Green Streak...')).toBeTruthy();

    // Wait for initialization to complete
    await waitFor(
      () => {
        expect(getByText('Green Streak')).toBeTruthy();
      },
      { timeout: 5000 }
    );

    // Should show home screen after initialization
    expect(getByText('Welcome to Green Streak!')).toBeTruthy();
  });

  it('shows onboarding flow for new users', async () => {
    // Mock onboarding store to show onboarding
    const { useOnboardingStore } = require('../../store/onboardingStore');
    useOnboardingStore.mockReturnValue({
      hasCompletedOnboarding: false,
      onboardingVersion: '1.0.0',
      completeOnboarding: jest.fn(),
      resetOnboarding: jest.fn(),
    });

    const { getByText } = renderWithProviders(<App />);

    // Wait for initialization
    await waitFor(
      () => {
        expect(getByText('Welcome to Green Streak!')).toBeTruthy();
      },
      { timeout: 5000 }
    );

    expect(getByText('Build lasting habits with visual progress tracking')).toBeTruthy();
  });

  it('handles complete user journey: onboarding -> add task -> log completion', async () => {
    // Mock stores for complete flow
    const mockCompleteOnboarding = jest.fn();
    const mockCreateTask = jest.fn().mockResolvedValue({
      id: 'new-task',
      name: 'Exercise',
      color: '#22c55e',
    });
    
    const { useOnboardingStore } = require('../../store/onboardingStore');
    const { useTasksStore } = require('../../store/tasksStore');
    
    // Start with onboarding not completed
    useOnboardingStore.mockReturnValue({
      hasCompletedOnboarding: false,
      onboardingVersion: '1.0.0',
      completeOnboarding: mockCompleteOnboarding,
      resetOnboarding: jest.fn(),
    });

    useTasksStore.mockReturnValue({
      tasks: [],
      loading: false,
      error: null,
      loadTasks: jest.fn().mockResolvedValue(undefined),
      createTask: mockCreateTask,
      updateTask: jest.fn(),
      deleteTask: jest.fn(),
    });

    const { getByText, rerender } = renderWithProviders(<App />);

    // Wait for onboarding to show
    await waitFor(() => {
      expect(getByText('Welcome to Green Streak!')).toBeTruthy();
    });

    // Complete onboarding and choose to set up task
    fireEvent.press(getByText('Set Up My First Habit'));

    // Mock onboarding completion
    useOnboardingStore.mockReturnValue({
      hasCompletedOnboarding: true,
      onboardingVersion: '1.0.0',
      completeOnboarding: mockCompleteOnboarding,
      resetOnboarding: jest.fn(),
    });

    // Re-render to simulate state change
    rerender(<App />);

    // Should now show add task screen
    await waitFor(() => {
      expect(getByText('Add New Habit')).toBeTruthy();
    });

    expect(mockCompleteOnboarding).toHaveBeenCalled();
  });

  it('handles initialization errors gracefully', async () => {
    // Mock database initialization to fail
    const { initializeDatabase } = require('../../database');
    initializeDatabase.mockRejectedValueOnce(new Error('Database connection failed'));

    const { getByText } = renderWithProviders(<App />);

    await waitFor(
      () => {
        expect(getByText('Initialization Error')).toBeTruthy();
      },
      { timeout: 5000 }
    );

    expect(getByText('Database connection failed')).toBeTruthy();
  });

  it('maintains app state through navigation flows', async () => {
    // Mock task store with existing task
    const { useTasksStore } = require('../../store/tasksStore');
    useTasksStore.mockReturnValue({
      tasks: [
        {
          id: 'task-1',
          name: 'Daily Exercise',
          color: '#22c55e',
          icon: 'dumbbell',
          isMultiCompletion: false,
        }
      ],
      loading: false,
      error: null,
      loadTasks: jest.fn().mockResolvedValue(undefined),
      createTask: jest.fn(),
      updateTask: jest.fn(),
      deleteTask: jest.fn(),
    });

    const { getByText, getByLabelText } = renderWithProviders(<App />);

    // Wait for home screen
    await waitFor(() => {
      expect(getByText('Green Streak')).toBeTruthy();
    });

    // Should show existing task
    expect(getByText('1 habit tracked')).toBeTruthy();
    expect(getByText('Your Habits')).toBeTruthy();

    // Navigate to settings
    fireEvent.press(getByLabelText('Settings'));

    await waitFor(() => {
      expect(getByText('Settings')).toBeTruthy();
    });

    // Close settings
    fireEvent.press(getByText('Done'));

    // Should be back to home screen
    await waitFor(() => {
      expect(getByText('Green Streak')).toBeTruthy();
    });
  });

  it('handles multiple async operations correctly', async () => {
    const mockLoadTasks = jest.fn().mockResolvedValue(undefined);
    const mockLoadContributionData = jest.fn().mockResolvedValue(undefined);

    const { useTasksStore } = require('../../store/tasksStore');
    const { useLogsStore } = require('../../store/logsStore');

    useTasksStore.mockReturnValue({
      tasks: [],
      loading: true, // Start with loading
      error: null,
      loadTasks: mockLoadTasks,
      createTask: jest.fn(),
      updateTask: jest.fn(),
      deleteTask: jest.fn(),
    });

    useLogsStore.mockReturnValue({
      contributionData: [],
      loading: true, // Start with loading
      error: null,
      loadContributionData: mockLoadContributionData,
      createLog: jest.fn(),
      updateLog: jest.fn(),
      deleteLog: jest.fn(),
    });

    const { getByText } = renderWithProviders(<App />);

    // Wait for app to initialize
    await waitFor(() => {
      expect(getByText('Green Streak')).toBeTruthy();
    });

    // Both async operations should have been called
    expect(mockLoadTasks).toHaveBeenCalled();
    expect(mockLoadContributionData).toHaveBeenCalled();
  });
});