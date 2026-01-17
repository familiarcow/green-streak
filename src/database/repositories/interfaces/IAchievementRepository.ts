import { UnlockedAchievement, AchievementProgress } from '../../../types/achievements';

/**
 * Interface for Achievement repository operations
 * Defines the contract for achievement data persistence
 */
export interface IAchievementRepository {
  // ============================================
  // Unlocked Achievements Operations
  // ============================================

  /**
   * Get all unlocked achievements
   */
  getAllUnlocked(): Promise<UnlockedAchievement[]>;

  /**
   * Get unlocked achievement by achievement ID
   */
  getUnlockedByAchievementId(achievementId: string): Promise<UnlockedAchievement | null>;

  /**
   * Check if an achievement is unlocked
   */
  isUnlocked(achievementId: string): Promise<boolean>;

  /**
   * Get all unviewed (new) achievements
   */
  getUnviewedAchievements(): Promise<UnlockedAchievement[]>;

  /**
   * Record a newly unlocked achievement
   */
  recordUnlock(
    achievementId: string,
    taskId?: string,
    metadata?: Record<string, any>
  ): Promise<UnlockedAchievement>;

  /**
   * Mark achievements as viewed
   */
  markAsViewed(achievementIds: string[]): Promise<void>;

  /**
   * Mark all achievements as viewed
   */
  markAllAsViewed(): Promise<void>;

  /**
   * Get count of unlocked achievements
   */
  getUnlockedCount(): Promise<number>;

  // ============================================
  // Progress Tracking Operations
  // ============================================

  /**
   * Get progress for a specific achievement
   */
  getProgress(achievementId: string): Promise<AchievementProgress | null>;

  /**
   * Get all progress records
   */
  getAllProgress(): Promise<AchievementProgress[]>;

  /**
   * Update progress for an achievement
   */
  updateProgress(
    achievementId: string,
    currentValue: number,
    targetValue: number
  ): Promise<AchievementProgress>;

  /**
   * Delete progress record (when achievement is unlocked)
   */
  deleteProgress(achievementId: string): Promise<void>;

  // ============================================
  // Batch Operations
  // ============================================

  /**
   * Get multiple unlocked achievements by IDs
   */
  getUnlockedByIds(achievementIds: string[]): Promise<UnlockedAchievement[]>;

  /**
   * Get set of all unlocked achievement IDs (efficient for checking)
   */
  getUnlockedIds(): Promise<Set<string>>;
}

export default IAchievementRepository;
