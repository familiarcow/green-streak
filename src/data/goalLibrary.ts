/**
 * Goal Library
 *
 * Static definitions for the 8 predefined life goals.
 * These are stored in code, not the database.
 */

import { GoalDefinition } from '../types/goals';

/**
 * All predefined goal definitions
 * Users can select from these to set their life goals
 */
export const GOALS: GoalDefinition[] = [
  {
    id: 'better-health',
    title: 'Better Health',
    icon: 'heart',
    color: '#ef4444', // red
    description: 'Improve physical well-being through healthy habits',
    emoji: '❤️',
  },
  {
    id: 'career-growth',
    title: 'Career Growth',
    icon: 'briefcase',
    color: '#3b82f6', // blue
    description: 'Advance professionally and develop work skills',
    emoji: '💼',
  },
  {
    id: 'financial-freedom',
    title: 'Financial Freedom',
    icon: 'trendingUp',
    color: '#22c55e', // green
    description: 'Build wealth and achieve financial security',
    emoji: '💰',
  },
  {
    id: 'learning',
    title: 'Learning & Growth',
    icon: 'graduation',
    color: '#8b5cf6', // violet
    description: 'Expand knowledge and learn new skills',
    emoji: '📚',
  },
  {
    id: 'relationships',
    title: 'Relationships',
    icon: 'users',
    color: '#ec4899', // pink
    description: 'Strengthen connections with family and friends',
    emoji: '👥',
  },
  {
    id: 'mindfulness',
    title: 'Mindfulness',
    icon: 'brain',
    color: '#06b6d4', // cyan
    description: 'Cultivate mental clarity and emotional balance',
    emoji: '🧘',
  },
  {
    id: 'fitness',
    title: 'Fitness',
    icon: 'dumbbell',
    color: '#f97316', // orange
    description: 'Build strength, endurance, and physical fitness',
    emoji: '💪',
  },
  {
    id: 'creativity',
    title: 'Creativity',
    icon: 'palette',
    color: '#a855f7', // purple
    description: 'Express yourself and develop creative skills',
    emoji: '🎨',
  },
];

/**
 * Get a goal definition by ID
 */
export const getGoalById = (id: string): GoalDefinition | undefined => {
  return GOALS.find(goal => goal.id === id);
};

/**
 * Get all goal IDs
 */
export const getAllGoalIds = (): string[] => {
  return GOALS.map(goal => goal.id);
};

/**
 * Map of goal ID to goal definition for quick lookup
 */
export const GOAL_MAP: Record<string, GoalDefinition> = GOALS.reduce(
  (acc, goal) => {
    acc[goal.id] = goal;
    return acc;
  },
  {} as Record<string, GoalDefinition>
);
