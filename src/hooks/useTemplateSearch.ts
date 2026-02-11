/**
 * useTemplateSearch Hook
 *
 * Provides search and filter functionality for habit templates.
 * Includes 300ms debouncing for search queries to improve performance.
 * Templates are automatically sorted by relevance to user's selected goals.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { HabitTemplate, TemplateCategory, PreviewGoals } from '../types/templates';
import { GoalId } from '../types/goals';
import { HABIT_TEMPLATES } from '../data/habitTemplates';
import { useGoalsStore } from '../store/goalsStore';
import { sortTemplatesByGoals, getOrderedUserGoals } from '../services/TemplateSortingService';

interface UseTemplateSearchOptions {
  /** Goals to use for sorting preview (onboarding mode) - bypasses store */
  previewGoals?: PreviewGoals;
}

interface UseTemplateSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: TemplateCategory | 'all';
  setSelectedCategory: (category: TemplateCategory | 'all') => void;
  filteredTemplates: HabitTemplate[];
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

const DEBOUNCE_MS = 300;

export const useTemplateSearch = (options?: UseTemplateSearchOptions): UseTemplateSearchReturn => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAttemptedLoad = useRef(false);

  // Get user's goals for personalized sorting (only used when not in preview mode)
  const { goals, primaryGoal, loading: goalsLoading, loadGoals } = useGoalsStore();

  // Load goals on mount if not in preview mode and not already loaded
  useEffect(() => {
    // Skip if using preview goals (onboarding mode)
    if (options?.previewGoals) {
      return;
    }
    // Only attempt load once to prevent infinite loop when user has no goals
    if (!hasAttemptedLoad.current && goals.length === 0 && !goalsLoading) {
      hasAttemptedLoad.current = true;
      loadGoals();
    }
  }, [options?.previewGoals, goals.length, goalsLoading, loadGoals]);

  // Debounce search query
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Extract goal IDs - use preview goals if provided (onboarding), otherwise use store
  const selectedGoalIds = useMemo(() => {
    if (options?.previewGoals) {
      return options.previewGoals.selectedGoalIds;
    }
    return goals.map((g) => g.goalId);
  }, [options?.previewGoals, goals]);

  const primaryGoalId = options?.previewGoals?.primaryGoalId ?? (primaryGoal?.goalId ?? null);

  // Pre-sort templates by user's goals (memoized, only changes when goals change)
  const sortedTemplates = useMemo(() => {
    // Don't sort while goals are loading (unless using preview goals)
    if (!options?.previewGoals && goalsLoading) {
      return HABIT_TEMPLATES;
    }

    const orderedGoals = getOrderedUserGoals(selectedGoalIds, primaryGoalId);
    return sortTemplatesByGoals(HABIT_TEMPLATES, orderedGoals as GoalId[]);
  }, [options?.previewGoals, selectedGoalIds, primaryGoalId, goalsLoading]);

  const filteredTemplates = useMemo(() => {
    let templates = sortedTemplates;

    // Filter by category (after sorting to maintain goal-based order within category)
    if (selectedCategory !== 'all') {
      templates = templates.filter((template) => template.category === selectedCategory);
    }

    // Filter by debounced search query
    const lowerQuery = debouncedQuery.toLowerCase().trim();
    if (lowerQuery) {
      templates = templates.filter(
        (template) =>
          template.name.toLowerCase().includes(lowerQuery) ||
          template.description.toLowerCase().includes(lowerQuery) ||
          template.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
      );
    }

    return templates;
  }, [sortedTemplates, debouncedQuery, selectedCategory]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    setSelectedCategory('all');
  }, []);

  const hasActiveFilters = searchQuery.length > 0 || selectedCategory !== 'all';

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredTemplates,
    clearFilters,
    hasActiveFilters,
  };
};

export default useTemplateSearch;
