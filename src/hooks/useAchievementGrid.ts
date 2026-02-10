import { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { useAchievementsStore } from '../store/achievementsStore';
import { useAchievementGridStore } from '../store/achievementGridStore';
import {
  GridCell,
  AchievementGridState,
  GridConfig,
  UnlockedAchievement,
  AchievementProgress,
  AchievementUnlockEvent,
} from '../types/achievements';
import logger from '../utils/logger';

interface UseAchievementGridReturn {
  // Grid state
  gridState: AchievementGridState | null;
  config: GridConfig;
  loading: boolean;
  error: string | null;

  // Pending unlock for animation
  pendingUnlock: AchievementUnlockEvent | null;

  // Animation state
  animatingUnlockId: string | null;
  setAnimatingUnlockId: (id: string | null) => void;

  // Actions
  initializeGrid: () => Promise<void>;
  refreshGrid: () => void;
  getPositionForAchievement: (achievementId: string) => { row: number; col: number } | null;
  resetGrid: () => Promise<void>;
  dismissPendingUnlock: () => Promise<void>;

  // Computed values
  progressPercentage: number;
  isComplete: boolean;
}

/**
 * Custom hook for achievement grid functionality
 * Encapsulates grid-specific achievement access patterns and pending unlock logic
 */
export const useAchievementGrid = (): UseAchievementGridReturn => {
  // Achievement state - access pendingUnlocks directly from store
  // (not through the useAchievements hook which may gate it with canShowModal)
  const {
    achievements,
    pendingUnlocks,
    loadAchievements,
    loadStats,
    loading: achievementsLoading,
    dismissPendingUnlock: storeDismissPendingUnlock,
  } = useAchievementsStore();

  // Grid state
  const {
    gridData,
    gridState,
    config,
    loading: gridLoading,
    error,
    initializeGrid,
    refreshGrid: storeRefreshGrid,
    getPositionForAchievement,
    resetGrid,
  } = useAchievementGridStore();

  // Animation state - managed locally to avoid prop drilling
  const [animatingUnlockId, setAnimatingUnlockId] = useState<string | null>(null);
  const hasProcessedPendingUnlock = useRef<string | null>(null);
  const animationDelayRef = useRef<NodeJS.Timeout | null>(null);

  // Get the first pending unlock (FIFO queue)
  const pendingUnlock = pendingUnlocks.length > 0 ? pendingUnlocks[0] : null;

  // Build unlocked data maps from achievements
  const { unlockedIds, unlockedRecords, progressRecords } = useMemo(() => {
    const ids = new Set<string>();
    const unlocked = new Map<string, UnlockedAchievement>();
    const progress = new Map<string, AchievementProgress>();

    for (const achievement of achievements) {
      if (achievement.isUnlocked && achievement.unlocked) {
        ids.add(achievement.definition.id);
        unlocked.set(achievement.definition.id, achievement.unlocked);
      }
      if (achievement.progress) {
        progress.set(achievement.definition.id, achievement.progress);
      }
    }

    return { unlockedIds: ids, unlockedRecords: unlocked, progressRecords: progress };
  }, [achievements]);

  // Initialize grid and load achievements on mount
  useEffect(() => {
    initializeGrid();
    loadAchievements();
    loadStats();
  }, [initializeGrid, loadAchievements, loadStats]);

  // Refresh grid when achievements data changes
  useEffect(() => {
    if (gridData && achievements.length > 0) {
      storeRefreshGrid(unlockedIds, unlockedRecords, progressRecords);
    }
  }, [gridData, achievements, unlockedIds, unlockedRecords, progressRecords, storeRefreshGrid]);

  // Handle pending unlocks - trigger animation when screen opens with pending unlock
  useEffect(() => {
    if (pendingUnlock && gridState && !animatingUnlockId && !animationDelayRef.current) {
      const achievementId = pendingUnlock.achievement.id;

      // Only process each pending unlock once
      if (hasProcessedPendingUnlock.current === achievementId) {
        return;
      }

      hasProcessedPendingUnlock.current = achievementId;
      logger.info('UI', 'Scheduling unlock animation', { achievementId, delay: 600 });

      // Wait for drawer to finish opening + user to see the grid (600ms)
      animationDelayRef.current = setTimeout(() => {
        logger.info('UI', 'Starting unlock animation for achievement', { achievementId });
        setAnimatingUnlockId(achievementId);
        animationDelayRef.current = null;
      }, 600);
    }
  }, [pendingUnlock, gridState, animatingUnlockId]);

  // Cleanup timeout on unmount only
  useEffect(() => {
    return () => {
      if (animationDelayRef.current) {
        clearTimeout(animationDelayRef.current);
        animationDelayRef.current = null;
      }
    };
  }, []);

  // Wrapped refresh that uses current achievement data
  const refreshGrid = useCallback(() => {
    if (gridData) {
      storeRefreshGrid(unlockedIds, unlockedRecords, progressRecords);
    }
  }, [gridData, unlockedIds, unlockedRecords, progressRecords, storeRefreshGrid]);

  // Dismiss pending unlock
  const dismissPendingUnlock = useCallback(async () => {
    await storeDismissPendingUnlock();
    hasProcessedPendingUnlock.current = null;
  }, [storeDismissPendingUnlock]);

  // Computed values
  const loading = achievementsLoading || gridLoading || !gridState;
  const progressPercentage = gridState
    ? Math.round((gridState.unlockedCount / gridState.totalCount) * 100)
    : 0;
  const isComplete = gridState?.isComplete || false;

  return {
    // Grid state
    gridState,
    config,
    loading,
    error,

    // Pending unlock for animation
    pendingUnlock,

    // Animation state
    animatingUnlockId,
    setAnimatingUnlockId,

    // Actions
    initializeGrid,
    refreshGrid,
    getPositionForAchievement,
    resetGrid,
    dismissPendingUnlock,

    // Computed values
    progressPercentage,
    isComplete,
  };
};

export default useAchievementGrid;
