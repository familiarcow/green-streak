import { getDatabase } from '../index';
import { AchievementGridData, AchievementGridPosition } from '../../types/achievements';
import { IAchievementGridRepository } from './interfaces/IAchievementGridRepository';
import logger from '../../utils/logger';
import uuid from 'react-native-uuid';

const uuidv4 = uuid.v4;

/**
 * Repository for achievement grid data persistence
 *
 * Handles the Kirby Air Ride-style achievement board layout.
 */
export class AchievementGridRepository implements IAchievementGridRepository {
  private generateId(): string {
    return uuidv4() as string;
  }

  async getGrid(): Promise<AchievementGridData | null> {
    const db = getDatabase();
    try {
      const result = await db.getFirstAsync(
        'SELECT * FROM achievement_grid ORDER BY created_at DESC LIMIT 1'
      );

      if (result) {
        return this.mapRowToGrid(result);
      }
      return null;
    } catch (error: any) {
      logger.error('DATA', 'Failed to fetch achievement grid', { error: error.message });
      throw error;
    }
  }

  async saveGrid(data: {
    seed: string;
    version: number;
    positions: AchievementGridPosition[];
  }): Promise<AchievementGridData> {
    const db = getDatabase();
    const id = this.generateId();
    const createdAt = new Date().toISOString();

    try {
      const sql = `
        INSERT INTO achievement_grid (
          id,
          seed,
          version,
          positions,
          created_at
        )
        VALUES (?, ?, ?, ?, ?)
      `;

      await db.runAsync(
        sql,
        id,
        data.seed,
        data.version,
        JSON.stringify(data.positions),
        createdAt
      );

      const grid: AchievementGridData = {
        id,
        seed: data.seed,
        version: data.version,
        positions: data.positions,
        createdAt,
      };

      logger.info('DATA', 'Achievement grid saved', {
        id,
        version: data.version,
        positionCount: data.positions.length,
      });

      return grid;
    } catch (error: any) {
      logger.error('DATA', 'Failed to save achievement grid', { error: error.message });
      throw error;
    }
  }

  async updateGrid(
    id: string,
    data: {
      version: number;
      positions: AchievementGridPosition[];
    }
  ): Promise<AchievementGridData> {
    const db = getDatabase();

    try {
      const sql = `
        UPDATE achievement_grid
        SET version = ?, positions = ?
        WHERE id = ?
      `;

      await db.runAsync(sql, data.version, JSON.stringify(data.positions), id);

      // Fetch and return the updated grid
      const result = await db.getFirstAsync('SELECT * FROM achievement_grid WHERE id = ?', id);

      if (!result) {
        throw new Error(`Grid with ID ${id} not found after update`);
      }

      logger.info('DATA', 'Achievement grid updated', {
        id,
        version: data.version,
        positionCount: data.positions.length,
      });

      return this.mapRowToGrid(result);
    } catch (error: any) {
      logger.error('DATA', 'Failed to update achievement grid', {
        error: error.message,
        id,
      });
      throw error;
    }
  }

  async deleteGrid(): Promise<void> {
    const db = getDatabase();
    try {
      await db.runAsync('DELETE FROM achievement_grid');
      logger.info('DATA', 'Achievement grid deleted');
    } catch (error: any) {
      logger.error('DATA', 'Failed to delete achievement grid', { error: error.message });
      throw error;
    }
  }

  async hasGrid(): Promise<boolean> {
    const db = getDatabase();
    try {
      const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM achievement_grid'
      );
      return (result?.count || 0) > 0;
    } catch (error: any) {
      logger.error('DATA', 'Failed to check if grid exists', { error: error.message });
      throw error;
    }
  }

  private mapRowToGrid(row: any): AchievementGridData {
    return {
      id: row.id,
      seed: row.seed,
      version: row.version,
      positions: JSON.parse(row.positions),
      createdAt: row.created_at,
    };
  }
}
