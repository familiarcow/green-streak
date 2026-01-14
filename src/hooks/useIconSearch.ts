/**
 * useIconSearch Hook
 *
 * Provides search and filter functionality for icons in the icon picker.
 * Includes 300ms debouncing for search queries to improve performance.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { IconName } from '../components/common/Icon';
import { PICKER_ICONS, ICON_CATEGORY_MAP } from '../data/iconCategories';

interface UseIconSearchReturn {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  filteredIcons: IconName[];
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

const DEBOUNCE_MS = 300;

export const useIconSearch = (): UseIconSearchReturn => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
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

  const filteredIcons = useMemo(() => {
    let icons = PICKER_ICONS;

    // Filter by category
    if (selectedCategory !== 'all') {
      icons = icons.filter((icon) => ICON_CATEGORY_MAP[icon] === selectedCategory);
    }

    // Filter by debounced search query
    const lowerQuery = debouncedQuery.toLowerCase().trim();
    if (lowerQuery) {
      icons = icons.filter((icon) => {
        // Match against icon name (convert kebab-case to spaces for matching)
        const iconName = icon.replace(/-/g, ' ').toLowerCase();
        return iconName.includes(lowerQuery);
      });
    }

    return icons;
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
    filteredIcons,
    clearFilters,
    hasActiveFilters,
  };
};

export default useIconSearch;
