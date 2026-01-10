/**
 * Streak Rules Engine
 * 
 * Encapsulates all streak configuration and business rule logic,
 * providing a clean separation of concerns for streak calculations.
 */

import { Task, StreakConfig } from '../types';
import { formatDateString } from '../utils/dateHelpers';
import logger from '../utils/logger';

export class StreakRulesEngine {
  private config: StreakConfig;

  constructor(task: Task) {
    this.config = {
      enabled: task.streakEnabled ?? true,
      skipWeekends: task.streakSkipWeekends ?? false,
      skipDays: task.streakSkipDays ?? [],
      minimumCount: task.streakMinimumCount ?? 1
    };
  }

  /**
   * Check if streak tracking is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Check if the given count meets the minimum requirement
   */
  meetsMinimumRequirement(count: number): boolean {
    return count >= this.config.minimumCount;
  }

  /**
   * Check if a specific date should be skipped
   */
  shouldSkipDate(dateStr: string): boolean {
    const date = new Date(dateStr);
    const dayOfWeek = date.getDay();

    // Check if weekends should be skipped
    if (this.config.skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
      logger.debug('SERVICES', 'Date is weekend and should be skipped', { dateStr });
      return true;
    }

    // Check custom skip days
    if (this.config.skipDays.includes(dateStr)) {
      logger.debug('SERVICES', 'Date is in custom skip days', { dateStr });
      return true;
    }

    return false;
  }

  /**
   * Check if the streak continues from last completion to current date
   */
  checkStreakContinuation(
    lastCompletionDate: string | undefined,
    currentDate: string
  ): boolean {
    if (!lastCompletionDate) {
      return false;
    }

    const lastDate = new Date(lastCompletionDate);
    const current = new Date(currentDate);
    
    // Reset time to compare dates only
    lastDate.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);

    // If same day, continue streak
    if (lastDate.getTime() === current.getTime()) {
      return true;
    }

    // If current date is before last date, invalid
    if (current < lastDate) {
      logger.debug('SERVICES', 'Current date is before last completion date', {
        lastCompletionDate,
        currentDate
      });
      return false;
    }

    // Calculate the difference in days
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysDiff = Math.floor((current.getTime() - lastDate.getTime()) / msPerDay);
    
    logger.debug('SERVICES', 'Checking streak continuation', {
      lastCompletionDate,
      currentDate,
      daysDiff
    });

    // If it's the next day, check if we should skip any days
    if (daysDiff === 1) {
      // Direct next day - streak continues
      return true;
    }
    
    // For gaps larger than 1 day, check if all intermediate days can be skipped
    if (daysDiff > 1) {
      let skippableDays = 0;
      
      // Check each day between last and current (exclusive)
      for (let i = 1; i < daysDiff; i++) {
        const checkDate = new Date(lastDate);
        checkDate.setDate(checkDate.getDate() + i);
        const dateStr = formatDateString(checkDate);
        
        if (this.shouldSkipDate(dateStr)) {
          skippableDays++;
        } else {
          // Found a non-skip day that was missed
          logger.debug('SERVICES', 'Streak broken - non-skip day missed', {
            missedDate: dateStr,
            lastCompletionDate,
            currentDate,
            daysDiff
          });
          return false;
        }
      }
      
      // All intermediate days were skippable
      logger.debug('SERVICES', 'All intermediate days were skippable', {
        daysDiff,
        skippableDays
      });
      return true;
    }

    return false;
  }

  /**
   * Calculate days until the streak will break
   */
  calculateDaysUntilBreak(
    lastCompletionDate: string,
    currentDate: string
  ): number {
    const last = new Date(lastCompletionDate);
    const current = new Date(currentDate);
    
    last.setHours(0, 0, 0, 0);
    current.setHours(0, 0, 0, 0);

    // Check if streak is already broken
    if (!this.checkStreakContinuation(lastCompletionDate, currentDate)) {
      return 0;
    }

    // Find the next day after current that would break the streak if not completed
    let checkDate = new Date(current);
    let daysChecked = 0;
    
    while (daysChecked < 30) {
      checkDate.setDate(checkDate.getDate() + 1);
      const dateStr = formatDateString(checkDate);
      daysChecked++;
      
      if (!this.shouldSkipDate(dateStr)) {
        // This is a day that requires completion
        // Days until break = days from current to this date
        const msPerDay = 24 * 60 * 60 * 1000;
        const daysUntilBreak = Math.ceil((checkDate.getTime() - current.getTime()) / msPerDay);
        
        logger.debug('SERVICES', 'Next required completion', {
          currentDate,
          nextRequiredDate: dateStr,
          daysUntilBreak
        });
        
        return daysUntilBreak;
      }
    }

    // All next 30 days are skippable (unlikely)
    logger.warn('SERVICES', 'All next 30 days are skippable', {
      lastCompletionDate,
      currentDate
    });
    return 30;
  }

  /**
   * Get the next non-skip date after a given date
   */
  getNextRequiredDate(fromDate: string): string {
    const date = new Date(fromDate);
    date.setDate(date.getDate() + 1);
    
    let attempts = 0;
    while (this.shouldSkipDate(formatDateString(date))) {
      date.setDate(date.getDate() + 1);
      attempts++;
      
      // Safety limit
      if (attempts > 365) {
        logger.error('SERVICES', 'Could not find next required date within a year', { fromDate });
        break;
      }
    }
    
    return formatDateString(date);
  }

  /**
   * Validate streak configuration
   */
  static validateConfiguration(config: Partial<StreakConfig>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate minimum count
    if (config.minimumCount !== undefined) {
      if (!Number.isInteger(config.minimumCount) || config.minimumCount < 1) {
        errors.push('Minimum count must be a positive integer');
      }
      if (config.minimumCount > 100) {
        errors.push('Minimum count cannot exceed 100');
      }
    }

    // Validate skip days format
    if (config.skipDays && Array.isArray(config.skipDays)) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      for (const dateStr of config.skipDays) {
        if (!dateRegex.test(dateStr)) {
          errors.push(`Invalid date format in skip days: ${dateStr}. Expected YYYY-MM-DD`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get streak configuration summary
   */
  getConfigurationSummary(): string {
    const parts: string[] = [];
    
    if (!this.config.enabled) {
      return 'Streak tracking disabled';
    }
    
    parts.push(`Minimum ${this.config.minimumCount} completion${this.config.minimumCount > 1 ? 's' : ''} per day`);
    
    if (this.config.skipWeekends) {
      parts.push('Weekends skipped');
    }
    
    if (this.config.skipDays.length > 0) {
      parts.push(`${this.config.skipDays.length} custom skip day${this.config.skipDays.length > 1 ? 's' : ''}`);
    }
    
    return parts.join(', ');
  }
}

/**
 * Factory function to create StreakRulesEngine
 */
export const createStreakRulesEngine = (task: Task): StreakRulesEngine => {
  return new StreakRulesEngine(task);
};