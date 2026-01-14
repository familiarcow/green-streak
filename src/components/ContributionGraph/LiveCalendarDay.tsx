import React, { useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withDelay,
  SharedValue,
  withSequence,
} from 'react-native-reanimated';
import { ContributionData } from '../../types';
import { colors } from '../../theme';
import { formatDisplayDate } from '../../utils/dateHelpers';
import { getContributionColor, ContributionColorPalette } from '../../utils/colorUtils';

interface LiveCalendarDayProps {
  data: ContributionData;
  maxCount: number;
  size: number;
  onPress: (date: string) => void;
  isSelected?: boolean;
  isToday?: boolean;
  animationDelay?: number;
  todayGlowValue: SharedValue<number>;
  palette?: ContributionColorPalette;
}

// Special colors for today - more subtle like GitHub
const todayColors = {
  border: '#1f2328',     // GitHub dark border
  shadow: '#1f2328',     // GitHub dark shadow
};

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const LiveCalendarDay: React.FC<LiveCalendarDayProps> = ({
  data,
  maxCount,
  size,
  onPress,
  isSelected = false,
  isToday = false,
  animationDelay = 0,
  todayGlowValue,
  palette,
}) => {
  const fadeInValue = useSharedValue(0);
  const scaleValue = useSharedValue(0.8);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    // Staggered entry animation
    fadeInValue.value = withDelay(
      animationDelay, 
      withSpring(1, { damping: 20, stiffness: 300 })
    );
    scaleValue.value = withDelay(
      animationDelay, 
      withSpring(1, { damping: 15, stiffness: 200 })
    );
  }, [animationDelay]);

  // Get the appropriate background color - GitHub style
  const backgroundColor = getContributionColor(data.count, maxCount, palette);

  // Animation styles
  const animatedStyle = useAnimatedStyle(() => {
    const baseScale = scaleValue.value * pressScale.value;
    const finalScale = isSelected ? baseScale * 1.05 : baseScale;

    return {
      opacity: fadeInValue.value,
      transform: [{ scale: finalScale }],
    };
  });

  const handlePressIn = () => {
    pressScale.value = withSpring(0.95, { damping: 20, stiffness: 400 });
    
    // Haptic feedback (using platform-specific implementation)
    if (Platform.OS === 'ios') {
      try {
        const { impactAsync, ImpactFeedbackStyle } = require('expo-haptics');
        impactAsync?.(ImpactFeedbackStyle.Light);
      } catch (error) {
        // Haptic feedback not available
        console.log('Haptic feedback not available');
      }
    }
  };

  const handlePressOut = () => {
    pressScale.value = withSequence(
      withSpring(1.1, { damping: 15, stiffness: 400 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
  };

  const handlePress = () => {
    onPress(data.date);
  };

  const dayStyles = [
    styles.day,
    {
      backgroundColor,
      borderRadius: 3, // GitHub-style square corners
      borderWidth: isToday ? 2 : (isSelected ? 1 : 0),
      borderColor: isToday 
        ? todayColors.border 
        : (isSelected ? colors.primary : 'transparent'),
    },
  ];

  return (
    <AnimatedTouchableOpacity
      style={[styles.container, animatedStyle]}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${formatDisplayDate(new Date(data.date))}${isToday ? ', Today' : ''}, ${data.count} ${data.count === 1 ? 'completion' : 'completions'}`}
      accessibilityHint="Tap to edit this day's tasks"
    >
      <Animated.View style={dayStyles} />
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  day: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LiveCalendarDay;