/**
 * Template Habits Type Definitions
 */

import { IconName } from '../components/common/Icon';

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
  tags: string[];
  suggestedSettings: {
    reminderTime?: string;
    reminderFrequency?: 'daily' | 'weekly';
    streakEnabled: boolean;
    streakSkipWeekends?: boolean;
    streakMinimumCount?: number;
  };
}

/**
 * Template catalog modal props
 */
export interface TemplateCatalogModalProps {
  visible: boolean;
  onClose: () => void;
  /** Called when user taps "Customize" - opens EditHabit with template */
  onSelectTemplate: (template: HabitTemplate) => void;
  /** Called when user taps "Add Habit" - adds directly without EditHabit */
  onQuickAdd?: (template: HabitTemplate) => void;
}

/**
 * Template card props
 */
export interface TemplateCardProps {
  template: HabitTemplate;
  onPress: (template: HabitTemplate) => void;
  isSelected?: boolean;
}

/**
 * Template preview props
 */
export interface TemplatePreviewProps {
  template: HabitTemplate;
  onCustomize: () => void;
  onQuickAdd: () => void;
  onClose: () => void;
  /** When true, hides the header (used when embedded in parent modal) */
  embedded?: boolean;
}

/**
 * Category tabs props
 */
export interface CategoryTabsProps {
  categories: CategoryInfo[];
  selectedCategory: TemplateCategory | 'all';
  onSelectCategory: (category: TemplateCategory | 'all') => void;
}
