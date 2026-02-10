import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon } from '../common/Icon';
import { colors, textStyles, spacing } from '../../theme';
import { glassStyles } from '../../theme/glass';
import { radiusValues } from '../../theme/utils';
import { RARITY_COLORS } from '../../theme/achievements';
import { GridCell } from '../../types/achievements';

interface AchievementDetailPanelProps {
  cell: GridCell;
  onClose: () => void;
}

/**
 * Detail panel for showing achievement information
 * Displays icon, name, rarity, description, and progress/unlock date
 */
export const AchievementDetailPanel: React.FC<AchievementDetailPanelProps> = ({ cell, onClose }) => {
  const { state, achievement, unlocked, progress } = cell;

  if (!achievement) {
    return null;
  }

  const rarityColor = RARITY_COLORS[achievement.rarity];
  const isUnlocked = state === 'unlocked';
  const isVisible = state === 'visible';

  return (
    <View style={[styles.detailContent, { borderColor: rarityColor }]}>
      {/* Header row: Icon, Name, Rarity badge, Close button */}
      <View style={styles.detailHeader}>
        <View style={[styles.detailIconContainer, { backgroundColor: `${rarityColor}30` }]}>
          <Text style={styles.detailIcon}>{achievement.icon}</Text>
          {isUnlocked && (
            <View style={[styles.detailUnlockedBadge, { backgroundColor: rarityColor }]}>
              <Icon name="check" size={10} color="#FFFFFF" />
            </View>
          )}
        </View>

        <View style={styles.detailNameContainer}>
          <Text style={styles.detailName}>{achievement.name}</Text>
          <View style={[styles.detailRarityBadge, { backgroundColor: rarityColor }]}>
            <Text style={styles.detailRarityText}>
              {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.detailCloseButton} onPress={onClose}>
          <Icon name="x" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Description - full width */}
      <Text style={styles.detailDescription}>
        {isVisible ? `Objective: ${achievement.description}` : achievement.description}
      </Text>

      {/* Footer: Progress bar OR unlock date */}
      {isVisible && progress ? (
        <View style={styles.detailProgressContainer}>
          <View style={styles.detailProgressBar}>
            <View
              style={[
                styles.detailProgressFill,
                { width: `${Math.min(progress.percentage, 100)}%`, backgroundColor: rarityColor },
              ]}
            />
          </View>
          <Text style={styles.detailProgressText}>
            {progress.currentValue}/{progress.targetValue}
          </Text>
        </View>
      ) : isUnlocked && unlocked ? (
        <Text style={styles.detailUnlockDate}>
          Unlocked {new Date(unlocked.unlockedAt).toLocaleDateString()}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  detailContent: {
    ...glassStyles.card,
    backgroundColor: colors.surface,
    borderRadius: radiusValues.xl,
    padding: spacing[4],
    borderWidth: 2,
    gap: spacing[3],
  },

  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },

  detailIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    flexShrink: 0,
  },

  detailIcon: {
    fontSize: 24,
  },

  detailUnlockedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },

  detailNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    flexWrap: 'wrap',
  },

  detailName: {
    ...textStyles.h4,
    color: colors.text.primary,
  },

  detailRarityBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: radiusValues.sm,
  },

  detailRarityText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.inverse,
  },

  detailDescription: {
    ...textStyles.body,
    color: colors.text.secondary,
    lineHeight: 22,
  },

  detailProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },

  detailProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: colors.interactive.default,
    borderRadius: 3,
    overflow: 'hidden',
  },

  detailProgressFill: {
    height: '100%',
    borderRadius: 3,
  },

  detailProgressText: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },

  detailUnlockDate: {
    ...textStyles.caption,
    color: colors.text.tertiary,
  },

  detailCloseButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});

export default AchievementDetailPanel;
