/**
 * Dynamic Icon Service
 *
 * Manages dynamic app icon switching based on user activity.
 * Shows a 2x2 grid representing the last 4 days of activity.
 *
 * Icon naming: icon_XXXX where X is 0 (no activity) or 1 (activity)
 * Position mapping:
 * - Index 0 = top-left (4 days ago)
 * - Index 1 = top-right (3 days ago)
 * - Index 2 = bottom-left (2 days ago)
 * - Index 3 = bottom-right (yesterday)
 *
 * Platform Notes:
 * - iOS: Fully supported since iOS 10.3. May show brief alert on icon change.
 * - Android: Uses activity-alias workaround. Less reliable, may require app restart.
 * - Expo Go: NOT SUPPORTED. Requires development build with native code.
 */

import { setAppIcon, getAppIcon } from 'expo-dynamic-app-icon';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getDataService } from './ServiceRegistry';
import { formatDateString } from '../utils/dateHelpers';
import logger from '../utils/logger';

// Icon name format: icon_XXXX where X is 0 or 1
type IconPattern = `icon_${'0' | '1'}${'0' | '1'}${'0' | '1'}${'0' | '1'}`;

// Debounce delay in milliseconds
const DEBOUNCE_DELAY = 500;

// Cache TTL in milliseconds (1 hour)
// After this time, the cache is considered stale and will be re-validated
const CACHE_TTL = 60 * 60 * 1000;

class DynamicIconService {
  private static instance: DynamicIconService;

  // Cache the current pattern to avoid unnecessary native calls
  private cachedPattern: string | null = null;

  // Timestamp when the cache was last set
  private cacheTimestamp: number | null = null;

  // Debounce timer for rapid updates
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Pending update promise for debounced calls
  private pendingUpdate: Promise<boolean> | null = null;

  // Resolve function for the pending promise (allows resetting timer while sharing promise)
  private pendingResolve: ((value: boolean) => void) | null = null;

  private constructor() {}

  static getInstance(): DynamicIconService {
    if (!DynamicIconService.instance) {
      DynamicIconService.instance = new DynamicIconService();
    }
    return DynamicIconService.instance;
  }

  /**
   * Check if dynamic icons are supported in the current environment
   * Returns false for Expo Go (which doesn't have native code)
   */
  isSupported(): boolean {
    // Expo Go doesn't support native modules like expo-dynamic-app-icon
    // appOwnership is 'expo' in Expo Go, 'standalone' or null in dev builds
    const isExpoGo = Constants.appOwnership === 'expo';

    if (isExpoGo) {
      logger.debug('SERVICE', 'Dynamic icons not supported in Expo Go');
      return false;
    }

    return true;
  }

  /**
   * Check if we're running on iOS (where dynamic icons work best)
   */
  isIOSPlatform(): boolean {
    return Platform.OS === 'ios';
  }

  /**
   * Get platform-specific notes for the UI
   */
  getPlatformNotes(): string | null {
    if (!this.isSupported()) {
      return 'Dynamic icons require a development build (not available in Expo Go)';
    }

    if (Platform.OS === 'android') {
      return 'On Android, icon changes may require an app restart to take effect';
    }

    return null;
  }

  /**
   * Get the last 4 days as date strings (excluding today)
   * Returns [4 days ago, 3 days ago, 2 days ago, yesterday]
   */
  private getLast4Days(): string[] {
    const dates: string[] = [];
    const today = new Date();

    for (let i = 4; i >= 1; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(formatDateString(date));
    }

    return dates;
  }

  /**
   * Convert activity data to binary pattern string
   * @param activityCounts Array of 4 activity counts (oldest to newest)
   * @returns Binary pattern like "1010"
   */
  private getPatternFromActivity(activityCounts: number[]): string {
    return activityCounts
      .map(count => (count > 0 ? '1' : '0'))
      .join('');
  }

  /**
   * Get the icon name for a given binary pattern
   */
  private getIconName(pattern: string): IconPattern {
    return `icon_${pattern}` as IconPattern;
  }

  /**
   * Update the app icon based on the last 4 days of activity
   * Includes debouncing to prevent rapid successive updates.
   * Each call resets the debounce timer while all callers share the same promise.
   */
  async updateIconFromActivity(): Promise<boolean> {
    // Check if supported first
    if (!this.isSupported()) {
      logger.debug('SERVICE', 'Skipping icon update - not supported in this environment');
      return false;
    }

    // Always clear existing timer (reset the debounce window)
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // If there's already a pending promise, reuse it but reset the timer
    if (!this.pendingUpdate) {
      // Create new promise and store the resolve function
      this.pendingUpdate = new Promise<boolean>((resolve) => {
        this.pendingResolve = resolve;
      });
    }

    // Start a new timer (this resets on each call)
    this.debounceTimer = setTimeout(async () => {
      const resolve = this.pendingResolve;

      try {
        const result = await this.performIconUpdate();

        // Clean up state before resolving
        this.pendingUpdate = null;
        this.pendingResolve = null;
        this.debounceTimer = null;

        resolve?.(result);
      } catch (error) {
        logger.error('SERVICE', 'Error in debounced icon update', { error });

        // Clean up state before resolving
        this.pendingUpdate = null;
        this.pendingResolve = null;
        this.debounceTimer = null;

        resolve?.(false);
      }
    }, DEBOUNCE_DELAY);

    return this.pendingUpdate;
  }

