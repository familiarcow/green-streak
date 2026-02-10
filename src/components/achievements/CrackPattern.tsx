/**
 * CrackPattern - SVG crack lines radiating from center
 *
 * Creates an organic crack pattern for the glass break effect:
 * - 4-7 lines radiating from center outward
 * - Lines vary in length (40-80% of cell radius)
 * - Slight angle variance for organic feel
 * - White at 80% opacity, fades quickly after impact
 */
import React, { useMemo, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import Svg, { Line } from 'react-native-svg';
import { AchievementRarity } from '../../types/achievements';

interface CrackPatternProps {
  visible: boolean;
  cellSize: number;
  rarity: AchievementRarity;
  delay?: number;        // Delay before appearing (ms)
  fadeDuration?: number; // How long to fade out (ms)
}

/**
 * Get line count based on rarity
 */
const getLineCount = (rarity: AchievementRarity): number => {
  switch (rarity) {
    case 'common':
      return 5;
    case 'uncommon':
      return 6;
    case 'rare':
      return 7;
    case 'epic':
      return 8;
    case 'legendary':
      return 9;
    default:
      return 6;
  }
};

/**
 * Generate crack line configurations
 */
interface CrackLine {
  angle: number;   // Angle in radians
  length: number;  // Length in pixels
  width: number;   // Stroke width
}

const generateCrackLines = (lineCount: number, cellSize: number): CrackLine[] => {
  const radius = cellSize / 2;
  const lines: CrackLine[] = [];

  for (let i = 0; i < lineCount; i++) {
    // Distribute angles evenly with some variance
    const baseAngle = (i / lineCount) * Math.PI * 2;
    const angleVariance = (Math.random() - 0.5) * 0.5; // ±15° in radians
    const angle = baseAngle + angleVariance;

    // Length varies between 60-95% of radius (longer, more dramatic)
    const lengthFactor = 0.6 + Math.random() * 0.35;
    const length = radius * lengthFactor;

    // Thicker stroke for visibility
    const width = 2.5 + Math.random() * 1.5;

    lines.push({ angle, length, width });
  }

  return lines;
};

export const CrackPattern: React.FC<CrackPatternProps> = ({
  visible,
  cellSize,
  rarity,
  delay = 0,
  fadeDuration = 150,
}) => {
  const opacity = useSharedValue(0);

  const lineCount = getLineCount(rarity);
  const lines = useMemo(
    () => generateCrackLines(lineCount, cellSize),
    [lineCount, cellSize]
  );

  const center = cellSize / 2;

  useEffect(() => {
    if (visible) {
      // Appear instantly after delay, then fade out
      // Using withSequence to properly chain the animations
      opacity.value = withDelay(
        delay,
        withSequence(
          withTiming(1, { duration: 1 }),
          withTiming(0, { duration: fadeDuration })
        )
      );
    } else {
      opacity.value = 0;
    }
  }, [visible, delay, fadeDuration]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: cellSize,
          height: cellSize,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <Svg width={cellSize} height={cellSize}>
        {lines.map((line, index) => {
          const endX = center + Math.cos(line.angle) * line.length;
          const endY = center + Math.sin(line.angle) * line.length;

          return (
            <Line
              key={index}
              x1={center}
              y1={center}
              x2={endX}
              y2={endY}
              stroke="rgba(255, 255, 255, 1)"
              strokeWidth={line.width}
              strokeLinecap="round"
            />
          );
        })}
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 25,
  },
});

export default CrackPattern;
