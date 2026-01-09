import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textStyles, spacing } from '../../theme';

interface StreakBadgeProps {
  currentStreak: number;
  bestStreak: number;
  isAtRisk?: boolean;
  size?: 'small' | 'medium' | 'large';
  showBest?: boolean;
}

export const StreakBadge: React.FC<StreakBadgeProps> = React.memo(({
  currentStreak,
  bestStreak,
  isAtRisk = false,
  size = 'medium',
  showBest = true,
}) => {
  if (currentStreak === 0) {
    return null;
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          badge: styles.badgeSmall,
          text: styles.textSmall,
          emoji: styles.emojiSmall,
        };
      case 'large':
        return {
          badge: styles.badgeLarge,
          text: styles.textLarge,
          emoji: styles.emojiLarge,
        };
      default:
        return {
          badge: styles.badgeMedium,
          text: styles.textMedium,
          emoji: styles.emojiMedium,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const badgeColor = isAtRisk ? colors.warning : colors.primary;

  return (
    <View style={styles.container}>
      <View style={[styles.badge, sizeStyles.badge, { backgroundColor: badgeColor }]}>
        <Text style={[styles.emoji, sizeStyles.emoji]}>🔥</Text>
        <Text style={[styles.text, sizeStyles.text]}>{currentStreak}</Text>
      </View>
      {showBest && bestStreak > currentStreak && (
        <Text style={styles.bestText}>Best: {bestStreak}</Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: spacing[3],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  badgeSmall: {
    paddingHorizontal: spacing[1],
    paddingVertical: 2,
  },
  badgeMedium: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  badgeLarge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  emoji: {
    marginRight: spacing[1],
  },
  emojiSmall: {
    fontSize: 12,
  },
  emojiMedium: {
    fontSize: 16,
  },
  emojiLarge: {
    fontSize: 24,
  },
  text: {
    color: colors.text.inverse,
    fontWeight: 'bold',
  },
  textSmall: {
    ...textStyles.caption,
  },
  textMedium: {
    ...textStyles.body,
  },
  textLarge: {
    ...textStyles.h3,
  },
  bestText: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
});