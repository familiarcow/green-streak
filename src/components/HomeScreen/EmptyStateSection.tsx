import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textStyles, spacing, shadows } from '../../theme';
import { EmptyStateSectionProps } from '../../types';
import { AnimatedButton } from '../AnimatedButton';

export const EmptyStateSection: React.FC<EmptyStateSectionProps> = React.memo(({
  onAddTask,
}) => {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateTitle}>Welcome to Green Streak!</Text>
      <Text style={styles.emptyStateText}>
        Start by adding your first habit to track
      </Text>
      <AnimatedButton
        title="Add Your First Habit"
        onPress={onAddTask}
        variant="primary"
        size="large"
        accessibilityLabel="Add your first task"
      />
    </View>
  );
});

const styles = StyleSheet.create({
  emptyState: {
    alignItems: 'center',
    padding: spacing[6],
    marginHorizontal: spacing[4],
    backgroundColor: colors.surface,
    borderRadius: spacing[3],
    ...shadows.sm,
  },
  
  emptyStateTitle: {
    ...textStyles.h2,
    color: colors.text.primary,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  
  emptyStateText: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[4],
  },
});

export default EmptyStateSection;