/**
 * Goal Types
 *
 * Type definitions for life goals that give meaning to daily habits.
 * Goals are the "why" behind the "what" of habits.
 */

import { IconName } from '../components/common/Icon';

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
 * UserGoal enriched with data from GoalDefinition
 * Used for display purposes
 */
export interface UserGoalWithDetails extends UserGoal {
  /** The goal definition */
  definition: GoalDefinition;
  /** IDs of habits linked to this goal */
  linkedHabitIds: string[];
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
