import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textStyles, spacing } from '../../theme';
import { TasksSectionProps } from '../../types';
import { AnimatedButton } from '../AnimatedButton';
import { AnimatedTaskList } from '../AnimatedTaskList';

export const TasksSection: React.FC<TasksSectionProps> = React.memo(({
  tasks,
  onTaskPress,
  onAddTask,
}) => {
  // Memoize the early return check
  const shouldRender = useMemo(() => tasks.length > 0, [tasks.length]);

  if (!shouldRender) {
    return null;
  }

  return (
    <View style={styles.tasksSection}>
      <View style={styles.tasksSectionHeader}>
        <Text style={styles.tasksSectionTitle}>Your Habits</Text>
        <AnimatedButton
          title="+ Add"
          onPress={onAddTask}
          variant="secondary"
          size="small"
          accessibilityLabel="Add new task"
        />
      </View>
      
      <AnimatedTaskList
        tasks={tasks}
        maxItems={5}
        showMoreText={true}
        onTaskPress={onTaskPress}
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