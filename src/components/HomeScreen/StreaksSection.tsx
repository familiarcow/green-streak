import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useStreaksStore } from '../../store/streaksStore';
import { StreakBadge } from './StreakBadge';
import { colors, textStyles, spacing } from '../../theme';
import { Task, TaskStreak } from '../../types';

interface StreaksSectionProps {
  onTaskPress?: (task: Task) => void;
}

export const StreaksSection: React.FC<StreaksSectionProps> = React.memo(({ onTaskPress }) => {
  const { activeStreaks, loadActiveStreaks, loading } = useStreaksStore();

  useEffect(() => {
    loadActiveStreaks();
  }, [loadActiveStreaks]);

  if (loading || activeStreaks.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Active Streaks</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {activeStreaks.map(({ task, streak, isAtRisk }) => (
          <TouchableOpacity
            key={task.id}
            style={[
              styles.streakCard,
              isAtRisk && styles.streakCardAtRisk
            ]}
            onPress={() => onTaskPress?.(task)}
            activeOpacity={0.7}
          >
            <View style={styles.taskInfo}>
              {task.icon && <Text style={styles.taskIcon}>{task.icon}</Text>}
              <Text style={styles.taskName} numberOfLines={1}>
                {task.name}
              </Text>
            </View>
            <StreakBadge
              currentStreak={streak.currentStreak}
              bestStreak={streak.bestStreak}
              isAtRisk={isAtRisk}
              size="small"
              showBest={false}
            />
            {isAtRisk && (
              <Text style={styles.atRiskText}>Complete today!</Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing[3],
  },
  sectionTitle: {
    ...textStyles.h3,
    marginBottom: spacing[2],
    paddingHorizontal: spacing[3],
  },
  scrollView: {
    paddingHorizontal: spacing[2],
  },
  streakCard: {
    backgroundColor: colors.surface,
    borderRadius: spacing[3],
    padding: spacing[3],
    marginHorizontal: spacing[1],
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streakCardAtRisk: {
    borderWidth: 2,
    borderColor: colors.accent.warm,
  },
  taskInfo: {
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  taskIcon: {
    fontSize: 24,
    marginBottom: spacing[1],
  },
  taskName: {
    ...textStyles.body,
    fontWeight: '600',
    textAlign: 'center',
    maxWidth: 100,
  },
  atRiskText: {
    ...textStyles.caption,
    color: colors.accent.warm,
    marginTop: spacing[1],
    fontWeight: 'bold',
  },
});