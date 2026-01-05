import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, textStyles, spacing, shadows } from '../../theme';
import { sizes, radiusValues } from '../../theme/utils';
import { ContributionData, Task } from '../../types';
import { formatDisplayDate, getTodayString } from '../../utils/dateHelpers';
import { AnimatedButton } from '../AnimatedButton';
import QuickAddSection from './QuickAddSection';

interface SelectedDateSectionProps {
  selectedDate: string;
  selectedDateData?: ContributionData;
  tasks: Task[];
  onQuickAdd: (taskId: string) => void;
  onDailyLogPress: () => void;
}

export const SelectedDateSection: React.FC<SelectedDateSectionProps> = ({
  selectedDate,
  selectedDateData,
  tasks,
  onQuickAdd,
  onDailyLogPress,
}) => {
  const isToday = selectedDate === getTodayString();
  const hasCompletions = selectedDateData && selectedDateData.count > 0;

  return (
    <View style={styles.selectedDateSection}>
      <Text style={styles.selectedDateTitle}>
        {formatDisplayDate(new Date(selectedDate))}
        {isToday && ' (Today)'}
      </Text>
      
      {hasCompletions ? (
        <View style={styles.tasksList}>
          {selectedDateData.tasks.map((task) => (
            <View key={task.taskId} style={styles.taskItem}>
              <View 
                style={[
                  styles.taskColorDot, 
                  { backgroundColor: task.color }
                ]} 
              />
              <Text style={styles.taskName}>{task.name}</Text>
              <Text style={styles.taskCount}>
                {task.count} {task.count === 1 ? 'time' : 'times'}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <>
          <Text style={styles.noDataText}>
            No completions on this day
          </Text>
          {isToday && tasks.length > 0 && (
            <QuickAddSection
              tasks={tasks}
              onQuickAdd={onQuickAdd}
            />
          )}
        </>
      )}
      
      <AnimatedButton
        title={isToday ? 'Log Today\'s Tasks' : 'Edit This Day'}
        onPress={onDailyLogPress}
        variant="primary"
        accessibilityLabel="Edit this day's tasks"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  selectedDateSection: {
    marginHorizontal: spacing[4],
    marginBottom: spacing[6],
    padding: spacing[4],
    backgroundColor: colors.surface,
    borderRadius: spacing[3],
    ...shadows.sm,
  },
  
  selectedDateTitle: {
    ...textStyles.h3,
    color: colors.text.primary,
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  
  tasksList: {
    marginBottom: spacing[4],
  },
  
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  
  taskColorDot: {
    width: sizes.progressDot * 2,
    height: sizes.progressDot * 2,
    borderRadius: radiusValues.sm,
    marginRight: spacing[3],
  },
  
  taskName: {
    ...textStyles.body,
    color: colors.text.primary,
    flex: 1,
  },
  
  taskCount: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
  },
  
  noDataText: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginVertical: spacing[3],
    fontStyle: 'italic',
  },
});

export default SelectedDateSection;