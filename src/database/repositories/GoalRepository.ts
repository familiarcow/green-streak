import { getDatabase } from '../index';
import { UserGoal, GoalHabitLink } from '../../types/goals';
import { IGoalRepository } from './interfaces/IGoalRepository';
import logger from '../../utils/logger';
import uuid from 'react-native-uuid';

const uuidv4 = uuid.v4;

/**
 * Database row type for user_goals table
 */
interface UserGoalRow {
  id: string;
  goal_id: string;
  is_primary: number;
  selected_at: string;
  archived_at: string | null;
  sort_order: number;
  updated_at: string;
}

/**
 * Database row type for goal_habits table
 */
interface GoalHabitRow {
  goal_id: string;
  task_id: string;
  linked_at: string;
}

export class GoalRepository implements IGoalRepository {
  private generateId(): string {
    return uuidv4() as string;
  }

  private mapRowToUserGoal(row: UserGoalRow): UserGoal {
    return {
      id: row.id,
      goalId: row.goal_id,
      isPrimary: row.is_primary === 1,
      selectedAt: row.selected_at,
      archivedAt: row.archived_at ?? undefined,
      sortOrder: row.sort_order,
      updatedAt: row.updated_at,
    };
  }

  private mapRowToGoalHabitLink(row: GoalHabitRow): GoalHabitLink {
    return {
      goalId: row.goal_id,
      taskId: row.task_id,
      linkedAt: row.linked_at,
    };
  }

  async getAllGoals(): Promise<UserGoal[]> {
    const db = getDatabase();

    try {
      const results = await db.getAllAsync<UserGoalRow>(
        `SELECT * FROM user_goals
         WHERE archived_at IS NULL
         ORDER BY sort_order ASC, selected_at ASC`
      );

      const goals = results.map(row => this.mapRowToUserGoal(row));
      logger.debug('DATA', 'Goals fetched', { count: goals.length });
      return goals;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to fetch goals', { error: errorMessage });
      throw error;
    }
  }

  async getGoalById(id: string): Promise<UserGoal | null> {
    const db = getDatabase();

    try {
      const row = await db.getFirstAsync<UserGoalRow>(
        'SELECT * FROM user_goals WHERE id = ?',
        id
      );

      if (!row) {
        return null;
      }

      return this.mapRowToUserGoal(row);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to fetch goal by ID', { error: errorMessage, id });
      throw error;
    }
  }

  async getGoalByGoalId(goalId: string): Promise<UserGoal | null> {
    const db = getDatabase();

    try {
      const row = await db.getFirstAsync<UserGoalRow>(
        'SELECT * FROM user_goals WHERE goal_id = ? AND archived_at IS NULL',
        goalId
      );

      if (!row) {
        return null;
      }

      return this.mapRowToUserGoal(row);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to fetch goal by goal_id', { error: errorMessage, goalId });
      throw error;
    }
  }

  async createGoal(goalId: string, isPrimary: boolean = false): Promise<UserGoal> {
    const db = getDatabase();
    const id = this.generateId();
    const now = new Date().toISOString();

    // Get max sort_order to place new goal at the end
    const maxResult = await db.getFirstAsync<{ max_order: number | null }>(
      'SELECT MAX(sort_order) as max_order FROM user_goals WHERE archived_at IS NULL'
    );
    const sortOrder = (maxResult?.max_order ?? -1) + 1;

    try {
      // If setting as primary, unset other primaries first
      if (isPrimary) {
        await db.runAsync(
          'UPDATE user_goals SET is_primary = 0, updated_at = ? WHERE is_primary = 1',
          now
        );
      }

      await db.runAsync(
        `INSERT INTO user_goals (id, goal_id, is_primary, selected_at, sort_order, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        id,
        goalId,
        isPrimary ? 1 : 0,
        now,
        sortOrder,
        now
      );

      const goal: UserGoal = {
        id,
        goalId,
        isPrimary,
        selectedAt: now,
        sortOrder,
        updatedAt: now,
      };

      logger.info('DATA', 'Goal created', { id, goalId, isPrimary });
      return goal;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to create goal', { error: errorMessage, goalId });
      throw error;
    }
  }

  async setPrimaryGoal(id: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    try {
      // Unset all primaries
      await db.runAsync(
        'UPDATE user_goals SET is_primary = 0, updated_at = ? WHERE is_primary = 1',
        now
      );

      // Set the new primary
      await db.runAsync(
        'UPDATE user_goals SET is_primary = 1, updated_at = ? WHERE id = ?',
        now,
        id
      );

      logger.info('DATA', 'Primary goal set', { id });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to set primary goal', { error: errorMessage, id });
      throw error;
    }
  }

  async archiveGoal(id: string): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    try {
      await db.runAsync(
        'UPDATE user_goals SET archived_at = ?, updated_at = ? WHERE id = ?',
        now,
        now,
        id
      );

      logger.info('DATA', 'Goal archived', { id });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to archive goal', { error: errorMessage, id });
      throw error;
    }
  }

  async deleteGoal(id: string): Promise<void> {
    const db = getDatabase();

    try {
      // Note: goal_habits links will be deleted by CASCADE
      await db.runAsync('DELETE FROM user_goals WHERE id = ?', id);

      logger.info('DATA', 'Goal deleted', { id });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to delete goal', { error: errorMessage, id });
      throw error;
    }
  }

  async updateSortOrders(updates: Array<{ id: string; sortOrder: number }>): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    try {
      for (const update of updates) {
        await db.runAsync(
          'UPDATE user_goals SET sort_order = ?, updated_at = ? WHERE id = ?',
          update.sortOrder,
          now,
          update.id
        );
      }

      logger.debug('DATA', 'Goal sort orders updated', { count: updates.length });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to update goal sort orders', { error: errorMessage });
      throw error;
    }
  }

  async getPrimaryGoal(): Promise<UserGoal | null> {
    const db = getDatabase();

    try {
      const row = await db.getFirstAsync<UserGoalRow>(
        'SELECT * FROM user_goals WHERE is_primary = 1 AND archived_at IS NULL'
      );

      if (!row) {
        return null;
      }

      return this.mapRowToUserGoal(row);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to fetch primary goal', { error: errorMessage });
      throw error;
    }
  }

  // ============================================
  // Goal-Habit Link Operations
  // ============================================

  async linkHabitToGoal(goalId: string, taskId: string): Promise<GoalHabitLink> {
    const db = getDatabase();
    const now = new Date().toISOString();

    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO goal_habits (goal_id, task_id, linked_at)
         VALUES (?, ?, ?)`,
        goalId,
        taskId,
        now
      );

      const link: GoalHabitLink = {
        goalId,
        taskId,
        linkedAt: now,
      };

      logger.debug('DATA', 'Habit linked to goal', { goalId, taskId });
      return link;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to link habit to goal', { error: errorMessage, goalId, taskId });
      throw error;
    }
  }

