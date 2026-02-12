import { getDatabase } from '../index';
import { TaskLog, ContributionData } from '../../types';
import { ILogRepository } from './interfaces/ILogRepository';
import logger from '../../utils/logger';
import uuid from 'react-native-uuid';

const uuidv4 = uuid.v4;

export class LogRepository implements ILogRepository {
  private generateId(): string {
    return uuidv4() as string;
  }

  async getAll(): Promise<TaskLog[]> {
    const db = getDatabase();
    try {
      const results = await db.getAllAsync('SELECT * FROM logs ORDER BY date DESC');
      return results.map(row => this.mapRowToLog(row));
    } catch (error: any) {
      logger.error('DATA', 'Failed to fetch all logs', { error: error.message });
      throw error;
    }
  }

  async getByTaskAndDate(taskId: string, date: string): Promise<TaskLog | null> {
    return this.findByTaskAndDate(taskId, date);
  }

  async create(logData: { taskId: string; date: string; count: number }): Promise<TaskLog> {
    return this.createOrUpdate(logData.taskId, logData.date, logData.count);
  }

  async createOrUpdate(taskId: string, date: string, count: number): Promise<TaskLog> {
    const db = getDatabase();
    const id = this.generateId();
    const updatedAt = new Date().toISOString();

    try {
      const sql = `
        INSERT INTO logs (id, task_id, date, count, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(task_id, date) DO UPDATE SET
          count = excluded.count,
          updated_at = excluded.updated_at
      `;

      await db.runAsync(sql, id, taskId, date, count, updatedAt);

      const taskLog: TaskLog = { id, taskId, date, count, updatedAt };
      logger.debug('DATA', 'Log created/updated', { taskId, date, count });
      return taskLog;
    } catch (error: any) {
      logger.error('DATA', 'Failed to create/update log', { 
        error: error.message, 
        taskId, 
        date, 
        count 
      });
      throw error;
    }
  }

  async findByTaskAndDate(taskId: string, date: string): Promise<TaskLog | null> {
    const db = getDatabase();

    try {
      const result = await db.getFirstAsync(
        'SELECT * FROM logs WHERE task_id = ? AND date = ?',
        taskId,
        date
      );

      if (result) {
        return this.mapRowToLog(result);
      } else {
        return null;
      }
    } catch (error: any) {
      logger.error('DATA', 'Failed to find log', { 
        error: error.message, 
        taskId, 
        date 
      });
      throw error;
    }
  }

  async findByTask(taskId: string): Promise<TaskLog[]> {
    const db = getDatabase();

    try {
      const results = await db.getAllAsync(
        'SELECT * FROM logs WHERE task_id = ? ORDER BY date DESC',
        taskId
      );

      const logs = results.map(row => this.mapRowToLog(row));
      return logs;
    } catch (error: any) {
      logger.error('DATA', 'Failed to fetch logs for task', {
        error: error.message,
        taskId
      });
      throw error;
    }
  }

  async getByTasksAndDate(taskIds: string[], date: string): Promise<TaskLog[]> {
    const db = getDatabase();

    if (taskIds.length === 0) {
      return [];
    }

    try {
      const placeholders = taskIds.map(() => '?').join(', ');
      const results = await db.getAllAsync(
        `SELECT * FROM logs WHERE task_id IN (${placeholders}) AND date = ?`,
        ...taskIds,
        date
      );

      const logs = results.map(row => this.mapRowToLog(row));
      logger.debug('DATA', 'Batch fetched logs for tasks on date', { taskCount: taskIds.length, date, logCount: logs.length });
      return logs;
    } catch (error: any) {
      logger.error('DATA', 'Failed to batch fetch logs for tasks on date', {
        error: error.message,
        taskCount: taskIds.length,
        date
      });
      throw error;
    }
  }

  async findByTasks(taskIds: string[]): Promise<TaskLog[]> {
    const db = getDatabase();

    if (taskIds.length === 0) {
      return [];
    }

    try {
      const placeholders = taskIds.map(() => '?').join(', ');
      const results = await db.getAllAsync(
        `SELECT * FROM logs WHERE task_id IN (${placeholders}) ORDER BY date DESC`,
        ...taskIds
      );

      const logs = results.map(row => this.mapRowToLog(row));
      logger.debug('DATA', 'Batch fetched logs for tasks', { taskCount: taskIds.length, logCount: logs.length });
      return logs;
    } catch (error: any) {
      logger.error('DATA', 'Failed to batch fetch logs for tasks', {
        error: error.message,
        taskCount: taskIds.length
      });
      throw error;
    }
  }

  async findByDateRange(startDate: string, endDate: string): Promise<TaskLog[]> {
    const db = getDatabase();

    try {
      const results = await db.getAllAsync(
        'SELECT * FROM logs WHERE date >= ? AND date <= ? ORDER BY date DESC',
        startDate,
        endDate
      );

      const logs = results.map(row => this.mapRowToLog(row));
      return logs;
    } catch (error: any) {
      logger.error('DATA', 'Failed to fetch logs by date range', { 
        error: error.message, 
        startDate, 
        endDate 
      });
      throw error;
    }
  }

  async getContributionData(dates: string[]): Promise<ContributionData[]> {
    const db = getDatabase();
    
    if (dates.length === 0) {
      return [];
    }

    const placeholders = dates.map(() => '?').join(',');
    
    try {
      const sql = `
        SELECT 
          l.date,
          l.task_id,
          l.count,
          t.name as task_name,
          t.color as task_color,
          SUM(l.count) OVER (PARTITION BY l.date) as total_count
        FROM logs l
        JOIN tasks t ON l.task_id = t.id
        WHERE l.date IN (${placeholders}) AND l.count > 0
        ORDER BY l.date DESC, l.count DESC
      `;

      const results = await db.getAllAsync(sql, ...dates);
      const contributionMap = new Map<string, ContributionData>();

      // Initialize all dates with empty data
      dates.forEach(date => {
        contributionMap.set(date, {
          date,
          count: 0,
          tasks: [],
        });
      });

      // Populate with actual data
      results.forEach((row: any) => {
        const dateData = contributionMap.get(row.date)!;
        dateData.count = row.total_count;
        dateData.tasks.push({
          taskId: row.task_id,
          name: row.task_name,
          count: row.count,
          color: row.task_color,
        });
      });

      const result = Array.from(contributionMap.values())
        .sort((a, b) => a.date.localeCompare(b.date));

      logger.debug('DATA', 'Contribution data retrieved', { 
        datesCount: dates.length, 
        activeDates: result.filter(d => d.count > 0).length 
      });

      return result;
    } catch (error: any) {
      logger.error('DATA', 'Failed to get contribution data', { 
        error: error.message, 
        datesCount: dates.length 
      });
      throw error;
    }
  }

  async deleteByTask(taskId: string): Promise<void> {
    const db = getDatabase();

    try {
      await db.runAsync('DELETE FROM logs WHERE task_id = ?', taskId);
      logger.info('DATA', 'Logs deleted for task', { taskId });
    } catch (error: any) {
      logger.error('DATA', 'Failed to delete logs for task', { 
        error: error.message, 
        taskId 
      });
      throw error;
    }
  }

  private mapRowToLog(row: any): TaskLog {
    return {
      id: row.id,
      taskId: row.task_id,
      date: row.date,
      count: row.count,
      updatedAt: row.updated_at,
    };
  }
}

export default new LogRepository();