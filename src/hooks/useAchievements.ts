import { useEffect, useCallback } from 'react';
import { useAchievementsStore } from '../store/achievementsStore';
import {
  AchievementCheckContext,
  AchievementUnlockEvent,
  AchievementWithStatus,
  AchievementStats,
} from '../types/achievements';
import logger from '../utils/logger';

interface UseAchievementsReturn {
  // State
  achievements: AchievementWithStatus[];
  pendingUnlock: AchievementUnlockEvent | null;
  stats: AchievementStats | null;
  loading: boolean;
  error: string | null;

  // Actions
  checkForAchievements: (context: AchievementCheckContext) => Promise<AchievementUnlockEvent[]>;
  dismissPendingUnlock: () => Promise<void>;
  refreshAchievements: () => Promise<void>;
  setCanShowModal: (value: boolean) => void;

  // Computed
  unlockedCount: number;
  totalCount: number;
  progressPercentage: number;
}

/**
 * Custom hook for achievement-related operations
 * Provides access to achievements state and actions
 */
export const useAchievements = (): UseAchievementsReturn => {
  const {
    achievements,
    pendingUnlocks,
    canShowModal,
    stats,
    loading,
    error,
    loadAchievements,
    loadStats,
    checkForAchievements: storeCheckForAchievements,
    dismissPendingUnlock: storeDismissPendingUnlock,
    subscribeToUnlocks,
    setCanShowModal,
  } = useAchievementsStore();

  // Subscribe to unlock events on mount
  useEffect(() => {
    const unsubscribe = subscribeToUnlocks();

    // Initial load
    loadAchievements();
    loadStats();

    return () => {
      unsubscribe();
    };
  }, [loadAchievements, loadStats, subscribeToUnlocks]);

  // Check for achievements with given context
  const checkForAchievements = useCallback(
    async (context: AchievementCheckContext): Promise<AchievementUnlockEvent[]> => {
      try {
        const unlocks = await storeCheckForAchievements(context);
        return unlocks;
      } catch (error) {
        logger.error('HOOK', 'Failed to check for achievements', { error, context });
        return [];
      }
    },
    [storeCheckForAchievements]
  );

  // Dismiss the current pending unlock
  const dismissPendingUnlock = useCallback(async () => {
    await storeDismissPendingUnlock();
  }, [storeDismissPendingUnlock]);

  // Refresh achievements data
  const refreshAchievements = useCallback(async () => {
    await Promise.all([loadAchievements(), loadStats()]);
  }, [loadAchievements, loadStats]);

  // Get the next pending unlock (queue behavior)
  // Only return pendingUnlock when canShowModal is true to prevent dual modal conflicts
  const pendingUnlock = canShowModal && pendingUnlocks.length > 0 ? pendingUnlocks[0] : null;

  // Computed values
  const unlockedCount = stats?.totalUnlocked || 0;
  const totalCount = stats?.totalAchievements || 0;
  const progressPercentage = stats?.percentage || 0;

  return {
    // State
    achievements,
    pendingUnlock,
    stats,
    loading,
    error,

    // Actions
    checkForAchievements,
    dismissPendingUnlock,
    refreshAchievements,
    setCanShowModal,

    // Computed
    unlockedCount,
    totalCount,
    progressPercentage,
  };
};

export default useAchievements;