  async unlinkHabitFromGoal(goalId: string, taskId: string): Promise<void> {
    const db = getDatabase();

    try {
      await db.runAsync(
        'DELETE FROM goal_habits WHERE goal_id = ? AND task_id = ?',
        goalId,
        taskId
      );

      logger.debug('DATA', 'Habit unlinked from goal', { goalId, taskId });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to unlink habit from goal', { error: errorMessage, goalId, taskId });
      throw error;
    }
  }

  async getHabitsForGoal(goalId: string): Promise<string[]> {
    const db = getDatabase();

    try {
      const results = await db.getAllAsync<{ task_id: string }>(
        'SELECT task_id FROM goal_habits WHERE goal_id = ?',
        goalId
      );

      return results.map(row => row.task_id);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to get habits for goal', { error: errorMessage, goalId });
      throw error;
    }
  }

  async getHabitsForGoals(goalIds: string[]): Promise<Map<string, string[]>> {
    const db = getDatabase();
    const result = new Map<string, string[]>();

    if (goalIds.length === 0) {
      return result;
    }

    try {
      // Initialize all goalIds with empty arrays
      for (const goalId of goalIds) {
        result.set(goalId, []);
      }

      // Build placeholders for IN clause
      const placeholders = goalIds.map(() => '?').join(', ');
      const rows = await db.getAllAsync<{ goal_id: string; task_id: string }>(
        `SELECT goal_id, task_id FROM goal_habits WHERE goal_id IN (${placeholders})`,
        ...goalIds
      );

      // Group by goal_id
      for (const row of rows) {
        const habits = result.get(row.goal_id);
        if (habits) {
          habits.push(row.task_id);
        }
      }

      logger.debug('DATA', 'Batch fetched habits for goals', { goalCount: goalIds.length, linkCount: rows.length });
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to batch get habits for goals', { error: errorMessage, goalCount: goalIds.length });
      throw error;
    }
  }

  async getGoalsForHabit(taskId: string): Promise<string[]> {
    const db = getDatabase();

    try {
      const results = await db.getAllAsync<{ goal_id: string }>(
        'SELECT goal_id FROM goal_habits WHERE task_id = ?',
        taskId
      );

      return results.map(row => row.goal_id);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to get goals for habit', { error: errorMessage, taskId });
      throw error;
    }
  }

  async getLinksForGoal(goalId: string): Promise<GoalHabitLink[]> {
    const db = getDatabase();

    try {
      const results = await db.getAllAsync<GoalHabitRow>(
        'SELECT * FROM goal_habits WHERE goal_id = ?',
        goalId
      );

      return results.map(row => this.mapRowToGoalHabitLink(row));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to get links for goal', { error: errorMessage, goalId });
      throw error;
    }
  }

  async setHabitGoals(taskId: string, goalIds: string[]): Promise<void> {
    const db = getDatabase();
    const now = new Date().toISOString();

    try {
      // Delete existing links for this task
      await db.runAsync(
        'DELETE FROM goal_habits WHERE task_id = ?',
        taskId
      );

      // Create new links
      for (const goalId of goalIds) {
        await db.runAsync(
          'INSERT INTO goal_habits (goal_id, task_id, linked_at) VALUES (?, ?, ?)',
          goalId,
          taskId,
          now
        );
      }

      logger.debug('DATA', 'Habit goals set', { taskId, goalCount: goalIds.length });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to set habit goals', { error: errorMessage, taskId });
      throw error;
    }
  }

  async getLinkedHabitCounts(): Promise<Record<string, number>> {
    const db = getDatabase();

    try {
      const results = await db.getAllAsync<{ goal_id: string; count: number }>(
        `SELECT goal_id, COUNT(*) as count
         FROM goal_habits
         GROUP BY goal_id`
      );

      const counts: Record<string, number> = {};
      for (const row of results) {
        counts[row.goal_id] = row.count;
      }

      return counts;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DATA', 'Failed to get linked habit counts', { error: errorMessage });
      throw error;
    }
  }
}

export default GoalRepository;
