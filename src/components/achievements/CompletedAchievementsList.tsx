import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from '../common/Icon';
import { colors, textStyles, spacing } from '../../theme';
import { glassStyles } from '../../theme/glass';
import { radiusValues } from '../../theme/utils';
import { RARITY_COLORS } from '../../theme/achievements';
import { AchievementGridState, GridCell } from '../../types/achievements';

interface CompletedAchievementsListProps {
  gridState: AchievementGridState;
}

/**
 * Collapsible dropdown list of completed achievements with full details
 * Shows achievements sorted by unlock date (most recent first)
 */
export const CompletedAchievementsList: React.FC<CompletedAchievementsListProps> = ({ gridState }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Get all unlocked cells, sorted by unlock date (most recent first)
  const completedCells = useMemo(() => {
    const unlocked: GridCell[] = [];
    for (const row of gridState.cells) {
      for (const cell of row) {
        if (cell.state === 'unlocked' && cell.achievement && cell.unlocked) {
          unlocked.push(cell);
        }
      }
    }
    // Sort by unlock date descending (most recent first)
    return unlocked.sort((a, b) => {
      const dateA = a.unlocked?.unlockedAt ? new Date(a.unlocked.unlockedAt).getTime() : 0;
      const dateB = b.unlocked?.unlockedAt ? new Date(b.unlocked.unlockedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [gridState]);

  if (completedCells.length === 0) {
    return null;
  }

  return (
    <View style={styles.dropdownSection}>
      <TouchableOpacity
        style={styles.dropdownHeader}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.dropdownTitle}>Completed ({completedCells.length})</Text>
        <Icon
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.text.secondary}
        />
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.dropdownContent}>
          {completedCells.map((cell) => {
            const achievement = cell.achievement!;
            const rarityColor = RARITY_COLORS[achievement.rarity];
            return (
              <View
                key={achievement.id}
                style={[styles.achievementRow, { borderLeftColor: rarityColor }]}
              >
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <View style={styles.achievementInfo}>
                  <View style={styles.achievementNameRow}>
                    <Text style={styles.achievementName}>{achievement.name}</Text>
                    <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                      <Text style={styles.rarityBadgeText}>
                        {achievement.rarity.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.achievementDescription} numberOfLines={2}>
                    {achievement.description}
                  </Text>
                  {cell.unlocked && (
                    <Text style={styles.achievementDate}>
                      Unlocked {new Date(cell.unlocked.unlockedAt).toLocaleDateString()}
                    </Text>
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

  achievementIcon: {
    fontSize: 28,
    marginRight: spacing[3],
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

  achievementDate: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    fontSize: 11,
  },
});

export default CompletedAchievementsList;
