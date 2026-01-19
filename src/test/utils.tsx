import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { Task, ContributionData } from '../types';

// Custom render function that includes common providers/wrappers
export const renderWithProviders = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <>{children}</>;
  };

  return render(ui, { wrapper: Wrapper, ...options });
};

// Test data factories
export const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'test-task-1',
  name: 'Test Task',
  description: 'Test task description',
  icon: 'checkCircle',
  color: '#22c55e',
  isMultiCompletion: false,
  reminderEnabled: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  sortOrder: 0,
  ...overrides,
});

export const createMockContributionData = (overrides: Partial<ContributionData> = {}): ContributionData => ({
  date: '2024-01-01',
  count: 1,
  tasks: [
    {
      taskId: 'test-task-1',
      name: 'Test Task',
      color: '#22c55e',
      count: 1,
    }
  ],
  ...overrides,
});

export const createMockTaskList = (count: number = 3): Task[] => {
  return Array.from({ length: count }, (_, i) => 
    createMockTask({
      id: `test-task-${i + 1}`,
      name: `Test Task ${i + 1}`,
      color: ['#22c55e', '#3b82f6', '#f59e0b'][i % 3],
    })
  );
};

export const createMockContributionDataRange = (days: number = 7): ContributionData[] => {
  return Array.from({ length: days }, (_, i) => {
    const date = new Date('2024-01-01');
    date.setDate(date.getDate() + i);
    return createMockContributionData({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 5),
    });
  });
};

// Mock store states
export const mockTasksStoreState = {
  tasks: createMockTaskList(),
  loading: false,
  error: null,
  loadTasks: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  deleteTask: jest.fn(),
};

export const mockLogsStoreState = {
  contributionData: createMockContributionDataRange(30),
  loading: false,
  error: null,
  loadContributionData: jest.fn(),
  createLog: jest.fn(),
  updateLog: jest.fn(),
  deleteLog: jest.fn(),
  getLogsForTask: jest.fn(),
  getLogsForDate: jest.fn(),
};

export const mockOnboardingStoreState = {
  hasCompletedOnboarding: false,
  onboardingVersion: '1.0.0',
  completeOnboarding: jest.fn(),
  resetOnboarding: jest.fn(),
};

export const mockSettingsStoreState = {
  globalReminderEnabled: false,
  globalReminderTime: '20:00',
  debugLoggingEnabled: false,
  currentLogLevel: 'INFO' as const,
  updateGlobalReminder: jest.fn(),
  setDebugLogging: jest.fn(),
  setLogLevel: jest.fn(),
  exportSettings: jest.fn(),
  resetSettings: jest.fn(),
};

// Test helpers for assertions
export const expectToBeVisible = (element: any) => {
  expect(element).toBeTruthy();
};

export const expectToHaveText = (element: any, text: string) => {
  expect(element).toHaveTextContent(text);
};

// Fire event helpers
export * from '@testing-library/react-native';