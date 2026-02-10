/**
 * Achievement Grid Service
 *
 * Encapsulates all business logic for the Kirby Air Ride-style achievement grid,
 * including grid generation, position calculation, and cell state management.
 * Provides a clean interface for grid operations.
 */

import {
  AchievementGridData,
  AchievementGridPosition,
  AchievementGridState,
  GridCell,
  GridCellState,
  GridConfig,
  UnlockedAchievement,
  AchievementProgress,
} from '../types/achievements';
import { IAchievementGridRepository } from '../database/repositories/interfaces/IAchievementGridRepository';
import { ITaskRepository } from '../database/repositories/interfaces';
import { ACHIEVEMENTS, getAchievementById } from '../data/achievementLibrary';
import logger from '../utils/logger';

// ============================================
// Grid Configuration Constants
// ============================================

/**
 * Grid version configurations
 * Version 1: 7x7 (49 cells) - initial release
 * Future: 8x8 (64 cells), 10x10 (100 cells) as achievements grow
 */
export const GRID_CONFIGS: Record<number, GridConfig> = {
  1: { version: 1, size: 7, maxAchievements: 49 },
  2: { version: 2, size: 8, maxAchievements: 64 },
  3: { version: 3, size: 10, maxAchievements: 100 },
};

/**
 * The "First Step" achievement is always at the center
 * This is the starting point for all users
 */
export const STARTER_ACHIEVEMENT_ID = 'explorer_first_completion';

// ============================================
// Seeded Random Number Generator
// ============================================

/**
 * Simple seeded PRNG (Linear Congruential Generator)
 * Creates deterministic "random" sequences from a seed
 */
export class SeededRandom {
  private seed: number;

  constructor(seed: string) {
    // Convert string seed to number using hash
    this.seed = this.hashString(seed);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) || 1; // Ensure non-zero
  }

  /**
   * Generate next random number between 0 and 1
   */
  next(): number {
    // LCG parameters (same as glibc)
    const a = 1103515245;
    const c = 12345;
    const m = 2 ** 31;
    this.seed = (a * this.seed + c) % m;
    return this.seed / m;
  }

  /**
   * Fisher-Yates shuffle with seeded randomness
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

// ============================================
// Service Class
// ============================================

/**
 * Service for managing achievement grid operations
 */
export class AchievementGridService {
  constructor(
    private gridRepository: IAchievementGridRepository,
    private taskRepository: ITaskRepository
  ) {
    logger.debug('SERVICES', 'AchievementGridService initialized');
  }

  // ============================================
  // Grid Configuration Methods
  // ============================================

  /**
   * Get the current grid version based on achievement count
   */
  getCurrentGridVersion(): number {
    const achievementCount = ACHIEVEMENTS.length;
    if (achievementCount <= 49) return 1;
    if (achievementCount <= 64) return 2;
    return 3;
  }

  /**
   * Get grid config for a version
   */
  getGridConfig(version: number): GridConfig {
    return GRID_CONFIGS[version] || GRID_CONFIGS[1];
  }

  // ============================================
  // Seed Generation
  // ============================================

  /**
   * Generate a seed from the user's oldest task creation date
   * Falls back to current timestamp if no tasks exist
   */
  async generateUserSeed(): Promise<string> {
    try {
      const tasks = await this.taskRepository.getAll();

      if (tasks.length > 0) {
        // Sort by creation date and use the oldest
        const sortedTasks = [...tasks].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        return sortedTasks[0].createdAt;
      }
    } catch (error) {
      logger.warn('SERVICES', 'Failed to get tasks for seed generation', { error });
    }

    // Fallback to current timestamp
    return new Date().toISOString();
  }

  // ============================================
  // Grid Position Generation
  // ============================================

  /**
   * Generate grid positions for all achievements
   * The starter achievement is always at center, others are shuffled
   */
  generateGridPositions(seed: string, config: GridConfig): AchievementGridPosition[] {
    const positions: AchievementGridPosition[] = [];
    const rng = new SeededRandom(seed);

    // Calculate center position
    const centerRow = Math.floor(config.size / 2);
    const centerCol = Math.floor(config.size / 2);

    // Get all achievement IDs except the starter
    const achievementIds = ACHIEVEMENTS
      .map(a => a.id)
      .filter(id => id !== STARTER_ACHIEVEMENT_ID);

    // Shuffle the non-starter achievements
    const shuffledIds = rng.shuffle(achievementIds);

    // Place starter at center
    positions.push({
      achievementId: STARTER_ACHIEVEMENT_ID,
      row: centerRow,
      col: centerCol,
    });

    // Generate all grid positions except center
    const allPositions: { row: number; col: number }[] = [];
    for (let row = 0; row < config.size; row++) {
      for (let col = 0; col < config.size; col++) {
        if (row !== centerRow || col !== centerCol) {
          allPositions.push({ row, col });
        }
      }
    }

    // Shuffle positions for random placement
    const shuffledPositions = rng.shuffle(allPositions);

    // Place achievements at shuffled positions
    for (let i = 0; i < shuffledIds.length && i < shuffledPositions.length; i++) {
      positions.push({
        achievementId: shuffledIds[i],
        row: shuffledPositions[i].row,
        col: shuffledPositions[i].col,
      });
    }

    return positions;
  }

  // ============================================
  // Adjacency & Cell State Calculation
  // ============================================

  /**
   * Get adjacent positions (4-directional: up, down, left, right)
   */
  getAdjacentPositions(row: number, col: number, gridSize: number): { row: number; col: number }[] {
    const adjacent: { row: number; col: number }[] = [];

    // Up
    if (row > 0) adjacent.push({ row: row - 1, col });
    // Down
    if (row < gridSize - 1) adjacent.push({ row: row + 1, col });
    // Left
    if (col > 0) adjacent.push({ row, col: col - 1 });
    // Right
    if (col < gridSize - 1) adjacent.push({ row, col: col + 1 });

    return adjacent;
  }

