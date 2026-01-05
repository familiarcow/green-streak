import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';

interface CelebrationEffectProps {
  visible: boolean;
  onComplete?: () => void;
  size?: number;
  color?: string;
}

interface ParticleProps {
  delay: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  size: number;
}

const Particle: React.FC<ParticleProps> = ({
  delay,
  startX,
  startY,
  endX,
  endY,
  color,
  size,
}) => {
  const translateX = useSharedValue(startX);
  const translateY = useSharedValue(startY);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  useEffect(() => {
    // Start animation
    opacity.value = withDelay(delay, withTiming(1, { duration: 100 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 15, stiffness: 200 }));
    
    // Move particle
    translateX.value = withDelay(
      delay,
      withSpring(endX, { damping: 10, stiffness: 100 })
    );
    translateY.value = withDelay(
      delay,
      withSpring(endY, { damping: 8, stiffness: 80 })
    );

    // Fade out
    opacity.value = withDelay(
      delay + 600,
      withTiming(0, { duration: 400 })
    );
    scale.value = withDelay(
      delay + 600,
      withTiming(0, { duration: 400 })
    );
  }, [delay, endX, endY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        animatedStyle,
        {
          backgroundColor: color,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    />
  );
};

export const CelebrationEffect: React.FC<CelebrationEffectProps> = ({
  visible,
  onComplete,
  size = 4,
  color = '#FFD700',
}) => {
  const containerOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      containerOpacity.value = withTiming(1, { duration: 100 });
      
      // Auto-hide after animation
      const timer = setTimeout(() => {
        containerOpacity.value = withTiming(0, { duration: 400 });
        if (onComplete) {
          setTimeout(onComplete, 400);
        }
      }, 1200);

      return () => clearTimeout(timer);
    } else {
      containerOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible, onComplete]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    pointerEvents: containerOpacity.value > 0 ? 'auto' : 'none',
  }));

  if (!visible) return null;

  // Generate particle configuration
  const particles = Array.from({ length: 8 }, (_, index) => {
    const angle = (index * 360) / 8; // Distribute evenly in circle
    const radius = 30 + Math.random() * 20; // Random distance
    const radians = (angle * Math.PI) / 180;
    
    return {
      delay: index * 50, // Stagger particles
      startX: 0,
      startY: 0,
      endX: Math.cos(radians) * radius,
      endY: Math.sin(radians) * radius,
      color: [
        '#FFD700', // Gold
        '#00D4AA', // Teal
        '#FF6B6B', // Red
        '#7C3AED', // Purple
        '#00B894', // Green
      ][index % 5],
      size: size + Math.random() * 2,
    };
  });

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      {particles.map((particle, index) => (
        <Particle
          key={index}
          delay={particle.delay}
          startX={particle.startX}
          startY={particle.startY}
          endX={particle.endX}
          endY={particle.endY}
          color={particle.color}
          size={particle.size}
        />
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  
  particle: {
    position: 'absolute',
  },
});

export default CelebrationEffect;