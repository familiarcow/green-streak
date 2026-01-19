/**
 * Achievement Library
 *
 * Static definitions for all achievements in the app.
 * These are stored in code, not the database.
 */

import {
  AchievementDefinition,
  AchievementCategory,
} from '../types/achievements';
import { RARITY_CELEBRATIONS } from '../theme/achievements';

/**
 * All achievement definitions organized by category
 */
export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ============================================
  // EXPLORER ACHIEVEMENTS - First actions
  // ============================================
  {
    id: 'explorer_first_task',
    name: 'Journey Begins',
    description: 'Create your first habit',
    icon: '🌱',
    category: 'explorer',
    rarity: 'common',
    condition: {
      type: 'first_action',
      action: 'create_task',
    },
    celebration: RARITY_CELEBRATIONS.common,
  },
  {
    id: 'explorer_first_completion',
    name: 'First Step',
    description: 'Complete your first habit',
    icon: '👣',
    category: 'explorer',
    rarity: 'common',
    condition: {
      type: 'first_action',
      action: 'complete_task',
    },
    celebration: RARITY_CELEBRATIONS.common,
  },
  {
    id: 'explorer_customize',
    name: 'Personal Touch',
    description: 'Customize a habit with color and icon',
    icon: '🎨',
    category: 'explorer',
    rarity: 'common',
    condition: {
      type: 'first_action',
      action: 'customize_task',
    },
    celebration: RARITY_CELEBRATIONS.common,
  },
  {
    id: 'explorer_5_habits',
    name: 'Habit Collector',
    description: 'Create 5 different habits',
    icon: '📚',
    category: 'explorer',
    rarity: 'uncommon',
    condition: {
      type: 'task_count',
      value: 5,
    },
    celebration: RARITY_CELEBRATIONS.uncommon,
  },
  {
    id: 'explorer_10_habits',
    name: 'Habit Hoarder',
    description: 'Create 10 different habits',
    icon: '🗃️',
    category: 'explorer',
    rarity: 'rare',
    condition: {
      type: 'task_count',
      value: 10,
    },
    celebration: RARITY_CELEBRATIONS.rare,
    prerequisiteId: 'explorer_5_habits',
  },

  // ============================================
  // STREAK ACHIEVEMENTS - Consecutive days
  // ============================================
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak on any habit',
    icon: '🔥',
    category: 'streak',
    rarity: 'common',
    condition: {
      type: 'streak_days',
      value: 7,
    },
    celebration: RARITY_CELEBRATIONS.common,
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak on any habit',
    icon: '🌟',
    category: 'streak',
    rarity: 'uncommon',
    condition: {
      type: 'streak_days',
      value: 30,
    },
    celebration: RARITY_CELEBRATIONS.uncommon,
    prerequisiteId: 'streak_7',
  },
  {
    id: 'streak_100',
    name: 'Century Club',
    description: 'Maintain a 100-day streak on any habit',
    icon: '💯',
    category: 'streak',
    rarity: 'rare',
    condition: {
      type: 'streak_days',
      value: 100,
    },
    celebration: RARITY_CELEBRATIONS.rare,
    prerequisiteId: 'streak_30',
  },
  {
    id: 'streak_365',
    name: 'Year of Dedication',
    description: 'Maintain a 365-day streak on any habit',
    icon: '🎊',
    category: 'streak',
    rarity: 'legendary',
    condition: {
      type: 'streak_days',
      value: 365,
    },
    celebration: RARITY_CELEBRATIONS.legendary,
    prerequisiteId: 'streak_100',
  },

  // ============================================
  // PERFECT ACHIEVEMENTS - No missed habits
  // ============================================
  {
    id: 'perfect_week_1',
    name: 'Perfect Week',
    description: 'Complete all habits every day for one week',
    icon: '✨',
    category: 'perfect',
    rarity: 'common',
    condition: {
      type: 'perfect_week',
      value: 1,
    },
    celebration: RARITY_CELEBRATIONS.common,
  },
  {
    id: 'perfect_week_4',
    name: 'Month of Perfection',
    description: 'Complete 4 perfect weeks',
    icon: '👑',
    category: 'perfect',
    rarity: 'rare',
    condition: {
      type: 'perfect_week',
      value: 4,
    },
    celebration: RARITY_CELEBRATIONS.rare,
    prerequisiteId: 'perfect_week_1',
  },

  // ============================================
  // CONSISTENCY ACHIEVEMENTS - All habits for X days
  // ============================================
  {
    id: 'consistency_7',
    name: 'All-Star Week',
    description: 'Complete ALL habits for 7 days straight',
    icon: '⭐',
    category: 'consistency',
    rarity: 'uncommon',
    condition: {
      type: 'all_habits_streak',
      value: 7,
    },
    celebration: RARITY_CELEBRATIONS.uncommon,
  },
  {
    id: 'consistency_30',
    name: 'Perfect Month',
    description: 'Complete ALL habits for 30 days straight',
    icon: '🏆',
    category: 'consistency',
    rarity: 'epic',
    condition: {
      type: 'all_habits_streak',
      value: 30,
    },
    celebration: RARITY_CELEBRATIONS.epic,
    prerequisiteId: 'consistency_7',
  },

  // ============================================
  // EARLY BIRD ACHIEVEMENTS - Complete before certain time
  // ============================================
  {
    id: 'early_bird_7',
    name: 'Early Bird',
    description: 'Complete a habit before 6 AM for 7 days',
    icon: '🌅',
    category: 'early_bird',
    rarity: 'rare',
    condition: {
      type: 'early_completion',
      value: 7,
      time: '06:00',
    },
    celebration: RARITY_CELEBRATIONS.rare,
  },

  // ============================================
  // HABIT MASTERY ACHIEVEMENTS - Total completions
  // ============================================
  {
    id: 'mastery_50',
    name: 'Habit Builder',
    description: 'Complete one habit 50 times',
    icon: '🔨',
    category: 'habit_mastery',
    rarity: 'uncommon',
    condition: {
      type: 'total_completions',
      value: 50,
    },
    celebration: RARITY_CELEBRATIONS.uncommon,
  },
  {
    id: 'mastery_100',
    name: 'Habit Artisan',
    description: 'Complete one habit 100 times',
    icon: '⚒️',
    category: 'habit_mastery',
    rarity: 'rare',
    condition: {
      type: 'total_completions',
      value: 100,
    },
    celebration: RARITY_CELEBRATIONS.rare,
    prerequisiteId: 'mastery_50',
  },
  {
    id: 'mastery_500',
    name: 'Habit Master',
    description: 'Complete one habit 500 times',
    icon: '🛠️',
    category: 'habit_mastery',
    rarity: 'epic',
    condition: {
      type: 'total_completions',
      value: 500,
    },
    celebration: RARITY_CELEBRATIONS.epic,
    prerequisiteId: 'mastery_100',
  },
  {
    id: 'mastery_1000',
    name: 'Habit Legend',
    description: 'Complete one habit 1000 times',
    icon: '🏅',
    category: 'habit_mastery',
    rarity: 'legendary',
    condition: {
      type: 'total_completions',
      value: 1000,
    },
    celebration: RARITY_CELEBRATIONS.legendary,
    prerequisiteId: 'mastery_500',
  },

  // ============================================
  // SPECIAL ACHIEVEMENTS - Holiday/seasonal (hidden)
  // ============================================
  {
    id: 'special_new_year',
    name: 'New Year Resolution',
    description: 'Complete a habit on New Year\'s Day',
    icon: '🎆',
    category: 'special',
    rarity: 'rare',
    condition: {
      type: 'date_specific',
      date: '01-01',
    },
    celebration: RARITY_CELEBRATIONS.rare,
    hidden: true,
  },
  {
    id: 'special_halloween',
    name: 'Spooky Streak',
    description: 'Complete a habit on Halloween',
    icon: '🎃',
    category: 'special',
    rarity: 'rare',
    condition: {
      type: 'date_specific',
      date: '10-31',
    },
    celebration: RARITY_CELEBRATIONS.rare,
    hidden: true,
  },
  {
    id: 'special_leap_day',
    name: 'Rare Occasion',
    description: 'Complete a habit on leap day (February 29)',
    icon: '🦘',
    category: 'special',
    rarity: 'epic',
    condition: {
      type: 'date_specific',
      date: '02-29',
    },
    celebration: RARITY_CELEBRATIONS.epic,
    hidden: true,
  },
  {
    id: 'special_anniversary',
    name: 'Anniversary',
    description: 'Use Green Streak for one year',
    icon: '🎂',
    category: 'special',
    rarity: 'epic',
    condition: {
      type: 'app_anniversary',
      value: 1,
    },
    celebration: RARITY_CELEBRATIONS.epic,
  },
];

