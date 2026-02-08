import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  Image,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedButton } from '../components/AnimatedButton';
import { Icon, IconName } from '../components/common/Icon';
import { TemplateCatalogModal } from '../components/TemplateCatalog';
import { IconPickerModal } from '../components/IconPicker';
import { ColorPickerModal } from '../components/ColorPicker';
import { TimePickerModal } from '../components/TimePicker';
import { useTasksStore } from '../store/tasksStore';
import { useAchievementsStore } from '../store/achievementsStore';
import { useSettingsStore } from '../store/settingsStore';
import { useAccentColor, useSounds } from '../hooks';
import { colors, textStyles, spacing, shadows, glassStyles } from '../theme';
import { radiusValues } from '../theme/utils';
import { COLOR_PALETTE } from '../database/schema';
import { EditTaskModalProps } from '../types';
import { HabitTemplate } from '../types/templates';
import { StreakRulesEngine } from '../services/StreakRulesEngine';
import logger from '../utils/logger';
import { formatTimeDisplay, getTimeOfDay } from '../utils/timeHelpers';
import { getIconEmoji } from '../utils/iconEmoji';

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  onClose,
  onTaskAdded,
  existingTask,
  initialTemplate
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [selectedIcon, setSelectedIcon] = useState<IconName>('checkCircle');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState('20:00');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [reminderFrequency, setReminderFrequency] = useState<'daily' | 'weekly'>('daily');
  const [reminderDayOfWeek, setReminderDayOfWeek] = useState(1); // Default Monday (1)
  const [reminderText, setReminderText] = useState('');
  const [streakEnabled, setStreakEnabled] = useState(true);
  const [streakSkipWeekends, setStreakSkipWeekends] = useState(false);
  const [streakMinimumCount, setStreakMinimumCount] = useState(1);
  const [showTemplateCatalog, setShowTemplateCatalog] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isEditingNotification, setIsEditingNotification] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<HabitTemplate | null>(null);

  const { createTask, updateTask, deleteTask } = useTasksStore();
  const { checkForAchievements } = useAchievementsStore();
  const { notificationSettings, updateNotificationSettings, use24HourFormat } = useSettingsStore();
  const accentColor = useAccentColor();
  const { play, playToggle, playRandomTap, playCaution, playCelebration } = useSounds();
  const isEditing = !!existingTask;

  // Handle reminder toggle - auto-enable global notifications if needed
  const handleReminderToggle = useCallback(async (enabled: boolean) => {
    playToggle(enabled);
    setReminderEnabled(enabled);

    // If enabling a reminder and global notifications are off, enable them
    if (enabled && !notificationSettings?.global?.enabled) {
      try {
        await updateNotificationSettings({
          global: { ...notificationSettings?.global, enabled: true }
        });
        logger.info('UI', 'Auto-enabled global notifications for habit reminder');
      } catch (error) {
        logger.error('UI', 'Failed to auto-enable global notifications', { error });
      }
    }
  }, [notificationSettings, updateNotificationSettings, playToggle]);

  // Apply template data to form - extracted for reuse
  const applyTemplateToForm = useCallback((template: HabitTemplate) => {
    logger.debug('UI', 'Applying template to form', { templateId: template.id, name: template.name });

    // Populate form with template data
    setName(template.name);
    setDescription(template.description);
    setSelectedIcon(template.icon);
    setSelectedColor(template.color);

    // Apply suggested settings
    const { suggestedSettings } = template;
    if (suggestedSettings.reminderTime) {
      setReminderEnabled(true);
      setReminderTime(suggestedSettings.reminderTime);
      setReminderFrequency(suggestedSettings.reminderFrequency || 'daily');
      if (suggestedSettings.reminderText) {
        setReminderText(suggestedSettings.reminderText);
      }
    }
    setStreakEnabled(suggestedSettings.streakEnabled);
    if (suggestedSettings.streakSkipWeekends !== undefined) {
      setStreakSkipWeekends(suggestedSettings.streakSkipWeekends);
    }
    if (suggestedSettings.streakMinimumCount !== undefined) {
      setStreakMinimumCount(suggestedSettings.streakMinimumCount);
    }
  }, []);

  // Handle template selection - store pending and close catalog
  const handleSelectTemplate = useCallback((template: HabitTemplate) => {
    logger.debug('UI', 'Template selected', { templateId: template.id, name: template.name });
    setPendingTemplate(template);
    setShowTemplateCatalog(false);
  }, []);

  // Apply pending template after catalog close animation completes
  const handleCatalogCloseComplete = useCallback(() => {
    if (pendingTemplate) {
      applyTemplateToForm(pendingTemplate);
      setPendingTemplate(null);
    }
  }, [pendingTemplate, applyTemplateToForm]);

  // Initialize form with existing task data when editing
  useEffect(() => {
    if (existingTask) {
      setName(existingTask.name);
      setDescription(existingTask.description || '');
      setSelectedColor(existingTask.color);
      setSelectedIcon(existingTask.icon as IconName);
      setReminderEnabled(existingTask.reminderEnabled || false);
      setReminderTime(existingTask.reminderTime || '20:00');
      setReminderFrequency((existingTask.reminderFrequency as 'daily' | 'weekly') || 'daily');
      setReminderDayOfWeek(existingTask.reminderDayOfWeek ?? 1);
      setReminderText(existingTask.reminderText || '');
      setStreakEnabled(existingTask.streakEnabled !== false);
      setStreakSkipWeekends(existingTask.streakSkipWeekends || false);
      setStreakMinimumCount(existingTask.streakMinimumCount || 1);
    }
  }, [existingTask]);

  // Initialize form with template data if provided (from onboarding)
  useEffect(() => {
    if (initialTemplate && !existingTask) {
      applyTemplateToForm(initialTemplate);
      logger.info('UI', 'Form initialized with template', { templateId: initialTemplate.id });
    }
  }, [initialTemplate, existingTask, applyTemplateToForm]);

  // Quick-access icons (17 most common + "More" button as 18th)
  const ICON_OPTIONS: IconName[] = [
    'checkCircle', 'dumbbell', 'book', 'brain', 'heart', 'droplet',
    'graduation', 'music', 'activity', 'calendar', 'pill', 'footprints',
    'apple', 'coffee', 'sun', 'moon', 'target'
  ];

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a task name');
      return;
    }

    // Validate streak configuration
    const streakConfig = {
      enabled: streakEnabled,
      skipWeekends: streakSkipWeekends,
      skipDays: [],
      minimumCount: streakMinimumCount
    };

    const validation = StreakRulesEngine.validateConfiguration(streakConfig);
    if (!validation.isValid) {
      Alert.alert('Invalid Streak Configuration', validation.errors.join('\n'));
      return;
    }

    try {
      const taskData = {
        name: name.trim(),
        description: description.trim() || undefined,
        icon: selectedIcon,
        color: selectedColor,
        isMultiCompletion: true, // Default to multi-completion for all tasks
        reminderEnabled,
        reminderTime: reminderEnabled ? reminderTime : undefined,
        reminderFrequency: reminderEnabled ? reminderFrequency : undefined,
        reminderDayOfWeek: reminderEnabled && reminderFrequency === 'weekly' ? reminderDayOfWeek : undefined,
        reminderText: reminderEnabled && reminderText.trim() ? reminderText.trim() : undefined,
        streakEnabled,
        streakSkipWeekends: streakEnabled ? streakSkipWeekends : false,
        streakMinimumCount: streakEnabled ? streakMinimumCount : 1,
      };

      if (isEditing && existingTask) {
        logger.debug('UI', 'Updating existing task', { id: existingTask.id, name });
        await updateTask(existingTask.id, taskData);
        logger.info('UI', 'Task updated successfully', { id: existingTask.id, name });

        // Check for customize achievement (if icon or color changed)
        const wasCustomized =
          existingTask.icon !== selectedIcon ||
          existingTask.color !== selectedColor;
        if (wasCustomized) {
          try {
            await checkForAchievements({
              trigger: 'task_customized',
              taskId: existingTask.id,
            });
          } catch (error) {
            logger.warn('UI', 'Failed to check achievements after customization', { error });
          }
        }
      } else {
        logger.debug('UI', 'Creating new task', { name, description, selectedColor });
        const newTask = await createTask(taskData);
        logger.info('UI', 'Task created successfully', { name });

        // Check for task creation achievements
        try {
          await checkForAchievements({
            trigger: 'task_created',
            taskId: newTask.id,
          });
        } catch (error) {
          logger.warn('UI', 'Failed to check achievements after task creation', { error });
        }
      }

      // Play success sound only after successful save
      playCelebration();

      onTaskAdded();
      // Don't call onClose() here - onTaskAdded() already triggers closeModal via HomeScreen.handleTaskAdded
    } catch (error) {
      const action = isEditing ? 'update' : 'create';
      logger.error('UI', `Failed to ${action} task`, { error, name });
      playCaution();
      Alert.alert('Error', `Failed to ${action} task. Please try again.`);
    }
  };

  const handleDelete = async () => {
    if (!existingTask) return;

    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${existingTask.name}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              logger.debug('UI', 'Deleting task', { id: existingTask.id, name: existingTask.name });
              await deleteTask(existingTask.id);
              logger.info('UI', 'Task deleted successfully', { id: existingTask.id, name: existingTask.name });
              onTaskAdded(); // Refresh data
              onClose();
            } catch (error) {
              logger.error('UI', 'Failed to delete task', { error, id: existingTask.id });
              Alert.alert('Error', 'Failed to delete habit. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            playCaution();
            onClose();
          }}
          style={styles.cancelButton}
          accessibilityRole="button"
          accessibilityLabel={isEditing ? "Cancel editing habit" : "Cancel adding habit"}
          accessibilityHint="Double tap to cancel and return to the previous screen"
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{isEditing ? 'Edit Habit' : 'Add New Habit'}</Text>
        <AnimatedButton
          title="Save"
          onPress={handleSave}
          variant="primary"
          size="medium"
          skipSound
        />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Browse Templates Button - Only show for new tasks */}
        {!isEditing && (
          <TouchableOpacity
            style={[styles.templateButton, { borderColor: accentColor }]}
            onPress={() => {
              playRandomTap();
              setShowTemplateCatalog(true);
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Browse habit templates"
            accessibilityHint="Open the template catalog to quickly create a habit from pre-defined templates"
          >
            <Icon name="target" size={20} color={accentColor} />
            <Text style={[styles.templateButtonText, { color: accentColor }]}>Browse Templates</Text>
            <Icon name="chevron-right" size={18} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}

        {/* Name Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Name *</Text>
          <View style={styles.settingItem}>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="Enter habit name"
              placeholderTextColor={colors.text.tertiary}
              maxLength={50}
            />
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <View style={styles.settingItem}>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add a description (Optional)"
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>
        </View>

        {/* Icon Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Icon</Text>
          <View style={styles.settingItem}>
            <View style={styles.iconGrid}>
              {ICON_OPTIONS.map((icon, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.iconOption,
                    selectedIcon === icon && [styles.selectedIconOption, { borderColor: accentColor }],
                  ]}
                  onPress={() => {
                    playRandomTap();
                    setSelectedIcon(icon);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${icon} icon`}
                  accessibilityHint="Double tap to select this icon for your habit"
                  accessibilityState={{ selected: selectedIcon === icon }}
                >
                  <Icon name={icon} size={20} color={colors.text.primary} />
                </TouchableOpacity>
              ))}
              {/* More button to open full icon picker - shows selected icon if from expanded list */}
              {(() => {
                const isExtraIconSelected = !ICON_OPTIONS.includes(selectedIcon);
                return (
                  <TouchableOpacity
                    style={[
                      styles.moreIconsButton,
                      isExtraIconSelected && [styles.moreIconsButtonSelected, { borderColor: accentColor }],
                    ]}
                    onPress={() => {
                      playRandomTap();
                      setShowIconPicker(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={isExtraIconSelected ? `Selected ${selectedIcon} icon, tap to change` : "Browse more icons"}
                    accessibilityHint="Double tap to open the full icon library"
                    accessibilityState={{ selected: isExtraIconSelected }}
                  >
                    <Icon
                      name={isExtraIconSelected ? selectedIcon : "moreHorizontal"}
                      size={20}
                      color={isExtraIconSelected ? accentColor : colors.text.secondary}
                    />
                  </TouchableOpacity>
                );
              })()}
            </View>
          </View>
        </View>

        {/* Color Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Color</Text>
          <View style={styles.settingItem}>
            <View style={styles.colorGrid}>
              {/* Show first 11 colors from palette */}
              {COLOR_PALETTE.slice(0, 11).map((color, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor.toUpperCase() === color.toUpperCase() && styles.selectedColorOption,
                  ]}
                  onPress={() => {
                    playRandomTap();
                    setSelectedColor(color);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Select color ${index + 1}`}
                  accessibilityHint="Double tap to select this color for your habit"
                  accessibilityState={{ selected: selectedColor.toUpperCase() === color.toUpperCase() }}
                />
              ))}

              {/* Custom color button - opens color picker modal */}
              {(() => {
                const isCustomColorSelected = !COLOR_PALETTE.slice(0, 11).some(
                  c => c.toUpperCase() === selectedColor.toUpperCase()
                );
                return (
                  <TouchableOpacity
                    style={[
                      styles.colorOption,
                      styles.customColorOption,
                      isCustomColorSelected && { backgroundColor: selectedColor, borderStyle: 'solid' },
                      isCustomColorSelected && styles.selectedColorOption,
                    ]}
                    onPress={() => {
                      playRandomTap();
                      setShowColorPicker(true);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={isCustomColorSelected ? `Custom color ${selectedColor}, tap to change` : "Select custom color"}
                    accessibilityHint="Double tap to open the color picker"
                    accessibilityState={{ selected: isCustomColorSelected }}
                  >
                    {!isCustomColorSelected && (
                      <Text style={styles.customColorText}>+</Text>
                    )}
                  </TouchableOpacity>
                );
              })()}
            </View>
          </View>
        </View>

        {/* Reminder Section */}
        <View style={styles.section}>
          <View style={[styles.toggleSection, glassStyles.card]}>
            <View style={styles.toggleSectionHeader}>
              <Text style={styles.toggleSectionTitle}>Remind Me</Text>
              <Switch
                value={reminderEnabled}
                onValueChange={handleReminderToggle}
                trackColor={{ false: colors.interactive.default, true: accentColor }}
                thumbColor={colors.surface}
                accessibilityLabel="Reminder setting"
                accessibilityHint={`${reminderEnabled ? 'Disable' : 'Enable'} reminders for this habit`}
              />
            </View>

            {reminderEnabled && (
              <View style={styles.toggleSectionContent}>
                {/* Animated Schedule Selector */}
                <View style={styles.reminderRow}>
                  <Text style={styles.reminderLabel}>Schedule:</Text>
                  <Animated.View
                    style={styles.scheduleSelector}
                    layout={LinearTransition.duration(200)}
                  >
                    {/* Daily button - always visible */}
                    <TouchableOpacity
                      style={[
                        styles.scheduleButton,
                        reminderFrequency === 'daily' && [styles.scheduleOptionSelected, { backgroundColor: accentColor, borderColor: accentColor }],
                      ]}
                      onPress={() => {
                        playRandomTap();
                        setReminderFrequency('daily');
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Daily"
                      accessibilityState={{ selected: reminderFrequency === 'daily' }}
                    >
                      <Text style={[
                        styles.scheduleButtonText,
                        reminderFrequency === 'daily' && styles.scheduleOptionTextSelected,
                      ]}>
                        Daily
                      </Text>
                    </TouchableOpacity>

                    {/* Weekly button OR expanded day buttons */}
                    {reminderFrequency === 'daily' ? (
                      // Collapsed: Show "Weekly" button
                      <Animated.View
                        key="weekly-button"
                        entering={FadeIn.delay(120).duration(150)}
                        exiting={FadeOut.duration(80)}
                      >
                        <TouchableOpacity
                          style={styles.scheduleButton}
                          onPress={() => {
                            playRandomTap();
                            setReminderFrequency('weekly');
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Weekly"
                        >
                          <Text style={styles.scheduleButtonText}>Weekly</Text>
                        </TouchableOpacity>
                      </Animated.View>
                    ) : (
                      // Expanded: Show day buttons with staggered animation
                      <>
                        {[
                          { value: 0, label: 'S', full: 'Sunday' },
                          { value: 1, label: 'M', full: 'Monday' },
                          { value: 2, label: 'T', full: 'Tuesday' },
                          { value: 3, label: 'W', full: 'Wednesday' },
                          { value: 4, label: 'T', full: 'Thursday' },
                          { value: 5, label: 'F', full: 'Friday' },
                          { value: 6, label: 'S', full: 'Saturday' },
                        ].map((day, index) => {
                          const isSelected = reminderDayOfWeek === day.value;
                          const exitDelay = (6 - index) * 20;
                          return (
                            <Animated.View
                              key={`day-${day.value}`}
                              entering={FadeIn.delay(index * 25).duration(120)}
                              exiting={FadeOut.delay(exitDelay).duration(80)}
                              style={styles.scheduleDayWrapper}
                            >
                              <TouchableOpacity
                                style={[
                                  styles.scheduleDayOption,
                                  isSelected && [styles.scheduleOptionSelected, { backgroundColor: accentColor, borderColor: accentColor }],
                                ]}
                                onPress={() => {
                                  playRandomTap();
                                  setReminderDayOfWeek(day.value);
                                }}
                                accessibilityRole="button"
                                accessibilityLabel={day.full}
                                accessibilityState={{ selected: isSelected }}
                              >
                                <Text style={[
                                  styles.scheduleDayText,
                                  isSelected && styles.scheduleOptionTextSelected,
                                ]}>
                                  {day.label}
                                </Text>
                              </TouchableOpacity>
                            </Animated.View>
                          );
                        })}
                      </>
                    )}
                  </Animated.View>
                </View>

                {/* Notification Preview */}
                <View style={styles.notificationPreviewContainer}>
                  <Text style={styles.reminderLabel}>Notification Preview:</Text>
                  <View style={styles.notificationBanner}>
                    {/* App icon - actual Green Streak logo */}
                    <Image
                      source={require('../../assets/icon.png')}
                      style={styles.notificationAppIcon}
                    />

                    {/* Content */}
                    <View style={styles.notificationContent}>
                      {/* Header row: App name + scheduled time */}
                      <View style={styles.notificationHeader}>
                        <Text style={styles.notificationAppName}>GREEN STREAK</Text>
                        <TouchableOpacity
                          style={styles.notificationTimeButton}
                          onPress={() => {
                            playRandomTap();
                            setShowTimePicker(true);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Scheduled for ${formatTimeDisplay(reminderTime, use24HourFormat ?? false)}, tap to change`}
                        >
                          <Text style={styles.notificationTime}>
                            {formatTimeDisplay(reminderTime, use24HourFormat ?? false)}
                          </Text>
                          <Icon name="pencil" size={12} color="rgba(0, 0, 0, 0.35)" />
                        </TouchableOpacity>
                      </View>

                      {/* Notification title: emoji + habit name */}
                      <Text style={styles.notificationTitle} numberOfLines={1}>
                        {getIconEmoji(selectedIcon)} {name || 'Your Habit'}
                      </Text>

                      {/* Notification body (editable) */}
                      {isEditingNotification ? (
                        <TextInput
                          style={styles.notificationBodyInput}
                          value={reminderText}
                          onChangeText={setReminderText}
                          placeholder={`Time for your ${(name || 'habit').toLowerCase()} habit!`}
                          placeholderTextColor="rgba(0, 0, 0, 0.4)"
                          maxLength={100}
                          autoFocus
                          accessibilityLabel="Custom notification text"
                          accessibilityHint="Enter custom text for the notification message"
                        />
                      ) : (
                        <TouchableOpacity
                          style={styles.notificationBodyButton}
                          onPress={() => {
                            playRandomTap();
                            setIsEditingNotification(true);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel="Edit notification text"
                        >
                          <Text style={styles.notificationBody} numberOfLines={2}>
                            {reminderText || `Time for your ${(name || 'habit').toLowerCase()} habit!`}
                          </Text>
                          <Icon name="pencil" size={14} color="rgba(0, 0, 0, 0.35)" />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Checkmark button when editing */}
                    {isEditingNotification && (
                      <TouchableOpacity
                        style={styles.notificationEditButton}
                        onPress={() => {
                          playRandomTap();
                          setIsEditingNotification(false);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel="Confirm notification text"
                      >
                        <Icon name="check" size={18} color="rgba(0, 0, 0, 0.4)" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Streak Section */}
        <View style={styles.section}>
          <View style={[styles.toggleSection, glassStyles.card]}>
            <View style={styles.toggleSectionHeader}>
              <Text style={styles.toggleSectionTitle}>Streaks</Text>
              <Switch
                value={streakEnabled}
                onValueChange={(enabled) => {
                  playToggle(enabled);
                  setStreakEnabled(enabled);
                }}
                trackColor={{ false: colors.interactive.default, true: accentColor }}
                thumbColor={colors.surface}
                accessibilityLabel="Streak tracking"
                accessibilityHint={`${streakEnabled ? 'Disable' : 'Enable'} streak tracking for this habit`}
              />
            </View>

            {streakEnabled && (
              <View style={styles.toggleSectionContent}>
                <View style={styles.streakSettingRow}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Skip Weekends</Text>
                    <Text style={styles.settingDescription}>
                      Don't break streak on weekends
                    </Text>
                  </View>
                  <Switch
                    value={streakSkipWeekends}
                    onValueChange={(enabled) => {
                      playToggle(enabled);
                      setStreakSkipWeekends(enabled);
                    }}
                    trackColor={{ false: colors.interactive.default, true: accentColor }}
                    thumbColor={colors.surface}
                    accessibilityLabel="Skip weekends"
                    accessibilityHint={`${streakSkipWeekends ? 'Disable' : 'Enable'} weekend skipping`}
                  />
                </View>

                <View style={styles.streakSettingRowLast}>
                  <View style={styles.settingInfo}>
                    <Text style={styles.settingTitle}>Minimum Daily Count</Text>
                    <Text style={styles.settingDescription}>
                      Completions needed to maintain streak
                    </Text>
                  </View>
                  <View style={styles.countSelector}>
                    <TouchableOpacity
                      style={[styles.countButton, { backgroundColor: accentColor }]}
                      onPress={() => {
                        if (streakMinimumCount > 1) {
                          playToggle(false);
                          setStreakMinimumCount(streakMinimumCount - 1);
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Decrease minimum count"
                    >
                      <Text style={styles.countButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.countValue}>{streakMinimumCount}</Text>
                    <TouchableOpacity
                      style={[styles.countButton, { backgroundColor: accentColor }]}
                      onPress={() => {
                        if (streakMinimumCount < 10) {
                          playToggle(true);
                          setStreakMinimumCount(streakMinimumCount + 1);
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel="Increase minimum count"
                    >
                      <Text style={styles.countButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {isEditing && (
          <View style={styles.deleteSection}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => {
                playCaution();
                handleDelete();
              }}
              accessibilityRole="button"
              accessibilityLabel="Delete habit"
              accessibilityHint="Double tap to permanently delete this habit"
            >
              <Icon name="x" size={20} color={colors.text.inverse} />
              <Text style={styles.deleteButtonText}>Delete Habit</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Template Catalog Modal */}
      <TemplateCatalogModal
        visible={showTemplateCatalog}
        onClose={() => setShowTemplateCatalog(false)}
        onCloseComplete={handleCatalogCloseComplete}
        onSelectTemplate={handleSelectTemplate}
      />

      {/* Icon Picker Modal */}
      <IconPickerModal
        visible={showIconPicker}
        onClose={() => setShowIconPicker(false)}
        selectedIcon={selectedIcon}
        onSelectIcon={setSelectedIcon}
        selectedColor={selectedColor}
      />

      {/* Color Picker Modal */}
      <ColorPickerModal
        visible={showColorPicker}
        onClose={() => setShowColorPicker(false)}
        selectedColor={selectedColor}
        onSelectColor={setSelectedColor}
      />

      {/* Time Picker Modal */}
      <TimePickerModal
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        selectedTime={reminderTime}
        onSelectTime={setReminderTime}
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
  
  cancelButton: {
    padding: spacing[2],
  },
  
  cancelButtonText: {
    ...textStyles.button,
    color: colors.text.secondary,
  },
  
  scrollView: {
    flex: 1,
  },
  
  scrollContent: {
    padding: spacing[4],
  },

  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent.light,
    borderRadius: radiusValues.box,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },

  templateButtonText: {
    ...textStyles.body,
    color: colors.primary,
    fontWeight: '600',
    flex: 1,
    marginLeft: spacing[2],
  },

  section: {
    marginBottom: spacing[6],
  },
  
  sectionTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },

  toggleSectionTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
  },

  toggleSection: {
    // Container for entire toggle section - glass card applied via glassStyles.card
    borderRadius: radiusValues.box,
    overflow: 'hidden',
  },

  toggleSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
  },

  toggleSectionContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  settingItem: {
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    padding: spacing[4],
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
  
  textInput: {
    ...textStyles.body,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radiusValues.box,
    padding: spacing[3],
    color: colors.text.primary,
    ...shadows.sm,
  },
  
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  
  iconOption: {
    width: 44,
    height: 44,
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  
  selectedIconOption: {
    borderColor: colors.primary,
    borderWidth: 2,
  },

  moreIconsButton: {
    width: 44,
    height: 44,
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },

  moreIconsButtonSelected: {
    borderStyle: 'solid',
    borderColor: colors.primary,
    backgroundColor: colors.accent.light,
  },

  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },
  
  selectedColorOption: {
    borderColor: colors.text.primary,
    borderWidth: 3,
  },

  customColorOption: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },

  customColorText: {
    ...textStyles.h3,
    color: colors.text.secondary,
    fontWeight: '700',
  },
  
  reminderRow: {
    marginBottom: spacing[3],
  },

  notificationPreviewContainer: {
    // Container for notification preview section
  },

  notificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    paddingRight: spacing[2],
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    gap: spacing[3],
    // iOS-style shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  notificationAppIcon: {
    width: 42,
    height: 42,
    borderRadius: 10, // iOS squircle-ish
  },

  notificationContent: {
    flex: 1,
  },

  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: 2,
  },

  notificationAppName: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.5)',
    letterSpacing: 0.3,
  },

  notificationTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  notificationTime: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.35)',
  },

  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.9)',
    marginBottom: 2,
  },

  notificationBody: {
    fontSize: 15,
    color: 'rgba(0, 0, 0, 0.6)',
    lineHeight: 20,
    flex: 1,
  },

  notificationBodyButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },

  notificationBodyInput: {
    fontSize: 15,
    color: 'rgba(0, 0, 0, 0.6)',
    lineHeight: 20,
    padding: 0,
    margin: 0,
  },

  notificationEditButton: {
    padding: spacing[2],
    marginTop: spacing[1],
  },

  streakSettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },

  streakSettingRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing[3],
  },

  reminderLabel: {
    ...textStyles.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing[2],
  },

  // Animated Schedule Selector styles
  scheduleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  scheduleButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: radiusValues.box,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  scheduleButtonText: {
    ...textStyles.bodySmall,
    color: colors.text.primary,
    fontWeight: '500',
  },

  scheduleDayWrapper: {
    flex: 1,
  },

  scheduleDayOption: {
    flex: 1,
    paddingVertical: spacing[2],
    borderRadius: radiusValues.box,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },

  scheduleDayText: {
    ...textStyles.bodySmall,
    color: colors.text.primary,
    fontWeight: '500',
  },

  scheduleOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  scheduleOptionTextSelected: {
    color: colors.text.inverse,
    fontWeight: '600',
  },

  countSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },

  countButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  countButtonText: {
    ...textStyles.body,
    color: colors.text.inverse,
    fontWeight: 'bold',
    fontSize: 18,
  },

  countValue: {
    ...textStyles.body,
    fontWeight: 'bold',
    minWidth: 30,
    textAlign: 'center',
  },

  deleteSection: {
    marginTop: spacing[6],
    paddingTop: spacing[6],
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },

  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
    backgroundColor: colors.error || '#ef4444',
    borderRadius: radiusValues.box,
    gap: spacing[2],
    ...shadows.sm,
  },

  deleteButtonText: {
    ...textStyles.button,
    color: colors.text.inverse,
    fontWeight: '600',
  },
});

export default EditTaskModal;