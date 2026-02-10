/**
 * StressFractures - Pre-break anticipation phase
 *
 * Creates tension before the full glass break:
 * - Small hairline cracks grow outward from center
 * - Cell trembles/vibrates slightly
 * - Cracks multiply and intensify
 * - Builds anticipation for 400ms before impact
 */
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import logger from '../../utils/logger';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';

export const STRESS_DURATION = 400; // Total stress phase duration

interface StressFracturesProps {
  visible: boolean;
  cellSize: number;
  onComplete: () => void;
}

interface CrackLine {
  angle: number;
  length: number;
  delay: number;
  startRadius: number;
}

/**
 * Generate crack lines radiating from center
 */
const generateCracks = (): CrackLine[] => {
  const cracks: CrackLine[] = [];
  const crackCount = 5;

  for (let i = 0; i < crackCount; i++) {
    // Distribute evenly with slight randomness
    const baseAngle = (i / crackCount) * Math.PI * 2;
    const angleVariance = (Math.random() - 0.5) * 0.4;

    cracks.push({
      angle: baseAngle + angleVariance,
      length: 8 + Math.random() * 10, // 8-18px
      delay: i * 60, // Stagger appearance
      startRadius: 2 + Math.random() * 3, // Start slightly off center
    });
  }

  return cracks;
};

/**
 * Single animated crack line wrapped in Animated.View for opacity control
 */
interface AnimatedCrackProps {
  crack: CrackLine;
  centerX: number;
  centerY: number;
  cellSize: number;
}

const AnimatedCrack: React.FC<AnimatedCrackProps> = ({ crack, centerX, centerY, cellSize }) => {
  const opacity = useSharedValue(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Delay before this crack appears
    const timeout = setTimeout(() => {
      setIsVisible(true);
      opacity.value = withTiming(0.8, { duration: 100 });
    }, crack.delay);

    return () => clearTimeout(timeout);
  }, [crack.delay]);

  const startX = centerX + Math.cos(crack.angle) * crack.startRadius;
  const startY = centerY + Math.sin(crack.angle) * crack.startRadius;
  const endX = centerX + Math.cos(crack.angle) * (crack.startRadius + crack.length);
  const endY = centerY + Math.sin(crack.angle) * (crack.startRadius + crack.length);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!isVisible) return null;

  return (
    <Animated.View style={[styles.crackWrapper, { width: cellSize, height: cellSize }, animatedStyle]}>
      <Svg width={cellSize} height={cellSize}>
        <Line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="rgba(255, 255, 255, 0.7)"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
};

export const StressFractures: React.FC<StressFracturesProps> = ({
  visible,
  cellSize,
  onComplete,
}) => {
  const shake = useSharedValue(0);
  const overallOpacity = useSharedValue(0);

  const cracks = useMemo(() => generateCracks(), []);
  const centerX = cellSize / 2;
  const centerY = cellSize / 2;

  useEffect(() => {
    if (visible) {
      logger.info('UI', 'StressFractures visible, starting animations');
      // Fade in quickly
      overallOpacity.value = withTiming(1, { duration: 100 });

      // Start subtle shake that intensifies
      shake.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 30 }),
          withTiming(-1, { duration: 30 }),
          withTiming(0.5, { duration: 30 }),
          withTiming(-0.5, { duration: 30 }),
        ),
        -1, // Infinite repeat
        true
      );

      // Call onComplete after stress duration
      const timeout = setTimeout(() => {
        logger.info('UI', 'StressFractures complete, calling onComplete');
        onComplete();
      }, STRESS_DURATION);

      return () => clearTimeout(timeout);
    } else {
      overallOpacity.value = 0;
      shake.value = 0;
    }
  }, [visible, onComplete]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: overallOpacity.value,
    transform: [
      { translateX: shake.value },
      { translateY: shake.value * 0.5 },
    ],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { width: cellSize, height: cellSize },
        containerStyle,
      ]}
      pointerEvents="none"
    >
      {cracks.map((crack, index) => (
        <AnimatedCrack
          key={index}
          crack={crack}
          centerX={centerX}
          centerY={centerY}
          cellSize={cellSize}
        />
      ))}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 15,
  },
  crackWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default StressFractures;
