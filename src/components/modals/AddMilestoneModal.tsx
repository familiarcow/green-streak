/**
 * AddMilestoneModal
 *
 * Modal for adding a milestone to a goal.
 * Includes date picker, title input, and optional description.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { BaseModal } from './BaseModal';
import { AnimatedButton } from '../AnimatedButton';
import { Icon } from '../common/Icon';
import { useGoalsStore } from '../../store/goalsStore';
import { useAccentColor, useSounds } from '../../hooks';
import { colors, textStyles, spacing, shadows } from '../../theme';
import { glassStyles } from '../../theme/glass';
import { radiusValues } from '../../theme/utils';
import { MILESTONE_TITLE_MAX_LENGTH, MILESTONE_DESCRIPTION_MAX_LENGTH } from '../../database/migrations/addMilestonesSupport';
import { getTodayString } from '../../utils/dateHelpers';
import logger from '../../utils/logger';

interface AddMilestoneModalProps {
  visible: boolean;
  onClose: () => void;
  onCloseComplete?: () => void;
  /** Pre-selected goal ID (user_goals.id) */
  defaultGoalId?: string;
}

/**
 * Format a date string (YYYY-MM-DD) to display format
 */
function formatDateDisplay(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export const AddMilestoneModal: React.FC<AddMilestoneModalProps> = ({
  visible,
  onClose,
  onCloseComplete,
  defaultGoalId,
}) => {
  const { goals, createMilestone } = useGoalsStore();
  const accentColor = useAccentColor();
  const { playRandomTap, playCaution, playCelebration } = useSounds();

  // Form state
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [date, setDate] = useState(getTodayString());
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Get currently selected goal
  const selectedGoal = useMemo(() => {
    if (!selectedGoalId) return null;
    return goals.find(g => g.id === selectedGoalId) || null;
  }, [goals, selectedGoalId]);

  // Initialize with default goal or first available
  useEffect(() => {
    if (visible) {
      if (defaultGoalId && goals.some(g => g.id === defaultGoalId)) {
        setSelectedGoalId(defaultGoalId);
      } else if (goals.length > 0 && !selectedGoalId) {
        setSelectedGoalId(goals[0].id);
      }
    }
  }, [visible, defaultGoalId, goals, selectedGoalId]);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setDate(getTodayString());
      setTitle('');
      setDescription('');
      setIsSaving(false);
    }
  }, [visible]);

  const handleCycleGoal = useCallback(() => {
    if (goals.length <= 1) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    playRandomTap();

    const currentIndex = goals.findIndex(g => g.id === selectedGoalId);
    const nextIndex = (currentIndex + 1) % goals.length;
    setSelectedGoalId(goals[nextIndex].id);
  }, [goals, selectedGoalId, playRandomTap]);

  const handleDateChange = useCallback((event: DateTimePickerEvent, selectedDate?: Date) => {
    // On Android, always hide the picker after selection
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      // Format to YYYY-MM-DD
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!selectedGoalId) {
      Alert.alert('Error', 'Please select a goal');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (title.trim().length > MILESTONE_TITLE_MAX_LENGTH) {
      Alert.alert('Error', `Title must be ${MILESTONE_TITLE_MAX_LENGTH} characters or less`);
      return;
    }

    if (description.length > MILESTONE_DESCRIPTION_MAX_LENGTH) {
      Alert.alert('Error', `Description must be ${MILESTONE_DESCRIPTION_MAX_LENGTH} characters or less`);
      return;
    }

    setIsSaving(true);

    try {
      logger.debug('UI', 'Creating milestone', { userGoalId: selectedGoalId, title: title.trim() });

      await createMilestone({
        userGoalId: selectedGoalId,
        date,
        title: title.trim(),
        description: description.trim(),
      });

      logger.info('UI', 'Milestone created', { userGoalId: selectedGoalId });
      playCelebration();
      onClose();
    } catch (error) {
      logger.error('UI', 'Failed to create milestone', { error });
      playCaution();
      Alert.alert('Error', 'Failed to create milestone. Please try again.');
      setIsSaving(false);
    }
  }, [selectedGoalId, date, title, description, createMilestone, onClose, playCelebration, playCaution]);

  const handleClose = useCallback(() => {
    playCaution();
    onClose();
  }, [onClose, playCaution]);

  if (goals.length === 0) {
    return (
      <BaseModal
        isVisible={visible}
        onClose={onClose}
        onCloseComplete={onCloseComplete}
        closeOnBackdropPress={true}
        height="auto"
      >
        <View style={styles.emptyContainer}>
          <Icon name="target" size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>No goals yet</Text>
          <Text style={styles.emptyDescription}>
            Create a goal first to add milestones
          </Text>
          <AnimatedButton
            title="Close"
            onPress={onClose}
            variant="secondary"
            size="medium"
          />
        </View>
      </BaseModal>
    );
  }

  return (
    <BaseModal
      isVisible={visible}
      onClose={onClose}
      onCloseComplete={onCloseComplete}
      closeOnBackdropPress={true}
      height="auto"
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon name="goal" size={24} color={accentColor} />
            <View>
              <Text style={styles.headerTitle}>Add Milestone</Text>
              <Text style={styles.headerSubtitle}>
                Record a meaningful moment on your journey
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Icon name="x" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Goal Selector */}
        {selectedGoal && (
          <TouchableOpacity
            style={[styles.goalSelector, glassStyles.card]}
            onPress={handleCycleGoal}
            disabled={goals.length <= 1}
            accessibilityRole="button"
            accessibilityLabel={`Selected goal: ${selectedGoal.definition.title}. ${goals.length > 1 ? 'Tap to change' : ''}`}
          >
            <View style={[styles.goalIcon, { backgroundColor: selectedGoal.definition.color + '20' }]}>
              <Icon
                name={selectedGoal.definition.icon}
                size={20}
                color={selectedGoal.definition.color}
              />
            </View>
            <Text style={styles.goalName} numberOfLines={1}>
              {selectedGoal.definition.title}
            </Text>
            {goals.length > 1 && (
              <Icon name="chevron-right" size={16} color={colors.text.tertiary} />
            )}
          </TouchableOpacity>
        )}

        {/* Date Row */}
        <View style={styles.formRow}>
          <Text style={styles.label}>Date</Text>
          <TouchableOpacity
            style={[styles.dateButton, glassStyles.card]}
            onPress={() => setShowDatePicker(true)}
            accessibilityRole="button"
            accessibilityLabel={`Date: ${formatDateDisplay(date)}. Tap to change`}
          >
            <Icon name="calendar" size={16} color={colors.text.secondary} />
            <Text style={styles.dateText}>{formatDateDisplay(date)}</Text>
          </TouchableOpacity>
        </View>

        {/* Date Picker (iOS inline, Android modal) */}
        {showDatePicker && (
          Platform.OS === 'ios' ? (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={new Date(date + 'T12:00:00')}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()}
                textColor={colors.text.primary}
              />
              <TouchableOpacity
                style={[styles.datePickerDone, { backgroundColor: accentColor }]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <DateTimePicker
              value={new Date(date + 'T12:00:00')}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )
        )}

        {/* Title Input */}
        <View style={styles.formRow}>
          <Text style={styles.label}>What did you achieve?</Text>
          <View style={[styles.inputContainer, glassStyles.card]}>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Ran my first 5K"
              placeholderTextColor={colors.text.tertiary}
              maxLength={MILESTONE_TITLE_MAX_LENGTH}
              autoCapitalize="sentences"
            />
            <Text style={styles.charCount}>
              {title.length}/{MILESTONE_TITLE_MAX_LENGTH}
            </Text>
          </View>
        </View>

        {/* Description Input */}
        <View style={styles.formRow}>
          <Text style={styles.label}>Add details (optional)</Text>
          <View style={[styles.inputContainer, glassStyles.card]}>
            <TextInput
              style={[styles.descriptionInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="How did it feel? What made it special?"
              placeholderTextColor={colors.text.tertiary}
              maxLength={MILESTONE_DESCRIPTION_MAX_LENGTH}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>
              {description.length}/{MILESTONE_DESCRIPTION_MAX_LENGTH}
            </Text>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.saveButtonContainer}>
          <AnimatedButton
            title={isSaving ? 'Saving...' : 'Save Milestone'}
            onPress={handleSave}
            variant="primary"
            size="large"
            disabled={isSaving || !title.trim()}
            style={styles.saveButton}
          />
        </View>
      </ScrollView>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    maxHeight: '100%',
  },

  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing[4],
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    flex: 1,
  },

  headerTitle: {
    ...textStyles.h2,
    color: colors.text.primary,
  },

  headerSubtitle: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },

  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },

  goalSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    marginBottom: spacing[4],
    gap: spacing[2],
  },

  goalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  goalName: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '500',
    flex: 1,
  },

  formRow: {
    marginBottom: spacing[4],
  },

  label: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    fontWeight: '500',
    marginBottom: spacing[2],
  },

  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    gap: spacing[2],
  },

  dateText: {
    ...textStyles.body,
    color: colors.text.primary,
  },

  datePickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    marginBottom: spacing[4],
    overflow: 'hidden',
    ...shadows.sm,
  },

  datePickerDone: {
    padding: spacing[3],
    alignItems: 'center',
  },

  datePickerDoneText: {
    ...textStyles.button,
    color: colors.text.inverse,
    fontWeight: '600',
  },

  inputContainer: {
    padding: spacing[3],
  },

  titleInput: {
    ...textStyles.body,
    color: colors.text.primary,
    padding: 0,
  },

  descriptionInput: {
    ...textStyles.body,
    color: colors.text.primary,
    minHeight: 80,
    padding: 0,
  },

  charCount: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    textAlign: 'right',
    marginTop: spacing[1],
  },

  saveButtonContainer: {
    marginTop: spacing[2],
  },

  saveButton: {
    width: '100%',
  },

  emptyContainer: {
    padding: spacing[6],
    alignItems: 'center',
    gap: spacing[3],
  },

  emptyTitle: {
    ...textStyles.h3,
    color: colors.text.secondary,
  },

  emptyDescription: {
    ...textStyles.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
});

export default AddMilestoneModal;