  /**
   * Calculate cell state based on unlock status and adjacency
   */
  calculateCellState(
    position: AchievementGridPosition,
    unlockedIds: Set<string>,
    positionMap: Map<string, AchievementGridPosition>,
    gridSize: number
  ): GridCellState {
    const { achievementId, row, col } = position;

    // If unlocked, show as unlocked
    if (unlockedIds.has(achievementId)) {
      return 'unlocked';
    }

    // Check if any adjacent cell is unlocked
    const adjacentPositions = this.getAdjacentPositions(row, col, gridSize);
    for (const adj of adjacentPositions) {
      // Find achievement at this position
      for (const [id, pos] of positionMap.entries()) {
        if (pos.row === adj.row && pos.col === adj.col) {
          if (unlockedIds.has(id)) {
            return 'visible';
          }
          break;
        }
      }
    }

    return 'locked';
  }

  /**
   * Build the 2D grid from positions and unlock status
   */
  buildGridState(
    positions: AchievementGridPosition[],
    unlockedIds: Set<string>,
    unlockedRecords: Map<string, UnlockedAchievement>,
    progressRecords: Map<string, AchievementProgress>,
    config: GridConfig
  ): AchievementGridState {
    // Create position lookup map
    const positionMap = new Map<string, AchievementGridPosition>();
    for (const pos of positions) {
      positionMap.set(pos.achievementId, pos);
    }

    // Create 2D grid initialized with empty cells
    const cells: GridCell[][] = [];
    for (let row = 0; row < config.size; row++) {
      cells[row] = [];
      for (let col = 0; col < config.size; col++) {
        cells[row][col] = {
          row,
          col,
          state: 'locked',
          achievement: null,
          unlocked: null,
          progress: null,
        };
      }
    }

    // Fill in cells with achievements
    let unlockedCount = 0;
    let starterPosition = { row: Math.floor(config.size / 2), col: Math.floor(config.size / 2) };

    for (const position of positions) {
      const { achievementId, row, col } = position;
      const achievement = getAchievementById(achievementId);
      const state = this.calculateCellState(position, unlockedIds, positionMap, config.size);

      if (state === 'unlocked') {
        unlockedCount++;
      }

      if (achievementId === STARTER_ACHIEVEMENT_ID) {
        starterPosition = { row, col };
      }

      cells[row][col] = {
        row,
        col,
        state,
        achievement: achievement || null,
        unlocked: unlockedRecords.get(achievementId) || null,
        progress: progressRecords.get(achievementId) || null,
      };
    }

    return {
      cells,
      unlockedCount,
      totalCount: positions.length,
      isComplete: unlockedCount === positions.length,
      starterPosition,
    };
  }

  // ============================================
  // Grid CRUD Operations
  // ============================================

  /**
   * Get or create grid data
   */
  async getOrCreateGrid(): Promise<{ gridData: AchievementGridData; config: GridConfig }> {
    try {
      logger.debug('SERVICES', 'Getting or creating achievement grid');

      const currentVersion = this.getCurrentGridVersion();
      const config = this.getGridConfig(currentVersion);

      // Check if grid already exists
      let gridData = await this.gridRepository.getGrid();

      if (!gridData) {
        // Generate new grid
        logger.info('SERVICES', 'Generating new achievement grid');
        const seed = await this.generateUserSeed();
        const positions = this.generateGridPositions(seed, config);

        gridData = await this.gridRepository.saveGrid({
          seed,
          version: currentVersion,
          positions,
        });

        logger.info('SERVICES', 'Achievement grid created', {
          seed,
          version: currentVersion,
          positions: positions.length,
        });
      } else if (gridData.version < currentVersion) {
        // Grid exists but needs upgrade
        logger.info('SERVICES', 'Upgrading achievement grid', {
          fromVersion: gridData.version,
          toVersion: currentVersion,
        });

        const positions = this.generateGridPositions(gridData.seed, config);
        gridData = await this.gridRepository.updateGrid(gridData.id, {
          version: currentVersion,
          positions,
        });
      }

      logger.debug('SERVICES', 'Achievement grid ready', {
        version: gridData.version,
        positions: gridData.positions.length,
      });

      return { gridData, config };
    } catch (error) {
      logger.error('SERVICES', 'Failed to get or create grid', { error });
      throw error;
    }
  }

  /**
   * Get grid data if it exists
   */
  async getGrid(): Promise<AchievementGridData | null> {
    try {
      return await this.gridRepository.getGrid();
    } catch (error) {
      logger.error('SERVICES', 'Failed to get grid', { error });
      throw error;
    }
  }

  /**
   * Reset the grid (delete and recreate)
   */
  async resetGrid(): Promise<{ gridData: AchievementGridData; config: GridConfig }> {
    try {
      logger.info('SERVICES', 'Resetting achievement grid');
      await this.gridRepository.deleteGrid();
      return await this.getOrCreateGrid();
    } catch (error) {
      logger.error('SERVICES', 'Failed to reset grid', { error });
      throw error;
    }
  }

  /**
   * Get position for a specific achievement
   */
  getPositionForAchievement(
    positions: AchievementGridPosition[],
    achievementId: string
  ): { row: number; col: number } | null {
    const position = positions.find(p => p.achievementId === achievementId);
    return position ? { row: position.row, col: position.col } : null;
  }
}

/**
 * Factory function to create AchievementGridService with dependencies
 */
export const createAchievementGridService = (
  gridRepository: IAchievementGridRepository,
  taskRepository: ITaskRepository
): AchievementGridService => {
  return new AchievementGridService(gridRepository, taskRepository);
};
