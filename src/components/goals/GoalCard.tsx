/**
 * GoalCard
 *
 * Displays goals with habit completion stats on the home screen.
 * Styled to match TodayCard pattern with proper card container.
 * Live updates when completions change.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Icon, IconName } from '../common/Icon';
import { GoalProgress, HabitStats, Milestone } from '../../types/goals';
import { useGoalsStore } from '../../store/goalsStore';
import { useLogsStore } from '../../store/logsStore';
import { colors, textStyles, spacing, shadows } from '../../theme';
import { radiusValues, sizes } from '../../theme/utils';

interface GoalCardProps {
  primaryGoalProgress: GoalProgress | null;
  secondaryGoalProgress: GoalProgress[];
  onPress: () => void;
  /** Callback to add a milestone (goalId is the user_goals.id) */
  onAddMilestone?: (goalId: string) => void;
}

type Period = 'week' | 'month' | 'allTime';

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'allTime', label: 'All Time' },
];

function getCountForPeriod(stats: HabitStats, period: Period): number {
  switch (period) {
    case 'week': return stats.completionsThisWeek;
    case 'month': return stats.completionsThisMonth ?? 0;
    case 'allTime': return stats.completionsAllTime;
  }
}

/**
 * Format a date string (YYYY-MM-DD) to a short display format
 */
function formatMilestoneDate(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00');
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Filter milestones based on selected time period
 */
function filterMilestonesByPeriod(milestones: Milestone[], period: Period): Milestone[] {
  if (period === 'allTime') {
    return milestones;
  }

  const now = new Date();

  if (period === 'week') {
    // Get start of current week (Sunday)
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - now.getDay());

    return milestones.filter(m => {
      const milestoneDate = new Date(m.date + 'T12:00:00');
      return milestoneDate >= startOfWeek;
    });
  }

  if (period === 'month') {
    // Get start of current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return milestones.filter(m => {
      const milestoneDate = new Date(m.date + 'T12:00:00');
      return milestoneDate >= startOfMonth;
    });
  }

  return milestones;
}

/**
 * Period selector - tap to cycle through options
 */
const PeriodPill: React.FC<{
  selected: Period;
  onChange: (period: Period) => void;
}> = ({ selected, onChange }) => {
  const selectedLabel = PERIOD_OPTIONS.find(o => o.value === selected)?.label || 'All Time';

  const cycleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentIndex = PERIOD_OPTIONS.findIndex(o => o.value === selected);
    const nextIndex = (currentIndex + 1) % PERIOD_OPTIONS.length;
    onChange(PERIOD_OPTIONS[nextIndex].value);
  };

  return (
    <TouchableOpacity onPress={cycleNext} style={periodStyles.pill}>
      <Text style={periodStyles.text}>{selectedLabel}</Text>
      <Icon name="chevron-down" size={10} color={colors.text.tertiary} />
    </TouchableOpacity>
  );
};

const periodStyles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radiusValues.box,
    backgroundColor: colors.interactive.default,
  },
  text: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
});

/**
 * Single goal row with milestones inline
 */
