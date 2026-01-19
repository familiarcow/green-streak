import { getDatabase } from '../index';
import { UnlockedAchievement, AchievementProgress } from '../../types/achievements';
import { IAchievementRepository } from './interfaces/IAchievementRepository';
import logger from '../../utils/logger';
import uuid from 'react-native-uuid';

const uuidv4 = uuid.v4;

/**
 * Repository for achievement data persistence
 */
export class AchievementRepository implements IAchievementRepository {
  private generateId(): string {
    return uuidv4() as string;
  }

  // ============================================
  // Unlocked Achievements Operations
  // ============================================

  async getAllUnlocked(): Promise<UnlockedAchievement[]> {
    const db = getDatabase();
    try {
      const results = await db.getAllAsync(
        'SELECT * FROM unlocked_achievements ORDER BY unlocked_at DESC'
      );
      return results.map(row => this.mapRowToUnlocked(row));
    } catch (error: any) {
      logger.error('DATA', 'Failed to fetch all unlocked achievements', { error: error.message });
      throw error;
    }
  }

  async getUnlockedByAchievementId(achievementId: string): Promise<UnlockedAchievement | null> {
    const db = getDatabase();
    try {
      const result = await db.getFirstAsync(
        'SELECT * FROM unlocked_achievements WHERE achievement_id = ?',
        achievementId
      );

      if (result) {
        return this.mapRowToUnlocked(result);
      }
      return null;
    } catch (error: any) {
      logger.error('DATA', 'Failed to fetch unlocked achievement', {
        error: error.message,
        achievementId,
      });
      throw error;
    }
  }

