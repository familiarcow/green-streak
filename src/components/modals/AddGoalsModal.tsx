/**
 * AddGoalsModal
 *
 * Browse all available goals (predefined + custom), add to user's goals,
 * and create new custom goals.
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BaseModal } from './BaseModal';
import { ScreenErrorBoundary } from '../ScreenErrorBoundary';
import { Icon } from '../common/Icon';
import { GoalListItem } from '../goals';
import { GOALS } from '../../data/goalLibrary';
import { AnyGoalDefinition, CustomGoalDefinition } from '../../types/goals';
import { useGoalsStore } from '../../store/goalsStore';
import { useAccentColor } from '../../hooks';
import { colors, textStyles, spacing } from '../../theme';
import { glassStyles } from '../../theme/glass';
import { radiusValues } from '../../theme/utils';

interface AddGoalsModalProps {
  visible: boolean;
  onClose: () => void;
  onCloseComplete?: () => void;
  onCreateCustom?: () => void;
  onEditCustom?: (goal: CustomGoalDefinition) => void;
}

export const AddGoalsModal: React.FC<AddGoalsModalProps> = ({
  visible,
  onClose,
  onCloseComplete,
  onCreateCustom,
  onEditCustom,
}) => {
  const goals = useGoalsStore((state) => state.goals);
  const customGoals = useGoalsStore((state) => state.customGoals);
  const selectGoal = useGoalsStore((state) => state.selectGoal);
  const deselectGoal = useGoalsStore((state) => state.deselectGoal);
  const accentColor = useAccentColor();

  // Map of goalId (definition) to selected state
  const selectedGoalsSet = useMemo(() => {
    const set = new Set<string>();
    for (const goal of goals) {
      set.add(goal.goalId);
    }
    return set;
  }, [goals]);

  // Combine predefined and custom goals
  const allGoals: AnyGoalDefinition[] = useMemo(() => {
    return [...GOALS, ...customGoals];
  }, [customGoals]);

  const handleToggle = useCallback(
    async (goalId: string) => {
      const isSelected = selectedGoalsSet.has(goalId);
      if (isSelected) {
        await deselectGoal(goalId);
      } else {
        // If this is the first goal, make it primary
        const shouldBePrimary = goals.length === 0;
        await selectGoal(goalId, shouldBePrimary);
      }
    },
    [selectedGoalsSet, goals.length, selectGoal, deselectGoal]
  );

  const handleCreateCustom = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Invoke callback to store intent, then parent handles modal sequencing
    onCreateCustom?.();
  }, [onCreateCustom]);

  const handleEditCustom = useCallback((goal: CustomGoalDefinition) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Invoke callback to store intent, then parent handles modal sequencing
    onEditCustom?.(goal);
  }, [onEditCustom]);

  return (
    <BaseModal
      isVisible={visible}
      onClose={onClose}
      onCloseComplete={onCloseComplete}
      closeOnBackdropPress={true}
      height="85%"
      minHeight={500}
    >
      <ScreenErrorBoundary
        screenName="Add Goals"
        onClose={onClose}
        onRetry={() => {
          // Reload goals on retry
          useGoalsStore.getState().loadGoals();
        }}
      >
        <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.headerIcon, { backgroundColor: accentColor + '20' }]}>
            <Icon name="plus" size={24} color={accentColor} />
          </View>
          <Text style={styles.title}>Add Goals</Text>
          <Text style={styles.subtitle}>
            Tap to add goals to your list
          </Text>
        </View>

        {/* Create Custom Button */}
        <TouchableOpacity
          style={[styles.createCustomButton, { borderColor: accentColor }]}
          onPress={handleCreateCustom}
          accessibilityRole="button"
          accessibilityLabel="Create a custom goal"
        >
          <View style={[styles.createIconContainer, { backgroundColor: accentColor + '20' }]}>
            <Icon name="plus" size={24} color={accentColor} />
          </View>
          <View style={styles.createTextContainer}>
            <Text style={[styles.createTitle, { color: accentColor }]}>Create Your Own</Text>
            <Text style={styles.createDescription}>
              Define a personal goal that matters to you
            </Text>
          </View>
          <Icon name="chevron-right" size={20} color={colors.text.tertiary} />
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>Available Goals</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Goals List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Predefined Goals */}
          {GOALS.map((goal, index) => {
            const isSelected = selectedGoalsSet.has(goal.id);

            return (
              <GoalListItem
                key={goal.id}
                goal={goal}
                index={index}
                isSelected={isSelected}
                showSelectionIndicator={true}
                onPress={() => handleToggle(goal.id)}
              />
            );
          })}

          {/* Custom Goals Section */}
          {customGoals.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Your Custom Goals</Text>
              </View>
              {customGoals.map((goal, index) => {
                const isSelected = selectedGoalsSet.has(goal.id);

                return (
                  <GoalListItem
                    key={goal.id}
                    goal={goal}
                    index={GOALS.length + index}
                    isSelected={isSelected}
                    showSelectionIndicator={true}
                    onPress={() => handleToggle(goal.id)}
                    onEdit={() => handleEditCustom(goal)}
                  />
                );
              })}
            </>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {goals.length === 0
              ? 'Select goals to get started'
              : `${goals.length} goal${goals.length !== 1 ? 's' : ''} selected`}
          </Text>
        </View>
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
    alignItems: 'center',
    marginBottom: spacing[4],
  },

  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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

  createCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: radiusValues.box,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: spacing[4],
    ...glassStyles.card,
  },

  createIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },

  createTextContainer: {
    flex: 1,
  },

  createTitle: {
    ...textStyles.body,
    fontWeight: '600',
    marginBottom: 2,
  },

  createDescription: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },

  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },

  dividerText: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    paddingHorizontal: spacing[3],
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: spacing[4],
    gap: spacing[2],
  },

  sectionHeader: {
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },

  sectionTitle: {
    ...textStyles.h3,
    color: colors.text.secondary,
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
});

export default AddGoalsModal;
