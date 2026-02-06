import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textStyles, spacing } from '../../theme';
import { TasksSectionProps } from '../../types';
import { AnimatedButton } from '../AnimatedButton';
import { DraggableTaskList } from '../DraggableTaskList';
import { useSounds } from '../../hooks';

export const TasksSection: React.FC<TasksSectionProps> = React.memo(({
  tasks,
  onTaskPress,
  onAddTask,
  onReorder,
}) => {
  const { playRandomTap } = useSounds();

  // Memoize the early return check
  const shouldRender = useMemo(() => tasks.length > 0, [tasks.length]);

  const handleReorder = useCallback((taskIds: string[]) => {
    onReorder?.(taskIds);
  }, [onReorder]);

  const handleAddTask = useCallback(() => {
    playRandomTap();
    onAddTask();
  }, [onAddTask, playRandomTap]);

  if (!shouldRender) {
    return null;
  }

  return (
    <View style={styles.tasksSection}>
      <View style={styles.tasksSectionHeader}>
        <Text style={styles.tasksSectionTitle}>Your Habits</Text>
        <AnimatedButton
          title="+ Add"
          onPress={handleAddTask}
          variant="secondary"
          size="small"
          skipSound
          accessibilityLabel="Add new task"
        />
      </View>

      <DraggableTaskList
        tasks={tasks}
        onTaskPress={onTaskPress}
        onReorder={handleReorder}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  tasksSection: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[6],
  },
  
  tasksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  
  tasksSectionTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
  },
});

export default TasksSection;