import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, textStyles, spacing, shadows } from '../../theme';
import { sizes, fontSizes } from '../../theme/utils';
import { Task } from '../../types';

interface QuickAddSectionProps {
  tasks: Task[];
  onQuickAdd: (taskId: string) => void;
}

export const QuickAddSection: React.FC<QuickAddSectionProps> = ({
  tasks,
  onQuickAdd,
}) => {
  if (tasks.length === 0) {
    return null;
  }

  return (
    <View style={styles.quickAddSection}>
      <Text style={styles.quickAddTitle}>Quick Add:</Text>
      <View style={styles.quickAddButtons}>
        {tasks.map((task) => (
          <TouchableOpacity
            key={task.id}
            style={[
              styles.quickAddButton,
              { backgroundColor: task.color }
            ]}
            onPress={() => onQuickAdd(task.id)}
            accessibilityRole="button"
            accessibilityLabel={`Quick add ${task.name}`}
          >
            {task.icon ? (
              <Text style={styles.quickAddIcon}>{task.icon}</Text>
            ) : (
              <Text style={styles.quickAddText}>
                {task.name.substring(0, 2).toUpperCase()}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  quickAddSection: {
    marginTop: spacing[3],
    alignItems: 'center',
  },
  
  quickAddTitle: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  
  quickAddButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    justifyContent: 'center',
  },
  
  quickAddButton: {
    width: sizes.iconContainer.large,
    height: sizes.iconContainer.large,
    borderRadius: sizes.iconContainer.large / 2,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  
  quickAddIcon: {
    fontSize: fontSizes.large,
  },
  
  quickAddText: {
    ...textStyles.bodySmall,
    color: colors.text.inverse,
    fontWeight: '600',
  },
});

export default QuickAddSection;