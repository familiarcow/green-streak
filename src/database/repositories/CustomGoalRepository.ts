import { getDatabase } from '../index';
import { CustomGoalDefinition, CreateCustomGoalInput, UpdateCustomGoalInput } from '../../types/goals';
import { ICustomGoalRepository } from './interfaces/ICustomGoalRepository';
import { IconName } from '../../components/common/Icon';
import logger from '../../utils/logger';
import uuid from 'react-native-uuid';

const uuidv4 = uuid.v4;

/**
 * Database row type for custom_goal_definitions table
 */
interface CustomGoalRow {
  id: string;
  title: string;
  emoji: string;
  color: string;
  description: string;
  icon: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export class CustomGoalRepository implements ICustomGoalRepository {
  private generateId(): string {
    return uuidv4() as string;
  }

  private mapRowToCustomGoal(row: CustomGoalRow): CustomGoalDefinition {
    return {
      id: row.id,
      title: row.title,
      emoji: row.emoji,
      color: row.color,
      description: row.description,
      icon: row.icon as IconName,
      isCustom: true,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getAll(): Promise<CustomGoalDefinition[]> {
    const db = getDatabase();

    try {
      const results = await db.getAllAsync<CustomGoalRow>(
        `SELECT * FROM custom_goal_definitions
         WHERE deleted_at IS NULL
         ORDER BY created_at ASC`
      );

      const goals = results.map(row => this.mapRowToCustomGoal(row));
      logger.debug('DATA', 'Custom goals fetched', { count: goals.length });
      return goals;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to fetch custom goals', { error: errorMessage });
      throw error;
    }
  }

  async getById(id: string): Promise<CustomGoalDefinition | null> {
    const db = getDatabase();

    try {
      const row = await db.getFirstAsync<CustomGoalRow>(
        'SELECT * FROM custom_goal_definitions WHERE id = ? AND deleted_at IS NULL',
        id
      );

      if (!row) {
        return null;
      }

      return this.mapRowToCustomGoal(row);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to fetch custom goal by ID', { error: errorMessage, id });
      throw error;
    }
  }

  async create(data: CreateCustomGoalInput): Promise<CustomGoalDefinition> {
    const db = getDatabase();
    const id = this.generateId();
    const now = new Date().toISOString();

    try {
      await db.runAsync(
        `INSERT INTO custom_goal_definitions (id, title, emoji, color, description, icon, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        id,
        data.title.trim(),
        data.emoji,
        data.color,
        data.description?.trim() || '',
        data.icon || 'target',
        now,
        now
      );

      const goal: CustomGoalDefinition = {
        id,
        title: data.title.trim(),
        emoji: data.emoji,
        color: data.color,
        description: data.description?.trim() || '',
        icon: (data.icon || 'target') as IconName,
        isCustom: true,
        createdAt: now,
        updatedAt: now,
      };

      logger.info('DATA', 'Custom goal created', { id, title: goal.title });
      return goal;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to create custom goal', { error: errorMessage, title: data.title });
      throw error;
    }
  }

  async update(id: string, data: UpdateCustomGoalInput): Promise<CustomGoalDefinition> {
    const db = getDatabase();
    const now = new Date().toISOString();

    try {
      // Get existing goal first
      const existing = await this.getById(id);
      if (!existing) {
        throw new Error(`Custom goal '${id}' not found`);
      }

      // Build update fields
      const updates: string[] = [];
      const values: string[] = [];

      if (data.title !== undefined) {
        updates.push('title = ?');
        values.push(data.title.trim());
      }
      if (data.emoji !== undefined) {
        updates.push('emoji = ?');
        values.push(data.emoji);
      }
      if (data.color !== undefined) {
        updates.push('color = ?');
        values.push(data.color);
      }
      if (data.description !== undefined) {
        updates.push('description = ?');
        values.push(data.description.trim());
      }
      if (data.icon !== undefined) {
        updates.push('icon = ?');
        values.push(data.icon);
      }

      updates.push('updated_at = ?');
      values.push(now);
      values.push(id);

      await db.runAsync(
        `UPDATE custom_goal_definitions SET ${updates.join(', ')} WHERE id = ?`,
        ...values
      );

      const updatedGoal: CustomGoalDefinition = {
        ...existing,
        title: data.title?.trim() ?? existing.title,
        emoji: data.emoji ?? existing.emoji,
        color: data.color ?? existing.color,
        description: data.description?.trim() ?? existing.description,
        icon: (data.icon ?? existing.icon) as IconName,
        updatedAt: now,
      };

      logger.info('DATA', 'Custom goal updated', { id, title: updatedGoal.title });
      return updatedGoal;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to update custom goal', { error: errorMessage, id });
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    try {
      await db.runAsync(
        'UPDATE custom_goal_definitions SET deleted_at = ?, updated_at = ? WHERE id = ?',
        now,
        now,
        id
      );

      logger.info('DATA', 'Custom goal soft deleted', { id });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to delete custom goal', { error: errorMessage, id });
      throw error;
    }
  }
}

export default CustomGoalRepository;
