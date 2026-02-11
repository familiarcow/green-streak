/**
 * GoalPickerStep
 *
 * Onboarding step for selecting life goals.
 * Multi-select with one "primary" goal.
 * Tap to select/deselect, long-press to set as primary.
 *
 * Full-width card layout with descriptions to help users choose.
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Icon } from '../common/Icon';
import { GOALS } from '../../data/goalLibrary';
import { GoalDefinition } from '../../types/goals';
import { colors, textStyles, spacing, shadows } from '../../theme';
import { radiusValues } from '../../theme/utils';

interface GoalPickerStepProps {
  selectedGoalIds: string[];
  primaryGoalId: string | null;
  onToggleGoal: (goalId: string) => void;
  onSetPrimary: (goalId: string) => void;
  onSkip?: () => void;
}

interface GoalCardProps {
  goal: GoalDefinition;
  isSelected: boolean;
  isPrimary: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  isSelected,
  isPrimary,
  onPress,
  onLongPress,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      activeOpacity={0.7}
      style={[
        styles.goalCard,
        isSelected && styles.goalCardSelected,
        isSelected && { borderColor: goal.color },
      ]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${goal.title}${isSelected ? ', selected' : ''}${isPrimary ? ', primary goal' : ''}`}
    >
      {/* Left side: Icon */}
      <View style={[styles.iconContainer, { backgroundColor: `${goal.color}15` }]}>
        <Text style={styles.goalEmoji}>{goal.emoji}</Text>
      </View>

      {/* Middle: Title and Description */}
      <View style={styles.textContainer}>
        <Text style={[styles.goalTitle, isSelected && { color: goal.color }]}>
          {goal.title}
        </Text>
        <Text style={styles.goalDescription} numberOfLines={2}>
          {goal.description}
        </Text>
      </View>

      {/* Right side: Selection indicator */}
      <View style={styles.selectionIndicator}>
        {isSelected ? (
          <View style={[styles.checkCircle, { backgroundColor: goal.color }]}>
            <Icon name="check" size={14} color={colors.text.inverse} />
          </View>
        ) : (
          <View style={styles.emptyCircle} />
        )}
        {isPrimary && (
          <Animated.View entering={FadeIn} style={styles.primaryStar}>
            <Icon name="star" size={12} color={colors.warning} />
          </Animated.View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export const GoalPickerStep: React.FC<GoalPickerStepProps> = ({
  selectedGoalIds,
  primaryGoalId,
  onToggleGoal,
  onSetPrimary,
  onSkip,
}) => {
  const handlePress = useCallback((goalId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleGoal(goalId);
  }, [onToggleGoal]);

  const handleLongPress = useCallback((goalId: string) => {
    // Only allow setting primary if goal is selected
    if (selectedGoalIds.includes(goalId)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSetPrimary(goalId);
    } else {
      // If not selected, select it and set as primary
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onToggleGoal(goalId);
      onSetPrimary(goalId);
    }
  }, [selectedGoalIds, onToggleGoal, onSetPrimary]);

  const handleSkip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSkip?.();
  }, [onSkip]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={styles.title}>Choose Your Goals</Text>
        <Text style={styles.subtitle}>
          Select the life goals that matter most to you
        </Text>
      </View>

      {/* Goals List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.goalsList}
        showsVerticalScrollIndicator={false}
      >
        {GOALS.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            isSelected={selectedGoalIds.includes(goal.id)}
            isPrimary={primaryGoalId === goal.id}
            onPress={() => handlePress(goal.id)}
            onLongPress={() => handleLongPress(goal.id)}
          />
        ))}
      </ScrollView>

      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {selectedGoalIds.length > 0 ? (
          <>
            <View style={styles.hintRow}>
              <Icon name="star" size={14} color={colors.warning} />
              <Text style={styles.hintText}>Long-press to set your primary goal</Text>
            </View>
            <Text style={styles.selectedCount}>
              {selectedGoalIds.length} goal{selectedGoalIds.length !== 1 ? 's' : ''} selected
            </Text>
          </>
        ) : (
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip for now</Text>
            <Icon name="chevron-right" size={16} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  headerSection: {
    alignItems: 'center',
    marginBottom: spacing[3],
    paddingHorizontal: spacing[4],
  },

  title: {
    ...textStyles.h2,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing[1],
  },

  subtitle: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  scrollView: {
    flex: 1,
  },

  goalsList: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
  },

  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    padding: spacing[3],
    marginBottom: spacing[2],
    borderWidth: 2,
    borderColor: 'transparent',
    ...shadows.sm,
  },

  goalCardSelected: {
    ...shadows.md,
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },

  goalEmoji: {
    fontSize: 24,
  },

  textContainer: {
    flex: 1,
    marginRight: spacing[2],
  },

  goalTitle: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },

  goalDescription: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    lineHeight: 18,
  },

  selectionIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
  },

  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
  },

  primaryStar: {
    marginTop: spacing[1],
  },

  bottomSection: {
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    gap: spacing[1],
  },

  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },

  hintText: {
    ...textStyles.bodySmall,
    color: colors.text.tertiary,
  },

  selectedCount: {
    ...textStyles.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },

  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
  },

  skipText: {
    ...textStyles.body,
    color: colors.text.tertiary,
  },
});

export default GoalPickerStep;
