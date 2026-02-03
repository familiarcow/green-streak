import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import TaskRepository from '../database/repositories/TaskRepository';
import LogRepository from '../database/repositories/LogRepository';
import { achievementRepository } from '../database/repositories/RepositoryFactory';
import EncryptionService from './EncryptionService';
import { useSettingsStore } from '../store/settingsStore';
import { useOnboardingStore } from '../store/onboardingStore';
import { Task, Log, AppSettings } from '../types';
import { UnlockedAchievement } from '../types/achievements';
import logger from '../utils/logger';

export interface ExportData {
  version: string;
  exportDate: string;
  appVersion: string;
  data: {
    tasks: Task[];
    logs: Log[];
    settings: AppSettings;
    achievements: UnlockedAchievement[];
    onboarding: {
      hasCompletedOnboarding: boolean;
      onboardingVersion: string;
    };
  };
  metadata: {
    totalTasks: number;
    totalLogs: number;
    totalAchievements: number;
    dateRange?: {
      earliest: string;
      latest: string;
    };
  };
}

export interface ImportResult {
  success: boolean;
  message: string;
  data?: {
    tasksImported: number;
    logsImported: number;
    achievementsImported: number;
    settingsImported: boolean;
    onboardingImported: boolean;
    errors?: string[];
  };
}

class DataExportService {
  private static readonly EXPORT_VERSION = '2.0.0';  // Bumped for achievements + full settings
  private static readonly APP_VERSION = '1.0.0';
  private static readonly FILE_EXTENSION = '.greenstreak';

  static async exportData(): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      logger.info('DATA', 'Starting data export');

      // Fetch all data from repositories and stores
      const tasks = await TaskRepository.getAll();
      const logs = await LogRepository.getAll();
      
      // Fetch unlocked achievements
      let achievements: UnlockedAchievement[] = [];
      try {
        achievements = await achievementRepository.getAllUnlocked();
      } catch (error) {
        logger.warn('DATA', 'Could not fetch achievements for export', { error });
      }
      
      // Get settings state
      const currentSettings = useSettingsStore.getState();
      
      // Extract ALL settings data, not just basic fields
      const settings: AppSettings = {
        globalReminderEnabled: currentSettings.globalReminderEnabled,
        globalReminderTime: currentSettings.globalReminderTime,
        debugLoggingEnabled: currentSettings.debugLoggingEnabled,
        currentLogLevel: currentSettings.currentLogLevel,
        notificationSettings: currentSettings.notificationSettings,
        calendarColor: currentSettings.calendarColor,
        dynamicIconEnabled: currentSettings.dynamicIconEnabled,
      };
      
      // Get onboarding state
      const onboardingState = useOnboardingStore.getState();
      const onboarding = {
        hasCompletedOnboarding: onboardingState.hasCompletedOnboarding,
        onboardingVersion: onboardingState.onboardingVersion,
      };

      logger.debug('DATA', 'Data fetched for export', { 
        tasksCount: tasks.length, 
        logsCount: logs.length,
        achievementsCount: achievements.length,
        settingsIncluded: true,
        onboardingIncluded: true,
      });

      // Create export data structure
      const exportData: ExportData = {
        version: this.EXPORT_VERSION,
        exportDate: new Date().toISOString(),
        appVersion: this.APP_VERSION,
        data: {
          tasks,
          logs,
          settings,
          achievements,
          onboarding,
        },
        metadata: {
          totalTasks: tasks.length,
          totalLogs: logs.length,
          totalAchievements: achievements.length,
          dateRange: this.getDateRange(logs),
        },
      };

      // Convert to JSON and encrypt
      const jsonData = JSON.stringify(exportData, null, 2);
      const encryptedData = EncryptionService.encrypt(jsonData);

      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const fileName = `green-streak-export-${timestamp}${this.FILE_EXTENSION}`;
      const filePath = `${(FileSystem as any).documentDirectory}${fileName}`;

      // Write encrypted data to file
      await FileSystem.writeAsStringAsync(filePath, encryptedData);

      logger.info('DATA', 'Export file created', { filePath, fileName });

