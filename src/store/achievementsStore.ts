import { create } from 'zustand';
import {
  AchievementWithStatus,
  AchievementUnlockEvent,
  AchievementStats,
} from '../types/achievements';
import { getAchievementService } from '../services';
import logger from '../utils/logger';

/**
 * Helper to deduplicate pending unlocks by achievement ID
 * Prevents the same achievement from appearing multiple times in the queue
 */
const deduplicatePendingUnlocks = (
  existing: AchievementUnlockEvent[],
  newEvents: AchievementUnlockEvent[]
): AchievementUnlockEvent[] => {
  const existingIds = new Set(existing.map((e) => e.achievement.id));
  const uniqueNewEvents = newEvents.filter((e) => !existingIds.has(e.achievement.id));
  return [...existing, ...uniqueNewEvents];
};

interface AchievementsState {
  // State
  achievements: AchievementWithStatus[];
  pendingUnlocks: AchievementUnlockEvent[];
  stats: AchievementStats | null;
  loading: boolean;
  error: string | null;
  canShowModal: boolean;

  // Actions
  loadAchievements: () => Promise<void>;
  loadStats: () => Promise<void>;
  checkForAchievements: (context: {
    trigger: 'task_completion' | 'streak_update' | 'task_created' | 'task_customized' | 'app_open';
    taskId?: string;
    date?: string;
    count?: number;
  }) => Promise<AchievementUnlockEvent[]>;
  addPendingUnlock: (event: AchievementUnlockEvent) => void;
  dismissPendingUnlock: () => Promise<void>;
  markAsViewed: (achievementIds: string[]) => Promise<void>;
  clearError: () => void;
  subscribeToUnlocks: () => () => void;
  setCanShowModal: (value: boolean) => void;
}

export const useAchievementsStore = create<AchievementsState>((set, get) => ({
  achievements: [],
  pendingUnlocks: [],
  stats: null,
  loading: false,
  error: null,
  canShowModal: true,

  loadAchievements: async () => {
    set({ loading: true, error: null });
    try {
      const achievementService = getAchievementService();
      const achievements = await achievementService.getAllAchievementsWithStatus();

      set({ achievements, loading: false });
      logger.debug('STATE', 'Achievements loaded', { count: achievements.length });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to load achievements';
      logger.error('STATE', 'Failed to load achievements', { error });
      set({ error: errorMsg, loading: false });
    }
  },

  loadStats: async () => {
    try {
      const achievementService = getAchievementService();
      const stats = await achievementService.getStats();

      set({ stats });
      logger.debug('STATE', 'Achievement stats loaded', {
        totalUnlocked: stats.totalUnlocked,
        percentage: stats.percentage,
      });
    } catch (error) {
      logger.error('STATE', 'Failed to load achievement stats', { error });
    }
  },

  checkForAchievements: async (context) => {
    try {
      const achievementService = getAchievementService();
      const unlocks = await achievementService.checkForUnlockedAchievements(context);

      if (unlocks.length > 0) {
        // Add to pending unlocks queue (with deduplication)
        set((state) => ({
          pendingUnlocks: deduplicatePendingUnlocks(state.pendingUnlocks, unlocks),
        }));

        logger.info('STATE', 'New achievements unlocked', {
          count: unlocks.length,
          achievements: unlocks.map((u) => u.achievement.name),
        });

        // Reload data in background - don't block UI
        // The pendingUnlocks state is already set for modal display
        get().loadAchievements().catch((error) => {
          logger.error('STATE', 'Failed to reload achievements', { error });
        });
        get().loadStats().catch((error) => {
          logger.error('STATE', 'Failed to reload stats', { error });
        });
      }

      return unlocks;
    } catch (error) {
      logger.error('STATE', 'Failed to check for achievements', { error });
      return [];
    }
  },

  addPendingUnlock: (event) => {
    set((state) => ({
      pendingUnlocks: deduplicatePendingUnlocks(state.pendingUnlocks, [event]),
    }));
  },

  dismissPendingUnlock: async () => {
    const { pendingUnlocks } = get();
    if (pendingUnlocks.length === 0) return;

    const [dismissed, ...remaining] = pendingUnlocks;

    // Mark the dismissed achievement as viewed
    try {
      const achievementService = getAchievementService();
      await achievementService.markAsViewed([dismissed.achievement.id]);
    } catch (error) {
      logger.error('STATE', 'Failed to mark achievement as viewed', { error });
    }

    set({ pendingUnlocks: remaining });
    logger.debug('STATE', 'Dismissed pending unlock', {
      achievementId: dismissed.achievement.id,
      remaining: remaining.length,
    });
  },

  markAsViewed: async (achievementIds) => {
    try {
      const achievementService = getAchievementService();
      await achievementService.markAsViewed(achievementIds);

      // Reload achievements to update viewed status
      await get().loadAchievements();
    } catch (error) {
      logger.error('STATE', 'Failed to mark achievements as viewed', { error });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setCanShowModal: (value) => {
    set({ canShowModal: value });
  },

  subscribeToUnlocks: () => {
    const achievementService = getAchievementService();

    // Subscribe to unlock events from the service
    const unsubscribe = achievementService.subscribe((events) => {
      // Add new unlocks to the pending queue (with deduplication)
      set((state) => ({
        pendingUnlocks: deduplicatePendingUnlocks(state.pendingUnlocks, events),
      }));
    });

    // Also load any unviewed achievements from previous sessions
    (async () => {
      try {
        const unviewed = await achievementService.getUnviewedAchievements();
        if (unviewed.length > 0) {
          set((state) => ({
            pendingUnlocks: deduplicatePendingUnlocks(state.pendingUnlocks, unviewed),
          }));
          logger.debug('STATE', 'Loaded unviewed achievements from previous session', {
            count: unviewed.length,
          });
        }
      } catch (error) {
        logger.error('STATE', 'Failed to load unviewed achievements', { error });
      }
    })();

    return unsubscribe;
  },
}));
