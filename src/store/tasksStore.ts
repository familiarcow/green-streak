import { create } from 'zustand';
import { Task } from '../types';
import { getTaskService } from '../services';
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
      logger.debug('STATE', 'Loading tasks via TaskService');
      const taskService = getTaskService();
      const tasks = await taskService.getAllTasks();
      
      set({ tasks, loading: false });
      logger.info('STATE', 'Tasks loaded via TaskService', { count: tasks.length });
      
      // Sync notifications with loaded tasks
      await get().syncNotifications();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STATE', 'Failed to load tasks via TaskService', { error: errorMessage });
      set({ loading: false, error: errorMessage });
    }
  },
  
  createTask: async (taskData) => {
    set({ loading: true, error: null });
    
    try {
      logger.debug('STATE', 'Creating task via TaskService', { name: taskData.name });
      const taskService = getTaskService();
      const task = await taskService.createTask(taskData);
      
      set(state => ({ 
        tasks: [task, ...state.tasks],
        loading: false 
      }));
      
      logger.info('STATE', 'Task created via TaskService', { taskId: task.id, name: task.name });
      
      return task;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STATE', 'Failed to create task via TaskService', { error: errorMessage });
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },
  
  updateTask: async (id, updates) => {
    set({ loading: true, error: null });
    
    try {
      logger.debug('STATE', 'Updating task via TaskService', { taskId: id, updates: Object.keys(updates) });
      const taskService = getTaskService();
      const updatedTask = await taskService.updateTask(id, updates);
      
      set(state => ({
        tasks: state.tasks.map(task => 
          task.id === id ? updatedTask : task
        ),
        loading: false
      }));
      
      logger.info('STATE', 'Task updated via TaskService', { taskId: id });
      
      return updatedTask;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STATE', 'Failed to update task via TaskService', { error: errorMessage, taskId: id });
      set({ loading: false, error: errorMessage });
      throw error;
    }
  },
  
  archiveTask: async (id) => {
    set({ loading: true, error: null });
    
    try {
      logger.debug('STATE', 'Archiving task via TaskService', { taskId: id });
      const taskService = getTaskService();
      await taskService.archiveTask(id);
      
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== id),
        loading: false
      }));
      
      logger.info('STATE', 'Task archived via TaskService', { taskId: id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STATE', 'Failed to archive task via TaskService', { error: errorMessage, taskId: id });
      set({ loading: false, error: errorMessage });
    }
  },
  
  deleteTask: async (id) => {
    set({ loading: true, error: null });
    
    try {
      logger.debug('STATE', 'Deleting task via TaskService', { taskId: id });
      const taskService = getTaskService();
      await taskService.deleteTask(id);
      
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== id),
        loading: false
      }));
      
      logger.info('STATE', 'Task deleted via TaskService', { taskId: id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('STATE', 'Failed to delete task via TaskService', { error: errorMessage, taskId: id });
      set({ loading: false, error: errorMessage });
    }
  },
  
  getTaskById: (id: string) => {
    return get().tasks.find(task => task.id === id);
  },

  syncNotifications: async () => {
    try {
      const { tasks } = get();
      const { getNotificationService } = await import('../services');
      const notificationService = getNotificationService();
      await notificationService.syncTaskReminders(tasks);
      logger.debug('STATE', 'Notifications synced with tasks via service registry');
    } catch (error) {
      logger.error('STATE', 'Failed to sync notifications via service registry', { error });
    }
  },
}));