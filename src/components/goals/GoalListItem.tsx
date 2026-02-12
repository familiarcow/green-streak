/**
 * GoalListItem
 *
 * Shared component for displaying a goal item in lists.
 * Used by both GoalDetailModal (active goals) and AddGoalsModal (available goals).
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Icon, IconName } from '../common/Icon';
import { AnyGoalDefinition, isCustomGoal } from '../../types/goals';

/** Minimal task info for displaying linked habit icons */
interface LinkedTaskInfo {
  id: string;
  icon: IconName;
  color: string;
}
import { colors, textStyles, spacing, shadows } from '../../theme';
import { glassStyles } from '../../theme/glass';
import { radiusValues } from '../../theme/utils';

interface GoalListItemProps {
  goal: AnyGoalDefinition;
  /** Animation delay index for staggered entry */
  index: number;
  /** Whether goal is selected/active */
  isSelected?: boolean;
  /** Whether this is the primary goal */
  isPrimary?: boolean;
  /** Linked tasks to display as icons */
  linkedTasks?: LinkedTaskInfo[];
  /** Show selection checkmark circle */
  showSelectionIndicator?: boolean;
  /** Main press action */
  onPress?: () => void;
  /** Long press action (e.g., set primary) */
  onLongPress?: () => void;
  /** Edit button action (for custom goals) */
  onEdit?: () => void;
  /** Remove/delete button action */
  onRemove?: () => void;
}

export const GoalListItem: React.FC<GoalListItemProps> = ({
  goal,
  index,
  isSelected = false,
  isPrimary = false,
  linkedTasks = [],
  showSelectionIndicator = false,
  onPress,
  onLongPress,
  onEdit,
  onRemove,
}) => {
  const customGoal = isCustomGoal(goal);

  const handlePress = useCallback(() => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  }, [onPress]);

  const handleLongPress = useCallback(() => {
    if (onLongPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onLongPress();
    }
  }, [onLongPress]);

  const handleEdit = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEdit?.();
  }, [onEdit]);

  const handleRemove = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRemove?.();
  }, [onRemove]);

  return (
    <Animated.View entering={FadeInDown.delay(50 + index * 20).springify()}>
      <Pressable
        onPress={handlePress}
        onLongPress={onLongPress ? handleLongPress : undefined}
        delayLongPress={400}
        style={({ pressed }) => [
          styles.container,
          glassStyles.card,
          isSelected && styles.containerSelected,
          isSelected && { borderColor: goal.color },
          pressed && styles.containerPressed,
        ]}
      >
        {/* Left: Icon and text */}
        <View style={styles.infoSection}>
          <View style={[styles.iconContainer, { backgroundColor: goal.color + '20' }]}>
            <Icon name={goal.icon} size={22} color={goal.color} />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              {/* Primary star - inline with title */}
              {isPrimary && (
                <Animated.View entering={FadeIn} style={styles.primaryStar}>
                  <Icon name="star" size={14} color={colors.warning} />
                </Animated.View>
              )}
              <Text
                style={[
                  styles.title,
                  isSelected && { color: goal.color },
                ]}
                numberOfLines={1}
              >
                {goal.title}
              </Text>
            </View>
            <Text style={styles.description} numberOfLines={1}>
              {goal.description}
            </Text>
          </View>
        </View>

        {/* Right: Actions */}
        <View style={styles.actionsSection}>
          {/* Linked task icons */}
          {linkedTasks.length > 0 && (
            <View style={styles.linkedTasks}>
              {linkedTasks.slice(0, 3).map((task) => (
                <View
                  key={task.id}
                  style={[styles.linkedTaskIcon, { backgroundColor: task.color + '20' }]}
                >
                  <Icon name={task.icon} size={12} color={task.color} />
                </View>
              ))}
              {linkedTasks.length > 3 && (
                <View style={styles.linkedTaskMore}>
                  <Text style={styles.linkedTaskMoreText}>+{linkedTasks.length - 3}</Text>
                </View>
              )}
            </View>
          )}

          {/* Edit button (for custom goals) */}
          {customGoal && onEdit && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleEdit}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${goal.title}`}
            >
              <Icon name="edit" size={16} color={colors.text.secondary} />
            </TouchableOpacity>
          )}

          {/* Remove button */}
          {onRemove && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleRemove}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${goal.title}`}
            >
              <Icon name="x" size={16} color={colors.text.secondary} />
            </TouchableOpacity>
          )}

          {/* Selection indicator (checkmark or empty circle) */}
          {showSelectionIndicator && (
            isSelected ? (
              <Animated.View
                entering={FadeIn}
                style={[styles.checkmark, { backgroundColor: goal.color }]}
              >
                <Icon name="check" size={14} color={colors.surface} />
              </Animated.View>
            ) : (
              <View style={styles.unselectedCircle} />
            )
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    borderRadius: radiusValues.box,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },

  containerSelected: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },

  containerPressed: {
    opacity: 0.8,
  },

  infoSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    gap: spacing[1],
    flexWrap: 'wrap',
  },

  primaryStar: {
    marginRight: 2,
  },

  title: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: 2,
    flexShrink: 1,
  },

  description: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },

  actionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  linkedTasks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: -4, // Overlap icons slightly
  },

  linkedTaskIcon: {
    width: 24,
    height: 24,
    borderRadius: radiusValues.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },

  linkedTaskMore: {
    width: 24,
    height: 24,
    borderRadius: radiusValues.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.border + '60',
    borderWidth: 2,
    borderColor: colors.surface,
  },

  linkedTaskMoreText: {
    ...textStyles.caption,
    fontSize: 10,
    color: colors.text.tertiary,
    fontWeight: '600',
  },

  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  unselectedCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
  },
});

export default GoalListItem;
