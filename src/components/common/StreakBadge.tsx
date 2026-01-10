import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textStyles, spacing } from '../../theme';
import { Icon } from './Icon';

interface StreakBadgeProps {
  count: number;
  isActive: boolean;
  hasCompletedToday: boolean;
  size?: 'small' | 'medium';
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  count,
  isActive,
  hasCompletedToday,
  size = 'small',
}) => {
  // Milestone detection
  const isMilestone = [7, 14, 30, 60, 100, 365].includes(count);
  const isAtRisk = isActive && !hasCompletedToday;
  
  const getBadgeColor = () => {
    if (!isActive) return colors.text.tertiary;
    if (isAtRisk) return colors.warning;
    if (count >= 100) return '#FF6B6B'; // Red-orange for 100+
    if (count >= 30) return '#FF9500'; // Orange for 30+
    if (count >= 7) return '#FFA500'; // Amber for 7+
    return colors.accent.warm; // Default warm color
  };
  
  const getEmoji = () => {
    if (!isActive) return '💔';
    if (count >= 100) return '💯';
    if (count >= 30) return '🌟';
    if (count >= 7) return '🔥';
    return '✨';
  };
  
  const badgeColor = getBadgeColor();
  const emoji = getEmoji();
  
  return (
    <View 
      style={[
        styles.badge,
        size === 'medium' && styles.badgeMedium,
        { 
          backgroundColor: isAtRisk ? `${badgeColor}15` : undefined,
          borderColor: isAtRisk ? badgeColor : undefined,
          borderWidth: isAtRisk ? 1 : 0,
          borderStyle: isAtRisk ? 'dashed' : 'solid',
        }
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${count} day streak${isActive ? ' active' : ' inactive'}${isAtRisk ? ', at risk' : ''}`}
    >
      <Text style={[
        styles.text, 
        size === 'medium' && styles.textMedium,
        { color: badgeColor }
      ]}>
        {count}
      </Text>
      <Text style={styles.emoji}>{emoji}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeMedium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  text: {
    ...textStyles.body,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  textMedium: {
    fontSize: 14,
    fontWeight: '700',
  },
  emoji: {
    fontSize: 12,
  },
});

export default StreakBadge;