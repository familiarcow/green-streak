import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textStyles, spacing, shadows } from '../../theme';
import { Icon } from './Icon';

interface StreakBadgeProps {
  count: number;
  isActive: boolean;
  hasCompletedToday: boolean;
  isToday?: boolean;
  size?: 'small' | 'medium';
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({
  count,
  isActive,
  hasCompletedToday,
  isToday = false,
  size = 'small',
}) => {
  // Milestone detection
  const isMilestone = [7, 14, 30, 60, 100, 365].includes(count);
  // Only show at risk styling when viewing today
  const isAtRisk = isToday && isActive && !hasCompletedToday;
  
  const getBadgeColor = () => {
    if (!isActive) return colors.text.tertiary;
    if (isAtRisk) return colors.warning;
    if (count >= 100) return '#8b5cf6'; // Purple for 100+ (high contrast)
    if (count >= 30) return '#3b82f6'; // Blue for 30+ (good contrast)
    if (count >= 7) return '#22c55e'; // Green for 7+ (vibrant)
    return '#06b6d4'; // Cyan for < 7 days (fresh start)
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
        isMilestone && isActive && styles.badgeMilestone,
        { 
          backgroundColor: isActive ? `${badgeColor}12` : '#F9FAFB',
          borderColor: isAtRisk ? badgeColor : (isActive ? `${badgeColor}30` : 'transparent'),
          borderWidth: 1,
          borderStyle: isAtRisk ? 'dashed' : 'solid',
        }
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${count} day streak${isActive ? ' active' : ' inactive'}${isAtRisk ? ', at risk' : ''}${isMilestone ? ', milestone!' : ''}`}
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
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: spacing[2],
  },
  badgeMedium: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 5,
  },
  badgeMilestone: {
    ...shadows.sm,
  },
  text: {
    ...textStyles.body,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textMedium: {
    fontSize: 15,
    fontWeight: '800',
  },
  emoji: {
    fontSize: 13,
  },
});

export default StreakBadge;