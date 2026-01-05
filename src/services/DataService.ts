import { Task, TaskLog, ContributionData } from '../types';
import { repositoryFactory } from '../database/repositories/RepositoryFactory';
import { ITaskRepository, ILogRepository } from '../database/repositories/interfaces';
import logger from '../utils/logger';

/**
 * Data Service Layer
 * 
 * Provides a high-level interface for data operations, abstracting
 * repository details and providing business logic coordination.
 */
export class DataService {
  private taskRepository: ITaskRepository;
  private logRepository: ILogRepository;

  constructor() {
    this.taskRepository = repositoryFactory.getTaskRepository();
    this.logRepository = repositoryFactory.getLogRepository();
  }

  // Task operations
  async getAllTasks(): Promise<Task[]> {
    try {
      logger.debug('SERVICE', 'Fetching all tasks');
      const tasks = await this.taskRepository.getAll();
      logger.info('SERVICE', 'Tasks fetched successfully', { count: tasks.length });
      return tasks;
    } catch (error) {
      logger.error('SERVICE', 'Failed to fetch tasks', { error });
      throw error;
    }
  }

  async getTaskById(id: string): Promise<Task | null> {
    try {
      logger.debug('SERVICE', 'Fetching task by ID', { taskId: id });
      const task = await this.taskRepository.getById(id);
      
      if (task) {
        logger.debug('SERVICE', 'Task found', { taskId: id, name: task.name });
      } else {
        logger.debug('SERVICE', 'Task not found', { taskId: id });
      }
      
      return task;
    } catch (error) {
      logger.error('SERVICE', 'Failed to fetch task by ID', { error, taskId: id });
      throw error;
    }
  }

  async createTask(taskData: Omit<Task, 'id' | 'createdAt'>): Promise<Task> {
    try {
      logger.debug('SERVICE', 'Creating new task', { name: taskData.name });
      const task = await this.taskRepository.create(taskData);
      logger.info('SERVICE', 'Task created successfully', { taskId: task.id, name: task.name });
      return task;
    } catch (error) {
      logger.error('SERVICE', 'Failed to create task', { error, name: taskData.name });
      throw error;
    }
  }

  async updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task> {
    try {
      logger.debug('SERVICE', 'Updating task', { taskId: id, updates: Object.keys(updates) });
      const updatedTask = await this.taskRepository.update(id, updates);
      logger.info('SERVICE', 'Task updated successfully', { taskId: id });
      return updatedTask;
    } catch (error) {
      logger.error('SERVICE', 'Failed to update task', { error, taskId: id });
      throw error;
    }
  }

  async archiveTask(id: string): Promise<void> {
    try {
      logger.debug('SERVICE', 'Archiving task', { taskId: id });
      
      // First archive the task
      await this.taskRepository.archive(id);
      
      // Clean up associated logs if needed (optional business rule)
      // await this.logRepository.deleteByTask(id);
      
      logger.info('SERVICE', 'Task archived successfully', { taskId: id });
    } catch (error) {
      logger.error('SERVICE', 'Failed to archive task', { error, taskId: id });
      throw error;
    }
  }

  async deleteTask(id: string): Promise<void> {
    try {
      logger.debug('SERVICE', 'Deleting task', { taskId: id });
      
      // Delete associated logs first
      await this.logRepository.deleteByTask(id);
      
      // Then delete the task
      await this.taskRepository.delete(id);
      
      logger.info('SERVICE', 'Task deleted successfully', { taskId: id });
    } catch (error) {
      logger.error('SERVICE', 'Failed to delete task', { error, taskId: id });
      throw error;
    }
  }

