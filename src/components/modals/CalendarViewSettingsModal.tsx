import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { BaseModal } from './BaseModal';
import { Icon, IconName, ICON_MAP } from '../common/Icon';
import { Task } from '../../types';
import { useSettingsStore } from '../../store/settingsStore';
import { useAccentColor, useSounds } from '../../hooks';
import { colors, textStyles, spacing, glassStyles } from '../../theme';
import { radiusValues } from '../../theme/utils';

interface CalendarViewSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  tasks: Task[];
}

export const CalendarViewSettingsModal: React.FC<CalendarViewSettingsModalProps> = ({
  visible,
  onClose,
  tasks,
}) => {
  const accentColor = useAccentColor();
  const { playToggle } = useSounds();

  const excludedTaskIds = useSettingsStore(state => state.excludedCalendarTaskIds) ?? [];
  const setExcludedCalendarTaskIds = useSettingsStore(state => state.setExcludedCalendarTaskIds);

  // A task is included if it's NOT in the exclude list
  const isTaskIncluded = useCallback((taskId: string) => {
    return !excludedTaskIds.includes(taskId);
  }, [excludedTaskIds]);

  const handleToggleTask = useCallback((taskId: string) => {
    const isCurrentlyIncluded = !excludedTaskIds.includes(taskId);
    playToggle(!isCurrentlyIncluded);

    if (isCurrentlyIncluded) {
      // Add to exclude list (hide from calendar)
      setExcludedCalendarTaskIds([...excludedTaskIds, taskId]);
    } else {
      // Remove from exclude list (show on calendar)
      setExcludedCalendarTaskIds(excludedTaskIds.filter(id => id !== taskId));
    }
  }, [excludedTaskIds, setExcludedCalendarTaskIds, playToggle]);

  // Render task icon (emoji or Icon component)
  const renderTaskIcon = useCallback((task: Task) => {
    if (!task.icon) {
      return <Text style={styles.taskIconEmoji}>📋</Text>;
    }

    // Check if it's a known icon name from the Icon component
    if (task.icon in ICON_MAP) {
      return (
        <Icon
          name={task.icon as IconName}
          size={16}
          color={task.color}
        />
      );
    }

    // Otherwise treat it as an emoji
    return <Text style={styles.taskIconEmoji}>{task.icon}</Text>;
  }, []);

  const includedCount = tasks.filter(t => !excludedTaskIds.includes(t.id)).length;

  return (
    <BaseModal
      isVisible={visible}
      onClose={onClose}
      closeOnBackdropPress={true}
      height="65%"
      minHeight={300}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Default Calendar View</Text>
          <Text style={styles.subtitle}>Choose which habits appear by default</Text>
        </View>

        {/* Task List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {tasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No habits yet</Text>
              <Text style={styles.emptySubtext}>Create some habits to customize your calendar view</Text>
            </View>
          ) : (
            tasks.map((task, index) => {
              const isIncluded = isTaskIncluded(task.id);

              return (
                <View
                  key={task.id}
                  style={[
                    styles.taskItem,
                    glassStyles.card,
                    index < tasks.length - 1 && styles.taskItemWithMargin,
                  ]}
                >
                  <View style={styles.taskInfo}>
                    <View style={[styles.taskIconContainer, { backgroundColor: task.color + '20' }]}>
                      {renderTaskIcon(task)}
                    </View>
                    <Text style={styles.taskName} numberOfLines={1}>{task.name}</Text>
                    <View style={[styles.colorBar, { backgroundColor: task.color }]} />
                  </View>

                  <Switch
                    value={isIncluded}
                    onValueChange={() => handleToggleTask(task.id)}
                    trackColor={{ false: colors.interactive.default, true: accentColor }}
                    thumbColor={colors.surface}
                    accessibilityLabel={`${task.name} visibility toggle`}
                    accessibilityHint={isIncluded ? "Double tap to hide from calendar" : "Double tap to show on calendar"}
                  />
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Footer note */}
        {tasks.length > 0 && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {includedCount === tasks.length
                ? 'All habits visible on calendar'
                : `${includedCount} of ${tasks.length} habits visible`}
            </Text>
            <Text style={styles.footerNote}>
              Hidden habits can still be viewed using the filter
            </Text>
          </View>
        )}
      </View>
    </BaseModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },

  header: {
    marginBottom: spacing[4],
  },

  title: {
    ...textStyles.h2,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },

  subtitle: {
    ...textStyles.body,
    color: colors.text.secondary,
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: spacing[4],
  },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing[8],
  },

  emptyText: {
    ...textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing[1],
  },

  emptySubtext: {
    ...textStyles.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
  },

  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[3],
    borderRadius: radiusValues.box,
  },

  taskItemWithMargin: {
    marginBottom: spacing[2],
  },

  taskInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing[3],
  },

  taskIconContainer: {
    width: 32,
    height: 32,
    borderRadius: radiusValues.box,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },

  taskIconEmoji: {
    fontSize: 16,
  },

  taskName: {
    ...textStyles.body,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing[2],
  },

  colorBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: spacing[2],
  },

  footer: {
    marginTop: spacing[2],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    alignItems: 'center',
  },

  footerText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginBottom: spacing[1],
  },

  footerNote: {
    ...textStyles.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
});

export default CalendarViewSettingsModal;
