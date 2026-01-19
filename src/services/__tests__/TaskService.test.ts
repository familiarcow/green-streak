/**
 * TaskService Tests
 * 
 * Comprehensive tests for the TaskService class, including CRUD operations,
 * validation integration, notification scheduling, and error handling.
 */

import { TaskService } from '../TaskService';
import { ValidationService } from '../ValidationService';
import notificationService from '../NotificationService';
import { ITaskRepository } from '../../database/repositories/interfaces';
import { Task } from '../../types';
import logger from '../../utils/logger';

// Mock the logger to avoid console output during tests
jest.mock('../../utils/logger', () => ({
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// Mock the notification service
jest.mock('../NotificationService', () => ({
  scheduleTaskReminder: jest.fn(),
  cancelTaskReminder: jest.fn(),
}));

// Create mock task repository
const createMockTaskRepository = (): jest.Mocked<ITaskRepository> => ({
  getAll: jest.fn(),
  getById: jest.fn(),
  getByIds: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  archive: jest.fn(),
  delete: jest.fn(),
  updateSortOrders: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
});

// Create mock validation service
const createMockValidationService = (): jest.Mocked<ValidationService> => ({
  validateTask: jest.fn(),
  validateTaskLog: jest.fn(),
  isValidColor: jest.fn(),
  isValidTime: jest.fn(),
  getInstance: jest.fn(),
} as any);

// Sample task data for testing
const mockTask: Task = {
  id: 'task-1',
  name: 'Test Task',
  description: 'A test task',
  icon: '✅',
  color: '#22c55e',
  isMultiCompletion: false,
  createdAt: '2024-01-01T00:00:00.000Z',
  reminderEnabled: true,
  reminderTime: '09:00',
  reminderFrequency: 'daily',
  sortOrder: 0,
};

const mockTaskData = {
  name: 'New Task',
  description: 'A new task',
  icon: '📝',
  color: '#3b82f6',
  isMultiCompletion: false,
  reminderEnabled: false,
};

describe('TaskService', () => {
  let taskService: TaskService;
  let mockTaskRepository: jest.Mocked<ITaskRepository>;
  let mockValidationService: jest.Mocked<ValidationService>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create fresh mock instances
    mockTaskRepository = createMockTaskRepository();
    mockValidationService = createMockValidationService();
    
    // Create TaskService instance
    taskService = new TaskService(mockTaskRepository, mockValidationService);
  });

  describe('getAllTasks', () => {
    it('should return all active tasks', async () => {
      const allTasks = [
        mockTask,
        { ...mockTask, id: 'task-2', archivedAt: '2024-01-01T00:00:00.000Z' }, // archived
        { ...mockTask, id: 'task-3', name: 'Active Task 2' }, // active
      ];
      
      mockTaskRepository.getAll.mockResolvedValue(allTasks);

      const result = await taskService.getAllTasks();

      expect(result).toHaveLength(2);
      expect(result.find(t => t.id === 'task-2')).toBeUndefined(); // archived task filtered out
      expect(result.find(t => t.id === 'task-1')).toBeDefined();
      expect(result.find(t => t.id === 'task-3')).toBeDefined();
      expect(logger.info).toHaveBeenCalledWith('SERVICES', 'Active tasks fetched successfully', {
        total: 3,
        active: 2,
      });
    });

    it('should handle repository errors', async () => {
      const error = new Error('Database error');
      mockTaskRepository.getAll.mockRejectedValue(error);

      await expect(taskService.getAllTasks()).rejects.toThrow('Database error');
      expect(logger.error).toHaveBeenCalledWith('SERVICES', 'Failed to fetch active tasks', { error });
    });
  });

  describe('getTaskById', () => {
    it('should return task when found', async () => {
      mockTaskRepository.getById.mockResolvedValue(mockTask);

      const result = await taskService.getTaskById('task-1');

      expect(result).toEqual(mockTask);
      expect(mockTaskRepository.getById).toHaveBeenCalledWith('task-1');
      expect(logger.debug).toHaveBeenCalledWith('SERVICES', 'Task found', {
        taskId: 'task-1',
        name: 'Test Task',
      });
    });

    it('should return null when task not found', async () => {
      mockTaskRepository.getById.mockResolvedValue(null);

      const result = await taskService.getTaskById('nonexistent');

      expect(result).toBeNull();
      expect(logger.debug).toHaveBeenCalledWith('SERVICES', 'Task not found', {
        taskId: 'nonexistent',
      });
    });

    it('should handle repository errors', async () => {
      const error = new Error('Database error');
      mockTaskRepository.getById.mockRejectedValue(error);

      await expect(taskService.getTaskById('task-1')).rejects.toThrow('Database error');
      expect(logger.error).toHaveBeenCalledWith('SERVICES', 'Failed to fetch task by ID', {
        error,
        taskId: 'task-1',
      });
    });
  });

  describe('createTask', () => {
    it('should create task with valid data', async () => {
      // Mock successful validation
      mockValidationService.validateTask.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
      });

      mockTaskRepository.create.mockResolvedValue(mockTask);

      const result = await taskService.createTask(mockTaskData);

      expect(result).toEqual(mockTask);
      expect(mockValidationService.validateTask).toHaveBeenCalledWith(mockTaskData);
      expect(mockTaskRepository.create).toHaveBeenCalledWith(mockTaskData);
      expect(logger.info).toHaveBeenCalledWith('SERVICES', 'Task created successfully', {
        taskId: 'task-1',
        name: 'Test Task',
      });
    });

    it('should schedule notification for enabled reminders', async () => {
      const taskWithReminder = { ...mockTask, reminderEnabled: true, reminderTime: '09:00' };
      
      mockValidationService.validateTask.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
      });

      mockTaskRepository.create.mockResolvedValue(taskWithReminder);

      await taskService.createTask(mockTaskData);

      expect(notificationService.scheduleTaskReminder).toHaveBeenCalledWith(
        taskWithReminder,
        '09:00',
        'daily'
      );
    });

    it('should handle validation errors', async () => {
      mockValidationService.validateTask.mockReturnValue({
        isValid: false,
        errors: ['Name is required', 'Invalid color'],
        warnings: [],
      });

      await expect(taskService.createTask(mockTaskData)).rejects.toThrow(
        'Task validation failed: Name is required, Invalid color'
      );
      
      expect(mockTaskRepository.create).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith('SERVICES', 'Task validation failed', {
        errors: ['Name is required', 'Invalid color'],
        warnings: [],
        name: 'New Task',
      });
    });

    it('should log validation warnings but still create task', async () => {
      mockValidationService.validateTask.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: ['Empty description'],
      });

      mockTaskRepository.create.mockResolvedValue(mockTask);

      await taskService.createTask(mockTaskData);

      expect(mockTaskRepository.create).toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith('SERVICES', 'Task validation warnings', {
        warnings: ['Empty description'],
        name: 'New Task',
      });
    });

    it('should handle notification scheduling errors gracefully', async () => {
      const taskWithReminder = { ...mockTask, reminderEnabled: true, reminderTime: '09:00' };
      
      mockValidationService.validateTask.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
      });

      mockTaskRepository.create.mockResolvedValue(taskWithReminder);
      (notificationService.scheduleTaskReminder as jest.Mock).mockRejectedValue(
        new Error('Notification error')
      );

      // Should not throw - notification errors should not fail task creation
      const result = await taskService.createTask(mockTaskData);

      expect(result).toEqual(taskWithReminder);
      expect(logger.error).toHaveBeenCalledWith('SERVICES', 'Failed to schedule task notification', {
        error: expect.any(Error),
        taskId: 'task-1',
      });
    });
  });

  describe('updateTask', () => {
    it('should update task with valid data', async () => {
      const updates = { name: 'Updated Task' };
      const updatedTask = { ...mockTask, name: 'Updated Task' };

      mockTaskRepository.getById.mockResolvedValue(mockTask);
      mockValidationService.validateTask.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
      });
      mockTaskRepository.update.mockResolvedValue(updatedTask);

      const result = await taskService.updateTask('task-1', updates);

      expect(result).toEqual(updatedTask);
      expect(mockValidationService.validateTask).toHaveBeenCalledWith({
        ...mockTask,
        ...updates,
      });
      expect(mockTaskRepository.update).toHaveBeenCalledWith('task-1', updates);
    });

    it('should sync notifications after update', async () => {
      const updates = { reminderTime: '10:00' };
      const updatedTask = { ...mockTask, reminderTime: '10:00' };

      mockTaskRepository.getById.mockResolvedValue(mockTask);
      mockValidationService.validateTask.mockReturnValue({
        isValid: true,
        errors: [],
        warnings: [],
      });
      mockTaskRepository.update.mockResolvedValue(updatedTask);

      await taskService.updateTask('task-1', updates);

      expect(notificationService.cancelTaskReminder).toHaveBeenCalledWith('task-1');
      expect(notificationService.scheduleTaskReminder).toHaveBeenCalledWith(
        updatedTask,
        '10:00',
        'daily'
      );
    });

    it('should handle task not found', async () => {
      mockTaskRepository.getById.mockResolvedValue(null);

      await expect(taskService.updateTask('nonexistent', { name: 'Updated' }))
        .rejects.toThrow('Task with ID nonexistent not found');
    });

    it('should handle validation errors', async () => {
      mockTaskRepository.getById.mockResolvedValue(mockTask);
      mockValidationService.validateTask.mockReturnValue({
        isValid: false,
        errors: ['Invalid update'],
        warnings: [],
      });

      await expect(taskService.updateTask('task-1', { name: '' }))
        .rejects.toThrow('Task validation failed: Invalid update');
    });
  });

  describe('archiveTask', () => {
    it('should archive existing task', async () => {
      mockTaskRepository.getById.mockResolvedValue(mockTask);

      await taskService.archiveTask('task-1');

      expect(mockTaskRepository.archive).toHaveBeenCalledWith('task-1');
      expect(notificationService.cancelTaskReminder).toHaveBeenCalledWith('task-1');
      expect(logger.info).toHaveBeenCalledWith('SERVICES', 'Task archived successfully', {
        taskId: 'task-1',
      });
    });

    it('should handle task not found', async () => {
      mockTaskRepository.getById.mockResolvedValue(null);

      await expect(taskService.archiveTask('nonexistent'))
        .rejects.toThrow('Task with ID nonexistent not found');
    });
  });

  describe('deleteTask', () => {
    it('should delete existing task', async () => {
      mockTaskRepository.getById.mockResolvedValue(mockTask);

      await taskService.deleteTask('task-1');

      expect(notificationService.cancelTaskReminder).toHaveBeenCalledWith('task-1');
      expect(mockTaskRepository.delete).toHaveBeenCalledWith('task-1');
      expect(logger.info).toHaveBeenCalledWith('SERVICES', 'Task deleted permanently', {
        taskId: 'task-1',
      });
    });

    it('should handle task not found', async () => {
      mockTaskRepository.getById.mockResolvedValue(null);

      await expect(taskService.deleteTask('nonexistent'))
        .rejects.toThrow('Task with ID nonexistent not found');
    });
  });

  describe('restoreTask', () => {
    it('should restore archived task', async () => {
      const restoredTask = { ...mockTask, archivedAt: undefined };
      mockTaskRepository.update.mockResolvedValue(restoredTask);

      const result = await taskService.restoreTask('task-1');

      expect(result).toEqual(restoredTask);
      expect(mockTaskRepository.update).toHaveBeenCalledWith('task-1', {
        archivedAt: undefined,
      });
      expect(logger.info).toHaveBeenCalledWith('SERVICES', 'Task restored successfully', {
        taskId: 'task-1',
      });
    });

    it('should re-enable notifications for restored task with reminders', async () => {
      const restoredTask = { ...mockTask, archivedAt: undefined, reminderEnabled: true };
      mockTaskRepository.update.mockResolvedValue(restoredTask);

      await taskService.restoreTask('task-1');

      expect(notificationService.scheduleTaskReminder).toHaveBeenCalledWith(
        restoredTask,
        '09:00',
        'daily'
      );
    });
  });

  describe('getTasksWithRecentActivity', () => {
    it('should return active tasks', async () => {
      const activeTasks = [mockTask];
      mockTaskRepository.getAll.mockResolvedValue(activeTasks);

      const result = await taskService.getTasksWithRecentActivity(30);

      expect(result).toEqual(activeTasks);
      expect(logger.info).toHaveBeenCalledWith('SERVICES', 'Tasks with recent activity fetched', {
        count: 1,
        days: 30,
      });
    });

    it('should use default days parameter', async () => {
      mockTaskRepository.getAll.mockResolvedValue([]);

      await taskService.getTasksWithRecentActivity();

      expect(logger.debug).toHaveBeenCalledWith('SERVICES', 'Fetching tasks with recent activity', {
        days: 30,
      });
    });
  });

  describe('validateTask', () => {
    it('should delegate to validation service', () => {
      const validationResult = {
        isValid: true,
        errors: [],
        warnings: [],
      };
      
      mockValidationService.validateTask.mockReturnValue(validationResult);

      const result = taskService.validateTask(mockTaskData);

      expect(result).toEqual(validationResult);
      expect(mockValidationService.validateTask).toHaveBeenCalledWith(mockTaskData);
      expect(logger.debug).toHaveBeenCalledWith('SERVICES', 'Validating task data', {
        taskName: 'New Task',
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle repository errors in CRUD operations', async () => {
      const error = new Error('Database connection lost');
      mockTaskRepository.getAll.mockRejectedValue(error);

      await expect(taskService.getAllTasks()).rejects.toThrow('Database connection lost');
      expect(logger.error).toHaveBeenCalledWith('SERVICES', 'Failed to fetch active tasks', {
        error,
      });
    });

    it('should not throw on notification service errors', async () => {
      // Test that notification errors don't crash the service
      (notificationService.cancelTaskReminder as jest.Mock).mockRejectedValue(
        new Error('Notification service down')
      );

      mockTaskRepository.getById.mockResolvedValue(mockTask);

      // Should not throw
      await expect(taskService.archiveTask('task-1')).resolves.not.toThrow();
      
      expect(logger.error).toHaveBeenCalledWith('SERVICES', 'Failed to cancel task notifications', {
        error: expect.any(Error),
        taskId: 'task-1',
      });
    });
  });
});