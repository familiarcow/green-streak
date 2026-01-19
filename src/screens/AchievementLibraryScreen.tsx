import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAchievementsStore } from '../store/achievementsStore';
import { colors, textStyles, spacing } from '../theme';
import { RARITY_COLORS, CATEGORY_NAMES } from '../theme/achievements';
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
  'habit_mastery',
  'special',
];

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
        <Text style={styles.statsText}>
          {displayStats.unlocked}/{displayStats.total} Unlocked
        </Text>
      </View>

      {/* Achievement List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {CATEGORY_ORDER.map((category) => {
          const categoryAchievements = achievementsByCategory[category];
          if (categoryAchievements.length === 0) return null;

          const unlockedCount = categoryAchievements.filter((a) => a.isUnlocked).length;

          return (
            <View key={category} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>{CATEGORY_NAMES[category]}</Text>
                <Text style={styles.categoryCount}>
                  {unlockedCount}/{categoryAchievements.length}
                </Text>
              </View>
              {categoryAchievements.map((achievement) => (
                <AchievementCard key={achievement.definition.id} achievement={achievement} />
              ))}
            </View>
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
  statsText: {
    ...textStyles.body,
    color: colors.text.secondary,
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
    marginBottom: spacing[3],
  },
  categoryTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
  },
  categoryCount: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
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
