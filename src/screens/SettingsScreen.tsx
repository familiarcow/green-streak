import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Alert
} from 'react-native';
import { AnimatedButton } from '../components/AnimatedButton';
import { Icon } from '../components/common/Icon';
import { useSettingsStore } from '../store/settingsStore';
import { useOnboardingStore } from '../store/onboardingStore';
import { useDataStore } from '../store/dataStore';
import { useTasksStore } from '../store/tasksStore';
import { useLogsStore } from '../store/logsStore';
import notificationService from '../services/NotificationService';
import { colors, textStyles, spacing, shadows } from '../theme';
import logger from '../utils/logger';

import { SettingsScreenProps } from '../types';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
  const {
    globalReminderEnabled,
    globalReminderTime,
    debugLoggingEnabled,
    currentLogLevel,
    firstDayOfWeek,
    updateGlobalReminder,
    setDebugLogging,
    setLogLevel,
    setFirstDayOfWeek,
    exportSettings,
    resetSettings,
  } = useSettingsStore();

  const { hasCompletedOnboarding, resetOnboarding } = useOnboardingStore();
  const { exportData, importData, isExporting, isImporting } = useDataStore();
  const { loadTasks } = useTasksStore();
  const { loadContributionData } = useLogsStore();

  const [reminderTime, setReminderTime] = useState(globalReminderTime);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notificationPermissions, setNotificationPermissions] = useState<'unknown' | 'granted' | 'denied' | 'undetermined'>('unknown');

  useEffect(() => {
    checkNotificationPermissions();
  }, []);

  const checkNotificationPermissions = async () => {
    try {
      const permissions = await notificationService.requestPermissions();
      setNotificationPermissions(permissions.status);
      logger.debug('UI', 'Notification permissions checked', { status: permissions.status });
    } catch (error) {
      logger.error('UI', 'Failed to check notification permissions', { error });
      setNotificationPermissions('denied');
    }
  };

  const handleGlobalReminderToggle = async (enabled: boolean) => {
    try {
      if (enabled && notificationPermissions !== 'granted') {
        const permissions = await notificationService.requestPermissions();
        setNotificationPermissions(permissions.status);
        
        if (permissions.status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'To enable reminders, please allow notifications in your device settings.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      await updateGlobalReminder(enabled, reminderTime);
      logger.info('UI', 'Global reminder toggled', { enabled, time: reminderTime });
    } catch (error) {
      logger.error('UI', 'Failed to toggle global reminder', { error });
      Alert.alert('Error', 'Failed to update reminder settings. Please try again.');
    }
  };

  const handleTimeChange = (newTime: string) => {
    setReminderTime(newTime);
    if (globalReminderEnabled) {
      updateGlobalReminder(true, newTime);
    }
  };

  const handleExportSettings = () => {
    try {
      const exported = exportSettings();
      logger.info('UI', 'Settings exported to console');
      console.log('Green Streak Settings Export:', exported);
      Alert.alert(
        'Settings Exported',
        'Your settings have been exported to the console. Check the developer logs.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      logger.error('UI', 'Failed to export settings', { error });
      Alert.alert('Error', 'Failed to export settings.');
    }
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to defaults? This will cancel all notifications.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetSettings();
              setReminderTime('20:00');
              logger.info('UI', 'Settings reset');
              Alert.alert('Settings Reset', 'All settings have been reset to defaults.');
            } catch (error) {
              logger.error('UI', 'Failed to reset settings', { error });
              Alert.alert('Error', 'Failed to reset settings.');
            }
          },
        },
      ]
    );
  };

  const handleResetOnboarding = () => {
    Alert.alert(
      'Reset Onboarding',
      'This will show the welcome tutorial the next time you open the app with no habits.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'default',
          onPress: () => {
            resetOnboarding();
            logger.info('UI', 'Onboarding reset from settings');
            Alert.alert('Onboarding Reset', 'The welcome tutorial will show again when appropriate.');
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Export all your habit data to a file. The file will be encrypted for privacy.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          style: 'default',
          onPress: () => {
            exportData((success, filePath, error) => {
              if (success) {
                Alert.alert(
                  'Export Successful',
                  'Your data has been exported and shared. Keep this file safe as it contains all your habit data.',
                  [{ text: 'OK' }]
                );
              } else {
                Alert.alert(
                  'Export Failed', 
                  error || 'Failed to export data. Please try again.',
                  [{ text: 'OK' }]
                );
              }
            });
          },
        },
      ]
    );
  };

  const handleImportData = () => {
    Alert.alert(
      'Import Data',
      'Import habit data from a Green Streak export file. This will add to your existing data without replacing it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'default',
          onPress: () => {
            importData((result) => {
              if (result.success) {
                Alert.alert(
                  'Import Successful',
                  result.message,
                  [{ 
                    text: 'OK', 
                    onPress: () => {
                      // Refresh data after import
                      loadTasks();
                      loadContributionData(true);
                    }
                  }]
                );
              } else {
                Alert.alert(
                  'Import Failed',
                  result.message,
                  [{ text: 'OK' }]
                );
              }
            });
          },
        },
      ]
    );
  };

  const timeOptions = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
    '19:00', '20:00', '21:00', '22:00', '23:00'
  ];

  const logLevelOptions: Array<{ value: typeof currentLogLevel; label: string }> = [
    { value: 'DEBUG', label: 'Debug (All logs)' },
    { value: 'INFO', label: 'Info (Important events)' },
    { value: 'WARN', label: 'Warnings (Issues only)' },
    { value: 'ERROR', label: 'Errors (Critical issues)' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <TouchableOpacity 
          onPress={onClose} 
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel="Close settings"
          accessibilityHint="Double tap to close the settings screen"
        >
          <Text style={styles.closeButtonText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          {notificationPermissions === 'denied' && (
            <View style={styles.warningCard}>
              <Text style={styles.warningText}>
                Notifications are disabled. Enable them in device settings to use reminders.
              </Text>
            </View>
          )}
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Daily Reminder</Text>
              <Text style={styles.settingDescription}>
                Get reminded to log your habits every day
              </Text>
            </View>
            <Switch
              value={globalReminderEnabled}
              onValueChange={handleGlobalReminderToggle}
              trackColor={{ false: colors.interactive.default, true: colors.primary }}
              thumbColor={colors.surface}
              disabled={notificationPermissions === 'denied'}
              accessibilityLabel="Daily reminder toggle"
              accessibilityHint={globalReminderEnabled ? "Double tap to disable daily reminders" : "Double tap to enable daily reminders"}
            />
          </View>

          {globalReminderEnabled && (
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Reminder Time</Text>
                <TouchableOpacity 
                  onPress={() => setShowTimePicker(!showTimePicker)}
                  accessibilityRole="button"
                  accessibilityLabel={`Reminder time: ${reminderTime}`}
                  accessibilityHint="Double tap to change reminder time"
                >
                  <Text style={styles.timeDisplay}>{reminderTime}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {showTimePicker && (
            <View style={styles.timePicker}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {timeOptions.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeOption,
                      reminderTime === time && styles.timeOptionSelected,
                    ]}
                    onPress={() => {
                      handleTimeChange(time);
                      setShowTimePicker(false);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Set reminder time to ${time}`}
                    accessibilityHint="Double tap to select this time"
                    accessibilityState={{ selected: reminderTime === time }}
                  >
                    <Text style={[
                      styles.timeOptionText,
                      reminderTime === time && styles.timeOptionTextSelected,
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Display Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>First Day of Week</Text>
              <Text style={styles.settingDescription}>
                Choose which day starts the week in your habit calendar
              </Text>
            </View>
            <View style={styles.dayPicker}>
              <TouchableOpacity
                style={[
                  styles.dayOption,
                  firstDayOfWeek === 'sunday' && styles.dayOptionSelected,
                ]}
                onPress={() => setFirstDayOfWeek('sunday')}
                accessibilityRole="button"
                accessibilityLabel="Set first day of week to Sunday"
                accessibilityHint="Double tap to select Sunday as the first day of the week"
                accessibilityState={{ selected: firstDayOfWeek === 'sunday' }}
              >
                <Text style={[
                  styles.dayOptionText,
                  firstDayOfWeek === 'sunday' && styles.dayOptionTextSelected,
                ]}>
                  Sunday
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dayOption,
                  firstDayOfWeek === 'monday' && styles.dayOptionSelected,
                ]}
                onPress={() => setFirstDayOfWeek('monday')}
                accessibilityRole="button"
                accessibilityLabel="Set first day of week to Monday"
                accessibilityHint="Double tap to select Monday as the first day of the week"
                accessibilityState={{ selected: firstDayOfWeek === 'monday' }}
              >
                <Text style={[
                  styles.dayOptionText,
                  firstDayOfWeek === 'monday' && styles.dayOptionTextSelected,
                ]}>
                  Monday
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Developer Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Debug Logging</Text>
              <Text style={styles.settingDescription}>
                Show detailed logs for debugging
              </Text>
            </View>
            <Switch
              value={debugLoggingEnabled}
              onValueChange={setDebugLogging}
              trackColor={{ false: colors.interactive.default, true: colors.primary }}
              thumbColor={colors.surface}
              accessibilityLabel="Debug logging toggle"
              accessibilityHint={debugLoggingEnabled ? "Double tap to disable debug logging" : "Double tap to enable debug logging"}
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Log Level</Text>
              <Text style={styles.settingDescription}>
                Control which logs are shown
              </Text>
            </View>
            <View style={styles.logLevelPicker}>
              {logLevelOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.logLevelOption,
                    currentLogLevel === option.value && styles.logLevelOptionSelected,
                  ]}
                  onPress={() => setLogLevel(option.value)}
                >
                  <Text style={[
                    styles.logLevelText,
                    currentLogLevel === option.value && styles.logLevelTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          
          <AnimatedButton
            title={isExporting ? "Exporting..." : "Export All Data"}
            onPress={handleExportData}
            variant="primary"
            style={{ marginBottom: spacing[2] }}
            disabled={isExporting || isImporting}
            icon={isExporting ? 'loader' : undefined}
          />

          <AnimatedButton
            title={isImporting ? "Importing..." : "Import Data"}
            onPress={handleImportData}
            variant="secondary"
            style={{ marginBottom: spacing[2] }}
            disabled={isExporting || isImporting}
            icon={isImporting ? 'loader' : undefined}
          />

          <AnimatedButton
            title="Export Settings"
            onPress={handleExportSettings}
            variant="secondary"
            style={{ marginBottom: spacing[2] }}
          />

          <AnimatedButton
            title="Reset All Settings"
            onPress={handleResetSettings}
            variant="destructive"
            style={{ marginBottom: spacing[2] }}
          />

          {hasCompletedOnboarding && (
            <AnimatedButton
              title="Reset Onboarding"
              onPress={handleResetOnboarding}
              variant="secondary"
            />
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Green Streak v1.0.0{'\n'}
            Privacy-first habit tracking
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  
  title: {
    ...textStyles.h2,
    color: colors.text.primary,
  },
  
  closeButton: {
    padding: spacing[2],
  },
  
  closeButtonText: {
    ...textStyles.button,
    color: colors.primary,
  },
  
  scrollView: {
    flex: 1,
    padding: spacing[4],
  },
  
  section: {
    marginBottom: spacing[6],
  },
  
  sectionTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  
  warningCard: {
    backgroundColor: colors.warning,
    padding: spacing[3],
    borderRadius: spacing[2],
    marginBottom: spacing[3],
  },
  
  warningText: {
    ...textStyles.bodySmall,
    color: colors.text.inverse,
    textAlign: 'center',
  },
  
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    backgroundColor: colors.surface,
    borderRadius: spacing[2],
    marginBottom: spacing[2],
    ...shadows.sm,
  },
  
  settingInfo: {
    flex: 1,
  },
  
  settingTitle: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  
  settingDescription: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  
  timeDisplay: {
    ...textStyles.body,
    color: colors.primary,
    fontWeight: '600',
  },
  
  timePicker: {
    backgroundColor: colors.surface,
    borderRadius: spacing[2],
    padding: spacing[3],
    marginBottom: spacing[2],
    ...shadows.sm,
  },
  
  timeOption: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: spacing[2],
    marginRight: spacing[2],
    backgroundColor: colors.interactive.default,
  },
  
  timeOptionSelected: {
    backgroundColor: colors.primary,
  },
  
  timeOptionText: {
    ...textStyles.body,
    color: colors.text.primary,
  },
  
  timeOptionTextSelected: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
  
  logLevelPicker: {
    marginTop: spacing[2],
  },
  
  logLevelOption: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: spacing[2],
    marginBottom: spacing[1],
    backgroundColor: colors.interactive.default,
  },
  
  logLevelOptionSelected: {
    backgroundColor: colors.primary,
  },
  
  logLevelText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
  
  logLevelTextSelected: {
    color: colors.text.inverse,
    fontWeight: '600',
  },

  dayPicker: {
    flexDirection: 'row',
    gap: spacing[2],
  },

  dayOption: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: spacing[2],
    backgroundColor: colors.interactive.default,
  },

  dayOptionSelected: {
    backgroundColor: colors.primary,
  },

  dayOptionText: {
    ...textStyles.bodySmall,
    color: colors.text.primary,
  },

  dayOptionTextSelected: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
  
  footer: {
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
  
  footerText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default SettingsScreen;