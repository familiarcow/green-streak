import { useMemo } from 'react';
import { useSettingsStore, DEFAULT_CALENDAR_COLOR } from '../store/settingsStore';
import {
  generateContributionPalette,
  ContributionColorPalette,
  DEFAULT_CONTRIBUTION_PALETTE,
} from '../utils/colorUtils';

/**
 * Hook to get the calendar color palette based on user settings
 * Returns a memoized palette that updates when calendarColor setting changes
 */
export const useCalendarColors = (): ContributionColorPalette => {
  const calendarColor = useSettingsStore((state) => state.calendarColor);

  return useMemo(() => {
    const color = calendarColor || DEFAULT_CALENDAR_COLOR;

    // Use default green palette for the default color
    if (color === DEFAULT_CALENDAR_COLOR) {
      return DEFAULT_CONTRIBUTION_PALETTE;
    }

    // Generate a custom palette from the selected color
    return generateContributionPalette(color);
  }, [calendarColor]);
};
