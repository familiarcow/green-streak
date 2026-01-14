import { getDatabase } from '../index';
import { Task } from '../../types';
import { ITaskRepository } from './interfaces/ITaskRepository';
import logger from '../../utils/logger';
import uuid from 'react-native-uuid';

const uuidv4 = uuid.v4;

export class TaskRepository implements ITaskRepository {
  private generateId(): string {
    return uuidv4() as string;
  }

  async getAll(): Promise<Task[]> {
    return this.findAll();
  }

  async getById(id: string): Promise<Task | null> {
    return this.findById(id);
  }

  async getByIds(ids: string[]): Promise<Task[]> {
    if (ids.length === 0) {
      return [];
    }

    const db = getDatabase();
    
    try {
      const placeholders = ids.map(() => '?').join(',');
      const sql = `
        SELECT * FROM tasks
        WHERE id IN (${placeholders})
        AND archived_at IS NULL
        ORDER BY sort_order ASC
      `;
      
      const results = await db.getAllAsync(sql, ...ids);
      const tasks = results.map(row => this.mapRowToTask(row));
      
      logger.debug('DATA', 'Tasks fetched by IDs', { count: tasks.length, requestedCount: ids.length });
      return tasks;
    } catch (error: any) {
      logger.error('DATA', 'Failed to fetch tasks by IDs', { error: error.message, ids });
      throw error;
    }
  }

