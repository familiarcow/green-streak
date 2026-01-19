/**
 * WidgetDataService
 *
 * Manages synchronization of app data to iOS widgets via the native WidgetBridge module.
 * Subscribes to store changes and debounces sync operations to avoid excessive widget refreshes.
 */

import { NativeModules, Platform } from 'react-native';
import { useTasksStore } from '../store/tasksStore';
import { useLogsStore } from '../store/logsStore';
import { useStreaksStore } from '../store/streaksStore';
import { useSettingsStore } from '../store/settingsStore';
import { generateContributionPalette, DEFAULT_CONTRIBUTION_PALETTE } from '../utils/colorUtils';
import logger from '../utils/logger';

const { WidgetBridge } = NativeModules;

// Widget data schema version for migrations
const WIDGET_DATA_VERSION = 1;

/**
 * Data structure synced to the widget extension
 */
export interface WidgetSyncData {
  version: number;
  lastUpdated: string;

  contributionData: {
    dates: Array<{
      date: string;
      count: number;
      level: 0 | 1 | 2 | 3 | 4;
    }>;
    maxCount: number;
    palette: {
      empty: string;
      level1: string;
      level2: string;
      level3: string;
      level4: string;
    };
  };

  tasks: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    todayCount: number;
    currentStreak: number;
    bestStreak: number;
    isMultiCompletion: boolean;
    isArchived: boolean;
    sortOrder: number;
    streakEnabled: boolean;
  }>;

  quickAddConfig: {
    singleTaskId: string | null;
    multiTaskIds: string[];
  };

  pendingActions: Array<{
    id: string;
    type: 'quick_add' | 'quick_remove';
    taskId: string;
    date: string;
    timestamp: string;
    processed: boolean;
  }>;
}

/**
 * Calculate the contribution level (0-4) based on count
 */
function calculateLevel(count: number, maxCount: number): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;

  const intensity = Math.min(count / Math.max(maxCount, 1), 1);

  if (intensity <= 0.25) return 1;
  if (intensity <= 0.5) return 2;
  if (intensity <= 0.75) return 3;
  return 4;
}

/**
 * Get today's date string in YYYY-MM-DD format
 */
function getTodayString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * WidgetDataService class
 *
 * Manages widget data synchronization as a class (not a hook) for
 * easier lifecycle management and service registry integration.
 */
export class WidgetDataService {
  private unsubscribers: Array<() => void> = [];
  private syncTimeout: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private lastSyncData: string | null = null;

  // Debounce interval in milliseconds
  private readonly DEBOUNCE_MS = 500;

  /**
   * Check if widgets are supported on this platform
   */
  isSupported(): boolean {
    return Platform.OS === 'ios' && WidgetBridge != null;
  }

  /**
   * Initialize the service and start listening to store changes
   */
  initialize(): void {
    if (this.isInitialized) {
      logger.debug('SERVICE', 'WidgetDataService already initialized');
      return;
    }

    if (!this.isSupported()) {
      logger.debug('SERVICE', 'Widgets not supported on this platform');
      return;
    }

    logger.info('SERVICE', 'Initializing WidgetDataService');

    // Subscribe to store changes
    this.subscribeToStores();

    // Perform initial sync
    this.performSync();

    this.isInitialized = true;
    logger.info('SERVICE', 'WidgetDataService initialized');
  }

  /**
   * Clean up subscriptions and pending timeouts
   */
  destroy(): void {
    logger.debug('SERVICE', 'Destroying WidgetDataService');

    // Clear pending sync
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }

    // Unsubscribe from all stores
    this.unsubscribers.forEach(unsub => unsub());
    this.unsubscribers = [];

    this.isInitialized = false;
    this.lastSyncData = null;

