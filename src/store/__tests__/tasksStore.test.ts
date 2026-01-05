import { act, renderHook } from '@testing-library/react-native';
import { useTasksStore } from '../tasksStore';
import { createMockTask } from '../../test/utils';

// Mock the database and dependencies
jest.mock('../../database', () => ({
  getDatabase: jest.fn(() => ({
    runAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
  })),
}));

jest.mock('../../services/NotificationService', () => ({
  default: {
    scheduleTaskNotification: jest.fn(),
    cancelTaskNotifications: jest.fn(),
  },
}));

jest.mock('../../database/repositories/TaskRepository', () => ({
  TaskRepository: {
    getAll: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('tasksStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useTasksStore.setState({
      tasks: [],
      loading: false,
      error: null,
    });
    
    jest.clearAllMocks();
  });

  it('initializes with empty state', () => {
    const { result } = renderHook(() => useTasksStore());
    
    expect(result.current.tasks).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('loads tasks successfully', async () => {
    const mockTasks = [createMockTask(), createMockTask({ id: 'task-2', name: 'Task 2' })];
    
    const { TaskRepository } = require('../../database/repositories/TaskRepository');
    TaskRepository.getAll.mockResolvedValueOnce(mockTasks);

    const { result } = renderHook(() => useTasksStore());

    await act(async () => {
      await result.current.loadTasks();
    });

    expect(result.current.tasks).toEqual(mockTasks);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(TaskRepository.getAll).toHaveBeenCalledTimes(1);
  });

  it('handles load tasks error', async () => {
    const { TaskRepository } = require('../../database/repositories/TaskRepository');
    TaskRepository.getAll.mockRejectedValueOnce(new Error('Database error'));

    const { result } = renderHook(() => useTasksStore());

    await act(async () => {
      await result.current.loadTasks();
    });

    expect(result.current.tasks).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Database error');
  });

  it('creates task successfully', async () => {
    const newTaskData = {
      name: 'New Task',
      description: 'Task description',
      icon: 'checkCircle' as const,
      color: '#22c55e',
      isMultiCompletion: false,
      reminderEnabled: false,
    };

    const createdTask = createMockTask(newTaskData);

    const { TaskRepository } = require('../../database/repositories/TaskRepository');
    TaskRepository.create.mockResolvedValueOnce(createdTask);
    TaskRepository.getAll.mockResolvedValueOnce([createdTask]);

    const { result } = renderHook(() => useTasksStore());

    await act(async () => {
      await result.current.createTask(newTaskData);
    });

    expect(result.current.tasks).toEqual([createdTask]);
    expect(TaskRepository.create).toHaveBeenCalledWith(newTaskData);
  });

  it('updates task successfully', async () => {
    const existingTask = createMockTask();
    const updatedTaskData = { name: 'Updated Task Name' };
    const updatedTask = { ...existingTask, ...updatedTaskData };

    const { TaskRepository } = require('../../database/repositories/TaskRepository');
    TaskRepository.update.mockResolvedValueOnce(updatedTask);
    TaskRepository.getAll.mockResolvedValueOnce([updatedTask]);

    const { result } = renderHook(() => useTasksStore());
    
    // Set initial state
    act(() => {
      useTasksStore.setState({ tasks: [existingTask] });
    });

    await act(async () => {
      await result.current.updateTask(existingTask.id, updatedTaskData);
    });

    expect(result.current.tasks).toEqual([updatedTask]);
    expect(TaskRepository.update).toHaveBeenCalledWith(existingTask.id, updatedTaskData);
  });

  it('deletes task successfully', async () => {
    const taskToDelete = createMockTask();

    const { TaskRepository } = require('../../database/repositories/TaskRepository');
    TaskRepository.delete.mockResolvedValueOnce(undefined);
    TaskRepository.getAll.mockResolvedValueOnce([]);

    const { result } = renderHook(() => useTasksStore());
    
    // Set initial state
    act(() => {
      useTasksStore.setState({ tasks: [taskToDelete] });
    });

    await act(async () => {
      await result.current.deleteTask(taskToDelete.id);
    });

    expect(result.current.tasks).toEqual([]);
    expect(TaskRepository.delete).toHaveBeenCalledWith(taskToDelete.id);
  });

  it('handles create task error', async () => {
    const newTaskData = {
      name: 'New Task',
      icon: 'checkCircle' as const,
      color: '#22c55e',
      isMultiCompletion: false,
      reminderEnabled: false,
    };

    const { TaskRepository } = require('../../database/repositories/TaskRepository');
    TaskRepository.create.mockRejectedValueOnce(new Error('Create failed'));

    const { result } = renderHook(() => useTasksStore());

    await act(async () => {
      await result.current.createTask(newTaskData);
    });

    expect(result.current.error).toBe('Create failed');
  });

  it('schedules notifications for tasks with reminders', async () => {
    const taskWithReminder = {
      name: 'Reminder Task',
      icon: 'checkCircle' as const,
      color: '#22c55e',
      isMultiCompletion: false,
      reminderEnabled: true,
      reminderTime: '09:00',
      reminderFrequency: 'daily' as const,
    };

    const createdTask = createMockTask(taskWithReminder);
    const notificationService = require('../../services/NotificationService').default;

    const { TaskRepository } = require('../../database/repositories/TaskRepository');
    TaskRepository.create.mockResolvedValueOnce(createdTask);
    TaskRepository.getAll.mockResolvedValueOnce([createdTask]);

    const { result } = renderHook(() => useTasksStore());

    await act(async () => {
      await result.current.createTask(taskWithReminder);
    });

    expect(notificationService.scheduleTaskNotification).toHaveBeenCalledWith(
      createdTask,
      '09:00',
      'daily'
    );
  });

  it('sets loading state correctly during async operations', async () => {
    const { TaskRepository } = require('../../database/repositories/TaskRepository');
    
    // Create a promise that we can control
    let resolvePromise: () => void;
    const promise = new Promise<any[]>((resolve) => {
      resolvePromise = () => resolve([]);
    });
    
    TaskRepository.getAll.mockReturnValueOnce(promise);

    const { result } = renderHook(() => useTasksStore());

    // Start the async operation
    act(() => {
      result.current.loadTasks();
    });

    // Should be loading
    expect(result.current.loading).toBe(true);

    // Resolve the promise
    await act(async () => {
      resolvePromise!();
      await promise;
    });

    // Should not be loading anymore
    expect(result.current.loading).toBe(false);
  });
});