      // Share the file
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/octet-stream',
          dialogTitle: 'Export Green Streak Data',
        });
        logger.info('DATA', 'Export file shared successfully');
      } else {
        logger.warn('DATA', 'Sharing not available on this platform');
      }

      return {
        success: true,
        filePath,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown export error';
      logger.error('DATA', 'Data export failed', { error: errorMessage });
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  static async importData(): Promise<ImportResult> {
    try {
      logger.info('DATA', 'Starting data import');

      // Pick document
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        logger.info('DATA', 'Import cancelled by user');
        return {
          success: false,
          message: 'Import cancelled',
        };
      }

      const file = result.assets[0];
      logger.debug('DATA', 'File selected for import', { 
        name: file.name, 
        size: file.size,
        uri: file.uri 
      });

      // Validate file extension
      if (!file.name.endsWith(this.FILE_EXTENSION)) {
        logger.warn('DATA', 'Invalid file extension', { fileName: file.name });
        return {
          success: false,
          message: `Invalid file type. Please select a ${this.FILE_EXTENSION} file.`,
        };
      }

      // Read file contents
      const encryptedData = await FileSystem.readAsStringAsync(file.uri);

      // Validate encrypted data format
      if (!EncryptionService.validateEncryptedData(encryptedData)) {
        logger.error('DATA', 'Invalid encrypted data format');
        return {
          success: false,
          message: 'Invalid or corrupted export file.',
        };
      }

      // Decrypt and parse data
      const decryptedData = EncryptionService.decrypt(encryptedData);
      const exportData: ExportData = JSON.parse(decryptedData);

      logger.debug('DATA', 'Import data parsed', { 
        version: exportData.version,
        exportDate: exportData.exportDate,
        tasksCount: exportData.data.tasks.length,
        logsCount: exportData.data.logs.length,
      });

      // Validate version compatibility
      if (exportData.version !== this.EXPORT_VERSION) {
        logger.warn('DATA', 'Version mismatch', { 
          exportVersion: exportData.version,
          currentVersion: this.EXPORT_VERSION 
        });
        // Continue anyway, but log the warning
      }

      // Import data to database
      const importResult = await this.performImport(exportData);

      logger.info('DATA', 'Data import completed', importResult);
      return importResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown import error';
      logger.error('DATA', 'Data import failed', { error: errorMessage });
      
      return {
        success: false,
        message: `Import failed: ${errorMessage}`,
      };
    }
  }

  private static async performImport(exportData: ExportData): Promise<ImportResult> {
    const errors: string[] = [];
    let tasksImported = 0;
    let logsImported = 0;
    let achievementsImported = 0;
    let settingsImported = false;
    let onboardingImported = false;

    try {
      // Import tasks
      for (const task of exportData.data.tasks) {
        try {
          // Check if task already exists (by ID or name)
          const existing = await TaskRepository.getById(task.id);
          if (existing) {
            logger.debug('DATA', 'Task already exists, skipping', { taskId: task.id });
            continue;
          }

          await TaskRepository.create({
            name: task.name,
            description: task.description,
            icon: task.icon,
            color: task.color,
            isMultiCompletion: task.isMultiCompletion,
            reminderEnabled: task.reminderEnabled,
            reminderTime: task.reminderTime,
            reminderFrequency: task.reminderFrequency,
          });
          tasksImported++;
        } catch (error) {
          const errorMsg = `Failed to import task "${task.name}": ${error}`;
          errors.push(errorMsg);
          logger.error('DATA', errorMsg);
        }
      }

      // Import logs
      for (const log of exportData.data.logs) {
        try {
          // Check if log already exists (by taskId and date)
          const existing = await LogRepository.getByTaskAndDate(log.taskId, log.date);
          if (existing) {
            logger.debug('DATA', 'Log already exists, skipping', { 
              taskId: log.taskId, 
              date: log.date 
            });
            continue;
          }

          await LogRepository.create({
            taskId: log.taskId,
            date: log.date,
            count: log.count,
          });
          logsImported++;
        } catch (error) {
          const errorMsg = `Failed to import log for task ${log.taskId} on ${log.date}: ${error}`;
          errors.push(errorMsg);
          logger.error('DATA', errorMsg);
        }
      }

      // Import achievements if they exist in the export
      if (exportData.data.achievements && exportData.data.achievements.length > 0) {
        for (const achievement of exportData.data.achievements) {
          try {
            // Check if achievement already unlocked
            const existing = await achievementRepository.isUnlocked(achievement.achievementId);
            if (existing) {
              logger.debug('DATA', 'Achievement already unlocked, skipping', { 
                achievementId: achievement.achievementId 
              });
              continue;
            }

            // Record the unlock (note: original unlock date is not preserved, 
            // will use current date - this could be enhanced in the future)
            await achievementRepository.recordUnlock(
              achievement.achievementId,
              achievement.taskId,
              achievement.metadata
            );
            achievementsImported++;
          } catch (error) {
            const errorMsg = `Failed to import achievement ${achievement.achievementId}: ${error}`;
            errors.push(errorMsg);
            logger.error('DATA', errorMsg);
          }
        }
        logger.info('DATA', 'Achievements imported', { count: achievementsImported });
      }

      // Import settings if they exist in the export
      if (exportData.data.settings) {
        try {
          const settingsStore = useSettingsStore.getState();
          
          // Update each setting if it exists in the imported data
          if (typeof exportData.data.settings.globalReminderEnabled === 'boolean') {
            await settingsStore.updateGlobalReminder(
              exportData.data.settings.globalReminderEnabled,
              exportData.data.settings.globalReminderTime
            );
          }
          
          if (typeof exportData.data.settings.debugLoggingEnabled === 'boolean') {
            settingsStore.setDebugLogging(exportData.data.settings.debugLoggingEnabled);
          }
          
          if (exportData.data.settings.currentLogLevel) {
            settingsStore.setLogLevel(exportData.data.settings.currentLogLevel);
          }
          
          // Import calendar color
          if (exportData.data.settings.calendarColor) {
            settingsStore.setCalendarColor(exportData.data.settings.calendarColor);
          }
          
          // Import dynamic icon setting
          if (typeof exportData.data.settings.dynamicIconEnabled === 'boolean') {
            await settingsStore.setDynamicIconEnabled(exportData.data.settings.dynamicIconEnabled);
          }
          
          // Import notification settings
          if (exportData.data.settings.notificationSettings) {
            await settingsStore.updateNotificationSettings(exportData.data.settings.notificationSettings);
          }

          settingsImported = true;
          logger.info('DATA', 'Settings imported successfully');
        } catch (error) {
          const errorMsg = `Failed to import settings: ${error}`;
          errors.push(errorMsg);
          logger.error('DATA', errorMsg);
        }
      }

      // Import onboarding state if it exists
      if (exportData.data.onboarding) {
        try {
          const onboardingStore = useOnboardingStore.getState();
          if (exportData.data.onboarding.hasCompletedOnboarding) {
            onboardingStore.completeOnboarding();
          }
          onboardingImported = true;
          logger.info('DATA', 'Onboarding state imported');
        } catch (error) {
          const errorMsg = `Failed to import onboarding state: ${error}`;
          errors.push(errorMsg);
          logger.error('DATA', errorMsg);
        }
      }

      const parts = [];
      if (tasksImported > 0) parts.push(`${tasksImported} tasks`);
      if (logsImported > 0) parts.push(`${logsImported} logs`);
      if (achievementsImported > 0) parts.push(`${achievementsImported} achievements`);
      if (settingsImported) parts.push('settings');
      if (onboardingImported) parts.push('onboarding');
      
      const message = parts.length > 0 
        ? `Successfully imported ${parts.join(', ')}.${errors.length > 0 ? ` ${errors.length} errors occurred.` : ''}`
        : 'No new data to import (all data already exists).';

      return {
        success: true,
        message,
        data: {
          tasksImported,
          logsImported,
          achievementsImported,
          settingsImported,
          onboardingImported,
          errors: errors.length > 0 ? errors : undefined,
        },
      };

    } catch (error) {
      logger.error('DATA', 'Import operation failed', { error });
      throw error;
    }
  }

  private static getDateRange(logs: Log[]): { earliest: string; latest: string } | undefined {
    if (logs.length === 0) return undefined;

    const dates = logs.map(log => log.date).sort();
    return {
      earliest: dates[0],
      latest: dates[dates.length - 1],
    };
  }

  static async validateExportFile(filePath: string): Promise<boolean> {
    try {
      const encryptedData = await FileSystem.readAsStringAsync(filePath);
      
      return EncryptionService.validateEncryptedData(encryptedData);
    } catch {
      return false;
    }
  }

  static getExportMetadata(exportData: ExportData): string {
    const { metadata, exportDate, data } = exportData;
    const date = new Date(exportDate).toLocaleDateString();
    
    let summary = `Export from ${date}\n`;
    summary += `${metadata.totalTasks} tasks, ${metadata.totalLogs} logs`;
    
    // Include settings information if present
    if (data.settings) {
      summary += `, settings included`;
    }
    
    summary += `\n`;
    
    if (metadata.dateRange) {
      const earliest = new Date(metadata.dateRange.earliest).toLocaleDateString();
      const latest = new Date(metadata.dateRange.latest).toLocaleDateString();
      summary += `Activity from ${earliest} to ${latest}`;
    }
    
    return summary;
  }
}

export default DataExportService;