import { create } from 'zustand';
import { Task } from '../types';
import { taskRepository } from '../database/repositories/RepositoryFactory';
import notificationService from '../services/NotificationService';
import logger from '../utils/logger';

interface TasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadTasks: () => Promise<void>;
  createTask: (taskData: Omit<Task, 'id' | 'createdAt'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => Promise<Task>;
  archiveTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  getTaskById: (id: string) => Task | undefined;
  syncNotifications: () => Promise<void>;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  
  loadTasks: async () => {
    set({ loading: true, error: null });
    
    try {
      logger.debug('STATE', 'Loading tasks');
      const tasks = await taskRepository.findAll();
      
      set({ tasks, loading: false });
      logger.info('STATE', 'Tasks loaded', { count: tasks.length });
      
      // Sync notifications with loaded tasks
      await get().syncNotifications();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STATE', 'Failed to load tasks', { error: errorMessage });
      set({ loading: false, error: errorMessage });
    }
  },
  
  createTask: async (taskData) => {
    set({ loading: true, error: null });
    
    try {
      logger.debug('STATE', 'Creating task', { name: taskData.name });
      const task = await taskRepository.create(taskData);
      
      set(state => ({ 
        tasks: [task, ...state.tasks],
        loading: false 
      }));
      
      logger.info('STATE', 'Task created', { taskId: task.id, name: task.name });
      
      // Schedule notification if enabled
      if (task.reminderEnabled && task.reminderTime) {
        await notificationService.scheduleTaskReminder(
          task,
          task.reminderTime,
          task.reminderFrequency || 'daily'
        );
      }
      
      return task;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STATE', 'Failed to create task', { error: errorMessage });
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },
  
  updateTask: async (id, updates) => {
    set({ loading: true, error: null });
    
    try {
      logger.debug('STATE', 'Updating task', { taskId: id, updates: Object.keys(updates) });
      const updatedTask = await taskRepository.update(id, updates);
      
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === id ? updatedTask : task
        ),
        loading: false
      }));
      
      logger.info('STATE', 'Task updated', { taskId: id });
      
      // Update notification scheduling
      if (updatedTask.reminderEnabled && updatedTask.reminderTime) {
        await notificationService.scheduleTaskReminder(
          updatedTask,
          updatedTask.reminderTime,
          updatedTask.reminderFrequency || 'daily'
        );
      } else {
        await notificationService.cancelTaskReminder(updatedTask.id);
      }
      
      return updatedTask;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STATE', 'Failed to update task', { error: errorMessage, taskId: id });
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },
  
  archiveTask: async (id) => {
    set({ loading: true, error: null });
    
    try {
      logger.debug('STATE', 'Archiving task', { taskId: id });
      await taskRepository.archive(id);
      
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== id),
        loading: false
      }));
      
      logger.info('STATE', 'Task archived', { taskId: id });
      
      // Cancel any notifications for archived task
      await notificationService.cancelTaskReminder(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STATE', 'Failed to archive task', { error: errorMessage, taskId: id });
      set({ loading: false, error: errorMessage });
    }
  },
  
  deleteTask: async (id) => {
    set({ loading: true, error: null });
    
    try {
      logger.debug('STATE', 'Deleting task', { taskId: id });
      await taskRepository.delete(id);
      
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== id),
        loading: false
      }));
      
      logger.info('STATE', 'Task deleted', { taskId: id });
      
      // Cancel any notifications for deleted task
      await notificationService.cancelTaskReminder(id);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STATE', 'Failed to delete task', { error: errorMessage, taskId: id });
      set({ loading: false, error: errorMessage });
    }
  },
  
  getTaskById: (id: string) => {
    return get().tasks.find(task => task.id === id);
  },

  syncNotifications: async () => {
    try {
      const { tasks } = get();
      await notificationService.syncTaskReminders(tasks);
      logger.debug('STATE', 'Notifications synced with tasks');
    } catch (error) {
      logger.error('STATE', 'Failed to sync notifications', { error });
    }
  },
}));