    logger.info('SERVICE', 'WidgetDataService destroyed');
  }

  /**
   * Subscribe to relevant store changes
   */
  private subscribeToStores(): void {
    // Track previous values to detect actual changes
    let prevTasks = useTasksStore.getState().tasks;
    let prevContributionData = useLogsStore.getState().contributionData;
    let prevStreaks = useStreaksStore.getState().streaks;
    let prevCalendarColor = useSettingsStore.getState().calendarColor;

    // Subscribe to tasks store
    const unsubTasks = useTasksStore.subscribe((state) => {
      if (state.tasks !== prevTasks) {
        prevTasks = state.tasks;
        this.scheduleSync();
      }
    });
    this.unsubscribers.push(unsubTasks);

    // Subscribe to contribution data changes
    const unsubLogs = useLogsStore.subscribe((state) => {
      if (state.contributionData !== prevContributionData) {
        prevContributionData = state.contributionData;
        this.scheduleSync();
      }
    });
    this.unsubscribers.push(unsubLogs);

    // Subscribe to streaks changes
    const unsubStreaks = useStreaksStore.subscribe((state) => {
      if (state.streaks !== prevStreaks) {
        prevStreaks = state.streaks;
        this.scheduleSync();
      }
    });
    this.unsubscribers.push(unsubStreaks);

    // Subscribe to calendar color changes
    const unsubSettings = useSettingsStore.subscribe((state) => {
      if (state.calendarColor !== prevCalendarColor) {
        prevCalendarColor = state.calendarColor;
        this.scheduleSync();
      }
    });
    this.unsubscribers.push(unsubSettings);

    logger.debug('SERVICE', 'Subscribed to store changes for widget sync');
  }

  /**
   * Schedule a sync with debouncing
   */
  scheduleSync(): void {
    if (!this.isSupported()) return;

    // Clear any pending sync
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    // Schedule new sync
    this.syncTimeout = setTimeout(() => {
      this.performSync();
    }, this.DEBOUNCE_MS);
  }

  /**
   * Force an immediate sync (bypasses debounce)
   */
  async forceSync(): Promise<void> {
    if (!this.isSupported()) return;

    // Clear pending debounced sync
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }

    await this.performSync();
  }

  /**
   * Perform the actual sync to the widget
   */
  private async performSync(): Promise<void> {
    if (!this.isSupported()) return;

    try {
      const syncData = this.buildSyncData();
      const jsonString = JSON.stringify(syncData);

      // Skip sync if data hasn't changed
      if (jsonString === this.lastSyncData) {
        logger.debug('SERVICE', 'Widget data unchanged, skipping sync');
        return;
      }

      logger.debug('SERVICE', 'Syncing widget data', {
        taskCount: syncData.tasks.length,
        dateCount: syncData.contributionData.dates.length,
      });

      // Write data to App Group storage
      await WidgetBridge.syncWidgetData(jsonString);

      // Trigger widget timeline refresh
      await WidgetBridge.reloadWidgets();

      this.lastSyncData = jsonString;

      logger.info('SERVICE', 'Widget data synced successfully');
    } catch (error) {
      logger.error('SERVICE', 'Failed to sync widget data', { error });
    }
  }

  /**
   * Build the sync data structure from current store state
   */
  private buildSyncData(): WidgetSyncData {
    const tasks = useTasksStore.getState().tasks;
    const contributionData = useLogsStore.getState().contributionData;
    const streaks = useStreaksStore.getState().streaks;
    const calendarColor = useSettingsStore.getState().calendarColor;

    // Generate color palette from user's calendar color
    const palette = calendarColor
      ? generateContributionPalette(calendarColor)
      : DEFAULT_CONTRIBUTION_PALETTE;

    // Calculate max count for contribution levels
    const maxCount = Math.max(
      ...contributionData.map(d => d.count),
      1 // Ensure at least 1 to avoid division by zero
    );

    // Build contribution data with levels
    const contributionDates = contributionData.map(d => ({
      date: d.date,
      count: d.count,
      level: calculateLevel(d.count, maxCount),
    }));

    // Build task data with streak info
    const today = getTodayString();
    const taskData = tasks
      .filter(t => !t.archivedAt) // Only active tasks
      .map(task => {
        const streak = streaks.find(s => s.taskId === task.id);
        const todayData = contributionData.find(d => d.date === today);
        const todayTaskData = todayData?.tasks.find(t => t.taskId === task.id);

        return {
          id: task.id,
          name: task.name,
          icon: task.icon || '',
          color: task.color,
          todayCount: todayTaskData?.count || 0,
          currentStreak: streak?.currentStreak || 0,
          bestStreak: streak?.bestStreak || 0,
          isMultiCompletion: task.isMultiCompletion,
          isArchived: !!task.archivedAt,
          sortOrder: task.sortOrder,
          streakEnabled: task.streakEnabled ?? true,
        };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);

    return {
      version: WIDGET_DATA_VERSION,
      lastUpdated: new Date().toISOString(),
      contributionData: {
        dates: contributionDates,
        maxCount,
        palette: {
          empty: palette.empty,
          level1: palette.level1,
          level2: palette.level2,
          level3: palette.level3,
          level4: palette.level4,
        },
      },
      tasks: taskData,
      quickAddConfig: {
        singleTaskId: null,
        multiTaskIds: [],
      },
      pendingActions: [],
    };
  }

  /**
   * Reload all widget timelines
   */
  async reloadAllWidgets(): Promise<void> {
    if (!this.isSupported()) return;

    try {
      await WidgetBridge.reloadWidgets();
      logger.debug('SERVICE', 'Widget timelines reloaded');
    } catch (error) {
      logger.error('SERVICE', 'Failed to reload widget timelines', { error });
    }
  }

  /**
   * Reload a specific widget by kind
   */
  async reloadWidget(kind: string): Promise<void> {
    if (!this.isSupported()) return;

    try {
      await WidgetBridge.reloadWidget(kind);
      logger.debug('SERVICE', 'Widget timeline reloaded', { kind });
    } catch (error) {
      logger.error('SERVICE', 'Failed to reload widget timeline', { error, kind });
    }
  }

  /**
   * Get current widget state (for debugging)
   */
  async getWidgetState(): Promise<any> {
    if (!this.isSupported()) return null;

    try {
      return await WidgetBridge.getWidgetState();
    } catch (error) {
      logger.error('SERVICE', 'Failed to get widget state', { error });
      return null;
    }
  }
}

// Create singleton instance
export const widgetDataService = new WidgetDataService();

// Export for service registry
export default WidgetDataService;
