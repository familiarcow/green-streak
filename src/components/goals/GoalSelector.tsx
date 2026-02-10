/**
 * GoalSelector
 *
 * Horizontal scrolling goal chips for linking habits to goals.
 * Used in EditTaskModal to allow multi-select goal association.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
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
  const [isExpanded, setIsExpanded] = useState(false);

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

  const toggleExpanded = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded((prev) => !prev);
  }, []);

  // Get selected goal objects for preview
  const selectedGoals = goals.filter((g) => selectedGoalIds.includes(g.goalId));

  return (
    <Animated.View entering={FadeInDown.delay(100)} style={styles.container}>
      {/* Header - tap to expand/collapse */}
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpanded}
        accessibilityRole="button"
        accessibilityLabel={`Link to Goals, ${isExpanded ? 'expanded' : 'collapsed'}`}
      >
        <View style={styles.headerLeft}>
          <Icon name="target" size={18} color={colors.text.secondary} />
          <Text style={styles.headerTitle}>Link to Goals</Text>
        </View>
        <View style={styles.headerRight}>
          {!isExpanded && selectedGoals.length > 0 && (
            <View style={styles.selectedPreview}>
              {selectedGoals.slice(0, 3).map((goal) => (
                <View
                  key={goal.id}
                  style={[styles.previewChip, { backgroundColor: goal.definition.color + '20' }]}
                >
                  <Text style={styles.previewEmoji}>{goal.definition.emoji}</Text>
                </View>
              ))}
              {selectedGoals.length > 3 && (
                <Text style={styles.previewMore}>+{selectedGoals.length - 3}</Text>
              )}
            </View>
          )}
          <Icon
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.text.tertiary}
          />
        </View>
      </TouchableOpacity>

      {/* Expanded content */}
      {isExpanded && (
        <Animated.View entering={FadeIn} style={styles.content}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContainer}
          >
            {goals.map((goal) => {
              const isSelected = selectedGoalIds.includes(goal.goalId);
              return (
                <Pressable
                  key={goal.id}
                  onPress={() => handleToggleGoal(goal.goalId)}
                  style={({ pressed }) => [
                    styles.chip,
                    glassStyles.card,
                    isSelected && styles.chipSelected,
                    isSelected && { borderColor: goal.definition.color },
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
                  {isSelected && (
                    <Animated.View entering={FadeIn}>
                      <Icon name="check" size={12} color={goal.definition.color} />
                    </Animated.View>
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          {selectedGoals.length > 0 && (
            <Text style={styles.selectionHint}>
              {selectedGoals.length} goal{selectedGoals.length !== 1 ? 's' : ''} linked
            </Text>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[3],
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[2],
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  headerTitle: {
    ...textStyles.body,
    color: colors.text.secondary,
    fontWeight: '500',
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  selectedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  previewChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  previewEmoji: {
    fontSize: 12,
  },

  previewMore: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    marginLeft: 4,
  },

  content: {
    paddingTop: spacing[2],
  },

  chipsContainer: {
    paddingHorizontal: spacing[2],
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
    borderColor: 'transparent',
    marginRight: spacing[2],
  },

  chipSelected: {
    backgroundColor: colors.surface,
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

  selectionHint: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing[2],
    paddingHorizontal: spacing[2],
  },
});

export default GoalSelector;
