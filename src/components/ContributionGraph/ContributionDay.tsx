import React, { useEffect } from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withDelay 
} from 'react-native-reanimated';
import { ContributionData } from '../../types';
import { getContributionColor, colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme';
import { radiusValues } from '../../theme/utils';
import { isDateToday, formatDisplayDate } from '../../utils/dateHelpers';

interface ContributionDayProps {
  data: ContributionData;
  maxCount: number;
  size: number;
  onPress: (date: string) => void;
  isSelected?: boolean;
  animationDelay?: number;
  disabled?: boolean;
  compact?: boolean;
  isTransitioning?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const ContributionDay: React.FC<ContributionDayProps> = ({
  data,
  maxCount,
  size,
  onPress,
  isSelected = false,
  animationDelay = 0,
  disabled = false,
  compact = false,
  isTransitioning = false,
}) => {
  const isToday = isDateToday(new Date(data.date));
  const color = getContributionColor(data.count, maxCount);
  const fadeInValue = useSharedValue(0);
  const scaleValue = useSharedValue(0.8);
  const sizeValue = useSharedValue(compact ? size * 0.8 : size);

  useEffect(() => {
    if (isTransitioning) {
      // Faster, smoother animations during transitions
      fadeInValue.value = withDelay(
        animationDelay, 
        withSpring(1, { damping: 20, stiffness: 300 })
      );
      scaleValue.value = withDelay(
        animationDelay, 
        withSpring(1, { damping: 15, stiffness: 200 })
      );
    } else {
      fadeInValue.value = withDelay(animationDelay, withSpring(1));
      scaleValue.value = withDelay(animationDelay, withSpring(1));
    }
  }, [animationDelay, isTransitioning]);
  
  // Animate size changes smoothly
  useEffect(() => {
    sizeValue.value = withSpring(compact ? size * 0.9 : size, {
      damping: 15,
      stiffness: 150,
    });
  }, [size, compact]);
  
  const animatedStyle = useAnimatedStyle(() => {
    const scale = isTransitioning 
      ? scaleValue.value * 0.95 
      : scaleValue.value * (isSelected ? 1.1 : 1);
    
    return {
      opacity: fadeInValue.value,
      transform: [
        { scale },
      ],
    };
  });
  
  const animatedDayStyle = useAnimatedStyle(() => {
    return {
      width: sizeValue.value,
      height: sizeValue.value,
    };
  });

  const dayStyles = [
    styles.day,
    {
      backgroundColor: color,
      borderRadius: compact ? radiusValues.xs : borderRadius.sm,
    },
    isToday && !compact && styles.today,
    isSelected && styles.selected,
  ];

  const handlePress = () => {
    if (!disabled) {
      onPress(data.date);
    }
  };

  return (
    <AnimatedTouchableOpacity
      style={animatedStyle}
      onPress={handlePress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${formatDisplayDate(new Date(data.date))}, ${data.count} completions`}
      accessibilityHint="Tap to edit this day's tasks"
    >
      <Animated.View style={[dayStyles, animatedDayStyle]} />
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  day: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  today: {
    borderWidth: spacing[1] / 2,
    borderColor: colors.text.primary,
  },
  
  selected: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default ContributionDay;