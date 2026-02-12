/**
 * GoalDetailModal (YourGoalsModal)
 *
 * Shows the user's currently selected/active goals.
 * Allows setting primary goal, removing goals, and opening AddGoalsModal.
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BaseModal } from './BaseModal';
import { ScreenErrorBoundary } from '../ScreenErrorBoundary';
import { Icon, IconName } from '../common/Icon';
import { GoalListItem } from '../goals';
import { useGoalsStore } from '../../store/goalsStore';
import { useTasksStore } from '../../store/tasksStore';
import { useAccentColor } from '../../hooks';
import { colors, textStyles, spacing, shadows } from '../../theme';

interface GoalDetailModalProps {
  visible: boolean;
  onClose: () => void;
  onCloseComplete?: () => void;
  onOpenAddGoals?: () => void;
}

export const GoalDetailModal: React.FC<GoalDetailModalProps> = ({
  visible,
  onClose,
  onCloseComplete,
  onOpenAddGoals,
}) => {
  const goals = useGoalsStore((state) => state.goals);
  const primaryGoal = useGoalsStore((state) => state.primaryGoal);
  const deselectGoal = useGoalsStore((state) => state.deselectGoal);
  const setPrimaryGoal = useGoalsStore((state) => state.setPrimaryGoal);
  const tasks = useTasksStore((state) => state.tasks);
  const accentColor = useAccentColor();

  // Create a map of task ID to task details for quick lookup
  const taskMap = useMemo(() => {
    const map = new Map<string, { icon: IconName; color: string }>();
    tasks.forEach((task) => {
      map.set(task.id, {
        icon: (task.icon as IconName) || 'check',
        color: task.color,
      });
    });
    return map;
  }, [tasks]);

  // Helper to get linked task info for a goal
  const getLinkedTasks = useCallback(
    (linkedHabitIds: string[]) => {
      return linkedHabitIds
        .map((id) => {
          const task = taskMap.get(id);
          if (!task) return null;
          return { id, icon: task.icon, color: task.color };
        })
        .filter((t): t is { id: string; icon: IconName; color: string } => t !== null);
    },
    [taskMap]
  );

  const handleRemove = useCallback(
    async (goalId: string) => {
      await deselectGoal(goalId);
    },
    [deselectGoal]
  );

  const handleSetPrimary = useCallback(
    async (goalId: string) => {
      await setPrimaryGoal(goalId);
    },
    [setPrimaryGoal]
  );

  const handleAddGoals = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Call onOpenAddGoals which sets up the pending action and closes the modal
    if (onOpenAddGoals) {
      onOpenAddGoals();
    } else {
      onClose();
    }
  }, [onClose, onOpenAddGoals]);

  return (
    <BaseModal
      isVisible={visible}
      onClose={onClose}
      onCloseComplete={() => {
        onCloseComplete?.();
      }}
      closeOnBackdropPress={true}
      height="75%"
      minHeight={400}
    >
      <ScreenErrorBoundary
        screenName="Your Goals"
        onClose={onClose}
        onRetry={() => {
          // Reload goals on retry
          useGoalsStore.getState().loadGoals();
        }}
      >
        <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={[styles.headerIcon, { backgroundColor: accentColor + '20' }]}>
                <Icon name="target" size={24} color={accentColor} />
              </View>
              <View>
                <Text style={styles.title}>Your Goals</Text>
                <Text style={styles.subtitle}>
                  Long-press to set primary
                </Text>
              </View>
            </View>
            {/* Add Goals Button */}
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: accentColor }]}
              onPress={handleAddGoals}
              accessibilityRole="button"
              accessibilityLabel="Add more goals"
            >
              <Icon name="plus" size={20} color={colors.surface} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Goals List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {goals.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Icon name="target" size={32} color={colors.text.tertiary} />
              </View>
              <Text style={styles.emptyTitle}>No goals selected</Text>
              <Text style={styles.emptyDescription}>
                Tap the + button to add goals that matter to you
              </Text>
            </View>
          ) : (
            goals.map((userGoal, index) => {
              const isPrimary = primaryGoal?.id === userGoal.id;

              return (
                <GoalListItem
                  key={userGoal.id}
                  goal={userGoal.definition}
                  index={index}
                  isSelected={true}
                  isPrimary={isPrimary}
                  linkedTasks={getLinkedTasks(userGoal.linkedHabitIds ?? [])}
                  onLongPress={!isPrimary ? () => handleSetPrimary(userGoal.goalId) : undefined}
                  onRemove={() => handleRemove(userGoal.goalId)}
                />
              );
            })
          )}
        </ScrollView>

      </View>
      </ScreenErrorBoundary>
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
    marginBottom: spacing[4],
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },

  title: {
    ...textStyles.h2,
    color: colors.text.primary,
    marginBottom: 2,
  },

  subtitle: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },

  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: spacing[4],
    gap: spacing[2],
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[8],
  },

  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.border + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },

  emptyTitle: {
    ...textStyles.h3,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },

  emptyDescription: {
    ...textStyles.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
  },

});

export default GoalDetailModal;
