/**
 * Goal Types
 *
 * Type definitions for life goals that give meaning to daily habits.
 * Goals are the "why" behind the "what" of habits.
 *
 * Supports both predefined goals (from goalLibrary.ts) and custom user-created goals.
 */

import { IconName } from '../components/common/Icon';

/**
 * Type-safe predefined goal ID union matching goalLibrary.ts
 * Used for template categorization and goal references
 */
export type PredefinedGoalId =
  | 'better-health'
  | 'career-growth'
  | 'financial-freedom'
  | 'learning'
  | 'relationships'
  | 'mindfulness'
  | 'fitness'
  | 'creativity';

/**
 * Goal ID that can be either a predefined ID or a custom UUID
 * Used in APIs that accept any goal reference
 */
export type AnyGoalId = PredefinedGoalId | string;

/**
 * @deprecated Use PredefinedGoalId instead
 * Kept for backwards compatibility
 */
export type GoalId = PredefinedGoalId;

/**
 * Predefined goal definition from the goal library
 * These are static and stored in code, not the database
 */
export interface GoalDefinition {
  /** Unique identifier for the goal type (e.g., 'better-health') */
  id: string;
  /** Display title (e.g., 'Better Health') */
  title: string;
  /** Icon name from the icon library */
  icon: IconName;
  /** Theme color for the goal */
  color: string;
  /** Short description of what this goal represents */
  description: string;
  /** Emoji representation for compact display */
  emoji: string;
  /** Type discriminator - always false for predefined goals */
  isCustom?: false;
}

/**
 * Custom goal definition created by user
 * Stored in custom_goal_definitions table
 */
export interface CustomGoalDefinition {
  /** UUID identifier */
  id: string;
  /** User-defined title (max 30 chars) */
  title: string;
  /** User-selected emoji */
  emoji: string;
  /** User-selected color */
  color: string;
  /** User-defined description (max 100 chars) */
  description: string;
  /** Icon name (defaults to 'target') */
  icon: IconName;
  /** Type discriminator - always true for custom goals */
  isCustom: true;
  /** When the goal was created */
  createdAt: string;
  /** When the goal was last updated */
  updatedAt: string;
}

/**
 * Union type for all goal definitions (predefined + custom)
 */
export type AnyGoalDefinition = GoalDefinition | CustomGoalDefinition;

/**
 * Type guard to check if a goal definition is custom
 */
export function isCustomGoal(def: AnyGoalDefinition): def is CustomGoalDefinition {
  return 'isCustom' in def && def.isCustom === true;
}

/**
 * Type guard to check if a goal definition is predefined
 */
export function isPredefinedGoal(def: AnyGoalDefinition): def is GoalDefinition {
  return !('isCustom' in def) || def.isCustom === false;
}

/**
 * Input data for creating a custom goal
 */
export interface CreateCustomGoalInput {
  title: string;
  emoji: string;
  color: string;
  description?: string;
  icon?: IconName;
}

/**
 * Input data for updating a custom goal
 */
export interface UpdateCustomGoalInput {
  title?: string;
  emoji?: string;
  color?: string;
  description?: string;
  icon?: IconName;
}

/**
 * User's selected goal stored in the database
 */
export interface UserGoal {
  /** Unique ID for this user_goals record */
  id: string;
  /** Reference to GoalDefinition.id */
  goalId: string;
  /** Whether this is the user's primary goal */
  isPrimary: boolean;
  /** When the goal was selected */
  selectedAt: string;
  /** When the goal was archived (soft delete) */
  archivedAt?: string;
  /** Sort order for display */
  sortOrder: number;
  /** Last update timestamp */
  updatedAt: string;
}

/**
 * Link between a goal and a habit (task)
 * Stored in goal_habits junction table
 */
export interface GoalHabitLink {
  /** Reference to user_goals.id */
  goalId: string;
  /** Reference to tasks.id */
  taskId: string;
  /** When the link was created */
  linkedAt: string;
}

/**
 * UserGoal enriched with data from GoalDefinition or CustomGoalDefinition
 * Used for display purposes
 */
export interface UserGoalWithDetails extends UserGoal {
  /** The goal definition (predefined or custom) */
  definition: AnyGoalDefinition;
  /** IDs of habits linked to this goal */
  linkedHabitIds: string[];
}

/**
 * Per-habit completion statistics for a goal
 */
export interface HabitStats {
  /** The task ID */
  taskId: string;
  /** Habit name */
  name: string;
  /** Habit icon */
  icon: string;
  /** Habit color */
  color: string;
  /** Completions today */
  completionsToday: number;
  /** Completions last 7 days */
  completionsThisWeek: number;
  /** Completions last 30 days */
  completionsThisMonth: number;
  /** Total completions all time */
  completionsAllTime: number;
}

/**
 * Goal progress for display (e.g., in GoalCard)
 */
export interface GoalProgress {
  /** The goal */
  goal: UserGoalWithDetails;
  /** Number of linked habits completed today */
  completedToday: number;
  /** Total number of linked habits */
  totalHabits: number;
  /** Progress percentage (0-100) */
  percentage: number;
  /** Per-habit statistics */
  habitStats: HabitStats[];
}

/**
 * Data needed to select a goal during onboarding or settings
 */
export interface SelectGoalData {
  /** The goal definition ID to select */
  goalId: string;
  /** Whether to set as primary */
  isPrimary?: boolean;
}

// ============================================
// Milestone Types
// ============================================

/**
 * A milestone recorded for a goal - a meaningful moment on the journey
 */
export interface Milestone {
  /** Unique ID */
  id: string;
  /** Reference to user_goals.id */
  userGoalId: string;
  /** Date of the milestone (YYYY-MM-DD) */
  date: string;
  /** Short title (max 50 chars) */
  title: string;
  /** Optional description (max 500 chars) */
  description: string;
  /** When the milestone was created */
  createdAt: string;
  /** When the milestone was last updated */
  updatedAt: string;
}

/**
 * Input data for creating a milestone
 */
export interface CreateMilestoneInput {
  /** Reference to user_goals.id */
  userGoalId: string;
  /** Date of the milestone (YYYY-MM-DD) */
  date: string;
  /** Short title (max 50 chars) */
  title: string;
  /** Optional description (max 500 chars) */
  description?: string;
}
