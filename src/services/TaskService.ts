/**
 * Task Service
 * 
 * Encapsulates all task-related business logic, including validation,
 * notification scheduling, and coordination with other services.
 * Provides a clean interface for task operations.
 */

import { Task } from '../types';
import { ITaskRepository } from '../database/repositories/interfaces';
import { ValidationService } from './ValidationService';
import type { ValidationResult } from './ValidationService';
import notificationService from './NotificationService';
import logger from '../utils/logger';

/**
 * Interface for task creation data
 */
export type CreateTaskData = Omit<Task, 'id' | 'createdAt' | 'sortOrder'>;

/**
 * Interface for task update data
 */
export type UpdateTaskData = Partial<Omit<Task, 'id' | 'createdAt'>>;

/**
 * Service for managing task-related operations
 */
export class TaskService {
  constructor(
    private taskRepository: ITaskRepository,
    private validationService: ValidationService
  ) {
    logger.debug('SERVICES', 'TaskService initialized');
  }

  /**
   * Get all active (non-archived) tasks
   */
  async getAllTasks(): Promise<Task[]> {
    try {
      logger.debug('SERVICES', 'Fetching all active tasks');
      const tasks = await this.taskRepository.getAll();
      
      // Filter out archived tasks (tasks without archivedAt)
      const activeTasks = tasks.filter(task => !task.archivedAt);
      
      logger.info('SERVICES', 'Active tasks fetched successfully', { 
        total: tasks.length, 
        active: activeTasks.length 
      });
      
      return activeTasks;
    } catch (error) {
      logger.error('SERVICES', 'Failed to fetch active tasks', { error });
      throw error;
    }
  }

  /**
   * Get task by ID
   */
  async getTaskById(id: string): Promise<Task | null> {
    try {
      logger.debug('SERVICES', 'Fetching task by ID', { taskId: id });
      const task = await this.taskRepository.getById(id);
      
      if (task) {
        logger.debug('SERVICES', 'Task found', { taskId: id, name: task.name });
      } else {
        logger.debug('SERVICES', 'Task not found', { taskId: id });
      }
      
      return task;
    } catch (error) {
      logger.error('SERVICES', 'Failed to fetch task by ID', { error, taskId: id });
      throw error;
    }
  }

  /**
   * Create a new task with validation and notification setup
   */
  async createTask(taskData: CreateTaskData): Promise<Task> {
    try {
      logger.debug('SERVICES', 'Creating new task', { name: taskData.name });

      // Validate task data
      const validation = this.validationService.validateTask(taskData);
      if (!validation.isValid) {
        const error = new Error(`Task validation failed: ${validation.errors.join(', ')}`);
        logger.error('SERVICES', 'Task validation failed', { 
          errors: validation.errors,
          warnings: validation.warnings,
          name: taskData.name 
        });
        throw error;
      }

      // Log validation warnings if any
      if (validation.warnings.length > 0) {
        logger.warn('SERVICES', 'Task validation warnings', { 
          warnings: validation.warnings,
          name: taskData.name 
        });
      }

      // Create the task
      const task = await this.taskRepository.create(taskData);
      logger.info('SERVICES', 'Task created successfully', { 
        taskId: task.id, 
        name: task.name 
      });

      // Set up notifications if enabled
      if (task.reminderEnabled && task.reminderTime) {
        await this.scheduleTaskNotification(task);
      }

      return task;
    } catch (error) {
      logger.error('SERVICES', 'Failed to create task', { 
        error, 
        name: taskData.name 
      });
      throw error;
    }
  }

