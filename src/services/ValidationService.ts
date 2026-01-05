import { Task, TaskLog } from '../types';
import logger from '../utils/logger';

/**
 * Validation Service
 * 
 * Provides centralized validation logic for business entities and operations.
 * Ensures data integrity and business rule compliance.
 */
export class ValidationService {
  private static instance: ValidationService;

  static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  /**
   * Validate task data before creation or update
   */
  validateTask(taskData: Partial<Task>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      logger.debug('SERVICE', 'Validating task data', { taskName: taskData.name });

      // Required fields validation
      if (!taskData.name || taskData.name.trim().length === 0) {
        errors.push('Task name is required');
      }

      if (!taskData.color || taskData.color.trim().length === 0) {
        errors.push('Task color is required');
      }

      // Name validation
      if (taskData.name && taskData.name.trim().length < 2) {
        errors.push('Task name must be at least 2 characters long');
      }

      if (taskData.name && taskData.name.trim().length > 100) {
        errors.push('Task name must be less than 100 characters');
      }

      // Description validation
      if (taskData.description && taskData.description.trim().length > 500) {
        errors.push('Task description must be less than 500 characters');
      }

      // Color validation
      if (taskData.color && !this.isValidColor(taskData.color)) {
        errors.push('Invalid color format. Use hex color (e.g., #FF0000)');
      }

      // Icon validation
      if (taskData.icon && taskData.icon.trim().length === 0) {
        warnings.push('Empty icon string will be treated as no icon');
      }

      // Reminder validation
      if (taskData.reminderEnabled && !taskData.reminderTime) {
        errors.push('Reminder time is required when reminders are enabled');
      }

      if (taskData.reminderTime && !this.isValidTime(taskData.reminderTime)) {
        errors.push('Invalid reminder time format. Use HH:MM format (e.g., 09:30)');
      }

      if (taskData.reminderFrequency && !['daily', 'weekly'].includes(taskData.reminderFrequency)) {
        errors.push('Reminder frequency must be either "daily" or "weekly"');
      }

      // Business rule validations
      if (taskData.reminderEnabled && taskData.reminderTime) {
        const timeWarning = this.validateReminderTime(taskData.reminderTime);
        if (timeWarning) {
          warnings.push(timeWarning);
        }
      }

      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
      };

      logger.debug('SERVICE', 'Task validation completed', { 
        isValid: result.isValid, 
        errorsCount: errors.length,
        warningsCount: warnings.length 
      });

      return result;
    } catch (error) {
      logger.error('SERVICE', 'Task validation failed', { error });
      return {
        isValid: false,
        errors: ['Validation process failed'],
        warnings: [],
      };
    }
  }

  /**
   * Validate task log data
   */
  validateTaskLog(logData: Partial<TaskLog>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      logger.debug('SERVICE', 'Validating task log data', { 
        taskId: logData.taskId, 
        date: logData.date 
      });

      // Required fields validation
      if (!logData.taskId || logData.taskId.trim().length === 0) {
        errors.push('Task ID is required');
      }

      if (!logData.date || logData.date.trim().length === 0) {
        errors.push('Date is required');
      }

      if (typeof logData.count !== 'number') {
        errors.push('Count must be a number');
      }

      // Date validation
      if (logData.date && !this.isValidDate(logData.date)) {
        errors.push('Invalid date format. Use YYYY-MM-DD format');
      }

      // Count validation
      if (typeof logData.count === 'number') {
        if (logData.count < 0) {
          errors.push('Count cannot be negative');
        }

        if (logData.count > 1000) {
          warnings.push('Very high completion count. Please verify this is correct.');
        }

        if (!Number.isInteger(logData.count)) {
          errors.push('Count must be a whole number');
        }
      }

      // Date business rules
      if (logData.date && this.isValidDate(logData.date)) {
        const logDate = new Date(logData.date);
        const today = new Date();
        const futureLimit = new Date();
        futureLimit.setDate(today.getDate() + 1);

        if (logDate > futureLimit) {
          errors.push('Cannot log completions for future dates');
        }

        const pastLimit = new Date();
        pastLimit.setFullYear(pastLimit.getFullYear() - 5);

        if (logDate < pastLimit) {
          warnings.push('Logging completions for dates older than 5 years');
        }
      }

      const result: ValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
      };

      logger.debug('SERVICE', 'Task log validation completed', { 
        isValid: result.isValid, 
        errorsCount: errors.length 
      });

      return result;
    } catch (error) {
      logger.error('SERVICE', 'Task log validation failed', { error });
      return {
        isValid: false,
        errors: ['Validation process failed'],
        warnings: [],
      };
    }
  }

  /**
   * Validate bulk import data
   */
  validateBulkTaskData(tasks: Partial<Task>[]): BulkValidationResult {
    const results: Array<ValidationResult & { index: number }> = [];
    const duplicateNames: string[] = [];

    try {
      logger.debug('SERVICE', 'Validating bulk task data', { count: tasks.length });

      // Check for duplicate names
      const nameOccurrences = new Map<string, number[]>();
      tasks.forEach((task, index) => {
        if (task.name) {
          const normalizedName = task.name.trim().toLowerCase();
          if (!nameOccurrences.has(normalizedName)) {
            nameOccurrences.set(normalizedName, []);
          }
          nameOccurrences.get(normalizedName)!.push(index);
        }
      });

      // Identify duplicates
      nameOccurrences.forEach((indices, name) => {
        if (indices.length > 1) {
          duplicateNames.push(name);
        }
      });

      // Validate each task
      tasks.forEach((task, index) => {
        const validation = this.validateTask(task);
        
        // Add duplicate name error if applicable
        if (task.name && duplicateNames.includes(task.name.trim().toLowerCase())) {
          validation.errors.push('Duplicate task name in bulk data');
        }

        results.push({ ...validation, index });
      });

      const validCount = results.filter(r => r.isValid).length;
      const invalidCount = results.length - validCount;

      const bulkResult: BulkValidationResult = {
        isValid: invalidCount === 0,
        validCount,
        invalidCount,
        totalCount: tasks.length,
        results,
        duplicateNames: Array.from(new Set(duplicateNames)),
      };

      logger.info('SERVICE', 'Bulk validation completed', {
        totalCount: tasks.length,
        validCount,
        invalidCount,
        duplicatesCount: duplicateNames.length
      });

      return bulkResult;
    } catch (error) {
      logger.error('SERVICE', 'Bulk validation failed', { error });
      return {
        isValid: false,
        validCount: 0,
        invalidCount: tasks.length,
        totalCount: tasks.length,
        results: [],
        duplicateNames: [],
      };
    }
  }

  private isValidColor(color: string): boolean {
    // Check for hex color format
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  }

  private isValidTime(time: string): boolean {
    // Check for HH:MM format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  private isValidDate(date: string): boolean {
    // Check for YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    // Check if it's a valid date
    const parsedDate = new Date(date);
    return !isNaN(parsedDate.getTime()) && 
           parsedDate.toISOString().split('T')[0] === date;
  }

  private validateReminderTime(time: string): string | null {
    const [hours] = time.split(':').map(Number);
    
    if (hours < 6) {
      return 'Setting reminders before 6 AM may not be effective for most users';
    }
    
    if (hours > 22) {
      return 'Setting reminders after 10 PM may interfere with sleep';
    }
    
    return null;
  }
}

// Type definitions
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BulkValidationResult {
  isValid: boolean;
  validCount: number;
  invalidCount: number;
  totalCount: number;
  results: Array<ValidationResult & { index: number }>;
  duplicateNames: string[];
}

export const validationService = ValidationService.getInstance();
export default validationService;