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
      reminderTime: '07:00',
      reminderFrequency: 'daily',
      reminderText: "Your body's ready to move",
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
      reminderTime: '12:00',
      reminderFrequency: 'daily',
      reminderText: 'Stay hydrated',
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
      reminderTime: '08:00',
      reminderFrequency: 'daily',
      reminderText: 'Fuel for the day',
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
      reminderTime: '12:00',
      reminderFrequency: 'daily',
      reminderText: 'Fresh air awaits',
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
      reminderTime: '12:00',
      reminderFrequency: 'daily',
      reminderText: 'Time to loosen up',
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
      reminderTime: '12:00',
      reminderFrequency: 'daily',
      reminderText: 'Nourish yourself',
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
      reminderTime: '21:00',
      reminderFrequency: 'daily',
      reminderText: 'Wind down time',
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
      reminderTime: '18:00',
      reminderFrequency: 'daily',
      reminderText: "You've got this",
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
      reminderTime: '07:00',
      reminderFrequency: 'daily',
      reminderText: 'A moment of calm awaits',
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
      reminderTime: '21:00',
      reminderFrequency: 'daily',
      reminderText: 'What made today good?',
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
      reminderTime: '12:00',
      reminderFrequency: 'daily',
      reminderText: 'Pause and breathe',
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
      reminderTime: '20:00',
      reminderFrequency: 'daily',
      reminderText: 'Unplug for a bit',
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
      reminderTime: '21:00',
      reminderFrequency: 'daily',
      reminderText: 'How was your day?',
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
      reminderTime: '12:00',
      reminderFrequency: 'daily',
      reminderText: 'Walk with intention',
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
      reminderTime: '09:00',
      reminderFrequency: 'daily',
      reminderText: 'Stay present today',
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
      reminderTime: '08:00',
      reminderFrequency: 'daily',
      reminderText: "You've got this",
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
      reminderTime: '21:00',
      reminderFrequency: 'daily',
      reminderText: 'Your book is waiting',
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
      reminderTime: '19:00',
      reminderFrequency: 'daily',
      reminderText: 'Curiosity time',
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
      reminderTime: '21:00',
      reminderFrequency: 'daily',
      reminderText: 'Set yourself up for success',
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
      reminderTime: '09:00',
      reminderFrequency: 'daily',
      reminderText: 'One step at a time',
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
      reminderTime: '10:00',
      reminderFrequency: 'daily',
      reminderText: 'Deep work mode',
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
      reminderTime: '17:00',
      reminderFrequency: 'daily',
      reminderText: 'Clear the inbox',
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
      reminderTime: '20:00',
      reminderFrequency: 'daily',
      reminderText: 'Check in with your goals',
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
      reminderTime: '19:00',
      reminderFrequency: 'daily',
      reminderText: 'Time to level up',
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
      reminderTime: '19:00',
      reminderFrequency: 'daily',
      reminderText: 'Someone would love to hear from you',
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
      reminderTime: '10:00',
      reminderFrequency: 'daily',
      reminderText: 'A tidy space, a clear mind',
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
      reminderTime: '18:00',
      reminderFrequency: 'daily',
      reminderText: 'Make some music',
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
      reminderTime: '07:00',
      reminderFrequency: 'daily',
      reminderText: 'Start the day right',
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
      reminderTime: '21:00',
      reminderFrequency: 'daily',
      reminderText: 'Take care of yourself',
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
      reminderTime: '20:00',
      reminderFrequency: 'daily',
      reminderText: 'Quick money check-in',
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
      reminderTime: '18:00',
      reminderFrequency: 'daily',
      reminderText: 'Clear head tonight',
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
      reminderTime: '18:00',
      reminderFrequency: 'daily',
      reminderText: 'Time to cook something good',
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
      reminderTime: '09:00',
      reminderFrequency: 'daily',
      reminderText: 'Breathe easy today',
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
      reminderTime: '18:00',
      reminderFrequency: 'daily',
      reminderText: 'Stay sharp',
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
      reminderTime: '21:00',
      reminderFrequency: 'daily',
      reminderText: 'Stay focused',
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
      reminderTime: '19:00',
      reminderFrequency: 'daily',
      reminderText: 'Reach out to someone',
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
      reminderTime: '19:00',
      reminderFrequency: 'daily',
      reminderText: 'Connection time',
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
