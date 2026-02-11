/**
 * GoalSelector
 *
 * Horizontal scrolling goal chips for linking habits to goals.
 * Used in EditTaskModal to allow multi-select goal association.
 * Styled consistently with other EditTaskModal sections.
 */

import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Icon } from '../common/Icon';
import { useGoalsStore } from '../../store/goalsStore';
import { colors, textStyles, spacing, shadows } from '../../theme';
import { glassStyles } from '../../theme/glass';
import { radiusValues } from '../../theme/utils';

interface GoalSelectorProps {
  taskId?: string;
  selectedGoalIds: string[];
  onGoalsChange: (goalIds: string[]) => void;
}

export const GoalSelector: React.FC<GoalSelectorProps> = ({
  taskId,
  selectedGoalIds,
  onGoalsChange,
}) => {
  const goals = useGoalsStore((state) => state.goals);
  const getGoalsForTask = useGoalsStore((state) => state.getGoalsForTask);

  // Load existing links when editing a task
  useEffect(() => {
    const loadExistingLinks = async () => {
      if (taskId) {
        try {
          const existingGoalIds = await getGoalsForTask(taskId);
          if (existingGoalIds.length > 0) {
            onGoalsChange(existingGoalIds);
          }
        } catch (error) {
          // Silently fail - new tasks won't have links
        }
      }
    };
    loadExistingLinks();
  }, [taskId, getGoalsForTask]);

  // Don't render if user has no goals
  if (goals.length === 0) {
    return null;
  }

  const handleToggleGoal = useCallback(
    (goalId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const isSelected = selectedGoalIds.includes(goalId);
      if (isSelected) {
        onGoalsChange(selectedGoalIds.filter((id) => id !== goalId));
      } else {
        onGoalsChange([...selectedGoalIds, goalId]);
      }
    },
    [selectedGoalIds, onGoalsChange]
  );

  const selectedCount = selectedGoalIds.length;

  return (
    <View style={[styles.container, glassStyles.card]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="target" size={18} color={colors.text.secondary} />
          <Text style={styles.headerTitle}>Link to Goals</Text>
        </View>
        {selectedCount > 0 && (
          <Text style={styles.countBadge}>
            {selectedCount} linked
          </Text>
        )}
      </View>

      {/* Goal chips - always visible */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {goals.map((goal) => {
          const isSelected = selectedGoalIds.includes(goal.goalId);
          const isPrimary = goal.isPrimary;
          return (
            <Pressable
              key={goal.id}
              onPress={() => handleToggleGoal(goal.goalId)}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                isSelected && { borderColor: goal.definition.color, backgroundColor: goal.definition.color + '15' },
                pressed && styles.chipPressed,
              ]}
            >
              <Text style={styles.chipEmoji}>{goal.definition.emoji}</Text>
              <Text
                style={[
                  styles.chipTitle,
                  isSelected && { color: goal.definition.color },
                ]}
                numberOfLines={1}
              >
                {goal.definition.title}
              </Text>
              {isPrimary && (
                <Icon name="star" size={10} color={isSelected ? goal.definition.color : colors.text.tertiary} />
              )}
              {isSelected && (
                <Animated.View entering={FadeIn}>
                  <Icon name="check" size={12} color={goal.definition.color} />
                </Animated.View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing[3],
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  headerTitle: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '600',
  },

  countBadge: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },

  chipsContainer: {
    gap: spacing[2],
  },

  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radiusValues.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginRight: spacing[2],
  },

  chipSelected: {
    ...shadows.sm,
  },

  chipPressed: {
    opacity: 0.8,
  },

  chipEmoji: {
    fontSize: 16,
  },

  chipTitle: {
    ...textStyles.bodySmall,
    color: colors.text.primary,
    fontWeight: '500',
    maxWidth: 100,
  },
});

export default GoalSelector;
