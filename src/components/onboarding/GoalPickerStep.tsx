/**
 * GoalPickerStep
 *
 * Onboarding step for selecting life goals.
 * Multi-select with one "primary" goal.
 * Tap to select/deselect, long-press to set as primary.
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import Animated, { FadeInUp, FadeIn, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Icon } from '../common/Icon';
import { GOALS } from '../../data/goalLibrary';
import { GoalDefinition } from '../../types/goals';
import { colors, textStyles, spacing, shadows } from '../../theme';
import { glassStyles } from '../../theme/glass';
import { radiusValues } from '../../theme/utils';

interface GoalPickerStepProps {
  selectedGoalIds: string[];
  primaryGoalId: string | null;
  onToggleGoal: (goalId: string) => void;
  onSetPrimary: (goalId: string) => void;
}

interface GoalCardProps {
  goal: GoalDefinition;
  isSelected: boolean;
  isPrimary: boolean;
  onPress: () => void;
  onLongPress: () => void;
  index: number;
}

const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  isSelected,
  isPrimary,
  onPress,
  onLongPress,
  index,
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(isSelected ? 1 : 0.98) },
    ],
    opacity: withSpring(isSelected ? 1 : 0.7),
  }));

  return (
    <Animated.View
      entering={FadeInUp.delay(100 + index * 50).springify()}
      style={animatedStyle}
    >
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        delayLongPress={400}
        style={({ pressed }) => [
          styles.goalCard,
          glassStyles.card,
          isSelected && styles.goalCardSelected,
          isSelected && { borderColor: goal.color },
          pressed && styles.goalCardPressed,
        ]}
      >
        {isPrimary && (
          <Animated.View entering={FadeIn} style={styles.primaryBadge}>
            <Icon name="star" size={12} color={colors.warning} />
          </Animated.View>
        )}

        <View style={[styles.goalIconContainer, { backgroundColor: goal.color + '20' }]}>
          <Text style={styles.goalEmoji}>{goal.emoji}</Text>
        </View>

        <Text style={[styles.goalTitle, isSelected && { color: goal.color }]} numberOfLines={1}>
          {goal.title}
        </Text>

        {isSelected && (
          <Animated.View entering={FadeIn} style={styles.checkmark}>
            <Icon name="check" size={14} color={goal.color} />
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
};

export const GoalPickerStep: React.FC<GoalPickerStepProps> = ({
  selectedGoalIds,
  primaryGoalId,
  onToggleGoal,
  onSetPrimary,
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

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100)} style={styles.headerSection}>
        <Text style={styles.title}>Choose Your Goals</Text>
        <Text style={styles.subtitle}>
          Select the life goals that matter most to you
        </Text>
      </Animated.View>

      <View style={styles.goalsGrid}>
        {GOALS.map((goal, index) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            isSelected={selectedGoalIds.includes(goal.id)}
            isPrimary={primaryGoalId === goal.id}
            onPress={() => handlePress(goal.id)}
            onLongPress={() => handleLongPress(goal.id)}
            index={index}
          />
        ))}
      </View>

      <Animated.View entering={FadeInUp.delay(500)} style={styles.hintSection}>
        <View style={styles.hintRow}>
          <Icon name="star" size={14} color={colors.warning} />
          <Text style={styles.hintText}>Long-press to set your primary goal</Text>
        </View>
        {selectedGoalIds.length === 0 && (
          <Text style={styles.skipHint}>You can skip this and add goals later</Text>
        )}
        {selectedGoalIds.length > 0 && (
          <Text style={styles.selectedCount}>
            {selectedGoalIds.length} goal{selectedGoalIds.length !== 1 ? 's' : ''} selected
          </Text>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing[2],
  },

  headerSection: {
    alignItems: 'center',
    marginBottom: spacing[4],
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

  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing[2],
  },

  goalCard: {
    width: '48%',
    padding: spacing[3],
    borderRadius: radiusValues.box,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },

  goalCardSelected: {
    backgroundColor: colors.surface,
    ...shadows.md,
  },

  goalCardPressed: {
    opacity: 0.8,
  },

  primaryBadge: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    backgroundColor: colors.warning + '20',
    borderRadius: spacing[3],
    padding: spacing[1],
  },

  goalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },

  goalEmoji: {
    fontSize: 24,
  },

  goalTitle: {
    ...textStyles.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
    textAlign: 'center',
  },

  checkmark: {
    position: 'absolute',
    bottom: spacing[2],
    right: spacing[2],
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 3,
    ...shadows.sm,
  },

  hintSection: {
    marginTop: spacing[4],
    alignItems: 'center',
    gap: spacing[2],
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

  skipHint: {
    ...textStyles.bodySmall,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },

  selectedCount: {
    ...textStyles.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
});

export default GoalPickerStep;
