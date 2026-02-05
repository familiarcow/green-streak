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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AnimatedButton } from '../components/AnimatedButton';
import { Icon, IconName } from '../components/common/Icon';
import { TemplateCatalogModal } from '../components/TemplateCatalog';
import { IconPickerModal } from '../components/IconPicker';
import { ColorPickerModal } from '../components/ColorPicker';
import { useTasksStore } from '../store/tasksStore';
import { useAchievementsStore } from '../store/achievementsStore';
import { useSettingsStore } from '../store/settingsStore';
import { useAccentColor } from '../hooks';
import { colors, textStyles, spacing, shadows } from '../theme';
import { radiusValues } from '../theme/utils';
import { COLOR_PALETTE } from '../database/schema';
import { EditTaskModalProps } from '../types';
import { HabitTemplate } from '../types/templates';
import { StreakRulesEngine } from '../services/StreakRulesEngine';
import logger from '../utils/logger';

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
  const [customTime, setCustomTime] = useState('');
  const [showCustomTimeInput, setShowCustomTimeInput] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [reminderFrequency, setReminderFrequency] = useState<'daily' | 'weekly'>('daily');
  const [reminderText, setReminderText] = useState('');
  const [streakEnabled, setStreakEnabled] = useState(true);
  const [streakSkipWeekends, setStreakSkipWeekends] = useState(false);
  const [streakMinimumCount, setStreakMinimumCount] = useState(1);
  const [showTemplateCatalog, setShowTemplateCatalog] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const { createTask, updateTask, deleteTask } = useTasksStore();
  const { checkForAchievements } = useAchievementsStore();
  const { notificationSettings, updateNotificationSettings } = useSettingsStore();
  const accentColor = useAccentColor();
  const isEditing = !!existingTask;

  // Handle reminder toggle - auto-enable global notifications if needed
  const handleReminderToggle = useCallback(async (enabled: boolean) => {
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
  }, [notificationSettings, updateNotificationSettings]);

  // Handle template selection - populate form with template data
  const handleSelectTemplate = useCallback((template: HabitTemplate) => {
    logger.debug('UI', 'Template selected', { templateId: template.id, name: template.name });

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
    }
    setStreakEnabled(suggestedSettings.streakEnabled);
    if (suggestedSettings.streakSkipWeekends !== undefined) {
      setStreakSkipWeekends(suggestedSettings.streakSkipWeekends);
    }
    if (suggestedSettings.streakMinimumCount !== undefined) {
      setStreakMinimumCount(suggestedSettings.streakMinimumCount);
    }

    // Close the template catalog
    setShowTemplateCatalog(false);
  }, []);

  // Initialize form with existing task data when editing
  useEffect(() => {
    if (existingTask) {
      setName(existingTask.name);
      setDescription(existingTask.description || '');
      setSelectedColor(existingTask.color);
      setSelectedIcon(existingTask.icon as IconName);
      setReminderEnabled(existingTask.reminderEnabled || false);
      const time = existingTask.reminderTime || '20:00';
      setReminderTime(time);
      // Check if time is a preset or custom
      const presetTimes = ['06:00', '07:00', '08:00', '09:00', '12:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
      if (!presetTimes.includes(time)) {
        setCustomTime(time);
        setShowCustomTimeInput(true);
      }
      setReminderFrequency((existingTask.reminderFrequency as 'daily' | 'weekly') || 'daily');
      setReminderText(existingTask.reminderText || '');
      setStreakEnabled(existingTask.streakEnabled !== false);
      setStreakSkipWeekends(existingTask.streakSkipWeekends || false);
      setStreakMinimumCount(existingTask.streakMinimumCount || 1);
    }
  }, [existingTask]);

  // Initialize form with template data if provided
  useEffect(() => {
    if (initialTemplate && !existingTask) {
      handleSelectTemplate(initialTemplate);
      logger.info('UI', 'Form initialized with template', { templateId: initialTemplate.id });
    }
  }, [initialTemplate, existingTask, handleSelectTemplate]);

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

      onTaskAdded();
      onClose();
    } catch (error) {
      const action = isEditing ? 'update' : 'create';
      logger.error('UI', `Failed to ${action} task`, { error, name });
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
          onPress={onClose} 
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
        />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Browse Templates Button - Only show for new tasks */}
        {!isEditing && (
          <TouchableOpacity
            style={[styles.templateButton, { borderColor: accentColor }]}
            onPress={() => setShowTemplateCatalog(true)}
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
                  onPress={() => setSelectedIcon(icon)}
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
                    onPress={() => setShowIconPicker(true)}
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
                  onPress={() => setSelectedColor(color)}
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
                    onPress={() => setShowColorPicker(true)}
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
          <Text style={styles.sectionTitle}>Reminder</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Enable Reminder</Text>
              <Text style={styles.settingDescription}>
                Get notified to complete this habit
              </Text>
            </View>
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
            <View style={styles.reminderSettings}>
              <View style={styles.reminderRow}>
                <Text style={styles.reminderLabel}>Time:</Text>
                <View style={styles.timeOptions}>
                  {['06:00', '07:00', '08:00', '09:00', '12:00', '18:00', '19:00', '20:00', '21:00', '22:00'].map((time) => (
                    <TouchableOpacity
                      key={time}
                      style={[
                        styles.timeOption,
                        reminderTime === time && !showCustomTimeInput && [styles.timeOptionSelected, { backgroundColor: accentColor, borderColor: accentColor }],
                      ]}
                      onPress={() => {
                        setReminderTime(time);
                        setShowCustomTimeInput(false);
                        setCustomTime('');
                      }}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        reminderTime === time && !showCustomTimeInput && styles.timeOptionTextSelected,
                      ]}>
                        {time}
                      </Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[
                      styles.timeOption,
                      styles.customTimeOption,
                      showCustomTimeInput && [styles.timeOptionSelected, { backgroundColor: accentColor, borderColor: accentColor }],
                    ]}
                    onPress={() => {
                      setShowCustomTimeInput(true);
                      if (customTime) {
                        setReminderTime(customTime);
                      }
                    }}
                  >
                    <Text style={[
                      styles.timeOptionText,
                      showCustomTimeInput && styles.timeOptionTextSelected,
                    ]}>
                      Custom
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {showCustomTimeInput && (
                  <View style={styles.customTimeContainer}>
                    <Text style={styles.customTimeLabel}>Enter custom time (HH:MM):</Text>
                    <TextInput
                      style={styles.customTimeInput}
                      value={customTime}
                      onChangeText={(text) => {
                        setCustomTime(text);
                        // Validate and set reminder time if valid format
                        if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(text)) {
                          setReminderTime(text);
                        }
                      }}
                      placeholder="20:00"
                      placeholderTextColor={colors.text.tertiary}
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>
                )}
              </View>

              <View style={styles.reminderRow}>
                <Text style={styles.reminderLabel}>Frequency:</Text>
                <View style={styles.frequencyOptions}>
                  {[
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                  ].map((freq) => (
                    <TouchableOpacity
                      key={freq.value}
                      style={[
                        styles.frequencyOption,
                        reminderFrequency === freq.value && [styles.frequencyOptionSelected, { backgroundColor: accentColor, borderColor: accentColor }],
                      ]}
                      onPress={() => setReminderFrequency(freq.value as 'daily' | 'weekly')}
                    >
                      <Text style={[
                        styles.frequencyOptionText,
                        reminderFrequency === freq.value && styles.frequencyOptionTextSelected,
                      ]}>
                        {freq.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.reminderRow}>
                <Text style={styles.reminderLabel}>Notification Text:</Text>
                <TextInput
                  style={[styles.textInput, styles.reminderTextInput]}
                  value={reminderText}
                  onChangeText={setReminderText}
                  placeholder="Time for your habit!"
                  placeholderTextColor={colors.text.tertiary}
                  maxLength={100}
                  accessibilityLabel="Custom notification text"
                  accessibilityHint="Enter custom text for the notification message"
                />
              </View>
            </View>
          )}
        </View>

        {/* Streak Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streaks</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Track Streaks</Text>
              <Text style={styles.settingDescription}>
                Track consecutive days of completion
              </Text>
            </View>
            <Switch
              value={streakEnabled}
              onValueChange={setStreakEnabled}
              trackColor={{ false: colors.interactive.default, true: accentColor }}
              thumbColor={colors.surface}
              accessibilityLabel="Streak tracking"
              accessibilityHint={`${streakEnabled ? 'Disable' : 'Enable'} streak tracking for this habit`}
            />
          </View>

          {streakEnabled && (
            <>
              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Skip Weekends</Text>
                  <Text style={styles.settingDescription}>
                    Don't break streak on weekends
                  </Text>
                </View>
                <Switch
                  value={streakSkipWeekends}
                  onValueChange={setStreakSkipWeekends}
                  trackColor={{ false: colors.interactive.default, true: accentColor }}
                  thumbColor={colors.surface}
                  accessibilityLabel="Skip weekends"
                  accessibilityHint={`${streakSkipWeekends ? 'Disable' : 'Enable'} weekend skipping`}
                />
              </View>

              <View style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Minimum Daily Count</Text>
                  <Text style={styles.settingDescription}>
                    Completions needed to maintain streak
                  </Text>
                </View>
                <View style={styles.countSelector}>
                  <TouchableOpacity
                    style={[styles.countButton, { backgroundColor: accentColor }]}
                    onPress={() => setStreakMinimumCount(Math.max(1, streakMinimumCount - 1))}
                    accessibilityRole="button"
                    accessibilityLabel="Decrease minimum count"
                  >
                    <Text style={styles.countButtonText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.countValue}>{streakMinimumCount}</Text>
                  <TouchableOpacity
                    style={[styles.countButton, { backgroundColor: accentColor }]}
                    onPress={() => setStreakMinimumCount(Math.min(10, streakMinimumCount + 1))}
                    accessibilityRole="button"
                    accessibilityLabel="Increase minimum count"
                  >
                    <Text style={styles.countButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>

        {isEditing && (
          <View style={styles.deleteSection}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
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
  
  reminderSettings: {
    marginTop: spacing[3],
    padding: spacing[3],
    backgroundColor: colors.accent.light,
    borderRadius: radiusValues.box,
  },

  reminderRow: {
    marginBottom: spacing[3],
  },

  reminderLabel: {
    ...textStyles.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing[2],
  },

  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },

  timeOption: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radiusValues.box,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  timeOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  timeOptionText: {
    ...textStyles.bodySmall,
    color: colors.text.primary,
  },

  timeOptionTextSelected: {
    color: colors.text.inverse,
    fontWeight: '600',
  },

  customTimeOption: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.border,
  },

  customTimeContainer: {
    marginTop: spacing[3],
    padding: spacing[3],
    backgroundColor: colors.accent.light,
    borderRadius: radiusValues.box,
  },

  customTimeLabel: {
    ...textStyles.bodySmall,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },

  customTimeInput: {
    ...textStyles.body,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radiusValues.box,
    padding: spacing[3],
    color: colors.text.primary,
    textAlign: 'center',
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: '600',
  },

  reminderTextInput: {
    marginTop: spacing[2],
  },

  frequencyOptions: {
    flexDirection: 'row',
    gap: spacing[2],
  },

  frequencyOption: {
    flex: 1,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radiusValues.box,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },

  frequencyOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  frequencyOptionText: {
    ...textStyles.bodySmall,
    color: colors.text.primary,
  },

  frequencyOptionTextSelected: {
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