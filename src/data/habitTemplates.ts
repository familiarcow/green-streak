/**
 * Habit Templates Catalog
 *
 * Pre-configured habit templates organized by category.
 * Users can select from these to quickly create new habits.
 */

import { HabitTemplate, CategoryInfo, TemplateCategory } from '../types/templates';

/**
 * Category metadata for display in UI
 */
export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'health-fitness',
    name: 'Health & Fitness',
    icon: 'heart',
    color: '#22c55e',
  },
  {
    id: 'mindfulness',
    name: 'Mindfulness',
    icon: 'brain',
    color: '#8b5cf6',
  },
  {
    id: 'productivity',
    name: 'Productivity',
    icon: 'target',
    color: '#3b82f6',
  },
  {
    id: 'lifestyle',
    name: 'Lifestyle',
    icon: 'sun',
    color: '#f59e0b',
  },
];

/**
 * Color palette mapping for templates
 */
const COLORS = {
  green: '#22c55e',
  blue: '#3b82f6',
  amber: '#f59e0b',
  red: '#ef4444',
  violet: '#8b5cf6',
  cyan: '#06b6d4',
  orange: '#f97316',
  lime: '#84cc16',
  pink: '#ec4899',
  gray: '#6b7280',
  teal: '#14b8a6',
  purple: '#a855f7',
};

/**
 * All habit templates
 */
