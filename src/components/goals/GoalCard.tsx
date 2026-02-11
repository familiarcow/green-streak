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
import { GoalProgress, HabitStats } from '../../types/goals';
import { useGoalsStore } from '../../store/goalsStore';
import { useLogsStore } from '../../store/logsStore';
import { colors, textStyles, spacing, shadows } from '../../theme';
import { radiusValues, sizes } from '../../theme/utils';

interface GoalCardProps {
  primaryGoalProgress: GoalProgress | null;
  secondaryGoalProgress: GoalProgress[];
  onPress: () => void;
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
 * Single goal row with multi-line layout
 */
const GoalRow: React.FC<{
  progress: GoalProgress;
  selectedPeriod: Period;
  onPeriodChange?: (period: Period) => void;
  showPeriodSelector?: boolean;
}> = ({ progress, selectedPeriod, onPeriodChange, showPeriodSelector }) => {
  const { goal, habitStats = [] } = progress;

  // Get badges for habits with completions
  const activeBadges = habitStats
    .map(s => ({ ...s, count: getCountForPeriod(s, selectedPeriod) }))
    .filter(s => s.count > 0);

  return (
    <View style={rowStyles.container}>
      {/* Goal header row */}
      <View style={rowStyles.headerRow}>
        <View style={rowStyles.titleSection}>
          <Text style={rowStyles.emoji}>{goal.definition.emoji}</Text>
          <Text style={rowStyles.name} numberOfLines={1}>{goal.definition.title}</Text>
        </View>

        {/* Period selector (only for primary) */}
        {showPeriodSelector && onPeriodChange && (
          <PeriodPill selected={selectedPeriod} onChange={onPeriodChange} />
        )}
      </View>

      {/* Completion badges row */}
      <View style={rowStyles.statsRow}>
        {activeBadges.length > 0 ? (
          <View style={rowStyles.badges}>
            {activeBadges.map((stats) => (
              <View key={stats.taskId} style={[rowStyles.badge, { backgroundColor: stats.color + '20' }]}>
                <Icon name={stats.icon as IconName} size={14} color={stats.color} />
                <Text style={[rowStyles.badgeCount, { color: stats.color }]}>×{stats.count}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={rowStyles.emptyText}>No completions this {selectedPeriod === 'allTime' ? 'period' : selectedPeriod}</Text>
        )}
      </View>
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
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flex: 1,
  },
  emoji: {
    fontSize: 20,
  },
  name: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: radiusValues.box,
    gap: 4,
  },
  badgeCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyText: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },
});

export const GoalCard: React.FC<GoalCardProps> = ({
  primaryGoalProgress,
  secondaryGoalProgress,
  onPress,
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('allTime');
  const [isExpanded, setIsExpanded] = useState(false);

  // Subscribe to logs for live updates
  const contributionData = useLogsStore((state) => state.contributionData);
  const refreshProgress = useGoalsStore((state) => state.refreshProgress);

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

  if (!primaryGoalProgress && secondaryGoalProgress.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Goals</Text>
        <TouchableOpacity onPress={onPress} style={styles.editButton}>
          <Icon name="edit" size={16} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Primary Goal */}
      {primaryGoalProgress && (
        <GoalRow
          progress={primaryGoalProgress}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          showPeriodSelector
        />
      )}

      {/* Secondary Goals */}
      {hasSecondaryGoals && (
        <>
          {!isExpanded ? (
            <TouchableOpacity onPress={toggleExpanded} style={styles.expandRow}>
              <View style={styles.expandLeft}>
                {secondaryGoalProgress.slice(0, 3).map((p) => (
                  <Text key={p.goal.id} style={styles.expandEmoji}>{p.goal.definition.emoji}</Text>
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
  expandEmoji: {
    fontSize: 14,
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
