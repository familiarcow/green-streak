import { getDatabase } from '../index';
import { TaskStreak } from '../../types';
import { IStreakRepository } from './interfaces/IStreakRepository';
import logger from '../../utils/logger';
import uuid from 'react-native-uuid';

const uuidv4 = uuid.v4;

export class StreakRepository implements IStreakRepository {
  private generateId(): string {
    return uuidv4() as string;
  }

  async getAll(): Promise<TaskStreak[]> {
    const db = getDatabase();
    try {
      const results = await db.getAllAsync('SELECT * FROM streaks ORDER BY current_streak DESC');
      return results.map(row => this.mapRowToStreak(row));
    } catch (error: any) {
      logger.error('DATA', 'Failed to fetch all streaks', { error: error.message });
      throw error;
    }
  }

  async getByTaskId(taskId: string): Promise<TaskStreak | null> {
    const db = getDatabase();
    try {
      const result = await db.getFirstAsync(
        'SELECT * FROM streaks WHERE task_id = ?',
        taskId
      );

      if (result) {
        return this.mapRowToStreak(result);
      } else {
        return null;
      }
    } catch (error: any) {
      logger.error('DATA', 'Failed to find streak', { 
        error: error.message, 
        taskId 
      });
      throw error;
    }
  }

  async create(streakData: Omit<TaskStreak, 'id' | 'updatedAt'>): Promise<TaskStreak> {
    const db = getDatabase();
    const id = this.generateId();
    const updatedAt = new Date().toISOString();

    try {
      const sql = `
        INSERT INTO streaks (
          id, 
          task_id, 
          current_streak, 
          best_streak, 
          last_completion_date, 
          streak_start_date, 
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      await db.runAsync(
        sql, 
        id, 
        streakData.taskId,
        streakData.currentStreak,
        streakData.bestStreak,
        streakData.lastCompletionDate || null,
        streakData.streakStartDate || null,
        updatedAt
      );

      const taskStreak: TaskStreak = { 
        id, 
        ...streakData,
        updatedAt 
      };

      logger.debug('DATA', 'Streak created', { 
        taskId: streakData.taskId,
        currentStreak: streakData.currentStreak 
      });

      return taskStreak;
    } catch (error: any) {
      logger.error('DATA', 'Failed to create streak', { 
        error: error.message, 
        taskId: streakData.taskId 
      });
      throw error;
    }
  }

  async update(
    taskId: string, 
    updates: Partial<Omit<TaskStreak, 'id' | 'taskId' | 'updatedAt'>>
  ): Promise<TaskStreak> {
    const db = getDatabase();
    const updatedAt = new Date().toISOString();

    try {
      // Build dynamic update query
      const updateFields: string[] = [];
      const values: any[] = [];

      if (updates.currentStreak !== undefined) {
        updateFields.push('current_streak = ?');
        values.push(updates.currentStreak);
      }
      if (updates.bestStreak !== undefined) {
        updateFields.push('best_streak = ?');
        values.push(updates.bestStreak);
      }
      if (updates.lastCompletionDate !== undefined) {
        updateFields.push('last_completion_date = ?');
        values.push(updates.lastCompletionDate);
      }
      if (updates.streakStartDate !== undefined) {
        updateFields.push('streak_start_date = ?');
        values.push(updates.streakStartDate);
      }

      updateFields.push('updated_at = ?');
      values.push(updatedAt);
      values.push(taskId);

      const sql = `
        UPDATE streaks 
        SET ${updateFields.join(', ')}
        WHERE task_id = ?
      `;

      await db.runAsync(sql, ...values);

      // Fetch and return updated streak
      const updatedStreak = await this.getByTaskId(taskId);
      if (!updatedStreak) {
        throw new Error(`Streak not found after update for task ${taskId}`);
      }

      logger.debug('DATA', 'Streak updated', { 
        taskId,
        updates 
      });

      return updatedStreak;
    } catch (error: any) {
      logger.error('DATA', 'Failed to update streak', { 
        error: error.message, 
        taskId 
      });
      throw error;
    }
  }

  async delete(taskId: string): Promise<void> {
    const db = getDatabase();
    try {
      await db.runAsync('DELETE FROM streaks WHERE task_id = ?', taskId);
      logger.debug('DATA', 'Streak deleted', { taskId });
    } catch (error: any) {
      logger.error('DATA', 'Failed to delete streak', { 
        error: error.message, 
        taskId 
      });
      throw error;
    }
  }

  async createOrUpdate(
    taskId: string, 
    currentStreak: number, 
    bestStreak: number, 
    lastCompletionDate?: string,
    streakStartDate?: string
  ): Promise<TaskStreak> {
    const db = getDatabase();
    const id = this.generateId();
    const updatedAt = new Date().toISOString();

    try {
      const sql = `
        INSERT INTO streaks (
          id, 
          task_id, 
          current_streak, 
          best_streak, 
          last_completion_date, 
          streak_start_date, 
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(task_id) DO UPDATE SET
          current_streak = excluded.current_streak,
          best_streak = CASE 
            WHEN excluded.current_streak > streaks.best_streak 
            THEN excluded.current_streak 
            ELSE streaks.best_streak 
          END,
          last_completion_date = excluded.last_completion_date,
          streak_start_date = excluded.streak_start_date,
          updated_at = excluded.updated_at
      `;

      await db.runAsync(
        sql,
        id,
        taskId,
        currentStreak,
        bestStreak,
        lastCompletionDate || null,
        streakStartDate || null,
        updatedAt
      );

      // Fetch and return the updated/created streak
      const streak = await this.getByTaskId(taskId);
      if (!streak) {
        throw new Error(`Failed to retrieve streak after create/update for task ${taskId}`);
      }

      logger.debug('DATA', 'Streak created/updated', { 
        taskId, 
        currentStreak,
        bestStreak 
      });

      return streak;
    } catch (error: any) {
      logger.error('DATA', 'Failed to create/update streak', { 
        error: error.message, 
        taskId, 
        currentStreak 
      });
      throw error;
    }
  }

  private mapRowToStreak(row: any): TaskStreak {
    return {
      id: row.id,
      taskId: row.task_id,
      currentStreak: row.current_streak,
      bestStreak: row.best_streak,
      lastCompletionDate: row.last_completion_date,
      streakStartDate: row.streak_start_date,
      updatedAt: row.updated_at
    };
  }
}