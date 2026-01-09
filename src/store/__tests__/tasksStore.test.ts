import { act, renderHook } from '@testing-library/react-native';
import { useTasksStore } from '../tasksStore';
import { createMockTask } from '../../test/utils';

// Mock TaskService
const mockTaskService = {
  getAllTasks: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  archiveTask: jest.fn(),
  deleteTask: jest.fn(),
  getTaskById: jest.fn(),
};

// Mock NotificationService
const mockNotificationService = {
  syncTaskReminders: jest.fn(),
  scheduleTaskReminder: jest.fn(),
  cancelTaskReminder: jest.fn(),
};

// Mock service registry
jest.mock('../../services', () => ({
  getTaskService: () => mockTaskService,
  getNotificationService: () => mockNotificationService,
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
    
    mockTaskService.getAllTasks.mockResolvedValueOnce(mockTasks);

    const { result } = renderHook(() => useTasksStore());

    await act(async () => {
      await result.current.loadTasks();
    });

    expect(result.current.tasks).toEqual(mockTasks);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockTaskService.getAllTasks).toHaveBeenCalledTimes(1);
  });

  it('handles load tasks error', async () => {
    mockTaskService.getAllTasks.mockRejectedValueOnce(new Error('Service error'));

    const { result } = renderHook(() => useTasksStore());

    await act(async () => {
      await result.current.loadTasks();
    });

    expect(result.current.tasks).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Service error');
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

    mockTaskService.createTask.mockResolvedValueOnce(createdTask);

    const { result } = renderHook(() => useTasksStore());

    await act(async () => {
      await result.current.createTask(newTaskData);
    });

    expect(result.current.tasks).toContain(createdTask);
    expect(mockTaskService.createTask).toHaveBeenCalledWith(newTaskData);
  });

  it('updates task successfully', async () => {
    const existingTask = createMockTask();
    const updatedTaskData = { name: 'Updated Task Name' };
    const updatedTask = { ...existingTask, ...updatedTaskData };

    mockTaskService.updateTask.mockResolvedValueOnce(updatedTask);

    const { result } = renderHook(() => useTasksStore());
    
    // Set initial state
    act(() => {
      useTasksStore.setState({ tasks: [existingTask] });
    });

    await act(async () => {
      await result.current.updateTask(existingTask.id, updatedTaskData);
    });

    expect(result.current.tasks).toEqual([updatedTask]);
    expect(mockTaskService.updateTask).toHaveBeenCalledWith(existingTask.id, updatedTaskData);
  });

  it('archives task successfully', async () => {
    const taskToArchive = createMockTask();

    mockTaskService.archiveTask.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useTasksStore());
    
    // Set initial state
    act(() => {
      useTasksStore.setState({ tasks: [taskToArchive] });
    });

    await act(async () => {
      await result.current.archiveTask(taskToArchive.id);
    });

    expect(result.current.tasks).toEqual([]);
    expect(mockTaskService.archiveTask).toHaveBeenCalledWith(taskToArchive.id);
  });

  it('deletes task successfully', async () => {
    const taskToDelete = createMockTask();

    mockTaskService.deleteTask.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useTasksStore());
    
    // Set initial state
    act(() => {
      useTasksStore.setState({ tasks: [taskToDelete] });
    });

    await act(async () => {
      await result.current.deleteTask(taskToDelete.id);
    });

    expect(result.current.tasks).toEqual([]);
    expect(mockTaskService.deleteTask).toHaveBeenCalledWith(taskToDelete.id);
  });

  it('handles create task error', async () => {
    const newTaskData = {
      name: 'New Task',
      icon: 'checkCircle' as const,
      color: '#22c55e',
      isMultiCompletion: false,
      reminderEnabled: false,
    };

    mockTaskService.createTask.mockRejectedValueOnce(new Error('Create failed'));

    const { result } = renderHook(() => useTasksStore());

    await act(async () => {
      try {
        await result.current.createTask(newTaskData);
      } catch (error) {
        // Expected error
      }
    });

    expect(result.current.error).toBe('Create failed');
  });

  it('syncs notifications after loading tasks', async () => {
    const mockTasks = [createMockTask()];
    
    mockTaskService.getAllTasks.mockResolvedValueOnce(mockTasks);
    mockNotificationService.syncTaskReminders.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useTasksStore());

    await act(async () => {
      await result.current.loadTasks();
    });

    expect(mockNotificationService.syncTaskReminders).toHaveBeenCalledWith(mockTasks);
  });

  it('sets loading state correctly during async operations', async () => {
    // Create a promise that we can control
    let resolvePromise: () => void;
    const promise = new Promise<any[]>((resolve) => {
      resolvePromise = () => resolve([]);
    });
    
    mockTaskService.getAllTasks.mockReturnValueOnce(promise);

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

  it('finds task by ID', () => {
    const task1 = createMockTask({ id: 'task-1' });
    const task2 = createMockTask({ id: 'task-2' });

    const { result } = renderHook(() => useTasksStore());
    
    // Set initial state
    act(() => {
      useTasksStore.setState({ tasks: [task1, task2] });
    });

    expect(result.current.getTaskById('task-1')).toEqual(task1);
    expect(result.current.getTaskById('task-2')).toEqual(task2);
    expect(result.current.getTaskById('nonexistent')).toBeUndefined();
  });
});