/**
 * Time formatting utilities for 12h/24h display conversion.
 * All internal time data stays in 24h "HH:MM" format.
 * These helpers convert to/from 12h format for display and input.
 */

/**
 * Format a 24h time string for display based on user preference.
 * @param time24h - Time in "HH:MM" format (24h)
 * @param use24Hour - Whether to display in 24h format
 * @returns Formatted time string (e.g., "2:00 PM" or "14:00")
 */
export const formatTimeDisplay = (
  time24h: string,
  use24Hour: boolean
): string => {
  const [hours, minutes] = time24h.split(':').map(Number);

  if (use24Hour) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  const hour12 = hours % 12 || 12;
  const ampm = hours < 12 ? 'AM' : 'PM';
  return `${hour12}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

/**
 * Convert 12h time components to 24h format string.
 * @param hour12 - Hour in 12h format (1-12)
 * @param minutes - Minutes (0-59)
 * @param isPM - Whether it's PM
 * @returns Time in "HH:MM" format (24h)
 */
export const convert12hTo24h = (
  hour12: number,
  minutes: number,
  isPM: boolean
): string => {
  let hour24 = hour12;
  if (isPM && hour12 !== 12) {
    hour24 += 12;
  }
  if (!isPM && hour12 === 12) {
    hour24 = 0;
  }
  return `${hour24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Parse a 24h time string into 12h components.
 * @param time24h - Time in "HH:MM" format (24h)
 * @returns Object with hour12 (1-12), minutes, and isPM
 */
export const parse24hTime = (time24h: string): { hour12: number; minutes: number; isPM: boolean } => {
  const [hours, minutes] = time24h.split(':').map(Number);
  const isPM = hours >= 12;
  const hour12 = hours % 12 || 12;
  return { hour12, minutes, isPM };
};

/**
 * Get the time of day period for an icon.
 * @param time24h - Time in "HH:MM" format (24h)
 * @returns 'morning' | 'noon' | 'evening'
 */
export const getTimeOfDay = (time24h: string): 'morning' | 'noon' | 'evening' => {
  const hour = parseInt(time24h.split(':')[0], 10);
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'noon';
  return 'evening';
};
