import React, { useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withDelay,
  interpolate,
} from 'react-native-reanimated';
import { ContributionData, Task } from '../../types';
import { getTaskColorWithOpacity } from '../../theme/colors';
import { spacing, borderRadius, colors } from '../../theme';
import { isDateToday, formatDisplayDate } from '../../utils/dateHelpers';

interface TaskContributionDayProps {
  data: ContributionData;
  task: Task;
  maxCount: number;
  size: number;
  onPress: (date: string) => void;
  isSelected?: boolean;
  animationDelay?: number;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const TaskContributionDay: React.FC<TaskContributionDayProps> = ({
  data,
  task,
  maxCount,
  size,
  onPress,
  isSelected = false,
  animationDelay = 0,
}) => {
  const isToday = isDateToday(new Date(data.date));
  const fadeInValue = useSharedValue(0);
  const scaleValue = useSharedValue(0.8);
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    fadeInValue.value = withDelay(animationDelay, withSpring(1));
    scaleValue.value = withDelay(animationDelay, withSpring(1));
    
    // Subtle pulse animation for active days
    if (data.count > 0) {
      pulseValue.value = withSpring(1.05, { damping: 15 });
      setTimeout(() => {
        pulseValue.value = withSpring(1, { damping: 15 });
      }, 200 + animationDelay);
    }
  }, [animationDelay, data.count]);

  const getIntensityColor = () => {
    if (data.count === 0) {
      return colors.contribution.empty;
    }
    
    const intensity = Math.min(data.count / Math.max(maxCount, 1), 1);
    // Use task color with varying opacity based on intensity
    return getTaskColorWithOpacity(task.color, 0.2 + intensity * 0.8);
  };

  const animatedStyle = useAnimatedStyle(() => {
    const scale = scaleValue.value * pulseValue.value * (isSelected ? 1.15 : 1);
    
    return {
      opacity: fadeInValue.value,
      transform: [{ scale }],
    };
  });

  const dayStyles = [
    styles.day,
    {
      width: size,
      height: size,
      backgroundColor: getIntensityColor(),
      borderRadius: borderRadius.sm,
    },
    isToday && { 
      ...styles.today, 
      borderColor: task.color,
      shadowColor: task.color,
    },
    isSelected && { 
      ...styles.selected,
      shadowColor: task.color,
    },
  ];

  const handlePress = () => {
    onPress(data.date);
  };

  const getAccessibilityLabel = () => {
    const dateStr = formatDisplayDate(new Date(data.date));
    const countStr = data.count === 0 
      ? 'no completions' 
      : data.count === 1 
        ? '1 completion' 
        : `${data.count} completions`;
    
    return `${dateStr}, ${countStr} for ${task.name}`;
  };

  return (
    <AnimatedTouchableOpacity
      style={animatedStyle}
      onPress={handlePress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityHint="Tap to see details for this day"
    >
      <View style={dayStyles}>
        {/* Show count for multi-completion tasks when there are multiple completions */}
        {task.isMultiCompletion && data.count > 1 && size >= 16 && (
          <Text style={[
            styles.count, 
            { 
              fontSize: Math.max(8, size * 0.25),
              color: data.count / maxCount > 0.5 ? 'white' : task.color
            }
          ]}>
            {data.count > 9 ? '9+' : data.count}
          </Text>
        )}
        
        {/* Show dot for single completion tasks */}
        {!task.isMultiCompletion && data.count > 0 && size >= 14 && (
          <View style={[
            styles.completionDot, 
            { 
              backgroundColor: data.count / maxCount > 0.5 ? 'white' : task.color,
              width: Math.max(3, size * 0.15),
              height: Math.max(3, size * 0.15),
              borderRadius: Math.max(1.5, size * 0.075),
            }
          ]} />
        )}
      </View>
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  day: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: spacing[1] / 2,
    position: 'relative',
  },
  
  today: {
    borderWidth: 2,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  
  selected: {
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  
  count: {
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    position: 'absolute',
  },
  
  completionDot: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
});

export default TaskContributionDay;