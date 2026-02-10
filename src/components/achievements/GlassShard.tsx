/**
 * GlassShard - Individual glass fragment with gravity physics
 *
 * Triangular shard that falls with realistic physics:
 * - Initial outward velocity based on impact angle
 * - Gravity acceleration pulling down
 * - Rotation follows velocity vector
 * - Fades as it falls
 */
import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';

export interface GlassShardProps {
  startX: number;           // Starting X position (relative to center)
  startY: number;           // Starting Y position (relative to center)
  initialAngle: number;     // Direction of initial push (radians)
  initialSpeed: number;     // Initial velocity (px/s) - 20-40 range
  size: number;             // Base size 8-16px
  delay: number;            // Delay from impact moment (ms)
  duration: number;         // Total animation duration (ms)
}

// Gravity constant - strong pull for dramatic effect
const GRAVITY = 1200; // px/s²

export const GlassShard: React.FC<GlassShardProps> = ({
  startX,
  startY,
  initialAngle,
  initialSpeed,
  size,
  delay,
  duration,
}) => {
  // Animation values
  const translateX = useSharedValue(startX);
  const translateY = useSharedValue(startY);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Initial velocity components
    const vx = Math.cos(initialAngle) * initialSpeed;
    const vy = Math.sin(initialAngle) * initialSpeed;

    // Calculate final positions using kinematic equations
    // For timing-based animation, we compute the end state
    const t = duration / 1000; // Convert to seconds

    // Final X = vx * t (no acceleration on X)
    const finalX = startX + vx * t;

    // Final Y = vy * t + 0.5 * g * t² (with gravity)
    const finalY = startY + vy * t + 0.5 * GRAVITY * t * t;

    // Final rotation based on final velocity direction
    // At time t: vy_final = vy + g * t
    const vyFinal = vy + GRAVITY * t;
    const finalRotation = Math.atan2(vyFinal, vx) * (180 / Math.PI);

    // Opacity: fade in quickly, then fade out over duration
    // Using withSequence to properly chain the animations
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 30 }),
        withTiming(0, { duration: duration - 30, easing: Easing.linear })
      )
    );

    // X movement (constant velocity)
    translateX.value = withDelay(
      delay,
      withTiming(finalX, {
        duration,
        easing: Easing.linear,
      })
    );

    // Y movement (accelerating due to gravity - use ease-in quad to approximate)
    translateY.value = withDelay(
      delay,
      withTiming(finalY, {
        duration,
        easing: Easing.in(Easing.quad),
      })
    );

    // Rotation follows velocity - use ease-in to match gravity effect
    rotation.value = withDelay(
      delay,
      withTiming(finalRotation + Math.random() * 90 - 45, {
        duration,
        easing: Easing.out(Easing.quad),
      })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute' as const,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
    opacity: opacity.value,
  }));

  // Use a View with borderWidth to create triangle-ish shape
  // SVG would be cleaner but adds complexity
  return (
    <Animated.View
      style={[
        {
          width: 0,
          height: 0,
          backgroundColor: 'transparent',
          borderStyle: 'solid',
          borderLeftWidth: size * 0.5,
          borderRightWidth: size * 0.5,
          borderBottomWidth: size,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: 'rgba(255, 255, 255, 0.9)',
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    />
  );
};

export default GlassShard;