  /**
   * Perform the actual icon update (called after debounce)
   */
  private async performIconUpdate(): Promise<boolean> {
    try {
      logger.debug('SERVICE', 'Updating dynamic app icon');

      // Get the last 4 days
      const dates = this.getLast4Days();
      logger.debug('SERVICE', 'Fetching activity for dates', { dates });

      // Get contribution data for those dates
      const dataService = getDataService();
      const contributionData = await dataService.getContributionData(dates);

      // Map dates to activity counts (in order: oldest to newest)
      const activityCounts = dates.map(date => {
        const dayData = contributionData.find(d => d.date === date);
        return dayData?.count ?? 0;
      });

      logger.debug('SERVICE', 'Activity counts', { activityCounts });

      // Convert to pattern and icon name
      const pattern = this.getPatternFromActivity(activityCounts);

      // Check if pattern has changed and cache is still valid
      const isCacheValid = this.cachedPattern !== null &&
        this.cacheTimestamp !== null &&
        (Date.now() - this.cacheTimestamp) < CACHE_TTL;

      if (pattern === this.cachedPattern && isCacheValid) {
        logger.debug('SERVICE', 'Icon pattern unchanged and cache valid, skipping native call', { pattern });
        return true;
      }

      if (pattern === this.cachedPattern && !isCacheValid) {
        logger.debug('SERVICE', 'Cache expired, will re-validate icon', { pattern });
      }

      const iconName = this.getIconName(pattern);

      logger.info('SERVICE', 'Setting dynamic icon', { pattern, iconName });

      // Set the icon
      const result = setAppIcon(iconName);

      if (result === false) {
        logger.error('SERVICE', 'Failed to set app icon', { iconName });
        return false;
      }

      // Update cache on success with timestamp
      this.cachedPattern = pattern;
      this.cacheTimestamp = Date.now();

      logger.info('SERVICE', 'Dynamic icon updated successfully', { iconName });
      return true;
    } catch (error) {
      logger.error('SERVICE', 'Error updating dynamic icon', { error });
      return false;
    }
  }

  /**
   * Reset the app icon to the default (static 3x3 icon)
   */
  async resetToDefault(): Promise<boolean> {
    // Check if supported first
    if (!this.isSupported()) {
      logger.debug('SERVICE', 'Skipping icon reset - not supported in this environment');
      return false;
    }

    try {
      logger.debug('SERVICE', 'Resetting app icon to default');

      // Clear any pending debounced updates
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }
      this.pendingUpdate = null;
      this.pendingResolve = null;

      // Setting to null resets to default icon
      // Note: The library expects a string, but null/undefined triggers default
      const result = setAppIcon(null as unknown as string);

      if (result === false) {
        logger.error('SERVICE', 'Failed to reset app icon to default');
        return false;
      }

      // Clear the cache
      this.cachedPattern = null;
      this.cacheTimestamp = null;

      logger.info('SERVICE', 'App icon reset to default');
      return true;
    } catch (error) {
      logger.error('SERVICE', 'Error resetting app icon', { error });
      return false;
    }
  }

  /**
   * Get the current app icon name
   */
  getCurrentIcon(): string {
    if (!this.isSupported()) {
      return 'DEFAULT';
    }

    try {
      return getAppIcon();
    } catch (error) {
      logger.error('SERVICE', 'Error getting current icon', { error });
      return 'DEFAULT';
    }
  }

  /**
   * Check if a specific pattern icon is currently set
   */
  isPatternIconSet(pattern: string): boolean {
    if (!this.isSupported()) {
      return false;
    }

    const currentIcon = this.getCurrentIcon();
    return currentIcon === this.getIconName(pattern);
  }

  /**
   * Clear the cached pattern (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cachedPattern = null;
    this.cacheTimestamp = null;
    logger.debug('SERVICE', 'Dynamic icon cache cleared');
  }

  /**
   * Cleanup resources (for lifecycle management)
   * Call this when the service is being destroyed or the app is shutting down
   */
  cleanup(): void {
    logger.debug('SERVICE', 'Cleaning up DynamicIconService');

    // Clear debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    // Clear pending promises
    this.pendingUpdate = null;
    this.pendingResolve = null;

    // Clear cache
    this.cachedPattern = null;
    this.cacheTimestamp = null;

    logger.info('SERVICE', 'DynamicIconService cleaned up');
  }

  /**
   * Get service health status (for ServiceRegistry health checks)
   */
  getHealthStatus(): {
    isHealthy: boolean;
    isSupported: boolean;
    cachedPattern: string | null;
    cacheAgeMs: number | null;
    isCacheValid: boolean;
    hasPendingUpdate: boolean;
  } {
    const cacheAgeMs = this.cacheTimestamp ? Date.now() - this.cacheTimestamp : null;
    const isCacheValid = cacheAgeMs !== null && cacheAgeMs < CACHE_TTL;

    return {
      isHealthy: true,
      isSupported: this.isSupported(),
      cachedPattern: this.cachedPattern,
      cacheAgeMs,
      isCacheValid,
      hasPendingUpdate: this.pendingUpdate !== null,
    };
  }
}

// Export singleton instance
export const dynamicIconService = DynamicIconService.getInstance();

// Export class for testing
export { DynamicIconService };
