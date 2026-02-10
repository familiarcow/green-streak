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
  | 'explorer'      // First actions (first task, first completion)
  | 'recovery'      // Comeback achievements after streak breaks
  | 'time_based'    // Morning/evening completion patterns
  | 'goals';        // Goal-related achievements

// Confetti animation types
export type ConfettiType = false | 'burst' | 'fireworks' | 'rain';

// Sound effect types for achievements
export type AchievementSoundType = 'celebration' | 'achievement' | 'none';

// Achievement trigger types
export type AchievementTrigger =
  | 'task_completion'
  | 'streak_update'
  | 'task_created'
  | 'task_customized'
  | 'app_open'
  | 'goal_selected'
  | 'goal_habit_linked';

// Condition types for achievements
export type AchievementConditionType =
  | 'streak_days'               // Reach X day streak on any task
  | 'total_completions'         // Total completions on a single task
  | 'all_habits_streak'         // Complete ALL habits for X consecutive days
  | 'perfect_week'              // No missed habits for X weeks
  | 'early_completion'          // Complete before X time for Y days
  | 'task_count'                // Create X number of tasks
  | 'first_action'              // First task created, first completion, etc.
  | 'date_specific'             // Complete on specific date (holidays)
  | 'app_anniversary'           // Use app for X years
  | 'multi_habit_same_day'      // Count distinct habits completed on one day
  | 'evening_completion'        // Complete after specified time for Y days
  | 'streak_recovery'           // Resume after streak break (value = min streak to rebuild)
  | 'weekend_streak'            // Consecutive weekends with both days completed
  | 'total_habits_completions'  // Sum of completions across ALL habits
  | 'multi_habit_streak'        // Complete X+ habits daily for Y consecutive days
  | 'goal_selected'             // Select X goals
  | 'goal_habits_linked'        // Link X habits to goals
  | 'goal_streak'               // All habits for a goal completed for X days
  | 'goal_primary_streak'       // Primary goal habits completed for X days
  | 'goal_total_completions'    // Total completions of goal-linked habits
  | 'goal_all_complete'         // Complete all habits for ALL goals in one day
  | 'concurrent_streaks'        // Have X habits with Y+ day streaks simultaneously
  | 'total_streak_days';        // Accumulate X total streak days across all habits

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

  // For streak_recovery: minimum streak that was lost before recovery
  minLostStreak?: number;

  // For multi_habit_streak: number of consecutive days required
  days?: number;
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

// ============================================
// ACHIEVEMENT GRID TYPES (Kirby Air Ride style)
// ============================================

/**
 * Grid cell state for the achievement board
 */
export type GridCellState = 'locked' | 'visible' | 'unlocked';

/**
 * Position of an achievement on the grid
 */
export interface AchievementGridPosition {
  achievementId: string;
  row: number;  // 0-based (0-7 for 8x8)
  col: number;  // 0-based (0-7 for 8x8)
}

/**
 * Grid configuration based on version
 */
export interface GridConfig {
  version: number;
  size: number;
  maxAchievements: number;
}

/**
 * Stored grid data in database
 */
export interface AchievementGridData {
  id: string;
  seed: string;
  version: number;
  positions: AchievementGridPosition[];
  createdAt: string;
}

/**
 * Cell data for rendering in the grid
 */
export interface GridCell {
  row: number;
  col: number;
  state: GridCellState;
  achievement: AchievementDefinition | null;
  unlocked: UnlockedAchievement | null;
  progress: AchievementProgress | null;
}

/**
 * Grid state for the achievement board screen
 */
export interface AchievementGridState {
  cells: GridCell[][];  // 2D array [row][col]
  unlockedCount: number;
  totalCount: number;
  isComplete: boolean;
  starterPosition: { row: number; col: number };
}
