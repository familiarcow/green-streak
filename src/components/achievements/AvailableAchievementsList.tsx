import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from '../common/Icon';
import { colors, textStyles, spacing } from '../../theme';
import { glassStyles } from '../../theme/glass';
import { radiusValues } from '../../theme/utils';
import { RARITY_COLORS } from '../../theme/achievements';
import { AchievementGridState, GridCell } from '../../types/achievements';

interface AvailableAchievementsListProps {
  gridState: AchievementGridState;
}

/**
 * Collapsible dropdown list of available achievements (visible but not yet unlocked)
 * Shows achievements sorted by progress percentage (closest to completion first)
 */
export const AvailableAchievementsList: React.FC<AvailableAchievementsListProps> = ({ gridState }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Get all visible (not yet unlocked) cells
  const availableCells = useMemo(() => {
    const visible: GridCell[] = [];
    for (const row of gridState.cells) {
      for (const cell of row) {
        if (cell.state === 'visible' && cell.achievement) {
          visible.push(cell);
        }
      }
    }
    // Sort by progress percentage descending (closest to completion first)
    return visible.sort((a, b) => {
      const progressA = a.progress?.percentage || 0;
      const progressB = b.progress?.percentage || 0;
      return progressB - progressA;
    });
  }, [gridState]);

  if (availableCells.length === 0) {
    return null;
  }

  return (
    <View style={styles.dropdownSection}>
      <TouchableOpacity
        style={styles.dropdownHeader}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.dropdownTitle}>Available ({availableCells.length})</Text>
        <Icon
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.text.secondary}
        />
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.dropdownContent}>
          {availableCells.map((cell) => {
            const achievement = cell.achievement!;
            const rarityColor = RARITY_COLORS[achievement.rarity];
            const progress = cell.progress;
            return (
              <View
                key={achievement.id}
                style={[styles.achievementRow, styles.achievementRowAvailable, { borderLeftColor: `${rarityColor}60` }]}
              >
                <Text style={[styles.achievementIcon, styles.achievementIconFaded]}>{achievement.icon}</Text>
                <View style={styles.achievementInfo}>
                  <View style={styles.achievementNameRow}>
                    <Text style={[styles.achievementName, styles.achievementNameFaded]}>{achievement.name}</Text>
                    <View style={[styles.rarityBadge, { backgroundColor: `${rarityColor}60` }]}>
                      <Text style={styles.rarityBadgeText}>
                        {achievement.rarity.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.achievementDescription, styles.achievementDescriptionFaded]} numberOfLines={2}>
                    {achievement.description}
                  </Text>
                  {progress && (
                    <View style={styles.progressRow}>
                      <View style={styles.progressBarSmall}>
                        <View
                          style={[
                            styles.progressFillSmall,
                            { width: `${Math.min(progress.percentage, 100)}%`, backgroundColor: rarityColor },
                          ]}
                        />
                      </View>
                      <Text style={styles.progressTextSmall}>
                        {progress.currentValue}/{progress.targetValue}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownSection: {
    marginBottom: spacing[4],
    ...glassStyles.cardSubtle,
    borderRadius: radiusValues.lg,
    overflow: 'hidden',
  },

  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
  },

  dropdownTitle: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '600',
  },

  dropdownContent: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  achievementRow: {
    flexDirection: 'row',
    padding: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderLeftWidth: 3,
  },

  achievementRowAvailable: {
    opacity: 0.85,
  },

  achievementIcon: {
    fontSize: 28,
    marginRight: spacing[3],
  },

  achievementIconFaded: {
    opacity: 0.6,
  },

  achievementInfo: {
    flex: 1,
  },

  achievementNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },

  achievementName: {
    ...textStyles.body,
    color: colors.text.primary,
    fontWeight: '600',
    flex: 1,
  },

  achievementNameFaded: {
    color: colors.text.secondary,
  },

  rarityBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radiusValues.sm,
  },

  rarityBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.inverse,
  },

  achievementDescription: {
    ...textStyles.caption,
    color: colors.text.secondary,
    lineHeight: 16,
    marginBottom: spacing[1],
  },

  achievementDescriptionFaded: {
    color: colors.text.tertiary,
  },

  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  progressBarSmall: {
    flex: 1,
    height: 4,
    backgroundColor: colors.interactive.default,
    borderRadius: 2,
    overflow: 'hidden',
  },

  progressFillSmall: {
    height: '100%',
    borderRadius: 2,
  },

  progressTextSmall: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    fontSize: 11,
    minWidth: 45,
  },
});

export default AvailableAchievementsList;
