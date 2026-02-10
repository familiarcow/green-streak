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
    id: 'explorer_3_habits',
    name: 'Building Momentum',
    description: 'Create 3 different habits',
    icon: '🎯',
    category: 'explorer',
    rarity: 'common',
    condition: {
      type: 'task_count',
      value: 3,
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
    prerequisiteId: 'explorer_3_habits',
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
    id: 'streak_3',
    name: 'Three Day Spark',
    description: 'Maintain a 3-day streak - momentum is building!',
    icon: '✨',
    category: 'streak',
    rarity: 'common',
    condition: {
      type: 'streak_days',
      value: 3,
    },
    celebration: RARITY_CELEBRATIONS.common,
  },
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
    prerequisiteId: 'streak_3',
  },
  {
    id: 'streak_10',
    name: 'Danger Zone Survivor',
    description: 'Maintain a 10-day streak - you\'ve passed when most people quit!',
    icon: '🛡️',
    category: 'streak',
    rarity: 'common',
    condition: {
      type: 'streak_days',
      value: 10,
    },
    celebration: RARITY_CELEBRATIONS.common,
    prerequisiteId: 'streak_7',
  },
  {
    id: 'streak_14',
    name: 'Two Week Triumph',
    description: 'Maintain a 14-day streak - you\'ve passed the critical prediction window!',
    icon: '📅',
    category: 'streak',
    rarity: 'uncommon',
    condition: {
      type: 'streak_days',
      value: 14,
    },
    celebration: RARITY_CELEBRATIONS.uncommon,
    prerequisiteId: 'streak_10',
  },
  {
    id: 'streak_21',
    name: 'Three Week Foundation',
    description: 'Maintain a 21-day streak - the classic psychological milestone',
    icon: '🏗️',
    category: 'streak',
    rarity: 'rare',
    condition: {
      type: 'streak_days',
      value: 21,
    },
    celebration: RARITY_CELEBRATIONS.rare,
    prerequisiteId: 'streak_14',
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
    prerequisiteId: 'streak_21',
  },
  {
    id: 'streak_45',
    name: 'Six Week Mark',
    description: 'Maintain a 45-day streak - halfway to habit formation!',
    icon: '📈',
    category: 'streak',
    rarity: 'rare',
    condition: {
      type: 'streak_days',
      value: 45,
    },
    celebration: RARITY_CELEBRATIONS.rare,
    prerequisiteId: 'streak_30',
  },
  {
    id: 'streak_66',
    name: 'Habit Formed',
    description: 'Maintain a 66-day streak - science says your habit is now automatic!',
    icon: '🧬',
    category: 'streak',
    rarity: 'epic',
    condition: {
      type: 'streak_days',
      value: 66,
    },
    celebration: RARITY_CELEBRATIONS.epic,
    prerequisiteId: 'streak_45',
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
    prerequisiteId: 'streak_66',
  },
  {
    id: 'streak_150',
    name: 'Five Month Journey',
    description: 'Maintain a 150-day streak - you\'re in it for the long haul!',
    icon: '🚀',
    category: 'streak',
    rarity: 'epic',
    condition: {
      type: 'streak_days',
      value: 150,
    },
    celebration: RARITY_CELEBRATIONS.epic,
    prerequisiteId: 'streak_100',
  },
  {
    id: 'streak_200',
    name: 'Two Hundred Club',
    description: 'Maintain a 200-day streak - halfway to a year!',
    icon: '🎯',
    category: 'streak',
    rarity: 'epic',
    condition: {
      type: 'streak_days',
      value: 200,
    },
    celebration: RARITY_CELEBRATIONS.epic,
    prerequisiteId: 'streak_150',
  },
  {
    id: 'streak_250',
    name: 'Closing In',
    description: 'Maintain a 250-day streak - the finish line is in sight!',
    icon: '🏁',
    category: 'streak',
    rarity: 'epic',
    condition: {
      type: 'streak_days',
      value: 250,
    },
    celebration: RARITY_CELEBRATIONS.epic,
    prerequisiteId: 'streak_200',
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
    prerequisiteId: 'streak_250',
  },
  {
    id: 'streak_500',
    name: 'Marathon Runner',
    description: 'Maintain a 500-day streak - you\'ve made this a permanent part of your life!',
    icon: '🏃',
    category: 'streak',
    rarity: 'legendary',
    condition: {
      type: 'streak_days',
      value: 500,
    },
    celebration: RARITY_CELEBRATIONS.legendary,
    prerequisiteId: 'streak_365',
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
    id: 'consistency_14',
    name: 'Perfect Fortnight',
    description: 'Complete ALL habits for 14 days straight - survived the danger zone!',
    icon: '🔄',
    category: 'consistency',
    rarity: 'rare',
    condition: {
      type: 'all_habits_streak',
      value: 14,
    },
    celebration: RARITY_CELEBRATIONS.rare,
    prerequisiteId: 'consistency_7',
  },
  {
    id: 'consistency_21',
    name: 'Three Week Champion',
    description: 'Complete ALL habits for 21 days straight - the classic milestone!',
    icon: '🏅',
    category: 'consistency',
    rarity: 'rare',
    condition: {
      type: 'all_habits_streak',
      value: 21,
    },
    celebration: RARITY_CELEBRATIONS.rare,
    prerequisiteId: 'consistency_14',
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
    prerequisiteId: 'consistency_21',
  },
  {
    id: 'consistency_66',
    name: 'Identity Shift',
    description: 'Complete ALL habits for 66 days - you\'ve transformed into the person you wanted to be',
    icon: '🦋',
    category: 'consistency',
    rarity: 'legendary',
    condition: {
      type: 'all_habits_streak',
      value: 66,
    },
    celebration: RARITY_CELEBRATIONS.legendary,
    prerequisiteId: 'consistency_30',
  },
  {
    id: 'habit_stacker',
    name: 'Habit Stacker',
    description: 'Complete 3 or more habits in a single day',
    icon: '📚',
    category: 'consistency',
    rarity: 'uncommon',
    condition: {
      type: 'multi_habit_same_day',
      value: 3,
    },
    celebration: RARITY_CELEBRATIONS.uncommon,
  },
  {
    id: 'daily_domination',
    name: 'Daily Domination',
    description: 'Complete 5 or more habits in a single day',
    icon: '👑',
    category: 'consistency',
    rarity: 'rare',
    condition: {
      type: 'multi_habit_same_day',
      value: 5,
    },
    celebration: RARITY_CELEBRATIONS.rare,
    prerequisiteId: 'habit_stacker',
  },
  {
    id: 'stack_master',
    name: 'Stack Master',
    description: 'Complete 3+ habits daily for 7 days - your neural pathways are linking up!',
    icon: '🔗',
    category: 'consistency',
    rarity: 'rare',
    condition: {
      type: 'multi_habit_streak',
      value: 3,
      days: 7,
    },
    celebration: RARITY_CELEBRATIONS.rare,
    prerequisiteId: 'habit_stacker',
  },
  {
    id: 'routine_architect',
    name: 'Routine Architect',
    description: 'Complete 3+ habits daily for 21 days - you\'ve built a powerful routine',
    icon: '🏛️',
    category: 'consistency',
    rarity: 'epic',
    condition: {
      type: 'multi_habit_streak',
      value: 3,
      days: 21,
    },
    celebration: RARITY_CELEBRATIONS.epic,
    prerequisiteId: 'stack_master',
  },
  {
    id: 'neural_network',
    name: 'Neural Network',
    description: 'Complete 5+ habits daily for 14 days - your habits reinforce each other',
    icon: '🧠',
    category: 'consistency',
    rarity: 'epic',
    condition: {
      type: 'multi_habit_streak',
      value: 5,
      days: 14,
    },
    celebration: RARITY_CELEBRATIONS.epic,
    prerequisiteId: 'daily_domination',
  },
  {
    id: 'habit_ecosystem',
    name: 'Habit Ecosystem',
    description: 'Complete 5+ habits daily for 66 days - a self-sustaining system of excellence',
    icon: '🌐',
    category: 'consistency',
    rarity: 'legendary',
    condition: {
      type: 'multi_habit_streak',
      value: 5,
      days: 66,
    },
    celebration: RARITY_CELEBRATIONS.legendary,
    prerequisiteId: 'neural_network',
  },

  // ============================================
  // EARLY BIRD ACHIEVEMENTS - Complete before certain time
  // ============================================
  {
    id: 'dawn_patrol',
    name: 'Dawn Patrol',
    description: 'Complete a habit before 6 AM',
    icon: '🌅',
    category: 'early_bird',
    rarity: 'uncommon',
    condition: {
      type: 'early_completion',
      value: 1,
      time: '06:00',
    },
    celebration: RARITY_CELEBRATIONS.uncommon,
  },
  {
    id: 'early_bird_7',
    name: 'Early Bird',
    description: 'Complete a habit before 6 AM for 7 days',
    icon: '🐦',
    category: 'early_bird',
    rarity: 'rare',
    condition: {
      type: 'early_completion',
      value: 7,
      time: '06:00',
    },
    celebration: RARITY_CELEBRATIONS.rare,
    prerequisiteId: 'dawn_patrol',
  },
  {
    id: 'early_riser',
    name: 'Early Riser',
    description: 'Complete a habit before 6 AM for 14 days - morning routine mastery!',
    icon: '🐓',
    category: 'early_bird',
    rarity: 'rare',
    condition: {
      type: 'early_completion',
      value: 14,
      time: '06:00',
    },
    celebration: RARITY_CELEBRATIONS.rare,
    prerequisiteId: 'early_bird_7',
  },

  // ============================================
  // TIME-BASED ACHIEVEMENTS - Evening routines
  // ============================================
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete a habit after 10 PM for 7 days - evening routines are valid too!',
    icon: '🦉',
    category: 'time_based',
    rarity: 'rare',
    condition: {
      type: 'evening_completion',
      value: 7,
      time: '22:00',
    },
    celebration: RARITY_CELEBRATIONS.rare,
  },

  // ============================================
  // RECOVERY ACHIEVEMENTS - Comeback after breaks
  // ============================================
  {
    id: 'phoenix_rising',
    name: 'Phoenix Rising',
    description: 'Resume a habit within 2 days of a break - one miss isn\'t failure!',
    icon: '🔥',
    category: 'recovery',
    rarity: 'uncommon',
    condition: {
      type: 'streak_recovery',
      value: 1,
      minLostStreak: 0,
    },
    celebration: RARITY_CELEBRATIONS.uncommon,
  },
  {
    id: 'comeback_kid',
    name: 'Comeback Kid',
    description: 'Rebuild a 7-day streak after losing a 7+ day streak',
    icon: '🥊',
    category: 'recovery',
    rarity: 'rare',
    condition: {
      type: 'streak_recovery',
      value: 7,
      minLostStreak: 7,
    },
    celebration: RARITY_CELEBRATIONS.rare,
    prerequisiteId: 'phoenix_rising',
  },
  {
    id: 'never_say_die',
    name: 'Never Say Die',
    description: 'Rebuild a 30-day streak after losing a 14+ day streak - true grit!',
    icon: '💪',
    category: 'recovery',
    rarity: 'epic',
    condition: {
      type: 'streak_recovery',
      value: 30,
      minLostStreak: 14,
    },
    celebration: RARITY_CELEBRATIONS.epic,
    prerequisiteId: 'comeback_kid',
  },

  // ============================================
  // HABIT MASTERY ACHIEVEMENTS - Total completions
  // ============================================
  {
    id: 'mastery_25',
    name: 'Habit Apprentice',
    description: 'Complete one habit 25 times - you\'re building a foundation!',
    icon: '🔰',
    category: 'habit_mastery',
    rarity: 'common',
    condition: {
      type: 'total_completions',
      value: 25,
    },
    celebration: RARITY_CELEBRATIONS.common,
  },
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
    prerequisiteId: 'mastery_25',
  },
  {
    id: 'mastery_75',
    name: 'Habit Journeyman',
    description: 'Complete one habit 75 times - consistency is paying off!',
    icon: '⚡',
    category: 'habit_mastery',
    rarity: 'uncommon',
    condition: {
      type: 'total_completions',
      value: 75,
    },
    celebration: RARITY_CELEBRATIONS.uncommon,
    prerequisiteId: 'mastery_50',
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
    prerequisiteId: 'mastery_75',
  },
  {
    id: 'mastery_200',
    name: 'Habit Expert',
    description: 'Complete one habit 200 times',
    icon: '🎖️',
    category: 'habit_mastery',
    rarity: 'rare',
    condition: {
      type: 'total_completions',
      value: 200,
    },
    celebration: RARITY_CELEBRATIONS.rare,
    prerequisiteId: 'mastery_100',
  },
  {
    id: 'mastery_300',
    name: 'Habit Veteran',
    description: 'Complete one habit 300 times',
    icon: '🎗️',
    category: 'habit_mastery',
    rarity: 'epic',
    condition: {
      type: 'total_completions',
      value: 300,
    },
    celebration: RARITY_CELEBRATIONS.epic,
    prerequisiteId: 'mastery_200',
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
    prerequisiteId: 'mastery_300',
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
  {
    id: 'mastery_2000',
    name: 'Habit Grandmaster',
    description: 'Complete one habit 2000 times - ~5.5 years of daily dedication!',
    icon: '♟️',
    category: 'habit_mastery',
    rarity: 'legendary',
    condition: {
      type: 'total_completions',
      value: 2000,
    },
    celebration: RARITY_CELEBRATIONS.legendary,
    prerequisiteId: 'mastery_1000',
  },
  {
    id: 'lifetime_achievement',
    name: 'Lifetime Achievement',
    description: 'Complete 5000 total habits across all your habits - a true portfolio of dedication!',
    icon: '🏆',
    category: 'habit_mastery',
    rarity: 'legendary',
    condition: {
      type: 'total_habits_completions',
      value: 5000,
    },
    celebration: RARITY_CELEBRATIONS.legendary,
  },

  // ============================================
  // SPECIAL ACHIEVEMENTS - Holiday/seasonal (hidden)
  // ============================================
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Complete a habit on both Saturday and Sunday for 4 consecutive weeks',
    icon: '🎉',
    category: 'special',
    rarity: 'rare',
    condition: {
      type: 'weekend_streak',
      value: 4,
    },
    celebration: RARITY_CELEBRATIONS.rare,
  },
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
    id: 'special_summer_solstice',
    name: 'Summer Solstice',
    description: 'Complete a habit on the longest day of the year (June 21)',
    icon: '☀️',
    category: 'special',
    rarity: 'rare',
    condition: {
      type: 'date_specific',
      date: '06-21',
    },
    celebration: RARITY_CELEBRATIONS.rare,
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

  // ============================================
  // GOALS ACHIEVEMENTS - Purpose-driven milestones
  // ============================================
  {
    id: 'goal_first',
    name: 'Finding Purpose',
    description: 'Select your first life goal',
    icon: '🎯',
    category: 'goals',
    rarity: 'common',
    condition: {
      type: 'goal_selected',
      value: 1,
    },
    celebration: RARITY_CELEBRATIONS.common,
  },
  {
    id: 'goal_multi',
    name: 'Life Architect',
    description: 'Select 3 or more life goals',
    icon: '🏗️',
    category: 'goals',
    rarity: 'uncommon',
    condition: {
      type: 'goal_selected',
      value: 3,
    },
    celebration: RARITY_CELEBRATIONS.uncommon,
    prerequisiteId: 'goal_first',
  },
  {
    id: 'goal_linked_5',
    name: 'Connected Purpose',
    description: 'Link 5 habits to your goals',
    icon: '🔗',
    category: 'goals',
    rarity: 'uncommon',
    condition: {
      type: 'goal_habits_linked',
      value: 5,
    },
    celebration: RARITY_CELEBRATIONS.uncommon,
    prerequisiteId: 'goal_first',
  },
  {
    id: 'goal_linked_10',
    name: 'Purposeful Living',
    description: 'Link 10 habits to your goals',
    icon: '🌟',
    category: 'goals',
    rarity: 'rare',
    condition: {
      type: 'goal_habits_linked',
      value: 10,
    },
    celebration: RARITY_CELEBRATIONS.rare,
    prerequisiteId: 'goal_linked_5',
  },
  {
    id: 'goal_streak_7',
    name: 'Goal-Driven Week',
    description: 'Complete all habits for a goal 7 days in a row',
    icon: '🔥',
    category: 'goals',
    rarity: 'rare',
    condition: {
      type: 'goal_streak',
      value: 7,
    },
    celebration: RARITY_CELEBRATIONS.rare,
    prerequisiteId: 'goal_first',
  },
  {
    id: 'goal_primary_14',
    name: 'Primary Focus Fortnight',
    description: 'Complete all primary goal habits for 14 days straight',
    icon: '🎯',
    category: 'goals',
    rarity: 'rare',
    condition: {
      type: 'goal_primary_streak',
      value: 14,
    },
    celebration: RARITY_CELEBRATIONS.rare,
    prerequisiteId: 'goal_streak_7',
  },
  {
    id: 'goal_primary_30',
    name: 'Primary Focus',
    description: 'Complete all primary goal habits for 30 days',
    icon: '⭐',
    category: 'goals',
    rarity: 'epic',
    condition: {
      type: 'goal_primary_streak',
      value: 30,
    },
    celebration: RARITY_CELEBRATIONS.epic,
    prerequisiteId: 'goal_primary_14',
  },
  {
    id: 'goal_all_complete',
    name: 'Goal Harmony',
    description: 'Complete all habits for ALL your goals in a single day (requires 3+ goals)',
    icon: '🌈',
    category: 'goals',
    rarity: 'epic',
    condition: {
      type: 'goal_all_complete',
      value: 3, // minimum goals required
    },
    celebration: RARITY_CELEBRATIONS.epic,
    prerequisiteId: 'goal_multi',
  },
  {
    id: 'goal_completions_1000',
    name: 'Life Changer',
    description: 'Complete 1000 goal-linked habits - your goals are becoming reality!',
    icon: '🌟',
    category: 'goals',
    rarity: 'legendary',
    condition: {
      type: 'goal_total_completions',
      value: 1000,
    },
    celebration: RARITY_CELEBRATIONS.legendary,
    prerequisiteId: 'goal_primary_30',
  },
  {
    id: 'streak_comeback',
    name: 'Resilience',
    description: 'Rebuild a 7-day streak after losing a 14+ day streak - true strength!',
    icon: '💪',
    category: 'recovery',
    rarity: 'rare',
    condition: {
      type: 'streak_recovery',
      value: 7,
      minLostStreak: 14,
    },
    celebration: RARITY_CELEBRATIONS.rare,
    prerequisiteId: 'comeback_kid',
  },
  {
    id: 'multi_active_streak_3',
    name: 'Triple Threat',
    description: 'Have 3 habits with 7+ day streaks at the same time',
    icon: '🔱',
    category: 'streak',
    rarity: 'rare',
    condition: {
      type: 'concurrent_streaks',
      value: 3,
      days: 7,
    },
    celebration: RARITY_CELEBRATIONS.rare,
  },
  {
    id: 'multi_active_streak_5',
    name: 'Streak Master',
    description: 'Have 5 habits with 14+ day streaks simultaneously',
    icon: '👑',
    category: 'streak',
    rarity: 'epic',
    condition: {
      type: 'concurrent_streaks',
      value: 5,
      days: 14,
    },
    celebration: RARITY_CELEBRATIONS.epic,
    prerequisiteId: 'multi_active_streak_3',
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
