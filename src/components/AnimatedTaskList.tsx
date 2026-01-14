import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  FadeIn,
  SlideInRight,
} from 'react-native-reanimated';
import { Task } from '../types';
import { colors, textStyles, spacing, shadows } from '../theme';
import { sizes, fontSizes, radiusValues } from '../theme/utils';
import { Icon, IconName } from './common/Icon';

interface AnimatedTaskListProps {
  tasks: Task[];
  maxItems?: number;
  showMoreText?: boolean;
  onTaskPress?: (task: Task) => void;
}

interface AnimatedTaskItemProps {
  task: Task;
  index: number;
  onPress?: (task: Task) => void;
}

const AnimatedTaskItem: React.FC<AnimatedTaskItemProps> = ({ task, index, onPress }) => {
  const fadeValue = useSharedValue(0);
  const slideValue = useSharedValue(50);

  useEffect(() => {
    fadeValue.value = withDelay(index * 100, withSpring(1));
    slideValue.value = withDelay(index * 100, withSpring(0));
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeValue.value,
    transform: [{ translateX: slideValue.value }],
  }));

  const handlePress = () => {
    onPress?.(task);
  };

  const TaskContent = (
    <>
      <View 
        style={[
          styles.taskColorDot, 
          { backgroundColor: task.color }
        ]} 
      />
      <View style={styles.taskInfo}>
        <Text style={styles.taskName}>{task.name}</Text>
        {task.description && (
          <Text style={styles.taskDescription}>{task.description}</Text>
        )}
      </View>
      {task.icon && (
        <Icon name={task.icon as IconName} size={fontSizes.large} color={colors.text.secondary} />
      )}
      {onPress && (
        <Icon name="chevron-right" size={fontSizes.large} color={colors.text.tertiary} />
      )}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
        <Animated.View 
          style={[styles.taskPreview, styles.taskPreviewClickable, animatedStyle]}
          entering={SlideInRight.delay(index * 100).springify()}
        >
          {TaskContent}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View 
      style={[styles.taskPreview, animatedStyle]}
      entering={SlideInRight.delay(index * 100).springify()}
    >
      {TaskContent}
    </Animated.View>
  );
};

export const AnimatedTaskList: React.FC<AnimatedTaskListProps> = ({
  tasks,
  maxItems = 5,
  showMoreText = true,
  onTaskPress,
}) => {
  const displayTasks = tasks.slice(0, maxItems);
  const remainingCount = Math.max(0, tasks.length - maxItems);

  return (
    <View style={styles.container}>
      {displayTasks.map((task, index) => (
        <AnimatedTaskItem
          key={task.id}
          task={task}
          index={index}
          onPress={onTaskPress}
        />
      ))}
      
      {showMoreText && remainingCount > 0 && (
        <Animated.View entering={FadeIn.delay(displayTasks.length * 100)}>
          <Text style={styles.moreTasksText}>
            +{remainingCount} more habits
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  
  taskPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    marginBottom: spacing[2],
    ...shadows.sm,
  },
  
  taskPreviewClickable: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  
  taskColorDot: {
    width: sizes.progressDot * 2,
    height: sizes.progressDot * 2,
    borderRadius: radiusValues.sm,
    marginRight: spacing[3],
  },
  
  taskInfo: {
    flex: 1,
  },
  
  taskName: {
    ...textStyles.body,
    color: colors.text.primary,
    flex: 1,
  },
  
  taskDescription: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  
  taskIcon: {
    fontSize: fontSizes.large,
    marginLeft: spacing[2],
  },
  
  moreTasksText: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing[2],
    fontStyle: 'italic',
  },
});

export default AnimatedTaskList;