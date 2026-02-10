/**
 * Achievement Theme Constants
 *
 * UI-specific styling for the achievement system.
 * Separated from type definitions to maintain proper separation of concerns.
 */

import { AchievementRarity, AchievementCelebration, AchievementCategory } from '../types/achievements';

/**
 * Rarity color mapping for UI display
 */
export const RARITY_COLORS: Record<AchievementRarity, string> = {
  common: '#6B7280',     // gray
  uncommon: '#22c55e',   // green
  rare: '#3b82f6',       // blue
  epic: '#8b5cf6',       // purple
  legendary: '#f59e0b',  // gold
};

/**
 * Rarity celebration defaults
 */
export const RARITY_CELEBRATIONS: Record<AchievementRarity, AchievementCelebration> = {
  common: {
    confetti: false,
    sound: 'achievement',
    toastDuration: 3000,
  },
  uncommon: {
    confetti: false,
    sound: 'achievement',
    toastDuration: 3500,
  },
  rare: {
    confetti: 'burst',
    sound: 'achievement',
    toastDuration: 4000,
  },
  epic: {
    confetti: 'fireworks',
    sound: 'achievement',
    toastDuration: 5000,
  },
  legendary: {
    confetti: 'rain',
    sound: 'achievement',
    toastDuration: 6000,
  },
};

/**
 * Category display names for UI
 */
export const CATEGORY_NAMES: Record<AchievementCategory, string> = {
  streak: 'Streak',
  consistency: 'Consistency',
  early_bird: 'Early Bird',
  perfect: 'Perfect Week',
  habit_mastery: 'Habit Mastery',
  special: 'Special',
  explorer: 'Explorer',
  recovery: 'Recovery',
  time_based: 'Time-Based',
  goals: 'Goals',
};

/**
 * Format category for display
 */
export const formatCategory = (category: AchievementCategory): string => {
  return CATEGORY_NAMES[category] || category;
};
