import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { colors, textStyles, spacing } from '../theme';
import { sizes, radiusValues } from '../theme/utils';

interface AnimatedLoaderProps {
  text?: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

export const AnimatedLoader: React.FC<AnimatedLoaderProps> = ({
  text = 'Loading...',
  size = 'medium',
  color = colors.primary,
}) => {
  const rotation = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    // Rotation animation
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Pulse animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 600 }),
        withTiming(1, { duration: 600 })
      ),
      -1,
      true
    );

    // Opacity animation for dots
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 500 }),
        withTiming(0.3, { duration: 500 })
      ),
      -1,
      true
    );
  }, []);

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return { width: sizes.badge.width * 1.5, height: sizes.badge.width * 1.5 };
      case 'large':
        return { width: sizes.iconContainer.large, height: sizes.iconContainer.large };
      default:
        return { width: sizes.touchTarget.small, height: sizes.touchTarget.small };
    }
  };

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const dotsStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const Spinner = () => (
    <Animated.View style={[styles.spinner, getSizeStyle(), pulseStyle]}>
      <Animated.View style={[styles.spinnerRing, rotationStyle, { borderTopColor: color }]} />
    </Animated.View>
  );

  const LoadingDots = () => (
    <Animated.View style={[styles.dotsContainer, dotsStyle]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={[styles.dot, { backgroundColor: color }]} />
      <View style={[styles.dot, { backgroundColor: color }]} />
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Spinner />
      {text && (
        <View style={styles.textContainer}>
          <Text style={styles.loadingText}>{text}</Text>
          <LoadingDots />
        </View>
      )}
    </View>
  );
};

// Pulse loader for minimal loading states
export const PulseLoader: React.FC<{ color?: string; size?: number }> = ({ 
  color = colors.primary, 
  size = 8 
}) => {
  const scale = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 600 }),
        withTiming(0.8, { duration: 600 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.pulseLoader,
        {
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: size / 2,
        },
        animatedStyle,
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
  },

  spinner: {
    marginBottom: spacing[3],
  },

  spinnerRing: {
    flex: 1,
    borderWidth: 2,
    borderRadius: radiusValues.full,
    borderColor: colors.interactive.default,
    borderTopColor: colors.primary, // This will be overridden by the color prop
  },

  textContainer: {
    alignItems: 'center',
  },

  loadingText: {
    ...textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },

  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  dot: {
    width: spacing[1],
    height: spacing[1],
    borderRadius: spacing[1] / 2,
    marginHorizontal: spacing[1] / 2,
    backgroundColor: colors.primary,
  },

  pulseLoader: {
    // Style will be dynamically applied in component
  },
});

export default AnimatedLoader;