/**
 * Get achievement by ID
 */
export const getAchievementById = (id: string): AchievementDefinition | undefined => {
  return ACHIEVEMENTS.find(a => a.id === id);
};

/**
 * Get achievements by category
 */
export const getAchievementsByCategory = (
  category: AchievementCategory
): AchievementDefinition[] => {
  return ACHIEVEMENTS.filter(a => a.category === category);
};

/**
 * Get all visible achievements (non-hidden or already unlocked)
 */
export const getVisibleAchievements = (
  unlockedIds: Set<string>
): AchievementDefinition[] => {
  return ACHIEVEMENTS.filter(a => !a.hidden || unlockedIds.has(a.id));
};

/**
 * Get achievements that can potentially be unlocked
 * (prerequisites met, not already unlocked)
 */
export const getUnlockableAchievements = (
  unlockedIds: Set<string>
): AchievementDefinition[] => {
  return ACHIEVEMENTS.filter(a => {
    // Already unlocked
    if (unlockedIds.has(a.id)) {
      return false;
    }

    // Check prerequisite
    if (a.prerequisiteId && !unlockedIds.has(a.prerequisiteId)) {
      return false;
    }

    return true;
  });
};

/**
 * Total number of achievements
 */
export const TOTAL_ACHIEVEMENTS = ACHIEVEMENTS.length;
