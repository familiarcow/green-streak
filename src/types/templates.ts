/**
 * Template Habits Type Definitions
 */

import { IconName } from '../components/common/Icon';
import { GoalId } from './goals';

/**
 * Template category types
 */
export type TemplateCategory =
  | 'health-fitness'
  | 'mindfulness'
  | 'productivity'
  | 'lifestyle';

/**
 * Category metadata for display
 */
export interface CategoryInfo {
  id: TemplateCategory;
  name: string;
  icon: IconName;
  color: string;
}

/**
 * Habit template structure
 */
export interface HabitTemplate {
  id: string;
  name: string;
  description: string;
  icon: IconName;
  color: string;
  category: TemplateCategory;
  /** Goals this habit supports - used for personalized sorting */
  goalIds: GoalId[];
  tags: string[];
  suggestedSettings: {
    reminderTime?: string;
    reminderFrequency?: 'daily' | 'weekly';
    reminderText?: string;
    streakEnabled: boolean;
    streakSkipWeekends?: boolean;
    streakMinimumCount?: number;
  };
}

/**
 * Preview goals for sorting during onboarding (before goals are saved to DB)
 */
export interface PreviewGoals {
  selectedGoalIds: string[];
  primaryGoalId: string | null;
}

/**
 * Template catalog modal props
 */
export interface TemplateCatalogModalProps {
  visible: boolean;
  onClose: () => void;
  /** Called after modal close animation completes - use to safely unmount parent */
  onCloseComplete?: () => void;
  /** Called when user selects a template - opens EditHabit with template data */
  onSelectTemplate: (template: HabitTemplate) => void;
  /** Preview goals for sorting during onboarding (bypasses store) */
  previewGoals?: PreviewGoals;
}

/**
 * Template card props
 */
export interface TemplateCardProps {
  template: HabitTemplate;
  onPress: (template: HabitTemplate) => void;
}

/**
 * Category tabs props
 */
export interface CategoryTabsProps {
  categories: CategoryInfo[];
  selectedCategory: TemplateCategory | 'all';
  onSelectCategory: (category: TemplateCategory | 'all') => void;
}
