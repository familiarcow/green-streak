/**
 * GoalCard
 *
 * Displays the primary goal with progress on the home screen.
 * Shows linked habit completion progress and quick access to all goals.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Icon } from '../common/Icon';
import { GoalProgress, UserGoalWithDetails } from '../../types/goals';
import { colors, textStyles, spacing, shadows } from '../../theme';
import { glassStyles } from '../../theme/glass';
import { radiusValues } from '../../theme/utils';

interface GoalCardProps {
  primaryGoalProgress: GoalProgress | null;
  allGoals: UserGoalWithDetails[];
  onPress: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  primaryGoalProgress,
  allGoals,
  onPress,
}) => {
  // If no goals, don't render
  if (allGoals.length === 0) {
    return null;
  }

  const primaryGoal = primaryGoalProgress?.goal;
  const otherGoals = allGoals.filter((g) => !g.isPrimary);
  const hasOtherGoals = otherGoals.length > 0;

  // Progress calculation
  const completedCount = primaryGoalProgress?.completedToday ?? 0;
  const totalCount = primaryGoalProgress?.totalHabits ?? 0;
  const progressPercentage = primaryGoalProgress?.percentage ?? 0;

  return (
    <Animated.View entering={FadeInUp.delay(200).springify()}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.container,
          glassStyles.card,
          pressed && styles.pressed,
        ]}
      >
        {/* Header row */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {primaryGoal ? (
              <>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: primaryGoal.definition.color + '20' },
                  ]}
                >
                  <Text style={styles.emoji}>{primaryGoal.definition.emoji}</Text>
                </View>
                <View style={styles.titleContainer}>
                  <View style={styles.titleRow}>
                    <Text style={styles.title} numberOfLines={1}>
                      {primaryGoal.definition.title}
                    </Text>
                    <Icon name="star" size={14} color={colors.warning} />
                  </View>
                  <Text style={styles.subtitle}>Primary Goal</Text>
                </View>
              </>
            ) : (
              <>
                <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                  <Icon name="target" size={20} color={colors.primary} />
                </View>
                <View style={styles.titleContainer}>
                  <Text style={styles.title}>Your Goals</Text>
                  <Text style={styles.subtitle}>No primary goal set</Text>
                </View>
              </>
            )}
          </View>
          <Icon name="chevron-right" size={20} color={colors.text.tertiary} />
        </View>

        {/* Progress section (only if primary goal has linked habits) */}
        {primaryGoal && totalCount > 0 && (
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Today's Progress</Text>
              <Text style={styles.progressCount}>
                {completedCount}/{totalCount} habits
              </Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor: primaryGoal.definition.color,
                  },
                ]}
              />
            </View>
          </View>
        )}

        {/* No habits linked message */}
        {primaryGoal && totalCount === 0 && (
          <View style={styles.noHabitsSection}>
            <Text style={styles.noHabitsText}>
              Link habits to track progress toward this goal
            </Text>
          </View>
        )}

        {/* Other goals preview */}
        {hasOtherGoals && (
          <View style={styles.otherGoalsSection}>
            <View style={styles.emojiPreview}>
              {otherGoals.slice(0, 3).map((goal) => (
                <Text key={goal.id} style={styles.previewEmoji}>
                  {goal.definition.emoji}
                </Text>
              ))}
            </View>
            <Text style={styles.otherGoalsText}>
              +{otherGoals.length} more goal{otherGoals.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radiusValues.box,
    padding: spacing[3],
    marginBottom: spacing[3],
  },

  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },

  emoji: {
    fontSize: 22,
  },

  titleContainer: {
    flex: 1,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },

  title: {
    ...textStyles.h4,
    color: colors.text.primary,
    fontWeight: '600',
  },

  subtitle: {
    ...textStyles.bodySmall,
    color: colors.text.tertiary,
    marginTop: 2,
  },

  progressSection: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border + '40',
  },

  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },

  progressLabel: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },

  progressCount: {
    ...textStyles.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
  },

  progressBarContainer: {
    height: 8,
    backgroundColor: colors.border + '40',
    borderRadius: 4,
    overflow: 'hidden',
  },

  progressBar: {
    height: '100%',
    borderRadius: 4,
  },

  noHabitsSection: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border + '40',
  },

  noHabitsText: {
    ...textStyles.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  otherGoalsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border + '40',
  },

  emojiPreview: {
    flexDirection: 'row',
    marginRight: spacing[2],
  },

  previewEmoji: {
    fontSize: 16,
    marginRight: 4,
  },

  otherGoalsText: {
    ...textStyles.bodySmall,
    color: colors.text.tertiary,
  },
});

export default GoalCard;
