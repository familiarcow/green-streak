/**
 * useTemplateSearch Hook
 *
 * Provides search and filter functionality for habit templates.
 * Includes 300ms debouncing for search queries to improve performance.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { HabitTemplate, TemplateCategory } from '../types/templates';
import { HABIT_TEMPLATES } from '../data/habitTemplates';

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

export const useTemplateSearch = (): UseTemplateSearchReturn => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const filteredTemplates = useMemo(() => {
    let templates = HABIT_TEMPLATES;

    // Filter by category
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
  }, [debouncedQuery, selectedCategory]);

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