export const HABIT_TEMPLATES: HabitTemplate[] = [
  // ============================================
  // HEALTH & FITNESS (8 templates)
  // ============================================
  {
    id: 'exercise',
    name: 'Exercise',
    description: '',
    icon: 'dumbbell',
    color: COLORS.green,
    category: 'health-fitness',
    tags: ['exercise', 'workout', 'fitness', 'health', 'gym'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'drink-water',
    name: 'Drink Water',
    description: '',
    icon: 'droplet',
    color: COLORS.blue,
    category: 'health-fitness',
    tags: ['water', 'hydration', 'health', 'drink'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'take-vitamins',
    name: 'Take Vitamins',
    description: '',
    icon: 'pill',
    color: COLORS.amber,
    category: 'health-fitness',
    tags: ['vitamins', 'supplements', 'health', 'medicine'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'walk',
    name: 'Walk',
    description: '',
    icon: 'footprints',
    color: COLORS.teal,
    category: 'health-fitness',
    tags: ['walk', 'exercise', 'outdoors', 'steps'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'stretching',
    name: 'Stretching',
    description: '',
    icon: 'activity',
    color: COLORS.violet,
    category: 'health-fitness',
    tags: ['stretch', 'flexibility', 'exercise', 'yoga', 'mobility'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: true,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'healthy-eating',
    name: 'Eat Healthy',
    description: '',
    icon: 'apple',
    color: COLORS.red,
    category: 'health-fitness',
    tags: ['food', 'diet', 'nutrition', 'healthy', 'eating'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'sleep-well',
    name: 'Sleep Well',
    description: '',
    icon: 'moon',
    color: COLORS.gray,
    category: 'health-fitness',
    tags: ['sleep', 'rest', 'health', 'recovery', 'night'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'no-junk-food',
    name: 'No Junk Food',
    description: '',
    icon: 'coffee',
    color: COLORS.orange,
    category: 'health-fitness',
    tags: ['food', 'junk', 'snacks', 'health', 'avoid'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },

  // ============================================
  // MINDFULNESS (8 templates)
  // ============================================
  {
    id: 'meditation',
    name: 'Meditation',
    description: '',
    icon: 'brain',
    color: COLORS.violet,
    category: 'mindfulness',
    tags: ['meditation', 'mindfulness', 'calm', 'focus', 'zen'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'gratitude-journal',
    name: 'Gratitude Journal',
    description: '',
    icon: 'fileText',
    color: COLORS.amber,
    category: 'mindfulness',
    tags: ['gratitude', 'journal', 'writing', 'positivity', 'reflection'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'deep-breathing',
    name: 'Deep Breathing',
    description: '',
    icon: 'activity',
    color: COLORS.cyan,
    category: 'mindfulness',
    tags: ['breathing', 'stress', 'relax', 'mindfulness', 'calm'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: true,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'digital-detox',
    name: 'Digital Detox',
    description: '',
    icon: 'phone',
    color: COLORS.gray,
    category: 'mindfulness',
    tags: ['digital', 'screen', 'detox', 'break', 'technology'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'reflection',
    name: 'Reflection',
    description: '',
    icon: 'moon',
    color: COLORS.blue,
    category: 'mindfulness',
    tags: ['reflection', 'review', 'mindfulness', 'journaling'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'mindful-walk',
    name: 'Mindful Walk',
    description: '',
    icon: 'footprints',
    color: COLORS.green,
    category: 'mindfulness',
    tags: ['walk', 'mindfulness', 'outdoors', 'awareness', 'nature'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: true,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'no-social-media',
    name: 'No Social Media',
    description: '',
    icon: 'phone',
    color: COLORS.red,
    category: 'mindfulness',
    tags: ['social', 'media', 'limit', 'detox', 'focus'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'positive-affirmation',
    name: 'Positive Affirmation',
    description: '',
    icon: 'heart',
    color: COLORS.pink,
    category: 'mindfulness',
    tags: ['affirmation', 'positive', 'self-care', 'motivation', 'mindset'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },

  // ============================================
  // PRODUCTIVITY (8 templates)
  // ============================================
  {
    id: 'reading',
    name: 'Reading',
    description: '',
    icon: 'book',
    color: COLORS.blue,
    category: 'productivity',
    tags: ['reading', 'books', 'learning', 'knowledge', 'education'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'learn-something-new',
    name: 'Learn Something New',
    description: '',
    icon: 'graduation',
    color: COLORS.violet,
    category: 'productivity',
    tags: ['learning', 'skill', 'education', 'growth', 'development'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: true,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'plan-tomorrow',
    name: 'Plan Tomorrow',
    description: '',
    icon: 'calendar',
    color: COLORS.amber,
    category: 'productivity',
    tags: ['planning', 'tasks', 'organization', 'productivity', 'tomorrow'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: true,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'no-procrastination',
    name: 'No Procrastination',
    description: '',
    icon: 'zap',
    color: COLORS.red,
    category: 'productivity',
    tags: ['procrastination', 'focus', 'productivity', 'tasks', 'action'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: true,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'focus-time',
    name: 'Focus Time',
    description: '',
    icon: 'target',
    color: COLORS.green,
    category: 'productivity',
    tags: ['focus', 'deep work', 'concentration', 'productivity', 'work'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: true,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'inbox-zero',
    name: 'Inbox Zero',
    description: '',
    icon: 'fileText',
    color: COLORS.cyan,
    category: 'productivity',
    tags: ['email', 'inbox', 'organization', 'productivity', 'communication'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: true,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'review-goals',
    name: 'Review Goals',
    description: '',
    icon: 'checkCircle',
    color: COLORS.teal,
    category: 'productivity',
    tags: ['goals', 'review', 'progress', 'tracking', 'achievement'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'practice-skill',
    name: 'Practice Skill',
    description: '',
    icon: 'brain',
    color: COLORS.purple,
    category: 'productivity',
    tags: ['practice', 'skill', 'improvement', 'mastery', 'learning'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: true,
      streakMinimumCount: 1,
    },
  },

  // ============================================
  // LIFESTYLE (8 templates)
  // ============================================
  {
    id: 'call-family',
    name: 'Call Family',
    description: '',
    icon: 'phone',
    color: COLORS.pink,
    category: 'lifestyle',
    tags: ['family', 'call', 'connection', 'relationships', 'communication'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'clean-room',
    name: 'Clean Room',
    description: '',
    icon: 'broom',
    color: COLORS.lime,
    category: 'lifestyle',
    tags: ['cleaning', 'organization', 'home', 'tidy', 'space'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'practice-music',
    name: 'Practice Music',
    description: '',
    icon: 'music',
    color: COLORS.purple,
    category: 'lifestyle',
    tags: ['music', 'practice', 'instrument', 'hobby', 'creativity'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: true,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'morning-routine',
    name: 'Morning Routine',
    description: '',
    icon: 'sun',
    color: COLORS.amber,
    category: 'lifestyle',
    tags: ['morning', 'routine', 'ritual', 'start', 'day'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'skincare-routine',
    name: 'Skincare Routine',
    description: '',
    icon: 'heart',
    color: COLORS.pink,
    category: 'lifestyle',
    tags: ['skincare', 'routine', 'self-care', 'beauty', 'health'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'budget-check',
    name: 'Budget Check',
    description: '',
    icon: 'fileText',
    color: COLORS.green,
    category: 'lifestyle',
    tags: ['budget', 'money', 'finance', 'spending', 'tracking'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: true,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'no-alcohol',
    name: 'No Alcohol',
    description: '',
    icon: 'coffee',
    color: COLORS.red,
    category: 'lifestyle',
    tags: ['alcohol', 'sober', 'health', 'lifestyle', 'avoid'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'cook-at-home',
    name: 'Cook at Home',
    description: '',
    icon: 'apple',
    color: COLORS.orange,
    category: 'lifestyle',
    tags: ['cooking', 'food', 'home', 'health', 'savings'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'no-smoking',
    name: 'No Smoking',
    description: '',
    icon: 'x',
    color: COLORS.red,
    category: 'lifestyle',
    tags: ['smoking', 'quit', 'health', 'stop', 'cigarettes', 'tobacco'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'no-drugs',
    name: 'No Drugs',
    description: '',
    icon: 'pill',
    color: COLORS.red,
    category: 'lifestyle',
    tags: ['drugs', 'quit', 'health', 'stop', 'sober', 'clean'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'no-adult-content',
    name: 'No Adult Content',
    description: '',
    icon: 'lock',
    color: COLORS.red,
    category: 'lifestyle',
    tags: ['adult', 'quit', 'health', 'stop', 'nofap', 'mental health'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'call-friend',
    name: 'Call a Friend',
    description: '',
    icon: 'phone',
    color: COLORS.cyan,
    category: 'lifestyle',
    tags: ['friend', 'call', 'connection', 'social', 'relationships'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'talk-with-someone',
    name: 'Talk with Someone',
    description: '',
    icon: 'message-circle',
    color: COLORS.blue,
    category: 'lifestyle',
    tags: ['talk', 'conversation', 'social', 'connection', 'communication'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
];

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category: TemplateCategory): HabitTemplate[] => {
  return HABIT_TEMPLATES.filter((template) => template.category === category);
};

/**
 * Get category info by ID
 */
export const getCategoryInfo = (categoryId: TemplateCategory): CategoryInfo | undefined => {
  return CATEGORIES.find((cat) => cat.id === categoryId);
};

/**
 * Search templates by query
 */
export const searchTemplates = (query: string): HabitTemplate[] => {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return HABIT_TEMPLATES;

  return HABIT_TEMPLATES.filter(
    (template) =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
  );
};
