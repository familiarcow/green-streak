/**
 * Store Factory Functions
 * 
 * Factory functions for creating Zustand stores with dependency injection.
 * Enables better testing and service layer integration.
 */

import { create } from 'zustand';
import { Task } from '../types';
import { ServiceContainer } from '../services/ServiceContainer';
import { DataService } from '../services/DataService';
import { TaskService } from '../services/TaskService';
import NotificationService from '../services/NotificationService';
import { getAdaptiveRange, formatDate } from '../utils/dateHelpers';
import logger from '../utils/logger';

/**
 * Service names used by stores
 */
export const SERVICE_NAMES = {
  DATA_SERVICE: 'dataService',
  TASK_SERVICE: 'taskService',
  VALIDATION_SERVICE: 'validationService',
  NOTIFICATION_SERVICE: 'notificationService',
  ANALYTICS_SERVICE: 'analyticsService',
} as const;

/**
 * Tasks store state interface
 */
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

/**
 * Logs store state interface
 */
interface LogsState {
  contributionData: any[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadContributionData: (forceRefresh?: boolean) => Promise<void>;
  updateTaskLog: (taskId: string, date: string, count: number) => Promise<void>;
  getLogsForDate: (date: string) => any | undefined;
}

/**
 * Create tasks store with injected services
 */
export function createTasksStore(serviceContainer: ServiceContainer) {
  return create<TasksState>((set, get) => ({
    tasks: [],
    loading: false,
    error: null,

    loadTasks: async () => {
      set({ loading: true, error: null });

      try {
        logger.debug('STORE', 'Loading tasks via service layer');
        
        // Get service from container instead of direct import
        const dataService = serviceContainer.resolve<DataService>('dataService');
        const tasks = await dataService.getAllTasks();

        set({ tasks, loading: false });
        logger.info('STORE', 'Tasks loaded via service layer', { count: tasks.length });

        // Sync notifications with loaded tasks
        await get().syncNotifications();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('STORE', 'Failed to load tasks via service layer', { error: errorMessage });
        set({ loading: false, error: errorMessage });
        throw error;
      }
    },

    createTask: async (taskData) => {
      set({ loading: true, error: null });

      try {
        logger.debug('STORE', 'Creating task via service layer', { name: taskData.name });

        const taskService = serviceContainer.resolve<TaskService>('taskService');
        const task = await taskService.createTask(taskData);

        // Update local state
        set(state => ({
          tasks: [...state.tasks, task],
          loading: false,
        }));

        logger.info('STORE', 'Task created via service layer', { 
          taskId: task.id, 
          name: task.name 
        });

        return task;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('STORE', 'Failed to create task via service layer', { error: errorMessage });
        set({ loading: false, error: errorMessage });
        throw error;
      }
    },

    updateTask: async (id, updates) => {
      set({ loading: true, error: null });

      try {
        logger.debug('STORE', 'Updating task via service layer', { taskId: id });

        const taskService = serviceContainer.resolve<TaskService>('taskService');
        const updatedTask = await taskService.updateTask(id, updates);

        // Update local state
        set(state => ({
          tasks: state.tasks.map(task =>
            task.id === id ? updatedTask : task
          ),
          loading: false,
        }));

        logger.info('STORE', 'Task updated via service layer', { taskId: id });
        return updatedTask;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('STORE', 'Failed to update task via service layer', { error: errorMessage });
        set({ loading: false, error: errorMessage });
        throw error;
      }
    },

    archiveTask: async (id) => {
      set({ loading: true, error: null });

      try {
        logger.debug('STORE', 'Archiving task via service layer', { taskId: id });

        const taskService = serviceContainer.resolve<TaskService>('taskService');
        await taskService.archiveTask(id);

        // Update local state
        set(state => ({
          tasks: state.tasks.filter(task => task.id !== id),
          loading: false,
        }));

        logger.info('STORE', 'Task archived via service layer', { taskId: id });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('STORE', 'Failed to archive task via service layer', { error: errorMessage });
        set({ loading: false, error: errorMessage });
        throw error;
      }
    },

    deleteTask: async (id) => {
      set({ loading: true, error: null });

      try {
        logger.debug('STORE', 'Deleting task via service layer', { taskId: id });

        const taskService = serviceContainer.resolve<TaskService>('taskService');
        await taskService.deleteTask(id);

        // Update local state
        set(state => ({
          tasks: state.tasks.filter(task => task.id !== id),
          loading: false,
        }));

        logger.info('STORE', 'Task deleted via service layer', { taskId: id });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('STORE', 'Failed to delete task via service layer', { error: errorMessage });
        set({ loading: false, error: errorMessage });
        throw error;
      }
    },

    getTaskById: (id) => {
      const { tasks } = get();
      return tasks.find(task => task.id === id);
    },

    syncNotifications: async () => {
      try {
        logger.debug('STORE', 'Syncing notifications via service layer');

        const notificationService = serviceContainer.resolve<typeof NotificationService>('notificationService');
        const { tasks } = get();
        
        await notificationService.syncTaskReminders(tasks);
        logger.debug('STORE', 'Notifications synced via service layer');
      } catch (error) {
        logger.error('STORE', 'Failed to sync notifications via service layer', { 
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        // Don't throw here as this is a background operation
      }
    },
  }));
}

/**
 * Create logs store with injected services
 */
export function createLogsStore(serviceContainer: ServiceContainer) {
  return create<LogsState>((set, get) => ({
    contributionData: [],
    loading: false,
    error: null,

    loadContributionData: async (_forceRefresh = false) => {
      set({ loading: true, error: null });

      try {
        logger.debug('STORE', 'Loading contribution data via service layer');

        const dataService = serviceContainer.resolve<DataService>('dataService');
        // Generate date range for contribution data (default 35 days adaptive range)
        const dates = getAdaptiveRange(35).map(d => formatDate(d));
        const contributionData = await dataService.getContributionData(dates);

        set({ contributionData, loading: false });
        logger.info('STORE', 'Contribution data loaded via service layer', { 
          count: contributionData.length 
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('STORE', 'Failed to load contribution data via service layer', { 
          error: errorMessage 
        });
        set({ loading: false, error: errorMessage });
        throw error;
      }
    },

    updateTaskLog: async (taskId, date, count) => {
      try {
        logger.debug('STORE', 'Updating task log via service layer', { taskId, date, count });

        const dataService = serviceContainer.resolve<DataService>('dataService');
        await dataService.logTaskCompletion(taskId, date, count);

        logger.info('STORE', 'Task log updated via service layer', { taskId, date, count });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('STORE', 'Failed to update task log via service layer', { 
          error: errorMessage 
        });
        set({ error: errorMessage });
        throw error;
      }
    },

    getLogsForDate: (date) => {
      const { contributionData } = get();
      return contributionData.find(data => data.date === date);
    },
  }));
}

/**
 * Store factory registry
 */
const storeFactories = {
  tasks: createTasksStore,
  logs: createLogsStore,
} as const;

/**
 * Create all stores with a service container
 */
export function createStores(serviceContainer: ServiceContainer) {
  logger.info('STORE', 'Creating stores with service injection');

  const stores = {
    tasks: createTasksStore(serviceContainer),
    logs: createLogsStore(serviceContainer),
  };

  logger.info('STORE', 'Stores created successfully', { 
    storeCount: Object.keys(stores).length 
  });

  return stores;
}

/**
 * Create a single store by name
 */
export function createStore<T extends keyof typeof storeFactories>(
  storeName: T,
  serviceContainer: ServiceContainer
): ReturnType<(typeof storeFactories)[T]> {
  logger.debug('STORE', 'Creating individual store', { storeName });

  const factory = storeFactories[storeName];
  if (!factory) {
    throw new Error(`Unknown store: ${storeName}`);
  }

  return factory(serviceContainer) as ReturnType<(typeof storeFactories)[T]>;
}