const GoalRow: React.FC<{
  progress: GoalProgress;
  selectedPeriod: Period;
  milestones: Milestone[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAddMilestone?: () => void;
}> = ({ progress, selectedPeriod, milestones, isExpanded, onToggleExpand, onAddMilestone }) => {
  const { goal, habitStats = [] } = progress;

  // Get badges for habits with completions
  const activeBadges = habitStats
    .map(s => ({ ...s, count: getCountForPeriod(s, selectedPeriod) }))
    .filter(s => s.count > 0);

  // Filter milestones by selected period
  const filteredMilestones = filterMilestonesByPeriod(milestones, selectedPeriod);

  const mostRecentMilestone = filteredMilestones.length > 0 ? filteredMilestones[0] : null;
  const hasFewMilestones = filteredMilestones.length <= 1;

  const handleAddMilestone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAddMilestone?.();
  };

  return (
    <View style={rowStyles.container}>
      {/* Goal header row with title and badges */}
      <View style={rowStyles.headerRow}>
        <View style={[rowStyles.goalIcon, { backgroundColor: goal.definition.color + '20' }]}>
          <Icon name={goal.definition.icon} size={16} color={goal.definition.color} />
        </View>
        <Text style={rowStyles.name} numberOfLines={1}>{goal.definition.title}</Text>
        {/* Completion badges inline */}
        {activeBadges.length > 0 ? (
          <View style={rowStyles.badges}>
            {activeBadges.map((stats) => (
              <View key={stats.taskId} style={[rowStyles.badge, { backgroundColor: stats.color + '20' }]}>
                <Icon name={stats.icon as IconName} size={12} color={stats.color} />
                <Text style={[rowStyles.badgeCount, { color: stats.color }]}>×{stats.count}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={rowStyles.emptyText}>No completions</Text>
        )}
      </View>

      {/* Milestones timeline section */}
      {(filteredMilestones.length > 0 || onAddMilestone) && (
        <View style={rowStyles.timelineSection}>
          {/* Timeline container with border */}
          <View style={rowStyles.timelineContainer}>
            {/* Vertical line through dots */}
            {((onAddMilestone && filteredMilestones.length > 0) || filteredMilestones.length > 1) && (
              <View
                style={[
                  rowStyles.timelineLine,
                  {
                    backgroundColor: goal.definition.color + '40',
                    height: isExpanded
                      ? ((onAddMilestone ? 1 : 0) + filteredMilestones.length - 1) * 28
                      : 28,
                  }
                ]}
              />
            )}

            {/* + Add row (like a milestone placeholder at the top) */}
            {onAddMilestone && (
              <TouchableOpacity
                style={rowStyles.timelineRow}
                onPress={handleAddMilestone}
                accessibilityRole="button"
                accessibilityLabel="Add milestone"
              >
                <View style={[rowStyles.timelineDotEmpty, { borderColor: goal.definition.color }]} />
                <Text style={[rowStyles.addMilestoneText, { color: goal.definition.color }]}>+ New Milestone</Text>
                {/* Chevron on right when there are milestones to expand */}
                {filteredMilestones.length > 1 && !mostRecentMilestone && (
                  <TouchableOpacity
                    style={rowStyles.expandChevron}
                    onPress={onToggleExpand}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.text.tertiary} />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            )}

            {/* Most recent milestone (always shown) */}
            {mostRecentMilestone && (
              <View style={rowStyles.timelineRow}>
                <View style={[rowStyles.timelineDot, { backgroundColor: goal.definition.color }]} />
                <Text style={rowStyles.milestoneDate}>{formatMilestoneDate(mostRecentMilestone.date)}</Text>
                <Text style={rowStyles.milestoneTitle} numberOfLines={1}>{mostRecentMilestone.title}</Text>
                {/* Expand chevron on the right */}
                {filteredMilestones.length > 1 && (
                  <TouchableOpacity
                    style={rowStyles.expandChevron}
                    onPress={onToggleExpand}
                    accessibilityRole="button"
                    accessibilityLabel={isExpanded ? 'Collapse milestones' : 'Expand milestones'}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Icon name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.text.tertiary} />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Expanded milestones (remaining ones) */}
            {isExpanded && filteredMilestones.length > 1 && (
              <Animated.View entering={FadeIn.duration(150)}>
                {filteredMilestones.slice(1).map((milestone) => (
                  <View key={milestone.id} style={rowStyles.timelineRow}>
                    <View style={[rowStyles.timelineDot, { backgroundColor: goal.definition.color }]} />
                    <Text style={rowStyles.milestoneDate}>{formatMilestoneDate(milestone.date)}</Text>
                    <Text style={rowStyles.milestoneTitle} numberOfLines={1}>{milestone.title}</Text>
                  </View>
                ))}
              </Animated.View>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const rowStyles = StyleSheet.create({
  container: {
    paddingVertical: spacing[2],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  goalIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
    borderRadius: radiusValues.sm,
    gap: 2,
  },
  badgeCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyText: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    fontSize: 11,
  },
  timelineSection: {
    marginTop: spacing[3],
  },
  timelineContainer: {
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radiusValues.box,
    padding: spacing[3],
    backgroundColor: colors.background + '40',
  },
  timelineLine: {
    position: 'absolute',
    left: spacing[3] + 3, // padding + center of 8px dot
    top: spacing[3] + 14, // padding + center of first row (28/2)
    width: 2,
    borderRadius: 1,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    gap: spacing[2],
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineDotEmpty: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  addMilestoneText: {
    ...textStyles.bodySmall,
    fontWeight: '600',
  },
  expandChevron: {
    padding: spacing[1],
    marginLeft: 'auto',
  },
  milestoneDate: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    width: 48,
  },
  milestoneTitle: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    flex: 1,
  },
});

export const GoalCard: React.FC<GoalCardProps> = ({
  primaryGoalProgress,
  secondaryGoalProgress,
  onPress,
  onAddMilestone,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('allTime');
  const [isExpanded, setIsExpanded] = useState(false);
  // Track which goals have their milestones expanded (keyed by goal ID)
  const [expandedGoals, setExpandedGoals] = useState<Record<string, boolean>>({});

  // Subscribe to logs for live updates
  const contributionData = useLogsStore((state) => state.contributionData);
  const refreshProgress = useGoalsStore((state) => state.refreshProgress);
  const storeMilestones = useGoalsStore((state) => state.milestones);

  useEffect(() => {
    if (contributionData.length > 0) {
      refreshProgress();
    }
  }, [contributionData, refreshProgress]);

  const hasSecondaryGoals = secondaryGoalProgress.length > 0;

  const toggleExpanded = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded((prev) => !prev);
  }, []);

  const toggleGoalMilestones = useCallback((goalId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedGoals((prev) => ({
      ...prev,
      [goalId]: !prev[goalId],
    }));
  }, []);

  if (!primaryGoalProgress && secondaryGoalProgress.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Goals</Text>
        <View style={styles.headerRight}>
          <PeriodPill selected={selectedPeriod} onChange={setSelectedPeriod} />
          <TouchableOpacity onPress={onPress} style={styles.editButton}>
            <Icon name="target" size={16} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Primary Goal */}
      {primaryGoalProgress && (
        <GoalRow
          progress={primaryGoalProgress}
          selectedPeriod={selectedPeriod}
          milestones={storeMilestones[primaryGoalProgress.goal.id] || []}
          isExpanded={expandedGoals[primaryGoalProgress.goal.id] || false}
          onToggleExpand={() => toggleGoalMilestones(primaryGoalProgress.goal.id)}
          onAddMilestone={onAddMilestone ? () => onAddMilestone(primaryGoalProgress.goal.id) : undefined}
        />
      )}

      {/* Secondary Goals */}
      {hasSecondaryGoals && (
        <>
          {!isExpanded ? (
            <TouchableOpacity onPress={toggleExpanded} style={styles.expandRow}>
              <View style={styles.expandLeft}>
                {secondaryGoalProgress.slice(0, 3).map((p) => (
                  <View
                    key={p.goal.id}
                    style={[styles.expandIcon, { backgroundColor: p.goal.definition.color + '20' }]}
                  >
                    <Icon name={p.goal.definition.icon} size={12} color={p.goal.definition.color} />
                  </View>
                ))}
                <Text style={styles.expandText}>
                  {secondaryGoalProgress.length} more goal{secondaryGoalProgress.length !== 1 ? 's' : ''}
                </Text>
              </View>
              <Icon name="chevron-down" size={14} color={colors.text.tertiary} />
            </TouchableOpacity>
          ) : (
            <Animated.View entering={FadeIn.duration(150)}>
              {secondaryGoalProgress.map((progress) => (
                <GoalRow
                  key={progress.goal.id}
                  progress={progress}
                  selectedPeriod={selectedPeriod}
                  milestones={storeMilestones[progress.goal.id] || []}
                  isExpanded={expandedGoals[progress.goal.id] || false}
                  onToggleExpand={() => toggleGoalMilestones(progress.goal.id)}
                  onAddMilestone={onAddMilestone ? () => onAddMilestone(progress.goal.id) : undefined}
                />
              ))}
              <TouchableOpacity onPress={toggleExpanded} style={styles.collapseRow}>
                <Icon name="chevron-up" size={14} color={colors.text.tertiary} />
              </TouchableOpacity>
            </Animated.View>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[6],
    padding: spacing[4],
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  title: {
    ...textStyles.h2,
    color: colors.text.primary,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  editButton: {
    width: sizes.touchTarget.small,
    height: sizes.touchTarget.small,
    borderRadius: radiusValues.box,
    backgroundColor: colors.interactive.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.border + '40',
    marginTop: spacing[2],
  },
  expandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  expandIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandText: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    marginLeft: spacing[1],
  },
  collapseRow: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
});

export default GoalCard;
