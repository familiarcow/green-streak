import { getDatabase } from '../index';
import { Milestone, CreateMilestoneInput } from '../../types/goals';
import { IMilestoneRepository } from './interfaces/IMilestoneRepository';
import logger from '../../utils/logger';
import uuid from 'react-native-uuid';

const uuidv4 = uuid.v4;

/**
 * Database row type for goal_milestones table
 */
interface MilestoneRow {
  id: string;
  user_goal_id: string;
  date: string;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export class MilestoneRepository implements IMilestoneRepository {
  private generateId(): string {
    return uuidv4() as string;
  }

  private mapRowToMilestone(row: MilestoneRow): Milestone {
    return {
      id: row.id,
      userGoalId: row.user_goal_id,
      date: row.date,
      title: row.title,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getById(id: string): Promise<Milestone | null> {
    const db = getDatabase();

    try {
      const row = await db.getFirstAsync<MilestoneRow>(
        'SELECT * FROM goal_milestones WHERE id = ? AND deleted_at IS NULL',
        id
      );

      if (!row) {
        return null;
      }

      return this.mapRowToMilestone(row);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to fetch milestone by ID', { error: errorMessage, id });
      throw error;
    }
  }

  async getByGoalId(userGoalId: string): Promise<Milestone[]> {
    const db = getDatabase();

    try {
      const results = await db.getAllAsync<MilestoneRow>(
        `SELECT * FROM goal_milestones
         WHERE user_goal_id = ? AND deleted_at IS NULL
         ORDER BY date DESC, created_at DESC`
        ,
        userGoalId
      );

      const milestones = results.map(row => this.mapRowToMilestone(row));
      logger.debug('DATA', 'Milestones fetched for goal', { userGoalId, count: milestones.length });
      return milestones;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to fetch milestones for goal', { error: errorMessage, userGoalId });
      throw error;
    }
  }

  async getByGoalIds(userGoalIds: string[]): Promise<Record<string, Milestone[]>> {
    const db = getDatabase();
    const result: Record<string, Milestone[]> = {};

    if (userGoalIds.length === 0) {
      return result;
    }

    try {
      // Initialize all goalIds with empty arrays
      for (const userGoalId of userGoalIds) {
        result[userGoalId] = [];
      }

      // Build placeholders for IN clause
      const placeholders = userGoalIds.map(() => '?').join(', ');
      const rows = await db.getAllAsync<MilestoneRow>(
        `SELECT * FROM goal_milestones
         WHERE user_goal_id IN (${placeholders}) AND deleted_at IS NULL
         ORDER BY date DESC, created_at DESC`,
        ...userGoalIds
      );

      // Group by user_goal_id
      for (const row of rows) {
        const milestones = result[row.user_goal_id];
        if (milestones) {
          milestones.push(this.mapRowToMilestone(row));
        }
      }

      logger.debug('DATA', 'Batch fetched milestones for goals', {
        goalCount: userGoalIds.length,
        milestoneCount: rows.length
      });
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to batch get milestones for goals', {
        error: errorMessage,
        goalCount: userGoalIds.length
      });
      throw error;
    }
  }

  async create(data: CreateMilestoneInput): Promise<Milestone> {
    const db = getDatabase();
    const id = this.generateId();
    const now = new Date().toISOString();

    try {
      await db.runAsync(
        `INSERT INTO goal_milestones (id, user_goal_id, date, title, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        id,
        data.userGoalId,
        data.date,
        data.title,
        data.description || '',
        now,
        now
      );

      const milestone: Milestone = {
        id,
        userGoalId: data.userGoalId,
        date: data.date,
        title: data.title,
        description: data.description || '',
        createdAt: now,
        updatedAt: now,
      };

      logger.info('DATA', 'Milestone created', { id, userGoalId: data.userGoalId, title: data.title });
      return milestone;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to create milestone', { error: errorMessage, data });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    try {
      await db.runAsync(
        'UPDATE goal_milestones SET deleted_at = ?, updated_at = ? WHERE id = ?',
        now,
        now,
        id
      );

      logger.info('DATA', 'Milestone soft deleted', { id });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to delete milestone', { error: errorMessage, id });
      throw error;
    }
  }
}

export default MilestoneRepository;
