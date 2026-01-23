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
    id: 'exercise-morning',
    name: 'Morning Exercise',
    description: 'Start your day with physical activity to boost energy and mood',
    icon: 'dumbbell',
    color: COLORS.green,
    category: 'health-fitness',
    tags: ['exercise', 'morning', 'workout', 'fitness', 'health'],
    suggestedSettings: {
      reminderTime: '07:00',
      reminderFrequency: 'daily',
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'drink-water',
    name: 'Drink Water',
    description: 'Stay hydrated by drinking at least 8 glasses of water daily',
    icon: 'droplet',
    color: COLORS.blue,
    category: 'health-fitness',
    tags: ['water', 'hydration', 'health', 'drink'],
    suggestedSettings: {
      reminderTime: '09:00',
      reminderFrequency: 'daily',
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'take-vitamins',
    name: 'Take Vitamins',
    description: 'Remember to take your daily vitamins and supplements',
    icon: 'pill',
    color: COLORS.amber,
    category: 'health-fitness',
    tags: ['vitamins', 'supplements', 'health', 'medicine'],
    suggestedSettings: {
      reminderTime: '08:00',
      reminderFrequency: 'daily',
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'evening-walk',
    name: 'Evening Walk',
    description: 'Wind down with a relaxing walk after your day',
    icon: 'footprints',
    color: COLORS.teal,
    category: 'health-fitness',
    tags: ['walk', 'evening', 'exercise', 'outdoors', 'relax'],
    suggestedSettings: {
      reminderTime: '18:00',
      reminderFrequency: 'daily',
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'stretching',
    name: 'Stretching',
    description: 'Keep your body flexible with daily stretching exercises',
    icon: 'activity',
    color: COLORS.violet,
    category: 'health-fitness',
    tags: ['stretch', 'flexibility', 'exercise', 'yoga', 'mobility'],
    suggestedSettings: {
      reminderTime: '07:30',
      reminderFrequency: 'daily',
      streakEnabled: true,
      streakSkipWeekends: true,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'healthy-eating',
    name: 'Eat Healthy',
    description: 'Make conscious choices about your food intake',
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
    id: 'sleep-8-hours',
    name: 'Sleep 8 Hours',
    description: 'Get adequate rest for better health and productivity',
    icon: 'moon',
    color: COLORS.gray,
    category: 'health-fitness',
    tags: ['sleep', 'rest', 'health', 'recovery', 'night'],
    suggestedSettings: {
      reminderTime: '22:00',
      reminderFrequency: 'daily',
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'no-junk-food',
    name: 'No Junk Food',
    description: 'Avoid unhealthy snacks and processed foods',
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
    id: 'morning-meditation',
    name: 'Morning Meditation',
    description: 'Start your day with 10 minutes of calm and clarity',
    icon: 'brain',
    color: COLORS.violet,
    category: 'mindfulness',
    tags: ['meditation', 'morning', 'mindfulness', 'calm', 'focus'],
    suggestedSettings: {
      reminderTime: '06:30',
      reminderFrequency: 'daily',
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'gratitude-journal',
    name: 'Gratitude Journal',
    description: 'Write down 3 things you are grateful for today',
    icon: 'fileText',
    color: COLORS.amber,
    category: 'mindfulness',
    tags: ['gratitude', 'journal', 'writing', 'positivity', 'reflection'],
    suggestedSettings: {
      reminderTime: '21:00',
      reminderFrequency: 'daily',
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'deep-breathing',
    name: 'Deep Breathing',
    description: 'Practice mindful breathing exercises to reduce stress',
    icon: 'activity',
    color: COLORS.cyan,
    category: 'mindfulness',
    tags: ['breathing', 'stress', 'relax', 'mindfulness', 'calm'],
    suggestedSettings: {
      reminderTime: '12:00',
      reminderFrequency: 'daily',
      streakEnabled: true,
      streakSkipWeekends: true,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'digital-detox',
    name: 'Digital Detox',
    description: 'Take a break from screens and digital devices',
    icon: 'phone',
    color: COLORS.gray,
    category: 'mindfulness',
    tags: ['digital', 'screen', 'detox', 'break', 'technology'],
    suggestedSettings: {
      reminderTime: '20:00',
      reminderFrequency: 'daily',
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'evening-reflection',
    name: 'Evening Reflection',
    description: 'Review your day mindfully before sleep',
    icon: 'moon',
    color: COLORS.blue,
    category: 'mindfulness',
    tags: ['reflection', 'evening', 'review', 'mindfulness', 'night'],
    suggestedSettings: {
      reminderTime: '21:30',
      reminderFrequency: 'daily',
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'mindful-walk',
    name: 'Mindful Walk',
    description: 'Walk with full awareness of your surroundings',
    icon: 'footprints',
    color: COLORS.green,
    category: 'mindfulness',
    tags: ['walk', 'mindfulness', 'outdoors', 'awareness', 'nature'],
    suggestedSettings: {
      reminderTime: '17:00',
      reminderFrequency: 'daily',
      streakEnabled: true,
      streakSkipWeekends: true,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'no-social-media',
    name: 'No Social Media',
    description: 'Limit social media usage to improve mental well-being',
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
    description: 'Say something positive to yourself every day',
    icon: 'heart',
    color: COLORS.pink,
    category: 'mindfulness',
    tags: ['affirmation', 'positive', 'self-care', 'motivation', 'mindset'],
    suggestedSettings: {
      reminderTime: '07:00',
      reminderFrequency: 'daily',
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },

  // ============================================
  // PRODUCTIVITY (8 templates)
  // ============================================
  {
    id: 'read-30-minutes',
    name: 'Read 30 Minutes',
    description: 'Expand your knowledge with daily reading',
    icon: 'book',
    color: COLORS.blue,
    category: 'productivity',
    tags: ['reading', 'books', 'learning', 'knowledge', 'education'],
    suggestedSettings: {
      reminderTime: '21:00',
      reminderFrequency: 'daily',
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'learn-something-new',
    name: 'Learn Something New',
    description: 'Dedicate time to picking up a new skill or topic',
    icon: 'graduation',
    color: COLORS.violet,
    category: 'productivity',
    tags: ['learning', 'skill', 'education', 'growth', 'development'],
    suggestedSettings: {
      reminderTime: '19:00',
      reminderFrequency: 'daily',
      streakEnabled: true,
      streakSkipWeekends: true,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'plan-tomorrow',
    name: 'Plan Tomorrow',
    description: 'Prepare for the next day by planning your tasks',
    icon: 'calendar',
    color: COLORS.amber,
    category: 'productivity',
    tags: ['planning', 'tasks', 'organization', 'productivity', 'tomorrow'],
    suggestedSettings: {
      reminderTime: '21:00',
      reminderFrequency: 'daily',
      streakEnabled: true,
      streakSkipWeekends: true,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'no-procrastination',
    name: 'No Procrastination',
    description: 'Complete your most important task without delay',
    icon: 'zap',
    color: COLORS.red,
    category: 'productivity',
    tags: ['procrastination', 'focus', 'productivity', 'tasks', 'action'],
    suggestedSettings: {
      reminderTime: '09:00',
      reminderFrequency: 'daily',
      streakEnabled: true,
      streakSkipWeekends: true,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'focus-time',
    name: 'Focus Time',
    description: 'Dedicate 2 hours to deep, uninterrupted work',
    icon: 'target',
    color: COLORS.green,
    category: 'productivity',
    tags: ['focus', 'deep work', 'concentration', 'productivity', 'work'],
    suggestedSettings: {
      reminderTime: '10:00',
      reminderFrequency: 'daily',
      streakEnabled: true,
      streakSkipWeekends: true,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'inbox-zero',
    name: 'Inbox Zero',
    description: 'Clear your email inbox by end of day',
    icon: 'fileText',
    color: COLORS.cyan,
    category: 'productivity',
    tags: ['email', 'inbox', 'organization', 'productivity', 'communication'],
    suggestedSettings: {
      reminderTime: '17:00',
      reminderFrequency: 'daily',
      streakEnabled: true,
      streakSkipWeekends: true,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'review-goals',
    name: 'Review Goals',
    description: 'Track progress on your personal and professional goals',
    icon: 'checkCircle',
    color: COLORS.teal,
    category: 'productivity',
    tags: ['goals', 'review', 'progress', 'tracking', 'achievement'],
    suggestedSettings: {
      reminderTime: '20:00',
      reminderFrequency: 'weekly',
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'practice-skill',
    name: 'Practice Skill',
    description: 'Dedicate time to improving a specific skill',
    icon: 'brain',
    color: COLORS.purple,
    category: 'productivity',
    tags: ['practice', 'skill', 'improvement', 'mastery', 'learning'],
    suggestedSettings: {
      reminderTime: '18:00',
      reminderFrequency: 'daily',
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
    description: 'Stay connected with your loved ones',
    icon: 'phone',
    color: COLORS.pink,
    category: 'lifestyle',
    tags: ['family', 'call', 'connection', 'relationships', 'communication'],
    suggestedSettings: {
      reminderTime: '19:00',
      reminderFrequency: 'weekly',
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'clean-room',
    name: 'Clean Room',
    description: 'Maintain a tidy and organized living space',
    icon: 'broom',
    color: COLORS.lime,
    category: 'lifestyle',
    tags: ['cleaning', 'organization', 'home', 'tidy', 'space'],
    suggestedSettings: {
      reminderTime: '10:00',
      reminderFrequency: 'daily',
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'practice-music',
    name: 'Practice Music',
    description: 'Keep your musical skills sharp with daily practice',
    icon: 'music',
    color: COLORS.purple,
    category: 'lifestyle',
    tags: ['music', 'practice', 'instrument', 'hobby', 'creativity'],
    suggestedSettings: {
      reminderTime: '18:00',
      reminderFrequency: 'daily',
      streakEnabled: true,
      streakSkipWeekends: true,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'morning-routine',
    name: 'Morning Routine',
    description: 'Complete your morning ritual for a productive day',
    icon: 'sun',
    color: COLORS.amber,
    category: 'lifestyle',
    tags: ['morning', 'routine', 'ritual', 'start', 'day'],
    suggestedSettings: {
      reminderTime: '07:00',
      reminderFrequency: 'daily',
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'skincare-routine',
    name: 'Skincare Routine',
    description: 'Take care of your skin with a consistent routine',
    icon: 'heart',
    color: COLORS.pink,
    category: 'lifestyle',
    tags: ['skincare', 'routine', 'self-care', 'beauty', 'health'],
    suggestedSettings: {
      reminderTime: '21:30',
      reminderFrequency: 'daily',
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'budget-check',
    name: 'Budget Check',
    description: 'Review your daily spending and stay on budget',
    icon: 'fileText',
    color: COLORS.green,
    category: 'lifestyle',
    tags: ['budget', 'money', 'finance', 'spending', 'tracking'],
    suggestedSettings: {
      reminderTime: '20:00',
      reminderFrequency: 'daily',
      streakEnabled: true,
      streakSkipWeekends: true,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'no-alcohol',
    name: 'No Alcohol',
    description: 'Stay sober and maintain a healthy lifestyle',
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
    description: 'Prepare your own meals for better health and savings',
    icon: 'apple',
    color: COLORS.orange,
    category: 'lifestyle',
    tags: ['cooking', 'food', 'home', 'health', 'savings'],
    suggestedSettings: {
      reminderTime: '17:00',
      reminderFrequency: 'daily',
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'no-smoking',
    name: 'No Smoking',
    description: 'Stay smoke-free and improve your health',
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
    description: 'Stay clean and maintain a healthy lifestyle',
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
    id: 'no-porn',
    name: 'No Porn',
    description: 'Break free from pornography for better mental health',
    icon: 'lock',
    color: COLORS.red,
    category: 'lifestyle',
    tags: ['porn', 'quit', 'health', 'stop', 'nofap', 'mental health'],
    suggestedSettings: {
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'call-friend',
    name: 'Call a Friend',
    description: 'Stay connected with friends through regular calls',
    icon: 'phone',
    color: COLORS.cyan,
    category: 'lifestyle',
    tags: ['friend', 'call', 'connection', 'social', 'relationships'],
    suggestedSettings: {
      reminderTime: '18:00',
      reminderFrequency: 'weekly',
      streakEnabled: true,
      streakSkipWeekends: false,
      streakMinimumCount: 1,
    },
  },
  {
    id: 'talk-with-someone',
    name: 'Talk with Someone',
    description: 'Have a meaningful conversation with another person',
    icon: 'message-circle',
    color: COLORS.blue,
    category: 'lifestyle',
    tags: ['talk', 'conversation', 'social', 'connection', 'communication'],
    suggestedSettings: {
      reminderTime: '19:00',
      reminderFrequency: 'daily',
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
