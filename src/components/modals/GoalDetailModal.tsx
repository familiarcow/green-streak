/**
 * GoalDetailModal
 *
 * Full goal management modal accessible from GoalCard on home screen.
 * Allows selecting/deselecting goals and setting the primary goal.
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { BaseModal } from './BaseModal';
import { Icon } from '../common/Icon';
import { GOALS } from '../../data/goalLibrary';
import { GoalDefinition, UserGoalWithDetails } from '../../types/goals';
import { useGoalsStore } from '../../store/goalsStore';
import { colors, textStyles, spacing, shadows } from '../../theme';
import { glassStyles } from '../../theme/glass';
import { radiusValues } from '../../theme/utils';

interface GoalDetailModalProps {
  visible: boolean;
  onClose: () => void;
  onCloseComplete?: () => void;
}

interface GoalItemProps {
  goal: GoalDefinition;
  userGoal: UserGoalWithDetails | undefined;
  isSelected: boolean;
  isPrimary: boolean;
  linkedHabitCount: number;
  onToggle: () => void;
  onSetPrimary: () => void;
  index: number;
}

const GoalItem: React.FC<GoalItemProps> = ({
  goal,
  isSelected,
  isPrimary,
  linkedHabitCount,
  onToggle,
  onSetPrimary,
  index,
}) => {
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggle();
  }, [onToggle]);

  const handleLongPress = useCallback(() => {
    if (isSelected) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSetPrimary();
    } else {
      // Select and set as primary
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onToggle();
      // onSetPrimary will be called after toggle completes
    }
  }, [isSelected, onToggle, onSetPrimary]);

  return (
    <Animated.View entering={FadeInDown.delay(50 + index * 30).springify()}>
      <Pressable
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={400}
        style={({ pressed }) => [
          styles.goalItem,
          glassStyles.card,
          isSelected && styles.goalItemSelected,
          isSelected && { borderColor: goal.color },
          pressed && styles.goalItemPressed,
        ]}
      >
        {/* Primary star badge */}
        {isPrimary && (
          <Animated.View entering={FadeIn} style={styles.primaryBadge}>
            <Icon name="star" size={12} color={colors.warning} />
          </Animated.View>
        )}

        {/* Left: Icon and title */}
        <View style={styles.goalInfo}>
          <View style={[styles.goalIconContainer, { backgroundColor: goal.color + '20' }]}>
            <Text style={styles.goalEmoji}>{goal.emoji}</Text>
          </View>
          <View style={styles.goalTextContainer}>
            <Text
              style={[styles.goalTitle, isSelected && { color: goal.color }]}
              numberOfLines={1}
            >
              {goal.title}
            </Text>
            <Text style={styles.goalDescription} numberOfLines={1}>
              {goal.description}
            </Text>
          </View>
        </View>

        {/* Right: Linked habits count & checkmark */}
        <View style={styles.goalRight}>
          {isSelected && linkedHabitCount > 0 && (
            <View style={styles.linkedCount}>
              <Icon name="layers" size={12} color={colors.text.tertiary} />
              <Text style={styles.linkedCountText}>{linkedHabitCount}</Text>
            </View>
          )}
          {isSelected && (
            <Animated.View entering={FadeIn} style={[styles.checkmark, { backgroundColor: goal.color }]}>
              <Icon name="check" size={12} color={colors.surface} />
            </Animated.View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

export const GoalDetailModal: React.FC<GoalDetailModalProps> = ({
  visible,
  onClose,
  onCloseComplete,
}) => {
  const goals = useGoalsStore((state) => state.goals);
  const primaryGoal = useGoalsStore((state) => state.primaryGoal);
  const selectGoal = useGoalsStore((state) => state.selectGoal);
  const deselectGoal = useGoalsStore((state) => state.deselectGoal);
  const setPrimaryGoal = useGoalsStore((state) => state.setPrimaryGoal);

  // Map of goalId (definition) to UserGoalWithDetails
  const selectedGoalsMap = useMemo(() => {
    const map: Record<string, UserGoalWithDetails> = {};
    for (const goal of goals) {
      map[goal.goalId] = goal;
    }
    return map;
  }, [goals]);

  const handleToggle = useCallback(
    async (goalId: string) => {
      const isSelected = goalId in selectedGoalsMap;
      if (isSelected) {
        await deselectGoal(goalId);
      } else {
        // If this is the first goal, make it primary
        const shouldBePrimary = goals.length === 0;
        await selectGoal(goalId, shouldBePrimary);
      }
    },
    [selectedGoalsMap, goals.length, selectGoal, deselectGoal]
  );

  const handleSetPrimary = useCallback(
    async (goalId: string) => {
      // Only set primary if currently selected
      if (goalId in selectedGoalsMap) {
        await setPrimaryGoal(goalId);
      }
    },
    [selectedGoalsMap, setPrimaryGoal]
  );

  const selectedCount = goals.length;

  return (
    <BaseModal
      isVisible={visible}
      onClose={onClose}
      onCloseComplete={onCloseComplete}
      closeOnBackdropPress={true}
      height="75%"
      minHeight={400}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Icon name="target" size={24} color={colors.primary} />
          </View>
          <Text style={styles.title}>Your Goals</Text>
          <Text style={styles.subtitle}>
            Tap to select, long-press to set as primary
          </Text>
        </View>

        {/* Goals List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {GOALS.map((goal, index) => {
            const userGoal = selectedGoalsMap[goal.id];
            const isSelected = !!userGoal;
            const isPrimary = primaryGoal?.goalId === goal.id;
            const linkedHabitCount = userGoal?.linkedHabitIds?.length ?? 0;

            return (
              <GoalItem
                key={goal.id}
                goal={goal}
                userGoal={userGoal}
                isSelected={isSelected}
                isPrimary={isPrimary}
                linkedHabitCount={linkedHabitCount}
                onToggle={() => handleToggle(goal.id)}
                onSetPrimary={() => handleSetPrimary(goal.id)}
                index={index}
              />
            );
          })}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {selectedCount === 0
              ? 'No goals selected'
              : `${selectedCount} goal${selectedCount !== 1 ? 's' : ''} selected`}
          </Text>
          {primaryGoal && (
            <View style={styles.primaryIndicator}>
              <Icon name="star" size={12} color={colors.warning} />
              <Text style={styles.primaryText}>
                Primary: {primaryGoal.definition.title}
              </Text>
            </View>
          )}
        </View>
      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },

  header: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },

  title: {
    ...textStyles.h2,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },

  subtitle: {
    ...textStyles.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: spacing[4],
    gap: spacing[2],
  },

  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    borderRadius: radiusValues.box,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },

  goalItemSelected: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },

  goalItemPressed: {
    opacity: 0.8,
  },

  primaryBadge: {
    position: 'absolute',
    top: spacing[2],
    right: spacing[2],
    backgroundColor: colors.warning + '20',
    borderRadius: spacing[3],
    padding: 4,
  },

  goalInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  goalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },

  goalEmoji: {
    fontSize: 20,
  },

  goalTextContainer: {
    flex: 1,
    marginRight: spacing[2],
  },

  goalTitle: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
  },

  goalDescription: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },

  goalRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  linkedCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.border + '40',
    paddingHorizontal: spacing[2],
    paddingVertical: 4,
    borderRadius: radiusValues.md,
  },

  linkedCountText: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    fontWeight: '600',
  },

  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  footer: {
    marginTop: spacing[2],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    alignItems: 'center',
  },

  footerText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },

  primaryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginTop: spacing[1],
  },

  primaryText: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },
});

export default GoalDetailModal;
