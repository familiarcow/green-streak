import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Switch,
  Alert
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming,
  interpolateColor,
  Easing
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedButton } from '../components/AnimatedButton';
import { Icon } from '../components/common/Icon';
import { ColorPickerModal } from '../components/ColorPicker/ColorPickerModal';
import { CalendarColorPreview } from '../components/CalendarColorPreview';
import { useSettingsStore, DEFAULT_CALENDAR_COLOR } from '../store/settingsStore';
import { generateContributionPalette, DEFAULT_CONTRIBUTION_PALETTE, CALENDAR_COLOR_PRESETS } from '../utils/colorUtils';
import { useAccentColor } from '../hooks';
import { useOnboardingStore } from '../store/onboardingStore';
import { useDataStore } from '../store/dataStore';
import { useTasksStore } from '../store/tasksStore';
import { useLogsStore } from '../store/logsStore';
import notificationService from '../services/NotificationService';
import { colors, textStyles, spacing, shadows, glassStyles } from '../theme';
import { radiusValues } from '../theme/utils';
import logger from '../utils/logger';

import { SettingsScreenProps } from '../types';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
  const {
    globalReminderEnabled,
    globalReminderTime,
    debugLoggingEnabled,
    currentLogLevel,
    calendarColor,
    dynamicIconEnabled,
    notificationSettings,
    updateGlobalReminder,
    setDebugLogging,
    setLogLevel,
    setCalendarColor,
    setDynamicIconEnabled,
    exportSettings,
    resetSettings,
    updateNotificationSettings,
    updateDailyNotification,
    updateStreakProtection,
  } = useSettingsStore();

  const { hasCompletedOnboarding, resetOnboarding } = useOnboardingStore();
  const { exportData, importData, isExporting, isImporting } = useDataStore();
  const { loadTasks } = useTasksStore();
  const { loadContributionData } = useLogsStore();

  const [reminderTime, setReminderTime] = useState(globalReminderTime);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notificationPermissions, setNotificationPermissions] = useState<'unknown' | 'granted' | 'denied' | 'undetermined'>('unknown');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [showCalendarColorPicker, setShowCalendarColorPicker] = useState(false);
  const [isDynamicIconLoading, setIsDynamicIconLoading] = useState(false);
  const [dynamicIconPlatformNote, setDynamicIconPlatformNote] = useState<string | null>(null);
  const [isDynamicIconSupported, setIsDynamicIconSupported] = useState(true);

  // Get accent color for UI elements
  const accentColor = useAccentColor();

  // Get the current calendar color palette for preview
  const currentCalendarColor = calendarColor || DEFAULT_CALENDAR_COLOR;
  const calendarPalette = currentCalendarColor === DEFAULT_CALENDAR_COLOR
    ? DEFAULT_CONTRIBUTION_PALETTE
    : generateContributionPalette(currentCalendarColor);

  useEffect(() => {
    checkNotificationPermissions();
    checkDynamicIconSupport();
  }, []);

  const checkDynamicIconSupport = async () => {
    try {
      const { getDynamicIconService } = await import('../services/ServiceRegistry');
      const dynamicIconService = getDynamicIconService();
      const isSupported = dynamicIconService.isSupported();
      const platformNote = dynamicIconService.getPlatformNotes();

      setIsDynamicIconSupported(isSupported);
      setDynamicIconPlatformNote(platformNote);

      logger.debug('UI', 'Dynamic icon support checked', { isSupported, platformNote });
    } catch (error) {
      logger.error('UI', 'Failed to check dynamic icon support', { error });
      setIsDynamicIconSupported(false);
      setDynamicIconPlatformNote('Dynamic icons require a development build');
    }
  };

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

  const handleDynamicIconToggle = async (enabled: boolean) => {
    // Check if supported before allowing toggle
    if (!isDynamicIconSupported) {
      Alert.alert(
        'Feature Not Available',
        dynamicIconPlatformNote || 'Dynamic icons require a development build (not available in Expo Go).',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsDynamicIconLoading(true);
      await setDynamicIconEnabled(enabled);
      logger.info('UI', 'Dynamic icon toggled', { enabled });

      if (enabled && dynamicIconPlatformNote) {
        // Show platform-specific note (e.g., Android restart required)
        Alert.alert(
          'Dynamic Icon Enabled',
          `Your app icon will now show your last 4 days of activity.\n\n${dynamicIconPlatformNote}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      logger.error('UI', 'Failed to toggle dynamic icon', { error });
      Alert.alert('Error', 'Failed to update app icon setting.');
    } finally {
      setIsDynamicIconLoading(false);
    }
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
          <Text style={[styles.closeButtonText, { color: accentColor }]}>Done</Text>
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
          
          {/* Master Notifications Toggle */}
          <View style={[styles.settingItem, glassStyles.card]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Enable Notifications</Text>
              <Text style={styles.settingDescription}>
                Master toggle for all notifications
              </Text>
            </View>
            <Switch
              value={notificationSettings?.global?.enabled ?? false}
              onValueChange={(enabled) => {
                updateNotificationSettings({
                  global: { ...notificationSettings?.global, enabled }
                });
              }}
              trackColor={{ false: colors.interactive.default, true: accentColor }}
              thumbColor={colors.surface}
              disabled={notificationPermissions === 'denied'}
              accessibilityLabel="Master notifications toggle"
              accessibilityHint={notificationSettings?.global?.enabled ? "Double tap to disable all notifications" : "Double tap to enable notifications"}
            />
          </View>

          {notificationSettings?.global?.enabled && (
            <>
              {/* Daily Smart Notifications */}
              <View style={[styles.subSection, styles.fadeIn]}>
                <View style={[styles.settingItem, glassStyles.card]}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Daily Summary</Text>
                    <Text style={styles.settingDescription}>
                      Smart daily reminders based on your activity
                    </Text>
                  </View>
                  <Switch
                    value={notificationSettings?.daily?.enabled ?? false}
                    onValueChange={(enabled) => {
                      updateDailyNotification({ enabled });
                    }}
                    trackColor={{ false: colors.interactive.default, true: accentColor }}
                    thumbColor={colors.surface}
                  />
                </View>

                {notificationSettings?.daily?.enabled && (
                  <>
                    <View style={styles.settingItem}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingSubtitle}>Time</Text>
                        <TouchableOpacity onPress={() => setShowTimePicker(!showTimePicker)}>
                          <Text style={[styles.timeDisplay, { color: accentColor }]}>
                            {notificationSettings?.daily?.time || '20:00'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={[styles.settingItem, glassStyles.cardSubtle]}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingSubtitle}>Smart Mode</Text>
                        <Text style={styles.settingDescription}>
                          Contextual messages based on your progress
                        </Text>
                      </View>
                      <Switch
                        value={notificationSettings?.daily?.smartMode ?? true}
                        onValueChange={(smartMode) => {
                          updateDailyNotification({ smartMode });
                        }}
                        trackColor={{ false: colors.interactive.default, true: accentColor }}
                        thumbColor={colors.surface}
                      />
                    </View>

                    <View style={styles.settingItem}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingSubtitle}>Include Motivation</Text>
                        <Text style={styles.settingDescription}>
                          Add motivational quotes to notifications
                        </Text>
                      </View>
                      <Switch
                        value={notificationSettings?.daily?.includeMotivation ?? false}
                        onValueChange={(includeMotivation) => {
                          updateDailyNotification({ includeMotivation });
                        }}
                        trackColor={{ false: colors.interactive.default, true: accentColor }}
                        thumbColor={colors.surface}
                      />
                    </View>
                  </>
                )}
              </View>

              {/* Streak Protection */}
              <View style={styles.subSection}>
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Streak Protection</Text>
                    <Text style={styles.settingDescription}>
                      Get notified when streaks are at risk
                    </Text>
                  </View>
                  <Switch
                    value={notificationSettings?.streaks?.protectionEnabled ?? false}
                    onValueChange={(protectionEnabled) => {
                      updateStreakProtection({ protectionEnabled });
                    }}
                    trackColor={{ false: colors.interactive.default, true: accentColor }}
                    thumbColor={colors.surface}
                  />
                </View>

                {notificationSettings?.streaks?.protectionEnabled && (
                  <>
                    <View style={styles.settingItem}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingSubtitle}>Protection Time</Text>
                        <TouchableOpacity onPress={() => setExpandedSections({...expandedSections, streakTime: true})}>
                          <Text style={[styles.timeDisplay, { color: accentColor }]}>
                            {notificationSettings?.streaks?.protectionTime || '21:00'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={[styles.settingItem, glassStyles.cardSubtle]}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingSubtitle}>Minimum Streak Days</Text>
                        <Text style={styles.settingDescription}>
                          Only protect streaks longer than {notificationSettings?.streaks?.protectionThreshold || 3} days
                        </Text>
                      </View>
                      <View style={styles.buttonGroup}>
                        {[1, 3, 7, 14].map(days => (
                          <TouchableOpacity
                            key={days}
                            style={[
                              styles.optionButton,
                              notificationSettings?.streaks?.protectionThreshold === days && [glassStyles.buttonActive, { backgroundColor: accentColor, borderColor: accentColor }]
                            ]}
                            onPress={() => updateStreakProtection({ protectionThreshold: days })}
                          >
                            <Text style={[
                              styles.optionButtonText,
                              notificationSettings?.streaks?.protectionThreshold === days && styles.optionButtonTextActive
                            ]}>
                              {days}d
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.settingItem}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingSubtitle}>Priority Alerts</Text>
                        <Text style={styles.settingDescription}>
                          Higher priority for longer streaks
                        </Text>
                      </View>
                      <Switch
                        value={notificationSettings?.streaks?.priorityBasedAlerts ?? true}
                        onValueChange={(priorityBasedAlerts) => {
                          updateStreakProtection({ priorityBasedAlerts });
                        }}
                        trackColor={{ false: colors.interactive.default, true: accentColor }}
                        thumbColor={colors.surface}
                      />
                    </View>
                  </>
                )}
              </View>

              {/* Achievement Notifications */}
              <View style={styles.subSection}>
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Achievements</Text>
                    <Text style={styles.settingDescription}>
                      Celebrate milestones and victories
                    </Text>
                  </View>
                  <Switch
                    value={notificationSettings?.achievements?.enabled ?? true}
                    onValueChange={(enabled) => {
                      updateNotificationSettings({
                        achievements: { ...notificationSettings?.achievements, enabled }
                      });
                    }}
                    trackColor={{ false: colors.interactive.default, true: accentColor }}
                    thumbColor={colors.surface}
                  />
                </View>

                {notificationSettings?.achievements?.enabled && (
                  <>
                    <View style={styles.settingItem}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingSubtitle}>Weekly Recap</Text>
                        <Text style={styles.settingDescription}>
                          Get a summary of your week
                        </Text>
                      </View>
                      <Switch
                        value={notificationSettings?.achievements?.weeklyRecapEnabled ?? false}
                        onValueChange={(weeklyRecapEnabled) => {
                          updateNotificationSettings({
                            achievements: { ...notificationSettings?.achievements, weeklyRecapEnabled }
                          });
                        }}
                        trackColor={{ false: colors.interactive.default, true: accentColor }}
                        thumbColor={colors.surface}
                      />
                    </View>

                    {notificationSettings?.achievements?.weeklyRecapEnabled && (
                      <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                          <Text style={styles.settingSubtitle}>Recap Day</Text>
                        </View>
                        <View style={styles.buttonGroup}>
                          <TouchableOpacity
                            style={[
                              styles.optionButton,
                              notificationSettings?.achievements?.weeklyRecapDay === 'sunday' && [glassStyles.buttonActive, { backgroundColor: accentColor, borderColor: accentColor }]
                            ]}
                            onPress={() => updateNotificationSettings({
                              achievements: { ...notificationSettings?.achievements, weeklyRecapDay: 'sunday' }
                            })}
                          >
                            <Text style={[
                              styles.optionButtonText,
                              notificationSettings?.achievements?.weeklyRecapDay === 'sunday' && styles.optionButtonTextActive
                            ]}>
                              Sun
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[
                              styles.optionButton,
                              notificationSettings?.achievements?.weeklyRecapDay === 'monday' && [glassStyles.buttonActive, { backgroundColor: accentColor, borderColor: accentColor }]
                            ]}
                            onPress={() => updateNotificationSettings({
                              achievements: { ...notificationSettings?.achievements, weeklyRecapDay: 'monday' }
                            })}
                          >
                            <Text style={[
                              styles.optionButtonText,
                              notificationSettings?.achievements?.weeklyRecapDay === 'monday' && styles.optionButtonTextActive
                            ]}>
                              Mon
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* Advanced Settings */}
              <View style={styles.subSection}>
                <TouchableOpacity 
                  style={styles.settingItem}
                  onPress={() => setExpandedSections({...expandedSections, advanced: !expandedSections.advanced})}
                >
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Advanced Settings</Text>
                    <Text style={styles.settingDescription}>
                      Quiet hours, weekend mode, and more
                    </Text>
                  </View>
                  <Icon 
                    name={expandedSections.advanced ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={colors.text.secondary}
                  />
                </TouchableOpacity>

                {expandedSections.advanced && (
                  <>
                    <View style={styles.settingItem}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingSubtitle}>Weekend Mode</Text>
                        <Text style={styles.settingDescription}>
                          Notification behavior on weekends
                        </Text>
                      </View>
                      <View style={styles.buttonGroup}>
                        {(['off', 'reduced', 'normal'] as const).map(mode => (
                          <TouchableOpacity
                            key={mode}
                            style={[
                              styles.optionButton,
                              notificationSettings?.global?.weekendMode === mode && [glassStyles.buttonActive, { backgroundColor: accentColor, borderColor: accentColor }]
                            ]}
                            onPress={() => updateNotificationSettings({
                              global: { ...notificationSettings?.global, weekendMode: mode }
                            })}
                          >
                            <Text style={[
                              styles.optionButtonText,
                              notificationSettings?.global?.weekendMode === mode && styles.optionButtonTextActive
                            ]}>
                              {mode}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.settingItem}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingSubtitle}>Quiet Hours</Text>
                        <Text style={styles.settingDescription}>
                          No notifications during these hours
                        </Text>
                      </View>
                      <Switch
                        value={notificationSettings?.global?.quietHours?.enabled ?? false}
                        onValueChange={(enabled) => {
                          updateNotificationSettings({
                            global: {
                              ...notificationSettings?.global,
                              quietHours: { ...notificationSettings?.global?.quietHours, enabled }
                            }
                          });
                        }}
                        trackColor={{ false: colors.interactive.default, true: accentColor }}
                        thumbColor={colors.surface}
                      />
                    </View>

                    {notificationSettings?.global?.quietHours?.enabled && (
                      <View style={styles.settingItem}>
                        <View style={styles.settingInfo}>
                          <Text style={styles.settingDescription}>
                            From {notificationSettings?.global?.quietHours?.start || '22:00'} to {notificationSettings?.global?.quietHours?.end || '08:00'}
                          </Text>
                        </View>
                      </View>
                    )}

                    <View style={styles.settingItem}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingSubtitle}>Sound</Text>
                        <Text style={styles.settingDescription}>
                          Play sounds with notifications
                        </Text>
                      </View>
                      <Switch
                        value={notificationSettings?.global?.soundEnabled ?? true}
                        onValueChange={(soundEnabled) => {
                          updateNotificationSettings({
                            global: { ...notificationSettings?.global, soundEnabled }
                          });
                        }}
                        trackColor={{ false: colors.interactive.default, true: accentColor }}
                        thumbColor={colors.surface}
                      />
                    </View>

                    <View style={styles.settingItem}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingSubtitle}>Vibration</Text>
                        <Text style={styles.settingDescription}>
                          Vibrate with notifications
                        </Text>
                      </View>
                      <Switch
                        value={notificationSettings?.global?.vibrationEnabled ?? true}
                        onValueChange={(vibrationEnabled) => {
                          updateNotificationSettings({
                            global: { ...notificationSettings?.global, vibrationEnabled }
                          });
                        }}
                        trackColor={{ false: colors.interactive.default, true: accentColor }}
                        thumbColor={colors.surface}
                      />
                    </View>
                  </>
                )}
              </View>
            </>
          )}

          {showTimePicker && (
            <View style={styles.timePicker}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {timeOptions.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeOption,
                      reminderTime === time && [styles.timeOptionSelected, { backgroundColor: accentColor }],
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

          {/* Calendar Color Setting */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Calendar Color</Text>
              <Text style={styles.settingDescription}>
                Customize the contribution graph colors
              </Text>
              <View style={styles.calendarColorPreview}>
                <CalendarColorPreview palette={calendarPalette} size={20} />
              </View>
            </View>
            <TouchableOpacity
              style={styles.changeColorButton}
              onPress={() => setShowCalendarColorPicker(true)}
              accessibilityRole="button"
              accessibilityLabel="Change calendar color"
              accessibilityHint="Double tap to open color picker"
            >
              <View style={[styles.colorSwatch, { backgroundColor: currentCalendarColor }]} />
              <Icon name="chevron-right" size={16} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Dynamic App Icon Setting */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, !isDynamicIconSupported && styles.settingTitleDisabled]}>
                Dynamic App Icon
              </Text>
              <Text style={styles.settingDescription}>
                Show your last 4 days of activity on the app icon
              </Text>
              {dynamicIconPlatformNote && (
                <Text style={[styles.settingDescription, styles.platformNote]}>
                  {dynamicIconPlatformNote}
                </Text>
              )}
            </View>
            <Switch
              value={dynamicIconEnabled ?? false}
              onValueChange={handleDynamicIconToggle}
              disabled={isDynamicIconLoading || !isDynamicIconSupported}
              trackColor={{ false: colors.interactive.default, true: accentColor }}
              thumbColor={colors.surface}
              accessibilityLabel="Dynamic app icon toggle"
              accessibilityHint={dynamicIconEnabled ? "Double tap to use default app icon" : "Double tap to enable dynamic app icon"}
            />
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
              trackColor={{ false: colors.interactive.default, true: accentColor }}
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
                    currentLogLevel === option.value && [styles.logLevelOptionSelected, { backgroundColor: accentColor }],
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

      {/* Calendar Color Picker Modal */}
      <ColorPickerModal
        visible={showCalendarColorPicker}
        onClose={() => setShowCalendarColorPicker(false)}
        selectedColor={currentCalendarColor}
        onSelectColor={setCalendarColor}
        presets={CALENDAR_COLOR_PRESETS}
        showGradientPreview={true}
      />
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
    borderRadius: radiusValues.box,
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
    borderRadius: radiusValues.box,
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

  settingTitleDisabled: {
    opacity: 0.5,
  },

  platformNote: {
    fontStyle: 'italic',
    color: colors.warning,
  },
  
  timeDisplay: {
    ...textStyles.body,
    color: colors.primary,
    fontWeight: '600',
  },
  
  timePicker: {
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    padding: spacing[3],
    marginBottom: spacing[2],
    ...shadows.sm,
  },
  
  timeOption: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radiusValues.box,
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
    borderRadius: radiusValues.box,
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

  calendarColorPreview: {
    marginTop: spacing[2],
  },

  changeColorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingLeft: spacing[2],
  },

  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: radiusValues.box,
    ...shadows.sm,
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
  
  subSection: {
    paddingLeft: spacing[3],
    marginTop: spacing[2],
  },
  
  settingSubtitle: {
    ...textStyles.bodySmall,
    color: colors.text.primary,
    fontWeight: '500',
  },
  
  buttonGroup: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  
  optionButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radiusValues.box,
    backgroundColor: colors.interactive.default,
  },
  
  optionButtonActive: {
    backgroundColor: colors.primary,
  },
  
  optionButtonText: {
    ...textStyles.bodySmall,
    color: colors.text.primary,
  },
  
  optionButtonTextActive: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
  
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    // Note: backdropFilter not supported in React Native
    ...shadows.md,
  },

  glassCardSubtle: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    // Note: backdropFilter not supported in React Native
  },

  glassButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    // Note: backdropFilter not supported in React Native
  },
  
  fadeIn: {
    opacity: 1,
  },
});

export default SettingsScreen;