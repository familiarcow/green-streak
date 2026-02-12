/**
 * GoalListItem
 *
 * Shared component for displaying a goal item in lists.
 * Used by both GoalDetailModal (active goals) and AddGoalsModal (available goals).
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity, Alert } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Icon, IconName } from '../common/Icon';
import { MilestoneTimeline } from './MilestoneTimeline';
import { AnyGoalDefinition, isCustomGoal, Milestone } from '../../types/goals';

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
  /** Whether the item is expanded to show milestones */
  isExpanded?: boolean;
  /** Toggle expand/collapse */
  onToggleExpand?: () => void;
  /** Milestones for this goal (when expanded) */
  milestones?: Milestone[];
  /** Delete milestone callback */
  onDeleteMilestone?: (milestoneId: string) => void;
  /** Delete goal callback (shown when expanded) */
  onDeleteGoal?: () => void;
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
  isExpanded = false,
  onToggleExpand,
  milestones = [],
  onDeleteMilestone,
  onDeleteGoal,
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

  const handleToggleExpand = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onToggleExpand?.();
  }, [onToggleExpand]);

  const handleDeleteGoal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Remove this goal?',
      `Are you sure you want to remove "${goal.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            Alert.alert(
              'Delete all milestones?',
              'This will delete all milestones for this goal. This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => onDeleteGoal?.(),
                },
              ]
            );
          },
        },
      ]
    );
  }, [goal.title, onDeleteGoal]);

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
          isExpanded && styles.containerExpanded,
          pressed && styles.containerPressed,
        ]}
      >
        {/* Main row content */}
        <View style={styles.mainRow}>
          {/* Left: Icon and text */}
          <View style={styles.infoSection}>
          <View style={styles.iconWrapper}>
            <View style={[styles.iconContainer, { backgroundColor: goal.color + '20' }]}>
              <Icon name={goal.icon} size={22} color={goal.color} />
            </View>
            {/* Primary star badge on icon */}
            {isPrimary && (
              <Animated.View entering={FadeIn} style={styles.primaryBadge}>
                <Icon name="star" size={10} color={colors.warning} />
              </Animated.View>
            )}
          </View>
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              {/* Delete X - shown when in expandable mode (goal detail drawer) */}
              {onDeleteGoal && onToggleExpand && (
                <TouchableOpacity
                  style={styles.deleteX}
                  onPress={handleDeleteGoal}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${goal.title}`}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="x" size={12} color={colors.text.tertiary} />
                </TouchableOpacity>
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

          {/* Remove button - only show when not using expandable mode */}
          {onRemove && !onToggleExpand && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleRemove}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${goal.title}`}
            >
              <Icon name="x" size={16} color={colors.text.secondary} />
            </TouchableOpacity>
          )}

          {/* Expand/collapse chevron - when in expandable mode */}
          {onToggleExpand && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleToggleExpand}
              accessibilityRole="button"
              accessibilityLabel={isExpanded ? `Collapse ${goal.title}` : `Expand ${goal.title}`}
            >
              <Icon
                name={isExpanded ? 'chevron-down' : 'chevron-right'}
                size={16}
                color={colors.text.secondary}
              />
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
        </View>

        {/* Expanded section with milestones */}
        {isExpanded && onToggleExpand && (
          <Animated.View entering={FadeIn} style={styles.expandedSection}>
            <View style={styles.expandedDivider} />
            <MilestoneTimeline
              milestones={milestones}
              onDelete={(id) => onDeleteMilestone?.(id)}
              accentColor={goal.color}
            />
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
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

  containerExpanded: {
    paddingBottom: spacing[4],
  },

  containerPressed: {
    opacity: 0.8,
  },

  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  infoSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconWrapper: {
    position: 'relative',
    marginRight: spacing[3],
  },

  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
    ...shadows.sm,
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

  deleteX: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.border + '60',
    alignItems: 'center',
    justifyContent: 'center',
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

  expandedSection: {
    width: '100%',
    marginTop: spacing[3],
  },

  expandedDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginBottom: spacing[3],
  },
});

export default GoalListItem;