  /**
   * Update an existing task with validation and notification sync
   */
  async updateTask(id: string, updates: UpdateTaskData): Promise<Task> {
    try {
      logger.debug('SERVICES', 'Updating task', { 
        taskId: id, 
        updates: Object.keys(updates) 
      });

      // Get existing task
      const existingTask = await this.getTaskById(id);
      if (!existingTask) {
        const error = new Error(`Task with ID ${id} not found`);
        logger.error('SERVICES', 'Task not found for update', { taskId: id });
        throw error;
      }

      // Merge updates with existing task for validation
      const updatedTaskData = { ...existingTask, ...updates };
      
      // Validate updated data
      const validation = this.validationService.validateTask(updatedTaskData);
      if (!validation.isValid) {
        const error = new Error(`Task validation failed: ${validation.errors.join(', ')}`);
        logger.error('SERVICES', 'Task update validation failed', { 
          errors: validation.errors,
          taskId: id 
        });
        throw error;
      }

      // Update the task
      const updatedTask = await this.taskRepository.update(id, updates);
      logger.info('SERVICES', 'Task updated successfully', { taskId: id });

      // Update notification scheduling
      await this.syncTaskNotification(updatedTask);

      return updatedTask;
    } catch (error) {
      logger.error('SERVICES', 'Failed to update task', { error, taskId: id });
      throw error;
    }
  }

  /**
   * Archive a task and clean up notifications
   */
  async archiveTask(id: string): Promise<void> {
    try {
      logger.debug('SERVICES', 'Archiving task', { taskId: id });

      // First check if task exists
      const existingTask = await this.getTaskById(id);
      if (!existingTask) {
        const error = new Error(`Task with ID ${id} not found`);
        logger.error('SERVICES', 'Task not found for archiving', { taskId: id });
        throw error;
      }

      // Archive the task (sets archivedAt timestamp)
      await this.taskRepository.archive(id);
      logger.info('SERVICES', 'Task archived successfully', { taskId: id });

      // Cancel any scheduled notifications
      await this.cancelTaskNotifications(id);
    } catch (error) {
      logger.error('SERVICES', 'Failed to archive task', { error, taskId: id });
      throw error;
    }
  }

  /**
   * Permanently delete a task
   */
  async deleteTask(id: string): Promise<void> {
    try {
      logger.debug('SERVICES', 'Deleting task permanently', { taskId: id });

      // First check if task exists
      const existingTask = await this.getTaskById(id);
      if (!existingTask) {
        const error = new Error(`Task with ID ${id} not found`);
        logger.error('SERVICES', 'Task not found for deletion', { taskId: id });
        throw error;
      }

      // Cancel notifications first
      await this.cancelTaskNotifications(id);

      // Delete the task permanently
      await this.taskRepository.delete(id);
      logger.info('SERVICES', 'Task deleted permanently', { taskId: id });
    } catch (error) {
      logger.error('SERVICES', 'Failed to delete task', { error, taskId: id });
      throw error;
    }
  }

  /**
   * Restore an archived task
   */
  async restoreTask(id: string): Promise<Task> {
    try {
      logger.debug('SERVICES', 'Restoring archived task', { taskId: id });

      // Update task to remove archivedAt timestamp
      const restoredTask = await this.taskRepository.update(id, { 
        archivedAt: undefined 
      });

      logger.info('SERVICES', 'Task restored successfully', { taskId: id });

      // Re-enable notifications if they were enabled
      if (restoredTask.reminderEnabled && restoredTask.reminderTime) {
        await this.scheduleTaskNotification(restoredTask);
      }

      return restoredTask;
    } catch (error) {
      logger.error('SERVICES', 'Failed to restore task', { error, taskId: id });
      throw error;
    }
  }

  /**
   * Reorder tasks based on new order (for drag-and-drop)
   * @param taskIds Array of task IDs in the new desired order
   */
  async reorderTasks(taskIds: string[]): Promise<void> {
    try {
      logger.debug('SERVICES', 'Reordering tasks', { count: taskIds.length });

      // Create sort order updates based on array position
      const updates = taskIds.map((id, index) => ({
        id,
        sortOrder: index,
      }));

      await this.taskRepository.updateSortOrders(updates);

      logger.info('SERVICES', 'Tasks reordered successfully', { count: taskIds.length });
    } catch (error) {
      logger.error('SERVICES', 'Failed to reorder tasks', { error });
      throw error;
    }
  }

