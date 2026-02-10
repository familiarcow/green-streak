/**
 * Interface for Achievement Grid Repository
 *
 * Handles persistence of the Kirby Air Ride-style achievement grid layout.
 */

import { AchievementGridData, AchievementGridPosition } from '../../../types/achievements';

export interface IAchievementGridRepository {
  /**
   * Get the grid data for the current user
   */
  getGrid(): Promise<AchievementGridData | null>;

  /**
   * Save a new grid layout
   */
  saveGrid(data: {
    seed: string;
    version: number;
    positions: AchievementGridPosition[];
  }): Promise<AchievementGridData>;

  /**
   * Update existing grid (for version upgrades)
   */
  updateGrid(
    id: string,
    data: {
      version: number;
      positions: AchievementGridPosition[];
    }
  ): Promise<AchievementGridData>;

  /**
   * Delete the grid (for testing/reset)
   */
  deleteGrid(): Promise<void>;

  /**
   * Check if grid exists
   */
  hasGrid(): Promise<boolean>;
}