  async create(taskData: Omit<Task, 'id' | 'createdAt' | 'sortOrder'>): Promise<Task> {
    const db = getDatabase();
    const id = this.generateId();
    const createdAt = new Date().toISOString();

    // Get max sort_order to place new task at the end
    const maxResult = await db.getFirstAsync<{ max_order: number | null }>(
      'SELECT MAX(sort_order) as max_order FROM tasks WHERE archived_at IS NULL'
    );
    const sortOrder = (maxResult?.max_order ?? -1) + 1;

    const task: Task = {
      id,
      createdAt,
      sortOrder,
      ...taskData,
    };

    try {
      const sql = `
        INSERT INTO tasks (
          id, name, description, icon, color, is_multi_completion,
          created_at, reminder_enabled, reminder_time, reminder_frequency,
          streak_enabled, streak_skip_weekends, streak_skip_days, streak_minimum_count,
          sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await db.runAsync(
        sql,
        task.id,
        task.name,
        task.description || null,
        task.icon || null,
        task.color,
        task.isMultiCompletion ? 1 : 0,
        task.createdAt,
        task.reminderEnabled ? 1 : 0,
        task.reminderTime || null,
        task.reminderFrequency || null,
        task.streakEnabled !== false ? 1 : 0,
        task.streakSkipWeekends ? 1 : 0,
        task.streakSkipDays ? JSON.stringify(task.streakSkipDays) : null,
        task.streakMinimumCount || 1,
        task.sortOrder
      );

      logger.info('DATA', 'Task created', { taskId: task.id, name: task.name, sortOrder: task.sortOrder });
      return task;
    } catch (error: any) {
      logger.error('DATA', 'Failed to create task', { error: error.message, taskName: task.name });
      throw error;
    }
  }

  async findById(id: string): Promise<Task | null> {
    const db = getDatabase();

    try {
      const result = await db.getFirstAsync(
        'SELECT * FROM tasks WHERE id = ? AND archived_at IS NULL',
        id
      );

      if (result) {
        return this.mapRowToTask(result);
      } else {
        return null;
      }
    } catch (error: any) {
      logger.error('DATA', 'Failed to find task by id', { error: error.message, taskId: id });
      throw error;
    }
  }

  async findAll(): Promise<Task[]> {
    const db = getDatabase();

    try {
      const results = await db.getAllAsync(
        'SELECT * FROM tasks WHERE archived_at IS NULL ORDER BY sort_order ASC'
      );

      const tasks = results.map(row => this.mapRowToTask(row));
      logger.debug('DATA', 'Tasks fetched', { count: tasks.length });
      return tasks;
    } catch (error: any) {
      logger.error('DATA', 'Failed to fetch all tasks', { error: error.message });
      throw error;
    }
  }

  async update(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task> {
    const db = getDatabase();
    const existingTask = await this.findById(id);
    
    if (!existingTask) {
      throw new Error(`Task with id ${id} not found`);
    }

    const updatedTask: Task = { ...existingTask, ...updates };

    try {
      const sql = `
        UPDATE tasks SET 
          name = ?, description = ?, icon = ?, color = ?, 
          is_multi_completion = ?, reminder_enabled = ?, 
          reminder_time = ?, reminder_frequency = ?,
          streak_enabled = ?, streak_skip_weekends = ?,
          streak_skip_days = ?, streak_minimum_count = ?
        WHERE id = ?
      `;

      await db.runAsync(
        sql,
        updatedTask.name,
        updatedTask.description || null,
        updatedTask.icon || null,
        updatedTask.color,
        updatedTask.isMultiCompletion ? 1 : 0,
        updatedTask.reminderEnabled ? 1 : 0,
        updatedTask.reminderTime || null,
        updatedTask.reminderFrequency || null,
        updatedTask.streakEnabled !== false ? 1 : 0,
        updatedTask.streakSkipWeekends ? 1 : 0,
        updatedTask.streakSkipDays ? JSON.stringify(updatedTask.streakSkipDays) : null,
        updatedTask.streakMinimumCount || 1,
        id
      );

      logger.info('DATA', 'Task updated', { taskId: id, updates: Object.keys(updates) });
      return updatedTask;
    } catch (error: any) {
      logger.error('DATA', 'Failed to update task', { error: error.message, taskId: id });
      throw error;
    }
  }

  async archive(id: string): Promise<void> {
    const db = getDatabase();
    const archivedAt = new Date().toISOString();

    try {
      await db.runAsync(
        'UPDATE tasks SET archived_at = ? WHERE id = ?',
        archivedAt,
        id
      );
      logger.info('DATA', 'Task archived', { taskId: id });
    } catch (error: any) {
      logger.error('DATA', 'Failed to archive task', { error: error.message, taskId: id });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const db = getDatabase();

    try {
      await db.runAsync('DELETE FROM tasks WHERE id = ?', id);
      logger.info('DATA', 'Task deleted', { taskId: id });
    } catch (error: any) {
      logger.error('DATA', 'Failed to delete task', { error: error.message, taskId: id });
      throw error;
    }
  }

  async updateSortOrders(updates: Array<{ id: string; sortOrder: number }>): Promise<void> {
    const db = getDatabase();

    try {
      // Use a transaction for atomic updates
      for (const { id, sortOrder } of updates) {
        await db.runAsync(
          'UPDATE tasks SET sort_order = ? WHERE id = ?',
          sortOrder,
          id
        );
      }

      logger.info('DATA', 'Task sort orders updated', { count: updates.length });
    } catch (error: any) {
      logger.error('DATA', 'Failed to update task sort orders', { error: error.message });
      throw error;
    }
  }

  private mapRowToTask(row: any): Task {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      icon: row.icon,
      color: row.color,
      isMultiCompletion: Boolean(row.is_multi_completion),
      createdAt: row.created_at,
      archivedAt: row.archived_at,
      reminderEnabled: Boolean(row.reminder_enabled),
      reminderTime: row.reminder_time,
      reminderFrequency: row.reminder_frequency,
      streakEnabled: row.streak_enabled !== null ? Boolean(row.streak_enabled) : true,
      streakSkipWeekends: Boolean(row.streak_skip_weekends),
      streakSkipDays: row.streak_skip_days ? JSON.parse(row.streak_skip_days) : [],
      streakMinimumCount: row.streak_minimum_count || 1,
      sortOrder: row.sort_order ?? 0,
    };
  }
}

export default new TaskRepository();