  /**
   * Get tasks that have recent activity (for analytics)
   */
  async getTasksWithRecentActivity(days: number = 30): Promise<Task[]> {
    try {
      logger.debug('SERVICES', 'Fetching tasks with recent activity', { days });
      
      const allTasks = await this.getAllTasks();
      
      // This is a placeholder - in a full implementation, you'd join with logs
      // to actually check for recent activity. For now, return all active tasks.
      logger.info('SERVICES', 'Tasks with recent activity fetched', { 
        count: allTasks.length,
        days 
      });
      
      return allTasks;
    } catch (error) {
      logger.error('SERVICES', 'Failed to fetch tasks with recent activity', { 
        error, 
        days 
      });
      throw error;
    }
  }

  /**
   * Validate task data using the validation service
   */
  validateTask(taskData: Partial<Task>): ValidationResult {
    logger.debug('SERVICES', 'Validating task data', { 
      taskName: taskData.name 
    });
    
    return this.validationService.validateTask(taskData);
  }

  /**
   * Check if global notifications are enabled
   * Uses lazy import to avoid circular dependencies
   */
  private async isGlobalNotificationsEnabled(): Promise<boolean> {
    try {
      // Use require for Jest compatibility with mocks
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { useSettingsStore } = require('../store/settingsStore');
      return useSettingsStore.getState().notificationSettings?.global?.enabled ?? false;
    } catch (error) {
      logger.warn('SERVICES', 'Failed to check global notification settings', { error });
      return false;
    }
  }

  /**
   * Private helper to schedule task notifications
   * Respects global notification settings - won't schedule if global is disabled
   */
  private async scheduleTaskNotification(task: Task): Promise<void> {
    try {
      if (task.reminderEnabled && task.reminderTime) {
        // Check if global notifications are enabled
        const globalEnabled = await this.isGlobalNotificationsEnabled();
        if (!globalEnabled) {
          logger.debug('SERVICES', 'Task notification paused - global notifications disabled', {
            taskId: task.id,
            taskName: task.name
          });
          // Cancel any existing notification but keep the task's reminder settings
          await notificationService.cancelTaskReminder(task.id);
          return;
        }

        await notificationService.scheduleTaskReminder(
          task,
          task.reminderTime,
          task.reminderFrequency || 'daily'
        );
        logger.debug('SERVICES', 'Task notification scheduled', {
          taskId: task.id,
          reminderTime: task.reminderTime,
          frequency: task.reminderFrequency
        });
      }
    } catch (error) {
      logger.error('SERVICES', 'Failed to schedule task notification', {
        error,
        taskId: task.id
      });
      // Don't throw - notification failure shouldn't fail task operations
    }
  }

  /**
   * Private helper to sync task notification (cancel old, schedule new if needed)
   */
  private async syncTaskNotification(task: Task): Promise<void> {
    try {
      // Cancel existing notifications
      await this.cancelTaskNotifications(task.id);

      // Schedule new notification if enabled
      if (task.reminderEnabled && task.reminderTime) {
        await this.scheduleTaskNotification(task);
      }

      logger.debug('SERVICES', 'Task notification synced', { 
        taskId: task.id,
        enabled: task.reminderEnabled 
      });
    } catch (error) {
      logger.error('SERVICES', 'Failed to sync task notification', { 
        error,
        taskId: task.id 
      });
      // Don't throw - notification failure shouldn't fail task operations
    }
  }

  /**
   * Private helper to cancel task notifications
   */
  private async cancelTaskNotifications(taskId: string): Promise<void> {
    try {
      await notificationService.cancelTaskReminder(taskId);
      logger.debug('SERVICES', 'Task notifications cancelled', { taskId });
    } catch (error) {
      logger.error('SERVICES', 'Failed to cancel task notifications', { 
        error,
        taskId 
      });
      // Don't throw - notification failure shouldn't fail task operations
    }
  }
}

/**
 * Factory function to create TaskService with dependencies
 */
export const createTaskService = (
  taskRepository: ITaskRepository,
  validationService: ValidationService
): TaskService => {
  return new TaskService(taskRepository, validationService);
};