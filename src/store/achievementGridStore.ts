import { create } from 'zustand';
import {
  AchievementGridData,
  AchievementGridState,
  GridConfig,
  UnlockedAchievement,
  AchievementProgress,
} from '../types/achievements';
import { getAchievementGridService } from '../services';
import logger from '../utils/logger';

// ============================================
// Store Definition
// ============================================

interface AchievementGridStoreState {
  // Data
  gridData: AchievementGridData | null;
  gridState: AchievementGridState | null;
  config: GridConfig;

  // Loading state
  loading: boolean;
  error: string | null;

  // Actions
  initializeGrid: () => Promise<void>;
  refreshGrid: (
    unlockedIds: Set<string>,
    unlockedRecords: Map<string, UnlockedAchievement>,
    progressRecords: Map<string, AchievementProgress>
  ) => void;
  getPositionForAchievement: (achievementId: string) => { row: number; col: number } | null;
  resetGrid: () => Promise<void>;
}

export const useAchievementGridStore = create<AchievementGridStoreState>((set, get) => ({
  gridData: null,
  gridState: null,
  config: { version: 1, size: 7, maxAchievements: 49 }, // Default config, will be updated on init
  loading: false,
  error: null,

  initializeGrid: async () => {
    set({ loading: true, error: null });

    try {
      const gridService = getAchievementGridService();
      const { gridData, config } = await gridService.getOrCreateGrid();

      set({
        gridData,
        config,
        loading: false,
      });

      logger.debug('STATE', 'Achievement grid initialized', {
        version: gridData.version,
        positions: gridData.positions.length,
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to initialize grid';
      logger.error('STATE', 'Failed to initialize achievement grid', { error });
      set({ error: errorMsg, loading: false });
    }
  },

  refreshGrid: (unlockedIds, unlockedRecords, progressRecords) => {
    const { gridData, config } = get();

    if (!gridData) {
      logger.warn('STATE', 'Cannot refresh grid: no grid data');
      return;
    }

    const gridService = getAchievementGridService();
    const gridState = gridService.buildGridState(
      gridData.positions,
      unlockedIds,
      unlockedRecords,
      progressRecords,
      config
    );

    set({ gridState });

    logger.debug('STATE', 'Achievement grid refreshed', {
      unlockedCount: gridState.unlockedCount,
      totalCount: gridState.totalCount,
      isComplete: gridState.isComplete,
    });
  },

  getPositionForAchievement: (achievementId: string) => {
    const { gridData } = get();

    if (!gridData) {
      return null;
    }

    const gridService = getAchievementGridService();
    return gridService.getPositionForAchievement(gridData.positions, achievementId);
  },

  resetGrid: async () => {
    try {
      const gridService = getAchievementGridService();
      const { gridData, config } = await gridService.resetGrid();

      set({
        gridData,
        config,
        gridState: null,
      });

      logger.info('STATE', 'Achievement grid reset and reinitialized');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to reset grid';
      logger.error('STATE', 'Failed to reset achievement grid', { error });
      set({ error: errorMsg });
    }
  },
}));