  // Log operations
  async logTaskCompletion(taskId: string, date: string, count: number): Promise<TaskLog> {
    try {
      logger.debug('SERVICE', 'Logging task completion', { taskId, date, count });
      
      // Validate that the task exists
      const task = await this.taskRepository.getById(taskId);
      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }
      
      const log = await this.logRepository.createOrUpdate(taskId, date, count);
      logger.info('SERVICE', 'Task completion logged successfully', { taskId, date, count });
      return log;
    } catch (error) {
      logger.error('SERVICE', 'Failed to log task completion', { error, taskId, date, count });
      throw error;
    }
  }

  async getTaskLogs(taskId: string): Promise<TaskLog[]> {
    try {
      logger.debug('SERVICE', 'Fetching logs for task', { taskId });
      
      // Validate that the task exists
      const task = await this.taskRepository.getById(taskId);
      if (!task) {
        throw new Error(`Task with ID ${taskId} not found`);
      }
      
      const logs = await this.logRepository.findByTask(taskId);
      logger.debug('SERVICE', 'Task logs fetched successfully', { taskId, count: logs.length });
      return logs;
    } catch (error) {
      logger.error('SERVICE', 'Failed to fetch task logs', { error, taskId });
      throw error;
    }
  }

  async getLogForTaskAndDate(taskId: string, date: string): Promise<TaskLog | null> {
    try {
      logger.debug('SERVICE', 'Fetching log for task and date', { taskId, date });
      const log = await this.logRepository.getByTaskAndDate(taskId, date);
      return log;
    } catch (error) {
      logger.error('SERVICE', 'Failed to fetch log for task and date', { error, taskId, date });
      throw error;
    }
  }

  async getContributionData(dates: string[]): Promise<ContributionData[]> {
    try {
      logger.debug('SERVICE', 'Fetching contribution data', { datesCount: dates.length });
      const contributionData = await this.logRepository.getContributionData(dates);
      logger.info('SERVICE', 'Contribution data fetched successfully', { 
        datesCount: dates.length,
        activeDates: contributionData.filter(d => d.count > 0).length
      });
      return contributionData;
    } catch (error) {
      logger.error('SERVICE', 'Failed to fetch contribution data', { error, datesCount: dates.length });
      throw error;
    }
  }

  async getLogsInDateRange(startDate: string, endDate: string): Promise<TaskLog[]> {
    try {
      logger.debug('SERVICE', 'Fetching logs in date range', { startDate, endDate });
      const logs = await this.logRepository.findByDateRange(startDate, endDate);
      logger.debug('SERVICE', 'Date range logs fetched successfully', { 
        startDate, 
        endDate, 
        count: logs.length 
      });
      return logs;
    } catch (error) {
      logger.error('SERVICE', 'Failed to fetch logs in date range', { 
        error, 
        startDate, 
        endDate 
      });
      throw error;
    }
  }

  // Combined operations
  async getTasksWithRecentActivity(days = 30): Promise<Array<Task & { recentCompletions: number }>> {
    try {
      logger.debug('SERVICE', 'Fetching tasks with recent activity', { days });
      
      const tasks = await this.getAllTasks();
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      
      const logs = await this.logRepository.findByDateRange(startDate, endDate);
      
      // Aggregate completions by task
      const taskCompletions = logs.reduce((acc, log) => {
        acc[log.taskId] = (acc[log.taskId] || 0) + log.count;
        return acc;
      }, {} as Record<string, number>);
      
      const tasksWithActivity = tasks.map(task => ({
        ...task,
        recentCompletions: taskCompletions[task.id] || 0,
      }));
      
      logger.info('SERVICE', 'Tasks with recent activity fetched successfully', { 
        taskCount: tasksWithActivity.length,
        activeTaskCount: tasksWithActivity.filter(t => t.recentCompletions > 0).length
      });
      
      return tasksWithActivity;
    } catch (error) {
      logger.error('SERVICE', 'Failed to fetch tasks with recent activity', { error, days });
      throw error;
    }
  }

  // Streak calculations
  async calculateCurrentStreak(): Promise<number> {
    try {
      logger.debug('SERVICE', 'Calculating current streak');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get last 100 days to ensure we capture the full streak
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 100);
      
      const contributionData = await this.getContributionData(
        this.generateDateRange(startDate, today)
      );
      
      // Sort by date descending (most recent first)
      const sortedData = contributionData.sort((a, b) => b.date.localeCompare(a.date));
      
      let streak = 0;
      for (const dayData of sortedData) {
        if (dayData.count > 0) {
          streak++;
        } else {
          break; // Streak is broken
        }
      }
      
      logger.info('SERVICE', 'Current streak calculated', { streak });
      return streak;
    } catch (error) {
      logger.error('SERVICE', 'Failed to calculate current streak', { error });
      return 0; // Return 0 on error
    }
  }

  async calculateBestStreak(): Promise<number> {
    try {
      logger.debug('SERVICE', 'Calculating best streak');
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get last 365 days for more comprehensive streak calculation
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 365);
      
      const contributionData = await this.getContributionData(
        this.generateDateRange(startDate, today)
      );
      
      // Sort by date ascending
      const sortedData = contributionData.sort((a, b) => a.date.localeCompare(b.date));
      
      let bestStreak = 0;
      let currentStreak = 0;
      
      for (const dayData of sortedData) {
        if (dayData.count > 0) {
          currentStreak++;
          bestStreak = Math.max(bestStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }
      
      logger.info('SERVICE', 'Best streak calculated', { bestStreak });
      return bestStreak;
    } catch (error) {
      logger.error('SERVICE', 'Failed to calculate best streak', { error });
      return 0; // Return 0 on error
    }
  }

  private generateDateRange(startDate: Date, endDate: Date): string[] {
    const dates: string[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  }
}

// Singleton instance
export const dataService = new DataService();
export default dataService;