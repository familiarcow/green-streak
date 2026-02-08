import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, useSharedValue } from 'react-native-reanimated';
import { useAchievementsStore } from '../store/achievementsStore';
import { Icon } from '../components/common/Icon';
import { colors, textStyles, spacing } from '../theme';
import { radiusValues } from '../theme/utils';
import { RARITY_COLORS, CATEGORY_NAMES } from '../theme/achievements';
import { useSounds } from '../hooks/useSounds';
import { AchievementCategory, AchievementWithStatus } from '../types/achievements';

interface AchievementLibraryScreenProps {
  onClose: () => void;
}

// Category display order
const CATEGORY_ORDER: AchievementCategory[] = [
  'explorer',
  'streak',
  'perfect',
  'consistency',
  'early_bird',
  'time_based',
  'recovery',
  'habit_mastery',
  'special',
];

interface CategorySectionProps {
  category: AchievementCategory;
  achievements: AchievementWithStatus[];
}

const CategorySection: React.FC<CategorySectionProps> = ({
  category,
  achievements,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const rotation = useSharedValue(180);
  const { playRandomTap } = useSounds();

  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;

  const handleToggle = useCallback(() => {
    playRandomTap();
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    rotation.value = withTiming(newExpanded ? 180 : 0, { duration: 200 });
  }, [isExpanded, rotation, playRandomTap]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={styles.categorySection}>
      <TouchableOpacity
        style={styles.categoryHeader}
        onPress={handleToggle}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityState={{ expanded: isExpanded }}
        accessibilityLabel={`${CATEGORY_NAMES[category]} section, ${unlockedCount} of ${achievements.length} unlocked`}
      >
        <View style={styles.categoryHeaderLeft}>
          <Text style={styles.categoryTitle}>{CATEGORY_NAMES[category]}</Text>
          <Text style={styles.categoryCount}>
            {unlockedCount}/{achievements.length}
          </Text>
        </View>
        <Animated.View style={chevronStyle}>
          <Icon name="chevron-up" size={20} color={colors.text.secondary} />
        </Animated.View>
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.categoryContent}>
          {achievements.map((achievement) => (
            <AchievementCard key={achievement.definition.id} achievement={achievement} />
          ))}
        </View>
      )}
    </View>
  );
};

const AchievementCard: React.FC<{ achievement: AchievementWithStatus }> = ({ achievement }) => {
  const { definition, isUnlocked, isHidden, progress } = achievement;
  const showHidden = isHidden && !isUnlocked;

  return (
    <View style={[styles.card, !isUnlocked && styles.cardLocked]}>
      <View style={styles.cardIcon}>
        <Text style={styles.iconText}>
          {showHidden ? '?' : definition.icon}
        </Text>
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardName, !isUnlocked && styles.textLocked]}>
            {showHidden ? '???' : definition.name}
          </Text>
          <View style={[styles.rarityBadge, { backgroundColor: RARITY_COLORS[definition.rarity] }]}>
            <Text style={styles.rarityText}>
              {definition.rarity.charAt(0).toUpperCase() + definition.rarity.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={[styles.cardDescription, !isUnlocked && styles.textLocked]}>
          {showHidden ? 'Complete special requirements to unlock' : definition.description}
        </Text>
        {progress && !isUnlocked && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(progress.percentage, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {progress.currentValue}/{progress.targetValue}
            </Text>
          </View>
        )}
      </View>
      {isUnlocked && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </View>
  );
};

export const AchievementLibraryScreen: React.FC<AchievementLibraryScreenProps> = ({ onClose }) => {
  const { achievements, stats, loadAchievements, loadStats, loading } = useAchievementsStore();
  const { playRandomTap } = useSounds();
  const handleClose = () => {
    playRandomTap();
    onClose();
  };

  useEffect(() => {
    loadAchievements();
    loadStats();
  }, [loadAchievements, loadStats]);

  // Group achievements by category
  const achievementsByCategory = useMemo(() => {
    const grouped: Record<AchievementCategory, AchievementWithStatus[]> = {
      explorer: [],
      streak: [],
      perfect: [],
      consistency: [],
      early_bird: [],
      time_based: [],
      recovery: [],
      habit_mastery: [],
      special: [],
    };

    achievements.forEach((achievement) => {
      const category = achievement.definition.category;
      if (grouped[category]) {
        grouped[category].push(achievement);
      }
    });

    return grouped;
  }, [achievements]);

  // Calculate display stats
  const displayStats = useMemo(() => {
    if (stats) {
      return {
        unlocked: stats.totalUnlocked,
        total: stats.totalAchievements,
      };
    }
    return {
      unlocked: achievements.filter((a) => a.isUnlocked).length,
      total: achievements.length,
    };
  }, [stats, achievements]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Achievements</Text>
        <View style={styles.headerRight}>
          <Text style={styles.statsText}>
            {displayStats.unlocked}/{displayStats.total}
          </Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Icon name="x" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Loading State */}
      {loading && achievements.length === 0 && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Achievement List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {CATEGORY_ORDER.map((category) => {
          const categoryAchievements = achievementsByCategory[category];
          if (categoryAchievements.length === 0) return null;

          return (
            <CategorySection
              key={category}
              category={category}
              achievements={categoryAchievements}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...textStyles.h2,
    color: colors.text.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    ...textStyles.body,
    color: colors.text.secondary,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[8],
  },
  categorySection: {
    marginTop: spacing[5],
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  categoryTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
  },
  categoryCount: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
  categoryContent: {
    marginTop: spacing[2],
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radiusValues.xl,
    padding: spacing[3],
    marginBottom: spacing[2],
    alignItems: 'center',
  },
  cardLocked: {
    opacity: 0.6,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  iconText: {
    fontSize: 22,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  cardName: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  cardDescription: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
  textLocked: {
    color: colors.text.secondary,
  },
  rarityBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: 4,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
    gap: spacing[2],
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    ...textStyles.caption,
    color: colors.text.secondary,
    minWidth: 40,
    textAlign: 'right',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing[2],
  },
  checkmarkText: {
    color: colors.text.inverse,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default AchievementLibraryScreen;
