import { useSettingsStore, DEFAULT_CALENDAR_COLOR } from '../store/settingsStore';

/**
 * Hook to get the app's accent color based on user's calendar color setting.
 * Returns the calendar color or falls back to the default green.
 */
export const useAccentColor = (): string => {
  const calendarColor = useSettingsStore((state) => state.calendarColor);
  return calendarColor || DEFAULT_CALENDAR_COLOR;
};
