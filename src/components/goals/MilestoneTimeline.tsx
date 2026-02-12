/**
 * MilestoneTimeline
 *
 * Displays a vertical timeline of milestones for a goal.
 * Supports long-press to delete with confirmation.
 */

import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Icon } from '../common/Icon';
import { Milestone } from '../../types/goals';
import { colors, textStyles, spacing } from '../../theme';
import { glassStyles } from '../../theme/glass';
import { radiusValues } from '../../theme/utils';

interface MilestoneTimelineProps {
  milestones: Milestone[];
  onDelete: (id: string) => void;
  /** Compact mode shows only titles (no descriptions) */
  compact?: boolean;
  /** Accent color for the timeline dots */
  accentColor?: string;
}

/**
 * Format a date string (YYYY-MM-DD) to a readable format
 */
function formatMilestoneDate(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00'); // Add time to avoid timezone issues
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  // Format as "Jan 15" or "Jan 15, 2024" if different year
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };
  if (date.getFullYear() !== now.getFullYear()) {
    options.year = 'numeric';
  }
  return date.toLocaleDateString('en-US', options);
}

export const MilestoneTimeline: React.FC<MilestoneTimelineProps> = ({
  milestones,
  onDelete,
  compact = false,
  accentColor = colors.primary,
}) => {
  const handleLongPress = useCallback((milestone: Milestone) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Delete Milestone',
      `Remove "${milestone.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            Alert.alert(
              'Confirm Delete',
              'This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => onDelete(milestone.id),
                },
              ]
            );
          },
        },
      ]
    );
  }, [onDelete]);

  if (milestones.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Icon name="goal" size={24} color={colors.text.tertiary} />
        <Text style={styles.emptyText}>No milestones yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {milestones.map((milestone, index) => (
        <Animated.View
          key={milestone.id}
          entering={FadeInDown.delay(index * 50).springify()}
        >
          <Pressable
            onLongPress={() => handleLongPress(milestone)}
            delayLongPress={500}
            style={({ pressed }) => [
              styles.milestoneItem,
              pressed && styles.milestoneItemPressed,
            ]}
          >
            {/* Timeline connector */}
            <View style={styles.timelineColumn}>
              <View style={[styles.dot, { backgroundColor: accentColor }]} />
              {index < milestones.length - 1 && (
                <View style={[styles.line, { backgroundColor: accentColor + '40' }]} />
              )}
            </View>

            {/* Content */}
            <View style={[styles.content, compact && styles.contentCompact]}>
              <View style={styles.header}>
                <Text style={styles.date}>{formatMilestoneDate(milestone.date)}</Text>
              </View>
              <Text
                style={[styles.title, compact && styles.titleCompact]}
                numberOfLines={compact ? 1 : 2}
              >
                {milestone.title}
              </Text>
              {!compact && milestone.description.length > 0 && (
                <Text style={styles.description} numberOfLines={3}>
                  {milestone.description}
                </Text>
              )}
            </View>
          </Pressable>
        </Animated.View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    gap: spacing[2],
  },

  emptyText: {
    ...textStyles.bodySmall,
    color: colors.text.tertiary,
  },

  milestoneItem: {
    flexDirection: 'row',
    paddingVertical: spacing[2],
  },

  milestoneItemPressed: {
    opacity: 0.7,
  },

  timelineColumn: {
    width: 24,
    alignItems: 'center',
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },

  line: {
    width: 2,
    flex: 1,
    marginTop: spacing[1],
  },

  content: {
    flex: 1,
    marginLeft: spacing[2],
    paddingBottom: spacing[3],
  },

  contentCompact: {
    paddingBottom: spacing[1],
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },

  date: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    fontWeight: '500',
  },

  title: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '600',
    marginBottom: spacing[1],
  },

  titleCompact: {
    ...textStyles.bodySmall,
    marginBottom: 0,
  },

  description: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});

export default MilestoneTimeline;
