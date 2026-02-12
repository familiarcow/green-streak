/**
 * GoalPickerStep
 *
 * Onboarding step for selecting life goals.
 * Multi-select with one "primary" goal.
 * Tap to select/deselect, long-press to set as primary.
 * Supports custom goal creation during onboarding.
 *
 * Full-width card layout with descriptions to help users choose.
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Icon } from '../common/Icon';
import { GOALS } from '../../data/goalLibrary';
import { GoalDefinition, CustomGoalDefinition, AnyGoalDefinition, isCustomGoal } from '../../types/goals';
import { useAccentColor } from '../../hooks';
import { colors, textStyles, spacing, shadows } from '../../theme';
import { radiusValues } from '../../theme/utils';

interface GoalPickerStepProps {
  selectedGoalIds: string[];
  primaryGoalId: string | null;
  customGoals?: CustomGoalDefinition[];
  onToggleGoal: (goalId: string) => void;
  onSetPrimary: (goalId: string) => void;
  onCreateCustom?: () => void;
  onSkip?: () => void;
}

interface GoalCardProps {
  goal: AnyGoalDefinition;
  isSelected: boolean;
  isPrimary: boolean;
  isCustom?: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  isSelected,
  isPrimary,
  isCustom,
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
      accessibilityLabel={`${goal.title}${isSelected ? ', selected' : ''}${isPrimary ? ', primary goal' : ''}${isCustom ? ', custom goal' : ''}`}
    >
      {/* Left side: Icon */}
      <View style={[styles.iconContainer, { backgroundColor: `${goal.color}15` }]}>
        <Icon name={goal.icon} size={24} color={goal.color} />
      </View>

      {/* Middle: Title and Description */}
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.goalTitle, isSelected && { color: goal.color }]}>
            {goal.title}
          </Text>
          {isCustom && (
            <View style={styles.customTag}>
              <Text style={styles.customTagText}>Custom</Text>
            </View>
          )}
        </View>
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
  customGoals = [],
  onToggleGoal,
  onSetPrimary,
  onCreateCustom,
  onSkip,
}) => {
  const accentColor = useAccentColor();

  // Combine predefined and custom goals
  const allGoals: AnyGoalDefinition[] = useMemo(() => {
    return [...GOALS, ...customGoals];
  }, [customGoals]);

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

  const handleCreateCustom = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCreateCustom?.();
  }, [onCreateCustom]);

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
        {/* Predefined Goals */}
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

        {/* Custom Goals (created during onboarding) */}
        {customGoals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            isSelected={selectedGoalIds.includes(goal.id)}
            isPrimary={primaryGoalId === goal.id}
            isCustom
            onPress={() => handlePress(goal.id)}
            onLongPress={() => handleLongPress(goal.id)}
          />
        ))}

        {/* Create Your Own Button */}
        {onCreateCustom && (
          <TouchableOpacity
            onPress={handleCreateCustom}
            activeOpacity={0.7}
            style={[styles.createCustomButton, { borderColor: accentColor }]}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Create your own custom goal"
          >
            <View style={[styles.createIconContainer, { backgroundColor: accentColor + '15' }]}>
              <Icon name="plus" size={24} color={accentColor} />
            </View>
            <View style={styles.textContainer}>
              <Text style={[styles.goalTitle, { color: accentColor }]}>
                Create Your Own
              </Text>
              <Text style={styles.goalDescription}>
                Define a personal goal that matters to you
              </Text>
            </View>
            <Icon name="chevron-right" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
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

  textContainer: {
    flex: 1,
    marginRight: spacing[2],
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  goalTitle: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },

  customTag: {
    backgroundColor: colors.border + '60',
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radiusValues.sm,
    marginBottom: 2,
  },

  customTagText: {
    ...textStyles.caption,
    fontSize: 10,
    color: colors.text.tertiary,
    fontWeight: '600',
  },

  goalDescription: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    lineHeight: 18,
  },

  createCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    padding: spacing[3],
    marginBottom: spacing[2],
    marginTop: spacing[2],
    borderWidth: 2,
    borderStyle: 'dashed',
    ...shadows.sm,
  },

  createIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
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
