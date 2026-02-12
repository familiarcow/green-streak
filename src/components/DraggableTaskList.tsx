import React, { useCallback, useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  useAnimatedReaction,
  SharedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Task } from '../types';
import { colors, textStyles, spacing, shadows } from '../theme';
import { fontSizes, radiusValues } from '../theme/utils';
import { Icon, IconName } from './common/Icon';
import { useSounds } from '../hooks/useSounds';

const ITEM_HEIGHT = 64;

interface DraggableTaskListProps {
  tasks: Task[];
  onTaskPress?: (task: Task) => void;
  onReorder: (taskIds: string[]) => void;
}

interface DraggableTaskItemProps {
  task: Task;
  index: number;
  draggedIndex: SharedValue<number>;
  dragY: SharedValue<number>;
  isDragging: SharedValue<boolean>;
  onTaskPress?: (task: Task) => void;
  onDragStart: (index: number) => void;
  onDragEnd: (fromIndex: number, toIndex: number) => void;
  totalItems: number;
}

const DraggableTaskItem: React.FC<DraggableTaskItemProps> = ({
  task,
  index,
  draggedIndex,
  dragY,
  isDragging,
  onTaskPress,
  onDragStart,
  onDragEnd,
  totalItems,
}) => {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const zIndex = useSharedValue(0);
  const shadowOpacity = useSharedValue(0);
  const startIndex = useSharedValue(index);

  // Handle position changes when other items are being dragged
  useAnimatedReaction(
    () => ({
      dragging: isDragging.value,
      draggedIdx: draggedIndex.value,
      currentDragY: dragY.value,
    }),
    (current) => {
      if (!current.dragging || current.draggedIdx === index) {
        if (current.draggedIdx !== index) {
          translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
        }
        return;
      }

      const draggedPosition = current.draggedIdx * ITEM_HEIGHT + current.currentDragY;
      const myPosition = index * ITEM_HEIGHT;
      const threshold = ITEM_HEIGHT / 2;

      if (current.draggedIdx < index) {
        // Dragged item is above me
        if (draggedPosition > myPosition - threshold) {
          translateY.value = withSpring(-ITEM_HEIGHT, { damping: 20, stiffness: 200 });
        } else {
          translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
        }
      } else {
        // Dragged item is below me
        if (draggedPosition < myPosition + threshold) {
          translateY.value = withSpring(ITEM_HEIGHT, { damping: 20, stiffness: 200 });
        } else {
          translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
        }
      }
    }
  );

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(200)
    .onStart(() => {
      startIndex.value = index;
      draggedIndex.value = index;
      isDragging.value = true;
      scale.value = withSpring(1.02, { damping: 15, stiffness: 200 });
      shadowOpacity.value = withTiming(0.25, { duration: 150 });
      zIndex.value = 1000;
      runOnJS(onDragStart)(index);
    })
    .onUpdate((event) => {
      const newY = event.translationY;
      // Constrain drag within bounds
      const minY = -index * ITEM_HEIGHT;
      const maxY = (totalItems - 1 - index) * ITEM_HEIGHT;
      dragY.value = Math.max(minY, Math.min(maxY, newY));
    })
    .onEnd(() => {
      // Calculate final position
      const newIndex = Math.round((index * ITEM_HEIGHT + dragY.value) / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(totalItems - 1, newIndex));

      // Reset visual state
      dragY.value = withSpring(0, { damping: 20, stiffness: 200 });
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      shadowOpacity.value = withTiming(0, { duration: 150 });
      zIndex.value = 0;
      isDragging.value = false;
      draggedIndex.value = -1;

      runOnJS(onDragEnd)(index, clampedIndex);
    })
    .onFinalize(() => {
      dragY.value = withSpring(0, { damping: 20, stiffness: 200 });
      scale.value = withSpring(1, { damping: 15, stiffness: 200 });
      shadowOpacity.value = withTiming(0, { duration: 150 });
      zIndex.value = 0;
      isDragging.value = false;
      draggedIndex.value = -1;
    });

  const animatedStyle = useAnimatedStyle(() => {
    const isDraggedItem = draggedIndex.value === index && isDragging.value;

    return {
      transform: [
        { translateY: isDraggedItem ? dragY.value : translateY.value },
        { scale: scale.value },
      ],
      zIndex: zIndex.value,
      shadowOpacity: shadowOpacity.value,
    };
  });

  const handleTaskPress = () => {
    onTaskPress?.(task);
  };

  return (
    <Animated.View style={[styles.itemContainer, animatedStyle]}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={styles.dragHandle}>
          <Icon name="grip-vertical" size={fontSizes.xlarge} color={colors.text.tertiary} />
        </Animated.View>
      </GestureDetector>
      <View style={[styles.iconContainer, { backgroundColor: task.color }]}>
        <Icon
          name={(task.icon as IconName) || 'check'}
          size={fontSizes.large}
          color={colors.text.inverse}
        />
      </View>
      <View style={styles.taskInfo}>
        <Text style={styles.taskName}>{task.name}</Text>
        {task.description && (
          <Text style={styles.taskDescription} numberOfLines={1}>
            {task.description}
          </Text>
        )}
      </View>
      <Pressable
        onPress={handleTaskPress}
        style={styles.editButton}
        disabled={!onTaskPress}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${task.name}`}
      >
        <Icon name="pen" size={fontSizes.small} color={colors.text.secondary} />
      </Pressable>
    </Animated.View>
  );
};

export const DraggableTaskList: React.FC<DraggableTaskListProps> = ({
  tasks,
  onTaskPress,
  onReorder,
}) => {
  const draggedIndex = useSharedValue(-1);
  const dragY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const [orderedTasks, setOrderedTasks] = useState(tasks);
  const lastTaskIds = useRef(tasks.map(t => t.id).join(','));
  const { playRandomTap, play } = useSounds();

  // Update ordered tasks when tasks prop changes
  useEffect(() => {
    const currentIds = tasks.map(t => t.id).join(',');
    if (currentIds !== lastTaskIds.current) {
      setOrderedTasks(tasks);
      lastTaskIds.current = currentIds;
    }
  }, [tasks]);

  const handleDragStart = useCallback((index: number) => {
    // Play sound when drag starts
    playRandomTap();
  }, [playRandomTap]);

  const handleDragEnd = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) {
      return;
    }

    // Play sound when drag ends with reorder
    play('close');

    // Reorder tasks
    const newTasks = [...orderedTasks];
    const [movedTask] = newTasks.splice(fromIndex, 1);
    newTasks.splice(toIndex, 0, movedTask);

    const newTaskIds = newTasks.map(t => t.id);
    setOrderedTasks(newTasks);
    lastTaskIds.current = newTaskIds.join(',');
    onReorder(newTaskIds);
  }, [orderedTasks, onReorder, play]);

  if (tasks.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {orderedTasks.map((task, index) => (
        <DraggableTaskItem
          key={task.id}
          task={task}
          index={index}
          draggedIndex={draggedIndex}
          dragY={dragY}
          isDragging={isDragging}
          onTaskPress={onTaskPress}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          totalItems={orderedTasks.length}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
    backgroundColor: colors.surface,
    borderRadius: radiusValues.box,
    paddingRight: spacing[2],
    ...shadows.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  dragHandle: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[4],
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: radiusValues.box,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  taskInfo: {
    flex: 1,
  },
  taskName: {
    ...textStyles.body,
    color: colors.text.primary,
  },
  taskDescription: {
    ...textStyles.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing[1],
  },
  editButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[4],
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DraggableTaskList;
