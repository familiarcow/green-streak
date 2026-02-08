import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import * as StoreReview from 'expo-store-review';
import { Icon } from '../components/common/Icon';
import { ColorPickerModal } from '../components/ColorPicker/ColorPickerModal';
import { CalendarColorPreview } from '../components/CalendarColorPreview';
import { CalendarViewSettingsModal } from '../components/modals/CalendarViewSettingsModal';
import { useSettingsStore, DEFAULT_CALENDAR_COLOR } from '../store/settingsStore';
import { generateContributionPalette, DEFAULT_CONTRIBUTION_PALETTE, CALENDAR_COLOR_PRESETS } from '../utils/colorUtils';
import { useAccentColor, useSounds } from '../hooks';
import { useDataStore } from '../store/dataStore';
import { useTasksStore } from '../store/tasksStore';
import { useLogsStore } from '../store/logsStore';
import notificationService from '../services/NotificationService';
import { colors, textStyles, spacing, shadows, glassStyles } from '../theme';
import { radiusValues } from '../theme/utils';
import logger from '../utils/logger';
import { formatTimeDisplay } from '../utils/timeHelpers';

import { SettingsScreenProps } from '../types';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
  const {
    globalReminderEnabled,
    globalReminderTime,
    calendarColor,
    notificationSettings,
    soundEffectsEnabled,
    use24HourFormat,
    excludedCalendarTaskIds,
    updateGlobalReminder,
    setCalendarColor,
    setSoundEffectsEnabled,
    setUse24HourFormat,
    resetSettings,
    updateNotificationSettings,
    updateDailyNotification,
    updateStreakProtection,
  } = useSettingsStore();

  const { exportData, importData, clearAllData, isExporting, isImporting, isClearing } = useDataStore();
  const { tasks, loadTasks, updateTask } = useTasksStore();
  const { loadContributionData } = useLogsStore();

  // Filter habits with reminders configured
  const habitsWithReminders = tasks.filter(t => t.reminderEnabled || t.reminderTime);

  const [reminderTime, setReminderTime] = useState(globalReminderTime);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notificationPermissions, setNotificationPermissions] = useState<'unknown' | 'granted' | 'denied' | 'undetermined'>('unknown');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    general: true,
    notifications: true,
    data: false,
  });
  const [showCalendarColorPicker, setShowCalendarColorPicker] = useState(false);
  const [showCalendarViewSettings, setShowCalendarViewSettings] = useState(false);

  // Toggle section expansion
  const toggleSection = (section: string) => {
    const willExpand = !expandedSections[section];
    playExpand(willExpand);
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Get accent color for UI elements
  const accentColor = useAccentColor();

  // Sound effects
  const { playToggle, playExpand, playCaution } = useSounds();

  // Get the current calendar color palette for preview
  const currentCalendarColor = calendarColor || DEFAULT_CALENDAR_COLOR;
  const calendarPalette = currentCalendarColor === DEFAULT_CALENDAR_COLOR
    ? DEFAULT_CONTRIBUTION_PALETTE
    : generateContributionPalette(currentCalendarColor);

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

  const handleClearAllData = () => {
    playCaution();
    Alert.alert(
      'Clear All Data',
      'This will permanently delete ALL your data:\n\n• All habits\n• All completion history\n• All achievements\n• All settings\n\nYou will need to set up the app again from scratch.\n\nThis action cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'I Understand, Continue',
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            Alert.alert(
              'Final Warning',
              'Are you absolutely sure? All your habit data, streaks, and progress will be permanently lost.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Everything',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      const result = await clearAllData();
                      if (result.success) {
                        logger.info('UI', 'All data cleared, triggering app restart');
                        Alert.alert(
                          'Data Cleared',
                          'All data has been deleted. The app will now restart.',
                          [{
                            text: 'OK',
                            onPress: () => {
                              // Close settings and the app will show onboarding
                              onClose();
                            }
                          }]
                        );
                      } else {
                        Alert.alert('Error', result.error || 'Failed to clear data. Please try again.');
                      }
                    } catch (error) {
                      logger.error('UI', 'Failed to clear all data', { error });
                      Alert.alert('Error', 'Failed to clear data. Please try again.');
                    }
                  },
                },
              ]
            );
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

  // Support section handlers
  const handleRateApp = useCallback(async () => {
    try {
      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        await StoreReview.requestReview();
        logger.info('UI', 'Store review requested from settings');
      } else {
        const storeUrl = StoreReview.storeUrl();
        if (storeUrl) {
          await Linking.openURL(storeUrl);
        } else {
          Alert.alert('Not Available', 'Store reviews are not available on this device.');
        }
      }
    } catch (error) {
      logger.error('UI', 'Failed to open store review', { error });
      Alert.alert('Error', 'Could not open the App Store. Please try again later.');
    }
  }, []);

  const handleSendFeedback = useCallback(async () => {
    const email = 'familiarcow@proton.me';
    const subject = 'Green Streak Feedback';
    const body = `Hi! I'd like to share some feedback about Green Streak:\n\n`;
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        logger.info('UI', 'Feedback email opened from settings');
      } else {
        Alert.alert('Send Feedback', `Please email your feedback to:\n\n${email}`, [{ text: 'OK' }]);
      }
    } catch (error) {
      logger.error('UI', 'Failed to open email', { error });
      Alert.alert('Send Feedback', `Please email your feedback to:\n\n${email}`, [{ text: 'OK' }]);
    }
  }, []);

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

        {/* General Section (formerly Display) */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('general')}
            accessibilityRole="button"
            accessibilityLabel={`General section, ${expandedSections.general ? 'expanded' : 'collapsed'}`}
          >
            <Text style={styles.sectionTitle}>General</Text>
            <Icon
              name={expandedSections.general ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.text.secondary}
            />
          </TouchableOpacity>

          {expandedSections.general && (
            <>
              {/* Calendar Color Setting */}
              <TouchableOpacity
                style={[styles.settingItem, glassStyles.card]}
                onPress={() => setShowCalendarColorPicker(true)}
                accessibilityRole="button"
                accessibilityLabel="Change calendar color"
                accessibilityHint="Double tap to open color picker"
              >
                <Text style={styles.settingTitle}>Calendar Color</Text>
                <View style={styles.calendarColorRight}>
                  <CalendarColorPreview palette={calendarPalette} size={18} />
                  <Icon name="edit" size={16} color={colors.text.secondary} />
                </View>
              </TouchableOpacity>

              {/* Calendar View Setting */}
              <TouchableOpacity
                style={[styles.settingItem, glassStyles.card]}
                onPress={() => setShowCalendarViewSettings(true)}
                accessibilityRole="button"
                accessibilityLabel="Calendar view"
                accessibilityHint="Double tap to choose which habits appear by default"
              >
                <Text style={styles.settingTitle}>Calendar View</Text>
                <View style={styles.calendarColorRight}>
                  <Text style={styles.calendarViewCount}>
                    {(excludedCalendarTaskIds?.length ?? 0) === 0
                      ? 'All habits'
                      : `${tasks.length - (excludedCalendarTaskIds?.length ?? 0)} of ${tasks.length}`}
                  </Text>
                  <Icon name="chevron-right" size={16} color={colors.text.secondary} />
                </View>
              </TouchableOpacity>

              {/* Sound Effects Setting */}
              <View style={[styles.settingItem, glassStyles.card]}>
                <View style={styles.settingInfo}>
                  <View style={styles.settingTitleRow}>
                    <Text style={styles.settingTitle}>Sound Effects</Text>
                    <Icon
                      name={soundEffectsEnabled ? 'volume' : 'volume-x'}
                      size={16}
                      color={soundEffectsEnabled ? accentColor : colors.text.tertiary}
                    />
                  </View>
                  <Text style={styles.settingDescription}>
                    Play sounds on actions
                  </Text>
                </View>
                <Switch
                  value={soundEffectsEnabled ?? true}
                  onValueChange={(enabled) => {
                    if (enabled) {
                      // Turning ON: save first so sound plays
                      setSoundEffectsEnabled(enabled);
                      playToggle(enabled);
                    } else {
                      // Turning OFF: play first while still enabled
                      playToggle(enabled);
                      setSoundEffectsEnabled(enabled);
                    }
                  }}
                  trackColor={{ false: colors.interactive.default, true: accentColor }}
                  thumbColor={colors.surface}
                  accessibilityLabel="Sound effects toggle"
                  accessibilityHint={soundEffectsEnabled ? "Double tap to disable sound effects" : "Double tap to enable sound effects"}
                />
              </View>

              {/* 24-Hour Format Setting */}
              <View style={[styles.settingItem, glassStyles.card]}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>24-Hour Format</Text>
                  <Text style={styles.settingDescription}>
                    Display time in 24-hour format
                  </Text>
                </View>
                <Switch
                  value={use24HourFormat ?? false}
                  onValueChange={(enabled) => {
                    playToggle(enabled);
                    setUse24HourFormat(enabled);
                  }}
                  trackColor={{ false: colors.interactive.default, true: accentColor }}
                  thumbColor={colors.surface}
                  accessibilityLabel="24-hour format toggle"
                  accessibilityHint={use24HourFormat ? "Double tap to use 12-hour format" : "Double tap to use 24-hour format"}
                />
              </View>
            </>
          )}
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('notifications')}
            accessibilityRole="button"
            accessibilityLabel={`Notifications section, ${expandedSections.notifications ? 'expanded' : 'collapsed'}`}
          >
            <Text style={styles.sectionTitle}>Notifications</Text>
            <Icon
              name={expandedSections.notifications ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.text.secondary}
            />
          </TouchableOpacity>

          {expandedSections.notifications && (
            <>
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
                    playToggle(enabled);
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
                      playToggle(enabled);
                      updateDailyNotification({ enabled });
                    }}
                    trackColor={{ false: colors.interactive.default, true: accentColor }}
                    thumbColor={colors.surface}
                  />
                </View>

                {notificationSettings?.daily?.enabled && (
                  <>
                    <View style={[styles.settingItem, glassStyles.cardSubtle]}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingSubtitle}>Time</Text>
                        <TouchableOpacity onPress={() => setShowTimePicker(!showTimePicker)}>
                          <Text style={[styles.timeDisplay, { color: accentColor }]}>
                            {formatTimeDisplay(notificationSettings?.daily?.time || '20:00', use24HourFormat ?? false)}
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
                          playToggle(smartMode);
                          updateDailyNotification({ smartMode });
                        }}
                        trackColor={{ false: colors.interactive.default, true: accentColor }}
                        thumbColor={colors.surface}
                      />
                    </View>

                    <View style={[styles.settingItem, glassStyles.cardSubtle]}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingSubtitle}>Include Motivation</Text>
                        <Text style={styles.settingDescription}>
                          Add motivational quotes to notifications
                        </Text>
                      </View>
                      <Switch
                        value={notificationSettings?.daily?.includeMotivation ?? false}
                        onValueChange={(includeMotivation) => {
                          playToggle(includeMotivation);
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
                <View style={[styles.settingItem, glassStyles.card]}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Streak Protection</Text>
                    <Text style={styles.settingDescription}>
                      Get notified when streaks are at risk
                    </Text>
                  </View>
                  <Switch
                    value={notificationSettings?.streaks?.protectionEnabled ?? false}
                    onValueChange={(protectionEnabled) => {
                      playToggle(protectionEnabled);
                      updateStreakProtection({ protectionEnabled });
                    }}
                    trackColor={{ false: colors.interactive.default, true: accentColor }}
                    thumbColor={colors.surface}
                  />
                </View>

                {notificationSettings?.streaks?.protectionEnabled && (
                  <>
                    <View style={[styles.settingItem, glassStyles.cardSubtle]}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingSubtitle}>Protection Time</Text>
                        <TouchableOpacity onPress={() => setExpandedSections({...expandedSections, streakTime: true})}>
                          <Text style={[styles.timeDisplay, { color: accentColor }]}>
                            {formatTimeDisplay(notificationSettings?.streaks?.protectionTime || '21:00', use24HourFormat ?? false)}
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

                    <View style={[styles.settingItem, glassStyles.cardSubtle]}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingSubtitle}>Priority Alerts</Text>
                        <Text style={styles.settingDescription}>
                          Higher priority for longer streaks
                        </Text>
                      </View>
                      <Switch
                        value={notificationSettings?.streaks?.priorityBasedAlerts ?? true}
                        onValueChange={(priorityBasedAlerts) => {
                          playToggle(priorityBasedAlerts);
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
                <View style={[styles.settingItem, glassStyles.card]}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Achievements</Text>
                    <Text style={styles.settingDescription}>
                      Celebrate milestones and victories
                    </Text>
                  </View>
                  <Switch
                    value={notificationSettings?.achievements?.enabled ?? true}
                    onValueChange={(enabled) => {
                      playToggle(enabled);
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
                    <View style={[styles.settingItem, glassStyles.cardSubtle]}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingSubtitle}>Weekly Recap</Text>
                        <Text style={styles.settingDescription}>
                          Get a summary of your week
                        </Text>
                      </View>
                      <Switch
                        value={notificationSettings?.achievements?.weeklyRecapEnabled ?? false}
                        onValueChange={(weeklyRecapEnabled) => {
                          playToggle(weeklyRecapEnabled);
                          updateNotificationSettings({
                            achievements: { ...notificationSettings?.achievements, weeklyRecapEnabled }
                          });
                        }}
                        trackColor={{ false: colors.interactive.default, true: accentColor }}
                        thumbColor={colors.surface}
                      />
                    </View>

                    {notificationSettings?.achievements?.weeklyRecapEnabled && (
                      <View style={[styles.settingItem, glassStyles.cardSubtle]}>
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
                  style={[styles.settingItem, glassStyles.card]}
                  onPress={() => {
                    playExpand(!expandedSections.advanced);
                    setExpandedSections({...expandedSections, advanced: !expandedSections.advanced});
                  }}
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
                    <View style={[styles.settingItem, glassStyles.cardSubtle]}>
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

                    <View style={[styles.settingItem, glassStyles.cardSubtle]}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingSubtitle}>Quiet Hours</Text>
                        <Text style={styles.settingDescription}>
                          No notifications during these hours
                        </Text>
                      </View>
                      <Switch
                        value={notificationSettings?.global?.quietHours?.enabled ?? false}
                        onValueChange={(enabled) => {
                          playToggle(enabled);
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
                      <View style={[styles.settingItem, glassStyles.cardSubtle]}>
                        <View style={styles.settingInfo}>
                          <Text style={styles.settingDescription}>
                            From {notificationSettings?.global?.quietHours?.start || '22:00'} to {notificationSettings?.global?.quietHours?.end || '08:00'}
                          </Text>
                        </View>
                      </View>
                    )}

                    <View style={[styles.settingItem, glassStyles.cardSubtle]}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingSubtitle}>Sound</Text>
                        <Text style={styles.settingDescription}>
                          Play sounds with notifications
                        </Text>
                      </View>
                      <Switch
                        value={notificationSettings?.global?.soundEnabled ?? true}
                        onValueChange={(soundEnabled) => {
                          playToggle(soundEnabled);
                          updateNotificationSettings({
                            global: { ...notificationSettings?.global, soundEnabled }
                          });
                        }}
                        trackColor={{ false: colors.interactive.default, true: accentColor }}
                        thumbColor={colors.surface}
                      />
                    </View>

                    <View style={[styles.settingItem, glassStyles.cardSubtle]}>
                      <View style={styles.settingInfo}>
                        <Text style={styles.settingSubtitle}>Vibration</Text>
                        <Text style={styles.settingDescription}>
                          Vibrate with notifications
                        </Text>
                      </View>
                      <Switch
                        value={notificationSettings?.global?.vibrationEnabled ?? true}
                        onValueChange={(vibrationEnabled) => {
                          playToggle(vibrationEnabled);
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

          {/* Habit Reminders - nested in Notifications */}
          {notificationSettings?.global?.enabled && habitsWithReminders.length > 0 && (
            <View style={styles.subSection}>
              <View style={[styles.habitRemindersCard, glassStyles.card]}>
                <View style={styles.habitRemindersHeader}>
                  <Text style={styles.settingTitle}>Habit Reminders</Text>
                </View>
                {habitsWithReminders.map((habit, index) => (
                  <View
                    key={habit.id}
                    style={[
                      styles.habitReminderRow,
                      index < habitsWithReminders.length - 1 && styles.habitReminderRowBorder
                    ]}
                  >
                    <View style={styles.habitReminderInfo}>
                      <View style={styles.habitReminderHeader}>
                        <View style={[styles.habitIcon, { backgroundColor: habit.color + '20' }]}>
                          <Icon name={habit.icon as any} size={14} color={habit.color} />
                        </View>
                        <Text style={styles.habitReminderName} numberOfLines={1}>{habit.name}</Text>
                      </View>
                      {habit.reminderTime && (
                        <Text style={styles.habitReminderTime}>
                          {formatTimeDisplay(habit.reminderTime, use24HourFormat ?? false)} • {habit.reminderFrequency || 'daily'}
                        </Text>
                      )}
                    </View>
                    <Switch
                      value={habit.reminderEnabled}
                      onValueChange={(enabled) => {
                        playToggle(enabled);
                        updateTask(habit.id, { reminderEnabled: enabled })
                          .then(() => {
                            logger.info('UI', 'Habit reminder toggled from settings', {
                              habitId: habit.id,
                              enabled
                            });
                          })
                          .catch((error) => {
                            logger.error('UI', 'Failed to toggle habit reminder', { error });
                            Alert.alert('Error', 'Failed to update reminder setting');
                          });
                      }}
                      trackColor={{ false: colors.interactive.default, true: accentColor }}
                      thumbColor={colors.surface}
                      accessibilityLabel={`${habit.name} reminder toggle`}
                    />
                  </View>
                ))}
              </View>
            </View>
          )}
            </>
          )}
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('data')}
            accessibilityRole="button"
            accessibilityLabel={`Data section, ${expandedSections.data ? 'expanded' : 'collapsed'}`}
          >
            <Text style={styles.sectionTitle}>Data</Text>
            <Icon
              name={expandedSections.data ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.text.secondary}
            />
          </TouchableOpacity>

          {expandedSections.data && (
            <>
              <View style={styles.dataButtonRow}>
                <TouchableOpacity
                  style={[styles.dataButton, (isExporting || isImporting) && styles.dataButtonDisabled]}
                  onPress={handleExportData}
                  disabled={isExporting || isImporting}
                  accessibilityRole="button"
                  accessibilityLabel="Export data"
                >
                  <Icon name={isExporting ? 'loader' : 'send'} size={20} color={isExporting || isImporting ? colors.text.tertiary : accentColor} />
                  <Text style={[styles.dataButtonText, (isExporting || isImporting) && styles.dataButtonTextDisabled]}>
                    {isExporting ? 'Exporting...' : 'Export'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.dataButton, (isExporting || isImporting) && styles.dataButtonDisabled]}
                  onPress={handleImportData}
                  disabled={isExporting || isImporting}
                  accessibilityRole="button"
                  accessibilityLabel="Import data"
                >
                  <Icon name={isImporting ? 'loader' : 'inbox'} size={20} color={isExporting || isImporting ? colors.text.tertiary : accentColor} />
                  <Text style={[styles.dataButtonText, (isExporting || isImporting) && styles.dataButtonTextDisabled]}>
                    {isImporting ? 'Importing...' : 'Import'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.resetLinksRow}>
                <TouchableOpacity
                  style={styles.resetLink}
                  onPress={handleResetSettings}
                  accessibilityRole="button"
                  accessibilityLabel="Reset all settings"
                >
                  <Text style={styles.resetLinkText}>Reset All Settings</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resetLink}
                  onPress={handleClearAllData}
                  disabled={isClearing || isExporting || isImporting}
                  accessibilityRole="button"
                  accessibilityLabel="Clear all data"
                >
                  <Text style={[styles.resetLinkText, (isClearing || isExporting || isImporting) && styles.resetLinkTextDisabled]}>
                    {isClearing ? 'Clearing...' : 'Clear All Data'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Support</Text>
          </View>

          <View style={styles.supportButtonRow}>
            <TouchableOpacity
              style={styles.supportButton}
              onPress={handleRateApp}
              accessibilityRole="button"
              accessibilityLabel="Rate the app"
            >
              <Icon name="star" size={20} color={accentColor} />
              <Text style={styles.supportButtonText}>Rate the App</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.supportButton}
              onPress={handleSendFeedback}
              accessibilityRole="button"
              accessibilityLabel="Send feedback"
            >
              <Icon name="mail" size={20} color={accentColor} />
              <Text style={styles.supportButtonText}>Send Feedback</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Green Streak v{Constants.expoConfig?.version || '1.0.0'}
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
        hideShadeSelector={true}
      />

      {/* Calendar View Settings Modal */}
      <CalendarViewSettingsModal
        visible={showCalendarViewSettings}
        onClose={() => setShowCalendarViewSettings(false)}
        tasks={tasks}
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

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
    marginBottom: spacing[3],
  },

  sectionTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
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

  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
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

  calendarColorRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },

  calendarViewCount: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
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

  dataButtonRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[3],
  },

  dataButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    ...shadows.sm,
  },

  dataButtonDisabled: {
    opacity: 0.5,
  },

  dataButtonText: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '500',
  },

  dataButtonTextDisabled: {
    color: colors.text.tertiary,
  },

  resetLinksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[4],
  },

  resetLink: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[2],
  },

  resetLinkText: {
    ...textStyles.bodySmall,
    color: colors.error,
  },

  resetLinkTextDisabled: {
    color: colors.text.tertiary,
  },

  habitRemindersCard: {
    padding: 0,
    overflow: 'hidden',
  },

  habitRemindersHeader: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },

  habitReminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },

  habitReminderRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },

  habitReminderInfo: {
    flex: 1,
    marginRight: spacing[3],
  },

  habitReminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  habitIcon: {
    width: 24,
    height: 24,
    borderRadius: radiusValues.box,
    alignItems: 'center',
    justifyContent: 'center',
  },

  habitReminderName: {
    ...textStyles.bodySmall,
    color: colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },

  habitReminderTime: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    marginTop: 2,
    marginLeft: 24 + spacing[2], // Align with name (icon width + gap)
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

  supportButtonRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },

  supportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    padding: spacing[3],
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    ...shadows.sm,
  },

  supportButtonText: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '500',
  },
});

export default SettingsScreen;