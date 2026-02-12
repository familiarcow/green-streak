/**
 * EditGoalModal
 *
 * Full-screen modal for creating and editing custom goals.
 * Follows the same pattern as EditTaskModal.
 */

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
import { AnimatedButton } from '../AnimatedButton';
import { Icon, IconName } from '../common/Icon';
import { ColorPickerModal } from '../ColorPicker';
import { useGoalsStore } from '../../store/goalsStore';
import { useAccentColor, useSounds } from '../../hooks';
import { colors, textStyles, spacing, shadows, glassStyles } from '../../theme';
import { radiusValues } from '../../theme/utils';
import { COLOR_PALETTE } from '../../database/schema';
import { CustomGoalDefinition } from '../../types/goals';
import logger from '../../utils/logger';

interface EditGoalModalProps {
  onClose: () => void;
  onSave: (goal: CustomGoalDefinition) => void;
  existingGoal?: CustomGoalDefinition;
}

// Icon presets for goals
const ICON_PRESETS: IconName[] = [
  'target', 'star', 'heart', 'zap', 'medal', 'trophy',
  'book', 'briefcase', 'lightbulb', 'users', 'sun', 'compass',
];

export const EditGoalModal: React.FC<EditGoalModalProps> = ({
  onClose,
  onSave,
  existingGoal,
}) => {
  const [title, setTitle] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_PALETTE[0]);
  const [selectedIcon, setSelectedIcon] = useState<IconName>('target');
  const [description, setDescription] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [makePrimary, setMakePrimary] = useState(false);

  const { goals, createCustomGoal, updateCustomGoal, deleteCustomGoal } = useGoalsStore();
  const accentColor = useAccentColor();
  const { playRandomTap, playCaution, playCelebration } = useSounds();

  const isEditing = !!existingGoal;

  // Initialize form with existing goal data
  useEffect(() => {
    if (existingGoal) {
      setTitle(existingGoal.title);
      setSelectedColor(existingGoal.color);
      setSelectedIcon(existingGoal.icon);
      setDescription(existingGoal.description || '');
    }
  }, [existingGoal]);

  // Auto-check "Make primary" if this will be the user's first goal
  useEffect(() => {
    if (!existingGoal && goals.length === 0) {
      setMakePrimary(true);
    }
  }, [existingGoal, goals.length]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a goal name');
      return;
    }

    if (title.trim().length > 30) {
      Alert.alert('Error', 'Goal name must be 30 characters or less');
      return;
    }

    if (description.length > 100) {
      Alert.alert('Error', 'Description must be 100 characters or less');
      return;
    }

    try {
      const goalData = {
        title: title.trim(),
        emoji: '', // Deprecated - icons are used instead
        color: selectedColor,
        icon: selectedIcon,
        description: description.trim(),
      };

      let savedGoal: CustomGoalDefinition;

      if (isEditing && existingGoal) {
        logger.debug('UI', 'Updating custom goal', { id: existingGoal.id });
        savedGoal = await updateCustomGoal(existingGoal.id, goalData);
        logger.info('UI', 'Custom goal updated', { id: existingGoal.id });
      } else {
        logger.debug('UI', 'Creating custom goal', { title: goalData.title });
        // Auto-select the newly created goal
        savedGoal = await createCustomGoal(goalData, { select: true, isPrimary: makePrimary });
        logger.info('UI', 'Custom goal created and selected', { id: savedGoal.id });
      }

      playCelebration();
      onSave(savedGoal);
    } catch (error) {
      const action = isEditing ? 'update' : 'create';
      logger.error('UI', `Failed to ${action} custom goal`, { error });
      playCaution();
      Alert.alert('Error', `Failed to ${action} goal. Please try again.`);
    }
  };

  const handleDelete = async () => {
    if (!existingGoal) return;

    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${existingGoal.title}"? This will also remove it from your selected goals.`,
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
              logger.debug('UI', 'Deleting custom goal', { id: existingGoal.id });
              await deleteCustomGoal(existingGoal.id);
              logger.info('UI', 'Custom goal deleted', { id: existingGoal.id });
              onClose();
            } catch (error) {
              logger.error('UI', 'Failed to delete custom goal', { error });
              Alert.alert('Error', 'Failed to delete goal. Please try again.');
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
          accessibilityLabel={isEditing ? 'Cancel editing goal' : 'Cancel adding goal'}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditing ? 'Edit Goal' : 'Create Goal'}</Text>
        <AnimatedButton
          title="Save"
          onPress={handleSave}
          variant="primary"
          size="medium"
          skipSound
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Preview Card */}
        <View style={[styles.previewCard, { borderColor: selectedColor }]}>
          <View style={[styles.previewIconContainer, { backgroundColor: selectedColor + '20' }]}>
            <Icon name={selectedIcon} size={32} color={selectedColor} />
          </View>
          <Text style={[styles.previewTitle, { color: selectedColor }]}>
            {title || 'Your Goal'}
          </Text>
          {description ? (
            <Text style={styles.previewDescription} numberOfLines={1}>
              {description}
            </Text>
          ) : null}
        </View>

        {/* Name Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Name *</Text>
          <View style={styles.settingItem}>
            <TextInput
              style={styles.textInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter goal name"
              placeholderTextColor={colors.text.tertiary}
              maxLength={30}
              autoCapitalize="words"
            />
            <Text style={styles.charCount}>{title.length}/30</Text>
          </View>
        </View>

        {/* Color Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Color</Text>
          <View style={styles.settingItem}>
            <View style={styles.colorGrid}>
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
                  accessibilityState={{ selected: selectedColor.toUpperCase() === color.toUpperCase() }}
                />
              ))}
              {/* Custom color button */}
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
                    accessibilityLabel={isCustomColorSelected ? `Custom color, tap to change` : 'Select custom color'}
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

        {/* Icon Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Icon</Text>
          <View style={styles.settingItem}>
            <View style={styles.iconGrid}>
              {ICON_PRESETS.map((icon, index) => (
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
                  accessibilityState={{ selected: selectedIcon === icon }}
                >
                  <Icon name={icon} size={20} color={colors.text.primary} />
                </TouchableOpacity>
              ))}
            </View>
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
              placeholder="What does this goal mean to you? (optional)"
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={3}
              maxLength={100}
            />
            <Text style={styles.charCount}>{description.length}/100</Text>
          </View>
        </View>

        {/* Primary Goal Toggle (Create mode only) */}
        {!isEditing && (
          <View style={styles.section}>
            <View style={styles.primaryToggleRow}>
              <View style={styles.primaryToggleInfo}>
                <Icon name="star" size={20} color={colors.warning} />
                <View>
                  <Text style={styles.primaryToggleLabel}>Make primary goal</Text>
                  <Text style={styles.primaryToggleDescription}>
                    Your primary goal appears first on your home screen
                  </Text>
                </View>
              </View>
              <Switch
                value={makePrimary}
                onValueChange={setMakePrimary}
                trackColor={{ false: colors.interactive.default, true: accentColor }}
                thumbColor={colors.surface}
              />
            </View>
          </View>
        )}

        {/* Delete Button (Edit mode only) */}
        {isEditing && (
          <View style={styles.deleteSection}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => {
                playCaution();
                handleDelete();
              }}
              accessibilityRole="button"
              accessibilityLabel="Delete goal"
            >
              <Icon name="x" size={20} color={colors.text.inverse} />
              <Text style={styles.deleteButtonText}>Delete Goal</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

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

  headerTitle: {
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

  previewCard: {
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: radiusValues.box,
    borderWidth: 2,
    marginBottom: spacing[6],
    ...glassStyles.card,
  },

  previewIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },

  previewTitle: {
    ...textStyles.h2,
    fontWeight: '600',
    marginBottom: spacing[1],
  },

  previewDescription: {
    ...textStyles.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
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
    ...shadows.sm,
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

  charCount: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    textAlign: 'right',
    marginTop: spacing[1],
  },

  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
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

  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
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
    borderWidth: 2,
  },

  primaryToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    padding: spacing[4],
    ...shadows.sm,
  },

  primaryToggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },

  primaryToggleLabel: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '500',
  },

  primaryToggleDescription: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    marginTop: 2,
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

export default EditGoalModal;