  async isUnlocked(achievementId: string): Promise<boolean> {
    const db = getDatabase();
    try {
      const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM unlocked_achievements WHERE achievement_id = ?',
        achievementId
      );
      return (result?.count || 0) > 0;
    } catch (error: any) {
      logger.error('DATA', 'Failed to check if achievement is unlocked', {
        error: error.message,
        achievementId,
      });
      throw error;
    }
  }

  async getUnviewedAchievements(): Promise<UnlockedAchievement[]> {
    const db = getDatabase();
    try {
      const results = await db.getAllAsync(
        'SELECT * FROM unlocked_achievements WHERE viewed = 0 ORDER BY unlocked_at ASC'
      );
      return results.map(row => this.mapRowToUnlocked(row));
    } catch (error: any) {
      logger.error('DATA', 'Failed to fetch unviewed achievements', { error: error.message });
      throw error;
    }
  }

  async recordUnlock(
    achievementId: string,
    taskId?: string,
    metadata?: Record<string, any>
  ): Promise<UnlockedAchievement> {
    const db = getDatabase();
    const id = this.generateId();
    const unlockedAt = new Date().toISOString();

    try {
      // Check if already unlocked (idempotent)
      const existing = await this.getUnlockedByAchievementId(achievementId);
      if (existing) {
        logger.debug('DATA', 'Achievement already unlocked', { achievementId });
        return existing;
      }

      const sql = `
        INSERT INTO unlocked_achievements (
          id,
          achievement_id,
          unlocked_at,
          task_id,
          metadata,
          viewed
        )
        VALUES (?, ?, ?, ?, ?, 0)
      `;

      await db.runAsync(
        sql,
        id,
        achievementId,
        unlockedAt,
        taskId || null,
        metadata ? JSON.stringify(metadata) : null
      );

      const unlocked: UnlockedAchievement = {
        id,
        achievementId,
        unlockedAt,
        taskId,
        metadata,
        viewed: false,
      };

      logger.info('DATA', 'Achievement unlocked', { achievementId, taskId });
      return unlocked;
    } catch (error: any) {
      logger.error('DATA', 'Failed to record achievement unlock', {
        error: error.message,
        achievementId,
      });
      throw error;
    }
  }

  async markAsViewed(achievementIds: string[]): Promise<void> {
    if (achievementIds.length === 0) return;

    const db = getDatabase();
    try {
      const placeholders = achievementIds.map(() => '?').join(',');
      await db.runAsync(
        `UPDATE unlocked_achievements SET viewed = 1 WHERE achievement_id IN (${placeholders})`,
        ...achievementIds
      );

      logger.debug('DATA', 'Achievements marked as viewed', { count: achievementIds.length });
    } catch (error: any) {
      logger.error('DATA', 'Failed to mark achievements as viewed', { error: error.message });
      throw error;
    }
  }

  async markAllAsViewed(): Promise<void> {
    const db = getDatabase();
    try {
      await db.runAsync('UPDATE unlocked_achievements SET viewed = 1 WHERE viewed = 0');
      logger.debug('DATA', 'All achievements marked as viewed');
    } catch (error: any) {
      logger.error('DATA', 'Failed to mark all achievements as viewed', { error: error.message });
      throw error;
    }
  }

  async getUnlockedCount(): Promise<number> {
    const db = getDatabase();
    try {
      const result = await db.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM unlocked_achievements'
      );
      return result?.count || 0;
    } catch (error: any) {
      logger.error('DATA', 'Failed to get unlocked count', { error: error.message });
      throw error;
    }
  }

  // ============================================
  // Progress Tracking Operations
  // ============================================

  async getProgress(achievementId: string): Promise<AchievementProgress | null> {
    const db = getDatabase();
    try {
      const result = await db.getFirstAsync(
        'SELECT * FROM achievement_progress WHERE achievement_id = ?',
        achievementId
      );

      if (result) {
        return this.mapRowToProgress(result);
      }
      return null;
    } catch (error: any) {
      logger.error('DATA', 'Failed to fetch achievement progress', {
        error: error.message,
        achievementId,
      });
      throw error;
    }
  }

  async getAllProgress(): Promise<AchievementProgress[]> {
    const db = getDatabase();
    try {
      const results = await db.getAllAsync('SELECT * FROM achievement_progress');
      return results.map(row => this.mapRowToProgress(row));
    } catch (error: any) {
      logger.error('DATA', 'Failed to fetch all achievement progress', { error: error.message });
      throw error;
    }
  }

  async updateProgress(
    achievementId: string,
    currentValue: number,
    targetValue: number
  ): Promise<AchievementProgress> {
    const db = getDatabase();
    const id = this.generateId();
    const percentage = Math.min(Math.floor((currentValue / targetValue) * 100), 100);
    const lastUpdatedAt = new Date().toISOString();

    try {
      const sql = `
        INSERT INTO achievement_progress (
          id,
          achievement_id,
          current_value,
          target_value,
          percentage,
          last_updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(achievement_id) DO UPDATE SET
          current_value = excluded.current_value,
          target_value = excluded.target_value,
          percentage = excluded.percentage,
          last_updated_at = excluded.last_updated_at
      `;

      await db.runAsync(
        sql,
        id,
        achievementId,
        currentValue,
        targetValue,
        percentage,
        lastUpdatedAt
      );

      const progress: AchievementProgress = {
        achievementId,
        currentValue,
        targetValue,
        percentage,
        lastUpdatedAt,
      };

      logger.debug('DATA', 'Achievement progress updated', {
        achievementId,
        currentValue,
        targetValue,
        percentage,
      });

      return progress;
    } catch (error: any) {
      logger.error('DATA', 'Failed to update achievement progress', {
        error: error.message,
        achievementId,
      });
      throw error;
    }
  }

  async deleteProgress(achievementId: string): Promise<void> {
    const db = getDatabase();
    try {
      await db.runAsync(
        'DELETE FROM achievement_progress WHERE achievement_id = ?',
        achievementId
      );
      logger.debug('DATA', 'Achievement progress deleted', { achievementId });
    } catch (error: any) {
      logger.error('DATA', 'Failed to delete achievement progress', {
        error: error.message,
        achievementId,
      });
      throw error;
    }
  }

  // ============================================
  // Batch Operations
  // ============================================

  async getUnlockedByIds(achievementIds: string[]): Promise<UnlockedAchievement[]> {
    if (achievementIds.length === 0) return [];

    const db = getDatabase();
    try {
      const placeholders = achievementIds.map(() => '?').join(',');
      const results = await db.getAllAsync(
        `SELECT * FROM unlocked_achievements WHERE achievement_id IN (${placeholders})`,
        ...achievementIds
      );
      return results.map(row => this.mapRowToUnlocked(row));
    } catch (error: any) {
      logger.error('DATA', 'Failed to fetch unlocked achievements by IDs', {
        error: error.message,
      });
      throw error;
    }
  }

  async getUnlockedIds(): Promise<Set<string>> {
    const db = getDatabase();
    try {
      const results = await db.getAllAsync<{ achievement_id: string }>(
        'SELECT achievement_id FROM unlocked_achievements'
      );
      return new Set(results.map(r => r.achievement_id));
    } catch (error: any) {
      logger.error('DATA', 'Failed to fetch unlocked achievement IDs', { error: error.message });
      throw error;
    }
  }

  // ============================================
  // Private Helpers
  // ============================================

  private mapRowToUnlocked(row: any): UnlockedAchievement {
    return {
      id: row.id,
      achievementId: row.achievement_id,
      unlockedAt: row.unlocked_at,
      taskId: row.task_id || undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      viewed: row.viewed === 1,
    };
  }

  private mapRowToProgress(row: any): AchievementProgress {
    return {
      achievementId: row.achievement_id,
      currentValue: row.current_value,
      targetValue: row.target_value,
      percentage: row.percentage,
      lastUpdatedAt: row.last_updated_at,
    };
  }
}
