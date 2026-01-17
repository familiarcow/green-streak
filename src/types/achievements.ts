/**
 * Achievement System Types
 *
 * Type definitions for the achievement and collectibles system.
 */

// Rarity levels with escalating celebration intensity
export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// Categories for organization
export type AchievementCategory =
  | 'streak'        // 7, 30, 100, 365 day streaks
  | 'consistency'   // Complete ALL habits for X days
  | 'early_bird'    // Complete before certain time
  | 'perfect'       // Perfect week/month
  | 'habit_mastery' // Total completions milestones
  | 'special'       // Holiday/seasonal
  | 'explorer';     // First actions (first task, first completion)

// Confetti animation types
export type ConfettiType = false | 'burst' | 'fireworks' | 'rain';

// Sound effect types for achievements
export type AchievementSoundType = 'success' | 'milestone' | 'streak' | 'none';

// Achievement trigger types
export type AchievementTrigger =
  | 'task_completion'
  | 'streak_update'
  | 'task_created'
  | 'task_customized'
  | 'app_open';

// Condition types for achievements
export type AchievementConditionType =
  | 'streak_days'           // Reach X day streak on any task
  | 'total_completions'     // Total completions on a single task
  | 'all_habits_streak'     // Complete ALL habits for X consecutive days
  | 'perfect_week'          // No missed habits for X weeks
  | 'early_completion'      // Complete before X time for Y days
  | 'task_count'            // Create X number of tasks
  | 'first_action'          // First task created, first completion, etc.
  | 'date_specific'         // Complete on specific date (holidays)
  | 'app_anniversary';      // Use app for X years

/**
 * Condition definition for evaluating achievement unlock
 */
export interface AchievementCondition {
  type: AchievementConditionType;

  // For numeric thresholds
  value?: number;

  // For date-specific achievements (MM-DD format)
  date?: string;

  // For time-based achievements (HH:mm format)
  time?: string;

  // For first-action achievements
  action?: 'create_task' | 'complete_task' | 'customize_task';
}

/**
 * Celebration configuration for when achievement unlocks
 */
export interface AchievementCelebration {
  confetti: ConfettiType;
  sound: AchievementSoundType;
  toastDuration: number;
}

/**
 * Static achievement definition (stored in code, not database)
 */
export interface AchievementDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;              // Emoji
  category: AchievementCategory;
  rarity: AchievementRarity;
  condition: AchievementCondition;
  celebration: AchievementCelebration;
  hidden?: boolean;          // Hidden until unlocked (for surprises)
  prerequisiteId?: string;   // Must unlock this achievement first
}

/**
 * Unlocked achievement record (stored in database)
 */
export interface UnlockedAchievement {
  id: string;
  achievementId: string;
  unlockedAt: string;       // ISO timestamp
  taskId?: string;          // Task that triggered the unlock (if applicable)
  metadata?: Record<string, any>;  // Additional context
  viewed: boolean;          // Whether user has seen the achievement
}

/**
 * Achievement progress tracking
 */
export interface AchievementProgress {
  achievementId: string;
  currentValue: number;
  targetValue: number;
  percentage: number;
  lastUpdatedAt: string;
}

/**
 * Combined achievement status for UI display
 */
export interface AchievementWithStatus {
  definition: AchievementDefinition;
  unlocked: UnlockedAchievement | null;
  progress: AchievementProgress | null;
  isUnlocked: boolean;
  isHidden: boolean;  // Should show as "???" in UI
}

/**
 * Event emitted when achievement unlocks
 */
export interface AchievementUnlockEvent {
  achievement: AchievementDefinition;
  unlockRecord: UnlockedAchievement;
  isNew: boolean;  // True if just unlocked, false if already was
}

/**
 * Context passed to achievement checking
 */
export interface AchievementCheckContext {
  trigger: AchievementTrigger;
  taskId?: string;
  date?: string;
  count?: number;
  time?: string;  // HH:mm format
}

/**
 * Achievement statistics
 */
export interface AchievementStats {
  totalUnlocked: number;
  totalAchievements: number;
  percentage: number;
  byCategory: Record<AchievementCategory, { unlocked: number; total: number }>;
  byRarity: Record<AchievementRarity, number>;
  recentUnlocks: UnlockedAchievement[];
}

// Note: UI-specific constants (RARITY_COLORS, RARITY_CELEBRATIONS, CATEGORY_NAMES)
// are located in src/theme/achievements.ts to maintain separation of concerns.
